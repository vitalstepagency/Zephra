import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { stripe } from '@/lib/stripe/checkout';
import { withErrorHandler, ErrorFactories, ErrorLogger } from '@/lib/error-handler';

async function verifySessionHandler(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const logger = ErrorLogger.getInstance();
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw ErrorFactories.authentication('User not authenticated');
    }

    // Get session ID from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      throw ErrorFactories.validation('Session ID is required');
    }

    // Verify the Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['customer', 'subscription']
    });

    // Check if session is completed and belongs to the current user
    const verified = checkoutSession.payment_status === 'paid' && 
                    checkoutSession.customer_details?.email === session.user.email;

    return NextResponse.json({
      success: true,
      verified,
      sessionData: {
        paymentStatus: checkoutSession.payment_status,
        customerEmail: checkoutSession.customer_details?.email,
        subscriptionId: checkoutSession.subscription
      }
    });

  } catch (error) {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'StripeInvalidRequestError') {
      throw ErrorFactories.validation('Invalid session ID');
    }
    
    logger.logError(error as Error, {
      url: '/api/stripe/verify-session',
      method: request.method,
      requestId
    });
    
    throw error;
  }
}

export const GET = withErrorHandler(verifySessionHandler);