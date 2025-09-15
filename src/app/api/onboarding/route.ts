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

    // Save onboarding data to Supabase
    // Update user profile with onboarding data
    const { data, error } = await supabase
      .from('users')
      .update({
        full_name: businessName,
        subscription_tier: plan as 'free' | 'starter' | 'pro' | 'enterprise',
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user?.email || '')
      .select()
      .single()

    if (error) {
      console.error('Error saving onboarding data:', error)
      return NextResponse.json(
        { error: 'Failed to save onboarding data' },
        { status: 500 }
      )
    }

    // Update user profile with onboarding completion
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        onboarding_completed: true,
        subscription_plan: plan,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Don't fail the request if profile update fails
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

    // Get user's data
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user?.email || '')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching onboarding data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch onboarding data' },
        { status: 500 }
      )
    }

    // Check if onboarding is completed based on whether user has filled out onboarding data
    // Not just subscription status, as new users with active subscriptions still need onboarding
    const hasOnboardingData = data && (
      data.full_name || 
      data.business_name || 
      data.industry || 
      data.team_size
    )
    
    return NextResponse.json(
      { 
        success: true, 
        data: data || null,
        completed: !!hasOnboardingData
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