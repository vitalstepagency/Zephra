import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Initialize Supabase with service role
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ hasActiveSubscription: false }, { status: 401 })
    }
    
    const supabase = getSupabaseClient()
    
    // Get user subscription info
    const { data: user, error } = await supabase
      .from('users')
      .select('subscription_status, subscription_tier, trial_ends_at')
      .eq('id', session.user.id)
      .single()
    
    if (error) {
      console.error('Error fetching user subscription:', error)
      return NextResponse.json({ hasActiveSubscription: false }, { status: 500 })
    }
    
    // Check if user has active subscription
    const hasActiveSubscription = user && (
      user.subscription_status === 'active' || 
      (user.subscription_status === 'trialing' && user.trial_ends_at && new Date(user.trial_ends_at) > new Date())
    )
    
    return NextResponse.json({ 
      hasActiveSubscription: !!hasActiveSubscription,
      subscriptionStatus: user?.subscription_status || null,
      subscriptionTier: user?.subscription_tier || null,
      trialEndsAt: user?.trial_ends_at || null
    })
    
  } catch (error) {
    console.error('Subscription status check error:', error)
    return NextResponse.json({ hasActiveSubscription: false }, { status: 500 })
  }
}