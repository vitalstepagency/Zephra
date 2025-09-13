import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase/server'
import { z } from 'zod'

// Force deployment update - simple signup endpoint

const simpleSignupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required')
})

export async function POST(request: NextRequest) {
  try {
    // Debug: Log environment variables status
    console.log('Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      serviceKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0
    })
    
    const body = await request.json()
    const { email, password, name } = simpleSignupSchema.parse(body)

    // Check if user already exists
    console.log('Checking for existing user with email:', email)
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      return NextResponse.json(
        { error: 'Database connection failed', details: checkError.message },
        { status: 500 }
      )
    }

    if (existingUser) {
      console.log('User already exists:', existingUser.id)
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }
    
    console.log('No existing user found, proceeding with creation')

    // Create user in Supabase Auth
    console.log('Creating auth user for email:', email)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        full_name: name
      }
    })

    if (authError || !authUser.user) {
      console.error('Auth creation failed:', {
        error: authError,
        hasAuthUser: !!authUser,
        hasUser: !!authUser?.user,
        errorMessage: authError?.message,
        errorCode: authError?.code
      })
      return NextResponse.json(
        { error: 'Failed to create user account', details: authError?.message },
        { status: 500 }
      )
    }
    
    console.log('Auth user created successfully:', authUser.user.id)

    // Check if user profile already exists
    console.log('Checking for existing profile for user:', authUser.user.id)
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', authUser.user.id)
      .maybeSingle()

    if (profileCheckError) {
      console.error('Error checking existing profile:', profileCheckError)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Database error during profile check', details: profileCheckError.message },
        { status: 500 }
      )
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', existingProfile.id)
      return NextResponse.json(
        { error: 'User profile already exists' },
        { status: 400 }
      )
    }

    // Create user profile with 14-day trial
    console.log('Creating user profile with trial')
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name: name,
        avatar_url: null,
        subscription_tier: 'starter',
        subscription_status: 'trial',
        trial_ends_at: trialEndDate.toISOString()
      })

    if (profileError) {
      // Clean up auth user if profile creation fails
      console.error('Profile creation failed, cleaning up auth user:', {
        profileError,
        authUserId: authUser.user.id
      })
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }
    
    console.log('User profile created successfully for:', authUser.user.id)

    return NextResponse.json(
      { 
        message: 'Account created successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          name
        }
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Simple signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}