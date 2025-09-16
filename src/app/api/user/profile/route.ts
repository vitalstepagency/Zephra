import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getStripe } from '@/lib/stripe/config'

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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const supabase = getSupabaseClient()
    
    // Get comprehensive user data with profile information
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        subscription_status,
        subscription_tier,
        trial_ends_at,
        stripe_customer_id,
        stripe_subscription_id,
        created_at,
        updated_at
      `)
      .eq('id', session.user.id)
      .single()
    
    if (error) {
      console.error('Error fetching user profile:', error)
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
    }
    
    let billingInfo = null
    
    // If user has Stripe customer ID, fetch billing information
    if (user?.stripe_customer_id && user?.stripe_subscription_id) {
      try {
        const stripe = getStripe()
        const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id, {
          expand: ['latest_invoice', 'customer']
        })
        
        // Type assertion to access Stripe subscription properties
        const stripeSubscription = subscription as any
        
        billingInfo = {
          currentPeriodStart: stripeSubscription.current_period_start ? new Date(stripeSubscription.current_period_start * 1000) : null,
          currentPeriodEnd: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : null,
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
          status: stripeSubscription.status || 'unknown',
          nextBillingDate: stripeSubscription.current_period_end ? new Date(stripeSubscription.current_period_end * 1000) : null
        }
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError)
        // Continue without billing info if Stripe fails
      }
    }
    
    // Check if user has active subscription
    const hasActiveSubscription = user && (
      user.subscription_status === 'active' || 
      (user.subscription_status === 'trialing' && user.trial_ends_at && new Date(user.trial_ends_at) > new Date())
    )
    
    // Format trial end date
    const trialEndsAt = user?.trial_ends_at ? new Date(user.trial_ends_at) : null
    const isTrialActive = trialEndsAt && trialEndsAt > new Date()
    
    return NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        subscriptionStatus: user.subscription_status,
        subscriptionTier: user.subscription_tier,
        hasActiveSubscription,
        isTrialActive,
        trialEndsAt,
        onboardingCompleted: false, // Will be updated when we implement profiles table properly
        createdAt: user.created_at,
        updatedAt: user.updated_at
      },
      billing: billingInfo
    })
    
  } catch (error) {
    console.error('User profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}