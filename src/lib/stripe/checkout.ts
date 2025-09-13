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
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  planId: string;
  priceId: string;
  userId?: string;
}

export async function createCheckoutSession(data: CheckoutSessionData) {
  try {
    // Input validation
    if (!data.email || !data.firstName || !data.lastName || !data.planId || !data.priceId) {
      throw new Error('Missing required fields');
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new Error('Invalid email format');
    }

    // Phone validation (basic format)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (data.phone && !phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      throw new Error('Invalid phone format');
    }

    // Sanitize inputs
    const sanitizedData = {
      email: data.email.trim().toLowerCase(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim(),
      company: data.company?.trim(),
      planId: data.planId.trim(),
      priceId: data.priceId.trim(),
      userId: data.userId?.trim()
    };

    // Create or retrieve customer
    let customer: Stripe.Customer;
    const existingCustomers = await stripe.customers.list({
      email: sanitizedData.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0 && existingCustomers.data[0]) {
      customer = existingCustomers.data[0];
      // Update customer info if needed
      const updateData: any = {
        name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
        metadata: {
          company: sanitizedData.company || '',
          planId: sanitizedData.planId,
          userId: sanitizedData.userId || ''
        }
      };
      if (sanitizedData.phone) {
        updateData.phone = sanitizedData.phone;
      }
      await stripe.customers.update(customer.id, updateData);
    } else {
      const createData: any = {
        email: sanitizedData.email,
        name: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
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
    }

    // Create checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-verification?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(sanitizedData.email)}&name=${encodeURIComponent(`${sanitizedData.firstName} ${sanitizedData.lastName}`)}&plan=${sanitizedData.planId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?plan=${sanitizedData.planId}&error=payment_cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      metadata: {
        planId: sanitizedData.planId,
        userId: sanitizedData.userId || '',
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        company: sanitizedData.company || ''
      },
      subscription_data: {
        metadata: {
          planId: sanitizedData.planId,
          userId: sanitizedData.userId || '',
          trial_period_days: '14'
        },
        trial_period_days: 14
      },
      automatic_tax: {
        enabled: true
      }
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url,
      customerId: customer.id
    };
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