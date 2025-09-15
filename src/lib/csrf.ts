import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken, validateCSRFToken } from './validation'

// CSRF token storage (in production, use Redis or database)
const csrfTokens = new Map<string, { token: string; expires: number }>()

// Clean up expired tokens
function cleanupExpiredTokens() {
  const now = Date.now()
  const entries = Array.from(csrfTokens.entries())
  for (const [key, value] of entries) {
    if (value.expires < now) {
      csrfTokens.delete(key)
    }
  }
}

// Generate and store CSRF token for a session
export function createCSRFToken(sessionId: string): string {
  cleanupExpiredTokens()
  
  const token = generateCSRFToken()
  const expires = Date.now() + (30 * 60 * 1000) // 30 minutes
  
  csrfTokens.set(sessionId, { token, expires })
  return token
}

// Validate CSRF token
export function verifyCSRFToken(sessionId: string, token: string): boolean {
  cleanupExpiredTokens()
  
  const storedData = csrfTokens.get(sessionId)
  if (!storedData) {
    return false
  }
  
  if (storedData.expires < Date.now()) {
    csrfTokens.delete(sessionId)
    return false
  }
  
  return validateCSRFToken(token, storedData.token)
}

// CSRF middleware for API routes
export function withCSRFProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return handler(req)
    }
    
    try {
      const sessionId = req.headers.get('x-session-id') || 'anonymous'
      const csrfToken = req.headers.get('x-csrf-token')
      
      if (!csrfToken) {
        return NextResponse.json(
          { error: 'CSRF token required' },
          { status: 403 }
        )
      }
      
      if (!verifyCSRFToken(sessionId, csrfToken)) {
        return NextResponse.json(
          { error: 'Invalid CSRF token' },
          { status: 403 }
        )
      }
      
      return handler(req)
    } catch (error) {
      console.error('CSRF validation error:', error)
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }
}

// Generate CSRF token endpoint
export async function generateCSRFTokenEndpoint(req: NextRequest): Promise<NextResponse> {
  try {
    const sessionId = req.headers.get('x-session-id') || 'anonymous'
    const token = createCSRFToken(sessionId)
    
    return NextResponse.json({ csrfToken: token })
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}

// Content Security Policy headers
export function getCSPHeaders(): Record<string, string> {
  const nonce = generateCSRFToken().substring(0, 16)
  
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com wss://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
}

// Security headers middleware
export function withSecurityHeaders(response: NextResponse): NextResponse {
  const headers = getCSPHeaders()
  
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}

export default {
  createCSRFToken,
  verifyCSRFToken,
  withCSRFProtection,
  generateCSRFTokenEndpoint,
  getCSPHeaders,
  withSecurityHeaders
}