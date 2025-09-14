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

    // Update user profile with trial info (profile is auto-created by trigger)
    console.log('Updating user profile with trial info for user:', authUser.user.id)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)

    // Wait a moment for the trigger to complete
    await new Promise(resolve => setTimeout(resolve, 100))

    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({
        subscription_tier: 'starter',
        subscription_status: 'trial',
        trial_ends_at: trialEndDate.toISOString()
      })
      .eq('id', authUser.user.id)

    if (profileError) {
      console.error('Profile update failed:', {
        profileError,
        authUserId: authUser.user.id
      })
      // Don't delete the auth user since the profile exists, just log the error
      console.warn('Profile update failed but user account was created successfully')
    } else {
      console.log('User profile updated successfully for:', authUser.user.id)
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'User created successfully',
        userId: authUser.user.id,
        email: authUser.user.email,
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