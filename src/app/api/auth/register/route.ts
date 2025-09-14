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
    
    if (!email || !password) {
      throw ErrorFactories.validation('Email and password are required')
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      throw ErrorFactories.conflict('User with this email already exists')
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      logger.logError(authError, {
        url: '/api/auth/register',
        method: request.method,
        requestId
      })
      throw ErrorFactories.internal('Failed to create user')
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: email,
        name: name || email.split('@')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (profileError) {
      logger.logError(profileError, {
        url: '/api/auth/register',
        method: request.method,
        requestId
      })
      // Don't fail the request if profile creation fails
      // The user can still log in and complete their profile later
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      userId: authUser.user.id
    })

  } catch (error) {
    logger.logError(error, {
      url: '/api/auth/register',
      method: request.method,
      requestId
    })
    
    throw error
  }
}

export const POST = withErrorHandler(registerHandler)