import { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { 
  secureErrorResponse, 
  secureResponse,
  logSecurityEvent
} from '@/lib/security'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const userAgent = req.headers.get('user-agent')
        const logEvent: any = {
          type: 'UNAUTHORIZED_ACCESS',
          ip: req.ip || 'unknown',
          path: '/api/admin/refund',
          details: { endpoint: '/api/admin/refund' }
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

    // Get recent payments for this customer
    const payments = await stripe.paymentIntents.list({
      customer: customer.stripe_customer_id,
      limit: 10,
    })

    const successfulPayments = payments.data.filter(
      payment => payment.status === 'succeeded' && payment.amount_received > 0
    )

    if (successfulPayments.length === 0) {
      return secureErrorResponse('No refundable payments found', 404)
    }

    // Process refund for the most recent payment
    const latestPayment = successfulPayments[0]
    if (!latestPayment) {
      return secureErrorResponse('No payment found to refund', 404)
    }
    
    const refund = await stripe.refunds.create({
      payment_intent: latestPayment.id,
      reason: 'requested_by_customer',
      metadata: {
        admin_refund: 'true',
        customer_id: customerId,
        processed_at: new Date().toISOString()
      }
    })

    // Update customer subscription status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        subscription_tier: 'starter',
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId)

    if (updateError) {
      console.error('Error updating customer after refund:', updateError)
    }

    // Log the refund event
    const userAgent = req.headers.get('user-agent')
      const logEvent: any = {
        type: 'SUSPICIOUS_REQUEST',
        ip: req.ip || 'unknown',
        path: '/api/admin/refund',
        details: {
          action: 'refund_processed',
          customer_id: customerId,
          refund_id: refund.id,
          amount: refund.amount,
          payment_intent: latestPayment.id
        }
      }
      if (userAgent) logEvent.userAgent = userAgent
      logSecurityEvent(logEvent)

    return secureResponse({
      success: true,
      refund_id: refund.id,
      amount: refund.amount,
      status: refund.status
    })

  } catch (error) {
    console.error('Refund processing error:', error)
    
    const userAgent = req.headers.get('user-agent')
      const logEvent: any = {
        type: 'SUSPICIOUS_REQUEST',
        ip: req.ip || 'unknown',
        path: '/api/admin/refund',
        details: { error: String(error) }
      }
      if (userAgent) logEvent.userAgent = userAgent
      logSecurityEvent(logEvent)

    return secureErrorResponse('Refund processing failed', 500)
  }
}