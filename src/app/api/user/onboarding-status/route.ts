import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check profile table for onboarding completion status
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, name')
      .eq('user_id', session.user.id)
      .single()

    // If profile doesn't exist, onboarding is not completed
    if (profileError && profileError.code === 'PGRST116') {
      return NextResponse.json({
        success: true,
        onboardingCompleted: false,
        hasProfile: false
      })
    }

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      onboardingCompleted: profileData?.onboarding_completed === true,
      hasProfile: true,
      name: profileData?.name
    })

  } catch (error) {
    console.error('Onboarding status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}