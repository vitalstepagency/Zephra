import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { logSecurityEvent } from '@/lib/security'
import { supabase } from '@/lib/supabase/client'
import { withErrorHandler, ErrorFactories, ErrorLogger, TransactionManager } from '@/lib/error-handler'

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

async function webhookHandler(req: NextRequest) {
  const requestId = crypto.randomUUID()
  const logger = ErrorLogger.getInstance()
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
  try {
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        path: '/api/stripe/webhook',
        details: 'Missing Stripe signature'
      })
      throw ErrorFactories.validation('Missing Stripe signature')
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        path: '/api/stripe/webhook',
        details: `Webhook signature verification failed: ${err}`
      })
      throw ErrorFactories.security('Webhook signature verification failed', {
        originalError: err
      })
    }

  // Log webhook event
  logSecurityEvent({
    type: 'SUSPICIOUS_REQUEST',
    ip,
    path: '/api/stripe/webhook',
    details: { eventType: event.type, eventId: event.id }
  })

    // Process webhook event with transaction rollback capability
    await TransactionManager.executeWithRollback(
      requestId,
      async () => {
        switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          const userId = session.metadata?.userId
          
          if (userId) {
            // Update user's subscription information using session metadata
            const { error } = await supabase
              .from('users')
              .update({
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing',
                plan_id: subscription.items.data[0]?.price.id,
                trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                payment_confirmed: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId)
            
            if (error) {
              console.error('Error updating user subscription:', error)
              throw error
            } else {
              console.log(`Subscription activated for user ${userId}:`, subscription.id)
            }
          } else {
            // Fallback: try to find user by customer email
            const customer = await stripe.customers.retrieve(session.customer as string)
            if (!customer.deleted && customer.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('id')
                .eq('email', customer.email)
                .single()
              
              if (userData) {
                await supabase
                  .from('users')
                  .update({
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: subscription.id,
                    subscription_status: subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing',
                    plan_id: subscription.items.data[0]?.price.id,
                    trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                    payment_confirmed: true,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', userData.id)
              }
            }
          }
        }
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        const validStatuses = ['active', 'canceled', 'past_due', 'trialing'] as const
        const status = validStatuses.includes(subscription.status as any) 
          ? subscription.status as 'active' | 'canceled' | 'past_due' | 'trialing'
          : 'canceled'
          
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: status,
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
          
        if (error) {
          console.error('Subscription update error:', error)
          throw error
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Cancel subscription
        const { error } = await supabase
          .from('users')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
          
        if (error) {
          console.error('Subscription cancellation error:', error)
          throw error
        }
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Handle failed payment
        logSecurityEvent({
          type: 'SUSPICIOUS_REQUEST',
          ip,
          path: '/api/stripe/webhook',
          details: { 
            eventType: 'payment_failed', 
            customerId: invoice.customer,
            invoiceId: invoice.id
          }
        })
        break
      }
      
        default:
          console.log(`Unhandled event type: ${event.type}`)
        }
      },
      async () => {
        // Rollback operations if needed
        console.log('Rolling back webhook processing for event:', event.id)
      }
    )

    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Webhook processing error:', error)
    
    logSecurityEvent({
      type: 'SUSPICIOUS_REQUEST',
      ip,
      path: '/api/stripe/webhook',
      details: { 
        eventType: event?.type || 'unknown', 
        eventId: (event as any)?.id || 'unknown', 
        error: String(error) 
      }
    })
    
    // Log error with context
    const userAgent = req.headers.get('user-agent')
    
    await logger.logError(error as Error, {
      requestId,
      ipAddress: ip,
      userAgent: userAgent || undefined,
      url: req.url,
      method: req.method
    })

    // Re-throw to be handled by withErrorHandler
    throw error
  }
}

// Export the wrapped handler
export const POST = withErrorHandler(webhookHandler)