import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, CheckoutSessionData } from '@/lib/stripe/checkout';
import { withErrorHandler, ErrorFactories, ErrorLogger } from '@/lib/error-handler';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Allow 500 unique tokens per interval
});

// Input validation schema
const checkoutSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().regex(/^[\+]?[1-9][\d\s\-\(\)]{7,15}$/, 'Invalid phone format').optional(),
  company: z.string().max(100, 'Company name too long').optional(),
  planId: z.string().min(1, 'Plan ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  userId: z.string().optional()
});

async function createCheckoutSessionHandler(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const logger = ErrorLogger.getInstance()
  
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? (forwarded.split(',')[0]?.trim() || '127.0.0.1') : realIp || '127.0.0.1';
    const { success } = await limiter.check(5, ip); // 5 requests per minute per IP
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw ErrorFactories.validation('Invalid JSON in request body')
    });
    const validatedData = checkoutSchema.parse(body);

    // Sanitize inputs to prevent XSS
    const sanitizedData: CheckoutSessionData = {
      email: validatedData.email.trim().toLowerCase(),
      firstName: validatedData.firstName.trim().replace(/[<>"'&]/g, ''),
      lastName: validatedData.lastName.trim().replace(/[<>"'&]/g, ''),
      phone: validatedData.phone ? validatedData.phone.trim().replace(/[<>"'&]/g, '') : '',
      company: validatedData.company ? validatedData.company.trim().replace(/[<>"'&]/g, '') : '',
      planId: validatedData.planId.trim(),
      priceId: validatedData.priceId.trim(),
      userId: validatedData.userId ? validatedData.userId.trim() : ''
    };

    // Validate price ID against allowed values
    const allowedPriceIds = [
      'price_1RDnUnFCKuRbOGyzto5CVIee', // Existing price ID
      // Add other valid price IDs here
    ];

    if (!allowedPriceIds.includes(sanitizedData.priceId)) {
      return NextResponse.json(
        { error: 'Invalid price ID' },
        { status: 400 }
      );
    }

    // Create checkout session
    const result = await createCheckoutSession(sanitizedData);

    if (!result.success) {
      throw ErrorFactories.externalApi('Stripe', 'Failed to create checkout session', {
        originalError: result.error
      });
    }

    // Return success response with session URL
    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      url: result.url,
      customerId: result.customerId
    });

  } catch (error) {
    // Log error with context
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    const userAgent = request.headers.get('user-agent')
    
    await logger.logError(error as Error, {
      requestId,
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
      url: request.url,
      method: request.method
    })
    
    if (error instanceof z.ZodError) {
      throw ErrorFactories.validation('Invalid input data', {
        validationErrors: error.errors
      });
    }

    // Re-throw to be handled by withErrorHandler
    throw error;
  }
}

// Export the wrapped handler
export const POST = withErrorHandler(createCheckoutSessionHandler);

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}