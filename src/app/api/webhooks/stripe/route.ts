import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

// Only create Supabase client if environment variables are properly configured
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabaseAdmin = supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith('https://') 
  ? createClient<Database>(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionChange(subscription, req)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription, req)
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutSessionCompleted(session, req)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice, req)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice, req)
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerCreated(customer, req)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription, req: NextRequest) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping subscription update')
    return
  }

  try {
    const customerId = subscription.customer as string
     const subscriptionId = subscription.id
     const status = subscription.status
     const currentPeriodEnd = (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null
    
    // Get subscription tier from metadata or price
      let tier: 'starter' | 'pro' | 'enterprise' | 'free' = 'starter'
      if (subscription.items?.data && subscription.items.data.length > 0) {
        const price = subscription.items.data[0]?.price
        if (price?.metadata?.tier && ['starter', 'pro', 'enterprise', 'free'].includes(price.metadata.tier)) {
          tier = price.metadata.tier as 'starter' | 'pro' | 'enterprise' | 'free'
        }
      }

     // Map Stripe status to our database status
     let dbStatus: 'active' | 'canceled' | 'past_due' | 'trialing'
     switch (status) {
       case 'active':
         dbStatus = 'active'
         break
       case 'trialing':
         dbStatus = 'trialing'
         break
       case 'past_due':
         dbStatus = 'past_due'
         break
       default:
         dbStatus = 'canceled'
         break
     }

     const { error } = await supabaseAdmin
       .from('users')
       .update({
         subscription_tier: tier,
         subscription_status: dbStatus,
         stripe_subscription_id: subscriptionId,
         trial_ends_at: currentPeriodEnd,
         updated_at: new Date().toISOString()
       })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Error updating subscription:', error)
      throw error
    }

    console.log(`Subscription updated for customer ${customerId}: ${status}`)
  } catch (error) {
    console.error('Error in handleSubscriptionChange:', error)
    throw error
  }
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription, req: NextRequest) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping subscription cancellation')
    return
  }

  try {
    const customerId = subscription.customer as string

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Error canceling subscription:', error)
      throw error
    }

    console.log(`Subscription canceled for customer ${customerId}`)
  } catch (error) {
    console.error('Error in handleSubscriptionCancellation:', error)
    throw error
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice, req: NextRequest) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping payment success update')
    return
  }

  try {
     const customerId = invoice.customer as string
      const subscriptionId = (invoice as any).subscription as string | null

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)
      .eq('stripe_subscription_id', subscriptionId || '')

    if (error) {
      console.error('Error updating payment success:', error)
      throw error
    }

    console.log(`Payment succeeded for customer ${customerId}`)
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error)
    throw error
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice, req: NextRequest) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping payment failure update')
    return
  }

  try {
     const customerId = invoice.customer as string
      const subscriptionId = (invoice as any).subscription as string | null

    const { error } = await supabaseAdmin
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)
      .eq('stripe_subscription_id', subscriptionId || '')

    if (error) {
      console.error('Error updating payment failure:', error)
      throw error
    }

    console.log(`Payment failed for customer ${customerId}`)
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
    throw error
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, req: NextRequest) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping checkout session update')
    return
  }

  try {
    const customerId = session.customer as string
    const subscriptionId = session.subscription as string
    
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    
    let tier: 'starter' | 'pro' | 'enterprise' | 'free' = 'starter'
      if (subscription.items?.data && subscription.items.data.length > 0) {
        const price = subscription.items.data[0]?.price
        if (price?.metadata?.tier && ['starter', 'pro', 'enterprise', 'free'].includes(price.metadata.tier)) {
          tier = price.metadata.tier as 'starter' | 'pro' | 'enterprise' | 'free'
        }
      }

     // Map Stripe status to our database status
     let dbStatus: 'active' | 'canceled' | 'past_due' | 'trialing'
     switch (subscription.status) {
       case 'active':
         dbStatus = 'active'
         break
       case 'trialing':
         dbStatus = 'trialing'
         break
       case 'past_due':
         dbStatus = 'past_due'
         break
       default:
         dbStatus = 'canceled'
         break
     }

     const { error } = await supabaseAdmin
       .from('users')
       .update({
         subscription_tier: tier,
         subscription_status: dbStatus,
         stripe_subscription_id: subscriptionId,
         stripe_customer_id: customerId,
         trial_ends_at: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
         updated_at: new Date().toISOString()
       })
      .eq('stripe_customer_id', customerId)

    if (error) {
      console.error('Error updating checkout session:', error)
      throw error
    }

    console.log(`Checkout completed for customer ${customerId}`)
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
    throw error
  }
}

async function handleCustomerCreated(customer: Stripe.Customer, req: NextRequest) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping customer creation')
    return
  }

  try {
    const customerId = customer.id
    const email = customer.email

    if (email) {
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('email', email)

      if (error) {
        console.error('Error updating customer:', error)
        throw error
      }

      console.log(`Customer created: ${customerId} for email ${email}`)
    }
  } catch (error) {
    console.error('Error in handleCustomerCreated:', error)
    throw error
  }
}