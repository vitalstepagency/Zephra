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
    const body = await request.json()
    const { email, password, name } = simpleSignupSchema.parse(body)

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        full_name: name
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

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
          email,
          full_name: name,
          avatar_url: null,
          subscription_tier: 'starter',
          subscription_status: 'inactive',
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        )
      }
    }

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