import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe/config'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
  const signature = headers().get('stripe-signature')!
  const stripe = getStripe()

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
        await handleSubscriptionChange(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancellation(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case 'customer.created': {
        const customer = event.data.object as Stripe.Customer
        await handleCustomerCreated(customer)
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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping subscription update')
    return
  }

  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  
  // Get the price ID to determine the plan
  const priceId = subscription.items.data[0]?.price.id
  let tier: 'starter' | 'pro' | 'enterprise' = 'starter'
  
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO) {
    tier = 'pro'
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ENTERPRISE) {
    tier = 'enterprise'
  }

  // Map Stripe status to our database status
  let status: 'active' | 'canceled' | 'past_due' | 'trialing'
  switch (subscription.status) {
    case 'active':
      status = 'active'
      break
    case 'canceled':
    case 'incomplete_expired':
    case 'unpaid':
    case 'paused':
      status = 'canceled'
      break
    case 'past_due':
      status = 'past_due'
      break
    case 'trialing':
      status = 'trialing'
      break
    default:
      status = 'canceled'
  }

  // Update user subscription in database
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: tier,
      stripe_subscription_id: subscriptionId,
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error updating user subscription:', error)
    throw error
  }

  console.log(`Updated subscription for customer ${customerId} to ${tier} (${status})`)
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping subscription cancellation')
    return
  }

  const customerId = subscription.customer as string

  // Update user to starter plan
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_tier: 'starter',
      stripe_subscription_id: null,
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)

  if (error) {
    console.error('Error canceling user subscription:', error)
    throw error
  }

  console.log(`Canceled subscription for customer ${customerId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping payment success update')
    return
  }

  const customerId = invoice.customer as string
  const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id

  // Update subscription status to active
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
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  if (!supabaseAdmin) {
    console.log('Supabase not configured, skipping payment failure update')
    return
  }

  const customerId = invoice.customer as string
  const subscriptionId = (invoice as any).subscription as string

  // Update subscription status to past_due
  const { error } = await supabaseAdmin
    .from('users')
    .update({
      subscription_status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customerId)
    .eq('stripe_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating payment failure:', error)
    throw error
  }

  console.log(`Payment failed for customer ${customerId}`)
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  // This is handled when creating the customer, but we can log it
  console.log(`New Stripe customer created: ${customer.id}`)
}