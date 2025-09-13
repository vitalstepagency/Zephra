import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'
import { z } from 'zod'
import { rateLimit } from '../../../../lib/rate-limit'
import DOMPurify from 'isomorphic-dompurify'
import { 
  signupValidationSchema, 
  sanitizeHtml, 
  getClientIP, 
  isValidUserAgent, 
  validateHoneypot, 
  validateTimestamp,
  generateCSRFToken,
  validateCSRFToken
} from '../../../../lib/validation'
import { withErrorHandler, ErrorFactories, TransactionManager, ErrorLogger } from '../../../../lib/error-handler'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Enhanced signup schema with security validations
const enhancedSignupSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
  company: z.string().max(100).optional(),
  planId: z.string().min(1, 'Plan ID is required'),
  stripeCustomerId: z.string().min(1, 'Stripe customer ID is required'),
  honeypot: z.string().optional(),
  timestamp: z.number().optional(),
  userAgent: z.string().optional(),
  csrfToken: z.string().optional()
})

// Input sanitization function
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  // Remove any HTML tags and sanitize
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  // Trim whitespace and normalize
  return sanitized.trim().replace(/\s+/g, ' ')
}

// Phone sanitization function
function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d+\-\s\(\)]/g, '')
}

// Email domain validation (optional - can be extended with blacklist)
function isValidEmailDomain(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  
  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/
  return domainRegex.test(domain)
}

// Validate phone number format
function isValidPhoneNumber(phone: string): boolean {
  // Basic phone number validation - accepts various formats
  const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Check for common password patterns
function isWeakPassword(password: string, email: string, firstName: string, lastName: string): boolean {
  const lowerPassword = password.toLowerCase()
  const lowerEmail = email.toLowerCase()
  const lowerFirstName = firstName.toLowerCase()
  const lowerLastName = lastName.toLowerCase()
  
  // Check if password contains personal information
  if (lowerPassword.includes(lowerFirstName) || 
      lowerPassword.includes(lowerLastName) ||
      lowerPassword.includes(lowerEmail.split('@')[0] || '')) {
    return true
  }
  
  // Check for common weak patterns
  const weakPatterns = [
    /^(password|123456|qwerty|abc123|letmein|welcome|admin)/i,
    /^(\d{8,}|[a-z]{8,}|[A-Z]{8,})$/, // All same character type
    /(.)\1{3,}/ // Repeated characters
  ]
  
  return weakPatterns.some(pattern => pattern.test(password))
}

async function signupHandler(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const logger = ErrorLogger.getInstance()
  
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
              request.headers.get('x-real-ip') || 
              '127.0.0.1'
    
    const rateLimiter = rateLimit({ interval: 60000 }) // 1 minute interval
     const rateLimitResult = await rateLimiter.check(5, ip) // 5 attempts per minute
     if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many signup attempts. Please try again later.' },
        { status: 429 }
      )
    }
    

    const body = await request.json().catch(() => {
      throw ErrorFactories.validation('Invalid JSON in request body')
    })
    
    const validatedData = enhancedSignupSchema.parse(body)
    
    // Validate phone number format if provided
    if (validatedData.phone && typeof validatedData.phone === 'string' && !isValidPhoneNumber(validatedData.phone)) {
      throw ErrorFactories.validation('Invalid phone number format')
    }
    
    // Sanitize all input fields
    const sanitizedData = {
      email: sanitizeInput(validatedData.email).toLowerCase(),
      password: validatedData.password, // Don't sanitize password
      firstName: sanitizeInput(validatedData.firstName),
      lastName: sanitizeInput(validatedData.lastName),
      phone: validatedData.phone ? sanitizePhone(validatedData.phone) : undefined,
      company: validatedData.company && typeof validatedData.company === 'string' ? sanitizeInput(validatedData.company) : undefined,
      planId: sanitizeInput(validatedData.planId),
      stripeCustomerId: sanitizeInput(validatedData.stripeCustomerId)
    }
    
    // Additional security validations
    if (!isValidEmailDomain(sanitizedData.email)) {
      return NextResponse.json(
        { error: 'Please use a valid email domain' },
        { status: 400 }
      )
    }
    
    if (isWeakPassword(sanitizedData.password, sanitizedData.email, sanitizedData.firstName, sanitizedData.lastName)) {
      return NextResponse.json(
        { error: 'Password is too weak. Please avoid using personal information or common patterns.' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', sanitizedData.email)
      .single()
    
    if (userCheckError && userCheckError.code !== 'PGRST116') {
      throw ErrorFactories.database('Failed to verify user status', { 
        originalError: userCheckError,
        email: sanitizedData.email 
      })
    }

    if (existingUser) {
      throw ErrorFactories.validation('User already exists with this email', {
        email: sanitizedData.email
      })
    }

    // Execute signup with transaction rollback capability
    const result = await TransactionManager.executeWithRollback(
      requestId,
      async () => {
        const fullName = `${sanitizedData.firstName} ${sanitizedData.lastName}`

        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: sanitizedData.email,
          password: sanitizedData.password,
          email_confirm: true,
          user_metadata: {
            firstName: sanitizedData.firstName,
            lastName: sanitizedData.lastName,
            full_name: fullName,
            phone: sanitizedData.phone,
            company: sanitizedData.company,
            planId: sanitizedData.planId,
            stripeCustomerId: sanitizedData.stripeCustomerId
          }
        })

        if (authError) {
          throw ErrorFactories.authentication('Failed to create user account', {
            originalError: authError,
            email: sanitizedData.email
          })
        }

        return { authUser, fullName }
      },
      async () => {
         // Rollback: Delete created auth user if profile creation fails
         try {
           if (result?.authUser?.user?.id) {
             await supabaseAdmin.auth.admin.deleteUser(result.authUser.user.id)
           }
         } catch (rollbackError) {
           console.error('Failed to rollback auth user creation:', rollbackError)
         }
       }
    )

    const { authUser, fullName } = result

    // Check if user profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUser.user.id)
      .single()

    if (!existingProfile) {
      // Create user profile in users table
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.user.id,
          email: sanitizedData.email,
          full_name: fullName,
          first_name: sanitizedData.firstName,
          last_name: sanitizedData.lastName,
          phone: sanitizedData.phone,
          company: sanitizedData.company,
          avatar_url: null,
          subscription_tier: 'starter',
          subscription_status: 'trial',
          plan_id: sanitizedData.planId,
          stripe_customer_id: sanitizedData.stripeCustomerId,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days trial
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        throw ErrorFactories.database('Failed to create user profile', {
          originalError: profileError,
          userId: authUser.user.id,
          email: sanitizedData.email
        })
      }
    }



    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          firstName: sanitizedData.firstName,
          lastName: sanitizedData.lastName,
          fullName: fullName,
          planId: sanitizedData.planId,
          stripeCustomerId: sanitizedData.stripeCustomerId
        }
      },
      { status: 201 }
    )

  } catch (error) {
    // Log error with context
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')
    
    await logger.logError(error as Error, {
      requestId,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      url: request.url,
      method: request.method
    })
    
    if (error instanceof z.ZodError) {
      throw ErrorFactories.validation('Invalid input data', { 
        validationErrors: error.errors 
      })
    }

    // Re-throw to be handled by withErrorHandler
    throw error
  }
}

// Export the wrapped handler
export const POST = withErrorHandler(signupHandler)