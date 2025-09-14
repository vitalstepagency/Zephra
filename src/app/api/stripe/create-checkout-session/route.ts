import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession, CheckoutSessionData } from '@/lib/stripe/checkout';
import { withErrorHandler, ErrorFactories, ErrorLogger } from '@/lib/error-handler';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Configure rate limiting
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per minute
});

// Input validation schema
const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  planId: z.string(),
  priceId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  userId: z.string().optional()
});

async function handler(request: NextRequest) {
  // Enforce rate limits
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded ? (forwarded.split(',')[0]?.trim() || '127.0.0.1') : realIp || '127.0.0.1';
  
  try {
    try {
       await limiter.check(10, ip); // 10 requests per minute per IP
     } catch {
       return NextResponse.json(
         { error: 'Too many requests. Please try again later.' },
         { status: 429 }
       );
     }

    // Parse request body
    const body = await request.json();
    
    // Validate against schema
    const validatedData = checkoutSchema.parse(body);
    
    // Create checkout session
    const session = await createCheckoutSession(validatedData);
    
    return NextResponse.json({
       success: true,
       sessionId: session.sessionId,
       url: session.url
     });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

// Export the POST handler
export async function POST(req: NextRequest) {
  return handler(req);
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_BASE_URL || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400', // 24 hours cache for preflight requests
    },
  });
}

// Helper function to sanitize input
function sanitizeInput(input: string | undefined): string {
  if (!input) return '';
  return input.trim().replace(/[<>"'&]/g, '');
}