import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { 
  secureErrorResponse, 
  secureResponse,
  logSecurityEvent
} from '@/lib/security'
import { getStripe } from '@/lib/stripe/config'

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const userAgent = req.headers.get('user-agent')
      const logEvent: any = {
        type: 'UNAUTHORIZED_ACCESS',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        path: '/api/admin/cancel-subscription',
        details: { endpoint: '/api/admin/cancel-subscription' }
      }
      if (userAgent) logEvent.userAgent = userAgent
      logSecurityEvent(logEvent)
      return secureErrorResponse('Unauthorized', 401)
    }

    const { customerId } = await req.json()
    
    if (!customerId) {
      return secureErrorResponse('Customer ID required', 400)
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('users')
      .select('stripe_customer_id, email')
      .eq('id', customerId)
      .single()

    if (customerError || !customer?.stripe_customer_id) {
      return secureErrorResponse('Customer not found', 404)
    }

    // Get active subscriptions for this customer
    const stripe = getStripe()
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.stripe_customer_id,
      status: 'active',
      limit: 10,
    })

    if (subscriptions.data.length === 0) {
      return secureErrorResponse('No active subscriptions found', 404)
    }

    // Cancel all active subscriptions
    const cancelledSubscriptions = []
    for (const subscription of subscriptions.data) {
      const cancelled = await stripe.subscriptions.cancel(subscription.id, {
        prorate: true,
      })
      cancelledSubscriptions.push(cancelled)
    }

    // Update customer subscription status in database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        subscription_tier: 'starter',
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)

    if (updateError) {
      console.error('Error updating customer after cancellation:', updateError)
    }

    // Log the cancellation event
    const userAgent = req.headers.get('user-agent')
    const logEvent: any = {
      type: 'SUSPICIOUS_REQUEST',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      path: '/api/admin/cancel-subscription',
      details: {
        action: 'subscription_cancelled',
        customer_id: customerId,
        cancelled_subscriptions: cancelledSubscriptions.map(sub => sub.id)
      }
    }
    if (userAgent) logEvent.userAgent = userAgent
    logSecurityEvent(logEvent)

    return secureResponse({
      success: true,
      cancelled_subscriptions: cancelledSubscriptions.length,
      subscription_ids: cancelledSubscriptions.map(sub => sub.id)
    })

  } catch (error) {
    console.error('Subscription cancellation error:', error)
    
    const userAgent = req.headers.get('user-agent')
    const logEvent: any = {
      type: 'SUSPICIOUS_REQUEST',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      path: '/api/admin/cancel-subscription',
      details: { error: String(error) }
    }
    if (userAgent) logEvent.userAgent = userAgent
    logSecurityEvent(logEvent)

    return secureErrorResponse('Subscription cancellation failed', 500)
  }
}