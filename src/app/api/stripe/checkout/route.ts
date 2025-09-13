import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import Stripe from 'stripe'
import { withSecurity } from '@/lib/api-security'
import { z } from 'zod'
import { logSecurityEvent } from '@/lib/security'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Input validation schema
const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Valid success URL required').optional(),
  cancelUrl: z.string().url('Valid cancel URL required').optional()
})

export const POST = withSecurity(
  async (req: NextRequest, { session, userId }) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-08-27.basil',
      })
      
      const body = await req.json()
      
      // Debug logging
      console.log('Checkout API received:', {
        body,
        envVars: {
          starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER,
          pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
          elite: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE
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
      
      const { priceId, successUrl, cancelUrl } = validationResult
      
      // Log payment attempt
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        path: '/api/stripe/checkout',
        details: { userId, priceId, action: 'checkout_attempt' }
      })

      // Create or retrieve Stripe customer
      let customer
      const existingCustomers = await stripe.customers.list({
        email: session.user.email,
        limit: 1
      })

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name || '',
          metadata: {
            userId: userId
          }
        })
      }

      // Create checkout session
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customer!.id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl || `${req.nextUrl.origin}/onboarding?success=true&plan=${priceId}`,
        cancel_url: cancelUrl || `${req.nextUrl.origin}/?canceled=true`,
        metadata: {
          userId: userId
        }
      })

      // Log successful checkout session creation
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        path: '/api/stripe/checkout',
        details: { userId, priceId, action: 'checkout_success', sessionId: checkoutSession.id }
      })

      return NextResponse.json({ 
        sessionId: checkoutSession.id,
        url: checkoutSession.url 
      })
    } catch (error) {
      console.error('Stripe checkout error:', error)
      
      // Log checkout error
       logSecurityEvent({
         type: 'SUSPICIOUS_REQUEST',
         ip,
         path: '/api/stripe/checkout',
         details: { userId, action: 'checkout_error', error: String(error) }
       })
      
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }
  },
   {
     requireAuth: true,
     allowedMethods: ['POST'],
     schema: checkoutSchema
   }
 )