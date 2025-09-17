import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      businessName,
      industry,
      teamSize,
      currentChallenges,
      monthlyGoal,
      primaryObjective,
      plan,
      completedAt
    } = body

    // Update user profile in users table with onboarding data
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: businessName,
        subscription_tier: plan as 'starter' | 'pro' | 'enterprise',
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id)
      .select()
      .single()

    if (error) {
      console.error('Error saving onboarding data to users table:', error)
      return NextResponse.json(
        { error: 'Failed to save onboarding data' },
        { status: 500 }
      )
    }

    // Update profile in profiles table with onboarding completion
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: session.user.id,
        email: session.user.email,
        name: businessName, // Use the business name from onboarding
        onboarding_completed: true,
        subscription_plan: plan,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to update onboarding status' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        data,
        message: 'Onboarding completed successfully' 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Onboarding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check profile table first for onboarding completion status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, name, subscription_plan')
      .eq('user_id', session.user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile data:', profileError)
    }

    // Get user's data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error fetching user data:', userError)
    }

    // Determine completion status - prioritize explicit flag from profiles table
    let completed = false
    if (profileData?.onboarding_completed === true) {
      completed = true
    } else if (userData && userData.full_name) {
      // Fallback: if user has a full name in users table, consider onboarding done
      completed = true
    }

    return NextResponse.json(
      {
        success: true,
        data: userData || null,
        profile: profileData || null,
        completed
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Onboarding GET API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}