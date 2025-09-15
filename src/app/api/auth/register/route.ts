import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withErrorHandler, ErrorFactories, ErrorLogger } from '@/lib/error-handler'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function registerHandler(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const logger = ErrorLogger.getInstance()
  
  try {
    const body = await request.json()
    const { email, password, name } = body
    
    // Enhanced validation
    if (!email || !password) {
      throw ErrorFactories.validation('Email and password are required')
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw ErrorFactories.validation('Please enter a valid email address')
    }
    
    if (password.length < 8) {
      throw ErrorFactories.validation('Password must be at least 8 characters long')
    }
    
    if (name && name.trim().length < 2) {
      throw ErrorFactories.validation('Name must be at least 2 characters long')
    }

    // Check if user already exists in auth
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
    const userExists = existingAuthUser.users?.some(user => 
      user.email?.toLowerCase() === email.toLowerCase().trim()
    )

    if (userExists) {
      throw ErrorFactories.conflict('User with this email already exists')
    }
    
    // Also check profiles table
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existingProfile) {
      throw ErrorFactories.conflict('User with this email already exists')
    }

    const normalizedEmail = email.toLowerCase().trim()
    const normalizedName = name ? name.trim() : normalizedEmail.split('@')[0]

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        name: normalizedName
      }
    })

    if (authError) {
      logger.logError(authError, {
        url: '/api/auth/register',
        method: request.method,
        requestId
      })
      
      // Provide more specific error messages
      if (authError.message?.includes('already registered')) {
        throw ErrorFactories.conflict('User with this email already exists')
      } else if (authError.message?.includes('password')) {
        throw ErrorFactories.validation('Password does not meet requirements')
      } else {
        throw ErrorFactories.internal('Failed to create user account')
      }
    }

    if (!authUser?.user) {
      throw ErrorFactories.internal('User creation failed - no user data returned')
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: normalizedEmail,
        name: normalizedName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      logger.logError(profileError, {
        url: '/api/auth/register',
        method: request.method,
        requestId,
        userId: authUser.user.id
      })
      
      // If profile creation fails, we should clean up the auth user
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        logger.logError(cleanupError as Error, {
          url: '/api/auth/register',
          method: request.method,
          requestId
        })
      }
      
      throw ErrorFactories.internal('Failed to create user profile')
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      userId: authUser.user.id
    })

  } catch (error) {
    logger.logError(error as Error, {
      url: '/api/auth/register',
      method: request.method,
      requestId
    })
    
    throw error
  }
}

export const POST = withErrorHandler(registerHandler)