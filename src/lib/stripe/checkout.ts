import Stripe from 'stripe';
import { NextRequest } from 'next/server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Updated to a valid API version
});

export interface CheckoutSessionData {
  email: string;
  name: string;
  planId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string | undefined;
}

export async function createCheckoutSession(data: CheckoutSessionData) {
  try {
    // Basic validation
    if (!data.email || !data.name || !data.planId || !data.priceId || !data.successUrl || !data.cancelUrl) {
      throw new Error('Missing required fields for checkout');
    }

    // Sanitize inputs
    const sanitizedData = {
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      planId: data.planId.trim(),
      priceId: data.priceId.trim(),
      successUrl: data.successUrl.trim(),
      cancelUrl: data.cancelUrl.trim(),
      userId: data.userId?.trim()
    };
    
    // Create or retrieve customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: sanitizedData.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
      customer = existingCustomers.data[0] as Stripe.Customer;
      
      // Update customer info
      await stripe.customers.update(customer.id, {
        name: sanitizedData.name,
        metadata: {
          planId: sanitizedData.planId,
          userId: sanitizedData.userId || ''
        }
      });
    } else {
      // Create new customer
      const createData = {
        email: sanitizedData.email,
        name: sanitizedData.name,
        metadata: {
          planId: sanitizedData.planId,
          userId: sanitizedData.userId || ''
        }
      };
        
      customer = await stripe.customers.create(createData) as Stripe.Customer;
      console.log('Created new customer:', customer.id);
    }

    // Create checkout session
    console.log('Creating checkout session with price:', sanitizedData.priceId);
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: sanitizedData.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: sanitizedData.successUrl,
      cancel_url: sanitizedData.cancelUrl,
      metadata: {
        planId: sanitizedData.planId,
        userId: sanitizedData.userId || ''
      },
      subscription_data: {
        trial_period_days: 7, // 7-day trial
        metadata: {
          planId: sanitizedData.planId,
          userId: sanitizedData.userId || ''
        }
      }
    });

    console.log('Checkout session created:', session.id);
    return { success: true, sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });
    return { success: true, session };
  } catch (error) {
    console.error('Failed to retrieve checkout session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve session'
    };
  }
}

export { stripe };