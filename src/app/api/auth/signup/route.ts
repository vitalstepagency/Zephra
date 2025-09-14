import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import DOMPurify from 'isomorphic-dompurify'
import { withErrorHandler, ErrorFactories, ErrorLogger } from '@/lib/error-handler'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Simple signup schema
const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(100),
  planId: z.string().min(1, 'Plan ID is required')
})

// Input sanitization function
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  // Remove any HTML tags and sanitize
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
  // Trim whitespace and normalize
  return sanitized.trim().replace(/\s+/g, ' ')
}

async function signupHandler(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const logger = ErrorLogger.getInstance()
  
  try {
    // Rate limiting check
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
              request.headers.get('x-real-ip') || '127.0.0.1'
    
    // Apply rate limiting - 5 requests per minute per IP
    const limiter = rateLimit({
      interval: 60 * 1000, // 1 minute
      uniqueTokenPerInterval: 500
    })
    
    const { success } = await limiter.check(5, ip)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
      
    }
    
    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw ErrorFactories.validation('Invalid JSON in request body')
    })
    
    const validatedData = signupSchema.parse(body)
    
    // Sanitize inputs
    const email = sanitizeInput(validatedData.email).toLowerCase()
    const name = sanitizeInput(validatedData.name)
    const planId = sanitizeInput(validatedData.planId)
    const password = validatedData.password
    
    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    // Create user in Supabase
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        planId
      }
    })
    
    if (userError) {
      logger.logError(new Error(`Failed to create user: ${userError.message}`), {
        requestId
      })
      
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      userId: userData.user.id
    })

  } catch (error) {
    // Log error
    await logger.logError(error as Error, {
      requestId
    })
    
    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Export POST handler
export const POST = withErrorHandler(signupHandler)