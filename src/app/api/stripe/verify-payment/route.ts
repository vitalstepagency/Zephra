import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'

export async function GET(req: NextRequest) {
  try {
    // Get Supabase client and check authentication
    const authSession = await getServerSession(authOptions)
    if (!authSession?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    const user = { id: authSession.user.id, email: authSession.user.email }
    
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
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!checkoutSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Check if the session belongs to the current user
    if (checkoutSession.metadata?.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized access to session' },
        { status: 403 }
      )
    }
    
    let status = 'pending'
    let subscriptionStatus = null
    
    if (checkoutSession.payment_status === 'paid' && checkoutSession.status === 'complete') {
      // Payment is complete, check subscription status
      if (checkoutSession.subscription) {
        const subscription = await stripe.subscriptions.retrieve(checkoutSession.subscription as string)
        subscriptionStatus = subscription.status
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          status = 'complete'
          
          // Update user's subscription status in database
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              stripe_customer_id: checkoutSession.customer as string,
              stripe_subscription_id: checkoutSession.subscription as string,
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
    } else if (
      checkoutSession.payment_status === 'unpaid' ||
      checkoutSession.status === 'expired'
    ) {
      status = 'failed'
    }
    
    return NextResponse.json({
      status,
      payment_status: checkoutSession.payment_status,
      session_status: checkoutSession.status,
      subscription_status: subscriptionStatus,
      customer_email: checkoutSession.customer_details?.email
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