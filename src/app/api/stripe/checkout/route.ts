import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/config'
import { z } from 'zod'
import { logSecurityEvent } from '@/lib/security'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Input validation schema
const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Valid success URL required').optional(),
  cancelUrl: z.string().url('Valid cancel URL required').optional(),
  trialDays: z.number().min(0).max(30).default(7)
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  
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
      const stripe = getStripe()
      
      const body = await req.json()
      
      // Debug logging
      console.log('Checkout API received:', {
        body,
        envVars: {
          basicMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_MONTHLY,
          basicYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_BASIC_YEARLY,
          proMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
          proYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_YEARLY,
          eliteMonthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_MONTHLY,
          eliteYearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE_YEARLY
        }
      })
      
      let validationResult
      try {
        validationResult = checkoutSchema.parse(body)
      } catch (error) {
        console.error('Validation failed:', error)
        return NextResponse.json(
          { error: 'Invalid input data', details: error instanceof Error ? error.message : 'Unknown validation error' },
          { status: 400 }
        )
      }
      
      const { priceId, successUrl, cancelUrl, trialDays } = validationResult
      
      // Log payment attempt
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        path: '/api/stripe/checkout',
        details: { userId: user.id, priceId, action: 'checkout_attempt' }
      })

      // Create or retrieve Stripe customer
      let customer
      const existingCustomers = await stripe.customers.list({
        email: user.email!,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: user.email!,
          name: user.user_metadata?.full_name || user.email!,
          metadata: {
            userId: user.id
          }
        })
      }

      // Create checkout session with trial
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer!.id,
        payment_method_types: ['card'] as Array<'card'>,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        subscription_data: {
          trial_period_days: trialDays,
          metadata: {
            userId: user.id
          }
        },
        success_url: successUrl || `${req.nextUrl.origin}/auth/signin?checkout=success`,
        cancel_url: cancelUrl || `${req.nextUrl.origin}/?canceled=true`,
        metadata: {
          userId: user.id
        }
      })

      // Log successful checkout session creation
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        path: '/api/stripe/checkout',
        details: { userId: user.id, priceId, action: 'checkout_success', sessionId: checkoutSession.id }
      })

      return NextResponse.json({ 
        sessionId: checkoutSession.id,
        url: checkoutSession.url 
      })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    // Log checkout error (user may not be available in outer catch)
    logSecurityEvent({
      type: 'SUSPICIOUS_REQUEST',
      ip,
      path: '/api/stripe/checkout',
      details: { action: 'checkout_error', error: String(error) }
    })
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}