import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function GET(req: NextRequest) {
  try {
    // Get Supabase client and check authentication
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    })
    
    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Check if the session belongs to the current user
    if (session.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to session' },
        { status: 403 }
      )
    }
    
    let status = 'pending'
    let subscriptionStatus = null
    
    if (session.payment_status === 'paid' && session.status === 'complete') {
      // Payment is complete, check subscription status
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        subscriptionStatus = subscription.status
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = 'complete'
          
          // Update user's subscription status in database
          const { error: updateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              subscription_status: subscription.status,
              plan_id: subscription.items.data[0]?.price.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
          
          if (updateError) {
            console.error('Error updating user subscription:', updateError)
          }
        }
      }
    } else if (session.payment_status === 'unpaid' || session.status === 'expired') {
      status = 'failed'
    }
    
    return NextResponse.json({
      status,
      payment_status: session.payment_status,
      session_status: session.status,
      subscription_status: subscriptionStatus,
      customer_email: session.customer_details?.email
    })
    
  } catch (error) {
    console.error('Error verifying payment:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: `Stripe error: ${error.message}` },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}