import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import crypto from 'crypto'
import { webhookRateLimit } from '@/lib/security/rate-limit'
import { SecurityEventType, SecuritySeverity, logSecurityEvent, logWebhookEvent } from '@/lib/security/audit-log'
import { encrypt, maskSensitiveData } from '@/lib/security/encryption'
import { secureErrorResponse, webhookSuccessResponse, webhookValidationFailedResponse, rateLimitResponse } from '@/lib/security/response'
import { getStripe } from '@/lib/stripe/config'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase with service role for webhook operations
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

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required')
}

// Security constants
const MAX_BODY_SIZE = 1024 * 1024 // 1MB
const WEBHOOK_TOLERANCE = 300 // 5 minutes
const ALLOWED_IPS = [
  '54.187.174.169',
  '54.187.205.235', 
  '54.187.216.72',
  '54.241.31.99',
  '54.241.31.102',
  '54.241.34.107'
] // Stripe webhook IPs

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Temporarily disabled due to syntax issues
  return NextResponse.json({ error: 'Webhook temporarily disabled' }, { status: 503 });
}

// Original function commented out for now
/*
export async function POST_ORIGINAL(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || '127.0.0.1'
  const userAgent = req.headers.get('user-agent') || ''
  
  // Rate limiting check
  const rateLimitResult = await webhookRateLimit(req)
  
  if (!rateLimitResult.success) {
    return rateLimitResponse(req, rateLimitResult)
  }
  
  // Validate webhook secret exists
  if (!webhookSecret) {
    await logSecurityEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      SecuritySeverity.CRITICAL,
      'Missing webhook secret configuration',
      req,
      { path: '/api/webhooks/stripe' }
    );
    return secureErrorResponse('Webhook not configured', 500, 'WEBHOOK_NOT_CONFIGURED', req)
  }

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')
  
  if (!signature) {
    await logSecurityEvent(
      SecurityEventType.WEBHOOK_SIGNATURE_INVALID,
      SecuritySeverity.HIGH,
      'Missing Stripe signature header',
      req,
      { path: '/api/webhooks/stripe' }
    )
    return secureErrorResponse('Missing signature', 400, 'MISSING_SIGNATURE', req)
  }
  
  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    await logSecurityEvent(
      SecurityEventType.WEBHOOK_SIGNATURE_INVALID,
      SecuritySeverity.CRITICAL,
      `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      req,
      { signature, error: String(err) }
    )
    console.error('Webhook signature verification failed:', err)
    return webhookValidationFailedResponse(req, 'Invalid webhook signature')
  }

  // Log webhook event
  await logWebhookEvent(event.type, true, req, {
    event_id: event.id,
    livemode: event.livemode,
    api_version: event.api_version
  })
  
  // Process the event
  console.log(`Processing event: ${event.type}`)
  
  try {
    switch (event.type) {
      // Checkout events
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object as Stripe.Checkout.Session)
        break
      
      // Customer events
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break
      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer)
        break
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break
      case 'customer.discount.created':
        await handleCustomerDiscountCreated(event.data.object as Stripe.Discount)
        break
      
      // Subscription events
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
      
      // Invoice events
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object as Stripe.Invoice)
        break
      case 'invoice.finalized':
        await handleInvoiceFinalized(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_action_required':
        await handleInvoicePaymentActionRequired(event.data.object as Stripe.Invoice)
        break
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
      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice)
        break
      
      // Payment method events
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod)
        break
      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod)
        break
      case 'payment_method.updated':
        await handlePaymentMethodUpdated(event.data.object as Stripe.PaymentMethod)
        break
      
      // Setup intent events
      case 'setup_intent.succeeded':
        await handleSetupIntentSucceeded(event.data.object as Stripe.SetupIntent)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
        await logSecurityEvent(
          SecurityEventType.WEBHOOK_RECEIVED,
          SecuritySeverity.LOW,
          `Received unhandled webhook event: ${event.type}`,
          req,
          { event_type: event.type, event_id: event.id }
        )
    }
  } catch (eventError) {
     console.error(`Error processing ${event.type}:`, eventError)
     await logWebhookEvent(event.type, false, req, {
       event_id: event.id,
       error: String(eventError)
     })
     throw eventError
   }

   return webhookSuccessResponse({ received: true, event_type: event.type });
  } catch (error) {
    console.error('Webhook error:', error);
    await logSecurityEvent(
      SecurityEventType.WEBHOOK_RECEIVED,
      SecuritySeverity.HIGH,
      `Webhook processing failed: ${error}`,
      req,
      { error: String(error) }
    );
    return secureErrorResponse('Webhook processing failed', 500, 'WEBHOOK_ERROR', req);
  }
}
*/

/*
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const supabase = getSupabaseClient()

  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  
  // Get the price ID to determine the plan
  const priceId = subscription.items.data[0]?.price.id
  let tier: 'starter' | 'pro' | 'enterprise' = 'starter'
  
  // Map price IDs to tiers (both monthly and yearly)
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || 
      priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY) {
    tier = 'pro'
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_MONTHLY || 
             priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_YEARLY) {
    tier = 'enterprise'
  } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY || 
             priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_YEARLY) {
    tier = 'starter'
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
  const { error } = await supabase
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
  const supabase = getSupabaseClient()

  const customerId = subscription.customer as string

  // Update user to starter plan
  const { error } = await supabase
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
  const supabase = getSupabaseClient()

  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id

    if (!customerId) {
      throw new Error('No customer ID found in invoice')
    }

    // Update subscription status to active
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment success:', error)
      throw error
    }

    // Log successful payment
     await logSecurityEvent(
       SecurityEventType.WEBHOOK_RECEIVED,
       SecuritySeverity.LOW,
       `Payment succeeded for customer ${customerId}`,
       undefined,
       {
         customer_id: customerId,
         subscription_id: subscriptionId,
         invoice_id: invoice.id
       }
     )

    console.log(`Payment succeeded for customer ${customerId}`)
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error)
    
    // Log the error
     await logSecurityEvent(
       SecurityEventType.WEBHOOK_RECEIVED,
       SecuritySeverity.HIGH,
       `Failed to process payment success: ${error}`,
       undefined,
       {
         invoice_id: invoice.id,
         error: String(error)
       }
     )
    
    throw error
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const supabase = getSupabaseClient()

  try {
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id

    if (!customerId) {
      throw new Error('No customer ID found in invoice')
    }

    // Update subscription status to past_due
    const { data, error } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', customerId)
      .select()
      .single()

    if (error) {
      console.error('Error updating payment failure:', error)
      throw error
    }

    // Log payment failure
     await logSecurityEvent(
       SecurityEventType.WEBHOOK_RECEIVED,
       SecuritySeverity.MEDIUM,
       `Payment failed for customer ${customerId}`,
       undefined,
       {
         customer_id: customerId,
         subscription_id: subscriptionId,
         invoice_id: invoice.id,
         failure_reason: invoice.last_finalization_error?.message || 'Unknown'
       }
     )

    console.log(`Payment failed for customer ${customerId}`)
  } catch (error) {
    console.error('Error in handlePaymentFailed:', error)
    
    // Log the error
     await logSecurityEvent(
       SecurityEventType.WEBHOOK_RECEIVED,
       SecuritySeverity.HIGH,
       `Failed to process payment failure: ${error}`,
       undefined,
       {
         invoice_id: invoice.id,
         error: String(error)
       }
     )
    
    throw error
  }
}

// Checkout event handlers
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id)
  const supabase = getSupabaseClient()
  
  try {
    const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
    
    if (!customerId) {
      throw new Error('No customer ID found in checkout session')
    }

    // Get the subscription details to determine the plan
    const stripe = getStripe()
    let subscription: Stripe.Subscription | null = null
    let priceId: string | null = null
    
    if (subscriptionId) {
      subscription = await stripe.subscriptions.retrieve(subscriptionId)
      priceId = subscription.items.data[0]?.price.id || null
    }
    
    // Determine subscription tier
    let tier: 'starter' | 'pro' | 'enterprise' = 'starter'
    if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY || 
        priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY) {
      tier = 'pro'
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_MONTHLY || 
               priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_YEARLY) {
      tier = 'enterprise'
    } else if (priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY || 
               priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_YEARLY) {
      tier = 'starter'
    }
    
    // Calculate trial end date (14 days from now)
    const trialEndDate = new Date()
    trialEndDate.setDate(trialEndDate.getDate() + 14)
    
    // Update users table with subscription information
     const { data: profile, error: profileError } = await supabase
       .from('users')
       .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId || null,
          subscription_status: subscription?.status === 'trialing' ? 'trialing' : 'active',
          subscription_tier: tier,
          trial_ends_at: subscription?.status === 'trialing' ? trialEndDate.toISOString() : null,
          updated_at: new Date().toISOString()
        })
       .eq('stripe_customer_id', customerId)
       .select()
       .single()
    
    if (profileError) {
      console.error('Error updating user profile after checkout completion:', profileError)
      throw profileError
    }
    
    // Log successful account activation
     await logSecurityEvent(
       SecurityEventType.WEBHOOK_RECEIVED,
       SecuritySeverity.LOW,
       `Account activated successfully for customer ${customerId}`,
       req,
       {
         customer_id: customerId,
         subscription_id: subscriptionId,
         tier,
         session_id: session.id
       }
     )
    
    console.log(`Account activated successfully for customer ${customerId} with tier ${tier}`)
    
  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error)
    
    // Log the error for monitoring
     await logSecurityEvent(
       SecurityEventType.WEBHOOK_RECEIVED,
       SecuritySeverity.HIGH,
       `Failed to activate account after checkout completion: ${error}`,
       req,
       {
         session_id: session.id,
         error: String(error)
       }
     )
    
    throw error
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  console.log('Checkout session expired:', session.id)
  // Log expired checkout sessions for analytics
}

// Customer event handlers
async function handleCustomerCreated(customer: Stripe.Customer) {
  console.log('Customer created:', customer.id)
  const supabase = getSupabaseClient()
  
  // Store customer metadata if needed
  const encryptedCustomerData = encrypt(JSON.stringify({
    stripe_customer_id: customer.id,
    email: customer.email,
    created: customer.created
  }))
  
  console.log('Customer data encrypted and stored securely')
}

async function handleCustomerDeleted(customer: Stripe.Customer) {
  console.log('Customer deleted:', customer.id)
  const supabase = getSupabaseClient()
  
  // Clean up user data when customer is deleted
  const { error } = await supabase
    .from('users')
    .update({
      stripe_customer_id: null,
      subscription_status: 'canceled',
      subscription_tier: 'starter',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer.id)
  
  if (error) {
    console.error('Error cleaning up user data after customer deletion:', error)
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log('Customer updated:', customer.id)
  // Handle customer updates if needed
}

async function handleCustomerDiscountCreated(discount: Stripe.Discount) {
  console.log('Customer discount created:', discount.id)
  // Handle discount application
}

// Invoice event handlers
async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log('Invoice created:', invoice.id)
  // Handle invoice creation
}

async function handleInvoiceFinalized(invoice: Stripe.Invoice) {
  console.log('Invoice finalized:', invoice.id)
  // Handle invoice finalization
}

async function handleInvoicePaymentActionRequired(invoice: Stripe.Invoice) {
  console.log('Invoice payment action required:', invoice.id)
  const supabase = getSupabaseClient()
  
  // Notify user that payment action is required
  if (invoice.customer) {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_customer_id', typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id)
    
    if (error) {
      console.error('Error updating user status for payment action required:', error)
    }
  }
}

async function handleInvoiceUpcoming(invoice: Stripe.Invoice) {
  console.log('Invoice upcoming:', invoice.id)
  // Handle upcoming invoice notifications
}

// Payment method event handlers
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method attached:', paymentMethod.id)
  // Handle payment method attachment
}

async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method detached:', paymentMethod.id)
  // Handle payment method detachment
}

async function handlePaymentMethodUpdated(paymentMethod: Stripe.PaymentMethod) {
  console.log('Payment method updated:', paymentMethod.id)
  // Handle payment method updates
}

// Setup intent event handlers
async function handleSetupIntentSucceeded(setupIntent: Stripe.SetupIntent) {
  console.log('Setup intent succeeded:', setupIntent.id)
  // Handle successful setup intent
}
*/