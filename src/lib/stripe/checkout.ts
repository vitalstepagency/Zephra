import Stripe from 'stripe';
import { NextRequest } from 'next/server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

export interface CheckoutSessionData {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  planId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  userId?: string;
}

export async function createCheckoutSession(data: CheckoutSessionData) {
  try {
    console.log('Creating checkout session with data:', {
      priceId: data.priceId ? `${data.priceId.substring(0, 8)}...` : 'missing',
      email: data.email ? `${data.email.substring(0, 3)}...@${data.email.split('@')[1] || 'unknown'}` : 'missing',
      name: data.name ? (data.name.length > 0 ? 'provided' : 'empty') : 'missing',
      userId: data.userId ? `${data.userId.substring(0, 8)}...` : 'missing',
    });
    
    // Input validation
    if (!data.email || !data.name || !data.planId || !data.priceId || !data.successUrl || !data.cancelUrl) {
      console.error('Missing required fields in checkout data');
      throw new Error('Missing required fields for checkout');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      console.error('Invalid email format provided');
      throw new Error('Invalid email format');
    }

    // Phone validation (basic format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (data.phone && !phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      console.error('Invalid phone format provided');
      throw new Error('Invalid phone format');
    }

    // Sanitize inputs
    const sanitizedData = {
      email: data.email.trim().toLowerCase(),
      name: data.name.trim(),
      phone: data.phone?.trim(),
      company: data.company?.trim(),
      planId: data.planId.trim(),
      priceId: data.priceId.trim(),
      successUrl: data.successUrl.trim(),
      cancelUrl: data.cancelUrl.trim(),
      userId: data.userId?.trim()
    };

    console.log('Looking up existing customer with email:', sanitizedData.email.substring(0, 3) + '...');
    
    // Create or retrieve customer
    let customer: Stripe.Customer;
    try {
      const existingCustomers = await stripe.customers.list({
        email: sanitizedData.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
        customer = existingCustomers.data[0];
        console.log('Found existing customer:', customer.id);
        
        // Update customer info if needed
        const updateData: any = {
          name: sanitizedData.name,
          metadata: {
            company: sanitizedData.company || '',
            planId: sanitizedData.planId,
            userId: sanitizedData.userId || ''
          }
        };
        if (sanitizedData.phone) {
          updateData.phone = sanitizedData.phone;
        }
        
        console.log('Updating customer data for:', customer.id);
        await stripe.customers.update(customer.id, updateData);
      } else {
        console.log('No existing customer found, creating new customer');
        
        const createData: any = {
          email: sanitizedData.email,
          name: sanitizedData.name,
          metadata: {
            company: sanitizedData.company || '',
            planId: sanitizedData.planId,
            userId: sanitizedData.userId || ''
          }
        };
        if (sanitizedData.phone) {
          createData.phone = sanitizedData.phone;
        }
        
        customer = await stripe.customers.create(createData);
        console.log('Created new customer:', customer.id);
      }
    } catch (error) {
      console.error('Error managing Stripe customer:', error);
      throw new Error('Failed to create or update customer');
    }

    // Create checkout session
    console.log('Creating Stripe checkout session for customer:', customer.id.substring(0, 8) + '...');
    
    try {
      // Configure session parameters
      const sessionConfig = {
        customer: customer.id,
        payment_method_types: ['card'] as Array<'card'>,
        line_items: [
          {
            price: sanitizedData.priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription' as const,
        success_url: sanitizedData.successUrl,
        cancel_url: sanitizedData.cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'required' as const,
        customer_update: {
          address: 'auto' as const,
          name: 'auto' as const
        },
        metadata: {
          planId: sanitizedData.planId,
          userId: sanitizedData.userId || '',
          name: sanitizedData.name,
          company: sanitizedData.company || ''
        },
        subscription_data: {
          metadata: {
            planId: sanitizedData.planId,
            userId: sanitizedData.userId || '',
            trial_period_days: '7'
          },
          trial_period_days: 7
        },
        automatic_tax: {
          enabled: true
        }
      };
      
      console.log('Session configuration:', {
        priceId: sanitizedData.priceId.substring(0, 8) + '...',
        planId: sanitizedData.planId,
        customerId: customer.id.substring(0, 8) + '...'
      });
      
      const session = await stripe.checkout.sessions.create(sessionConfig);
      
      if (!session || !session.url) {
        console.error('Stripe session created but missing URL');
        throw new Error('Checkout session URL not available');
      }
      
      console.log('Checkout session created successfully:', {
        sessionId: session.id,
        url: session.url.substring(0, 30) + '...' // Log partial URL for brevity
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url,
        customerId: customer.id
      };
    } catch (stripeError) {
      console.error('Stripe checkout session creation error:', stripeError);
      throw new Error(
        stripeError instanceof Error 
          ? `Stripe error: ${stripeError.message}` 
          : 'Failed to create Stripe checkout session'
      );
    }
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
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