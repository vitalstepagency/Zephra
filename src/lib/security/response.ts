import { NextResponse } from 'next/server'
import { SecurityEventType, SecuritySeverity, logSecurityEvent } from './audit-log'
import { getRateLimitHeaders, type RateLimitResult } from './rate-limit'
import type { NextRequest } from 'next/server'

// Security response headers
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
}

interface ErrorResponse {
  error: string
  code: string
  timestamp: string
  requestId: string
}

/**
 * Create a secure error response that doesn't leak sensitive information
 */
export function secureErrorResponse(
  message: string,
  status: number = 400,
  code: string = 'SECURITY_ERROR',
  req?: NextRequest,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const requestId = req?.headers.get('x-request-id') || crypto.randomUUID()
  
  // Log security event for non-200 responses
  if (status >= 400 && req) {
    const severity = status >= 500 ? SecuritySeverity.HIGH : SecuritySeverity.MEDIUM
    logSecurityEvent(
      SecurityEventType.SUSPICIOUS_REQUEST,
      severity,
      `Security error response: ${message}`,
      req,
      { status, code, requestId }
    ).catch(console.error)
  }
  
  const errorResponse: ErrorResponse = {
    error: sanitizeErrorMessage(message, status),
    code,
    timestamp: new Date().toISOString(),
    requestId
  }
  
  const response = NextResponse.json(errorResponse, { status })
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitResponse(
  req: NextRequest,
  rateLimitResult: RateLimitResult
): NextResponse {
  const rateLimitHeaders = getRateLimitHeaders(rateLimitResult)
  
  return secureErrorResponse(
    'Rate limit exceeded. Please try again later.',
    429,
    'RATE_LIMIT_EXCEEDED',
    req,
    rateLimitHeaders
  )
}

/**
 * Create an unauthorized response
 */
export function unauthorizedResponse(
  req: NextRequest,
  reason: string = 'Unauthorized access'
): NextResponse {
  return secureErrorResponse(
    'Access denied',
    401,
    'UNAUTHORIZED',
    req
  )
}

/**
 * Create a forbidden response
 */
export function forbiddenResponse(
  req: NextRequest,
  reason: string = 'Forbidden'
): NextResponse {
  return secureErrorResponse(
    'Access forbidden',
    403,
    'FORBIDDEN',
    req
  )
}

/**
 * Create a webhook validation failed response
 */
export function webhookValidationFailedResponse(
  req: NextRequest,
  reason: string = 'Invalid webhook signature'
): NextResponse {
  // Log critical security event
  logSecurityEvent(
    SecurityEventType.WEBHOOK_SIGNATURE_INVALID,
    SecuritySeverity.CRITICAL,
    `Webhook validation failed: ${reason}`,
    req,
    { reason }
  ).catch(console.error)
  
  return secureErrorResponse(
    'Webhook validation failed',
    401,
    'WEBHOOK_VALIDATION_FAILED',
    req
  )
}

/**
 * Create a successful webhook response
 */
export function webhookSuccessResponse(
  data?: any,
  additionalHeaders: Record<string, string> = {}
): NextResponse {
  const response = NextResponse.json(
    {
      success: true,
      timestamp: new Date().toISOString(),
      ...(data && { data })
    },
    { status: 200 }
  )
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Add additional headers
  Object.entries(additionalHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

/**
 * Sanitize error messages to prevent information leakage
 */
function sanitizeErrorMessage(message: string, status: number): string {
  // For 5xx errors, don't expose internal details
  if (status >= 500) {
    return 'Internal server error. Please try again later.'
  }
  
  // For 4xx errors, provide generic but helpful messages
  const sanitizedMessages: Record<number, string> = {
    400: 'Bad request. Please check your input.',
    401: 'Authentication required.',
    403: 'Access forbidden.',
    404: 'Resource not found.',
    405: 'Method not allowed.',
    409: 'Conflict. Resource already exists.',
    422: 'Invalid input data.',
    429: 'Too many requests. Please try again later.'
  }
  
  return sanitizedMessages[status] || message
}

/**
 * Add CORS headers for webhook endpoints
 */
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', 'https://api.stripe.com')
  response.headers.set('Access-Control-Allow-Methods', 'POST')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}