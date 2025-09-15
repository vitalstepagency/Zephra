import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequestWithAuth } from 'next-auth/middleware'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Rate limiting configuration
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '15 m'), // 100 requests per 15 minutes
  analytics: true,
})

// Suspicious patterns to block
const suspiciousPatterns = [
  /\.php$/,
  /\.asp$/,
  /\.jsp$/,
  /wp-admin/,
  /wp-login/,
  /admin\.php/,
  /phpmyadmin/,
  /\.env$/,
  /\.git/,
  /\.well-known/,
  /xmlrpc\.php/,
  /\.sql$/,
  /backup/,
]

// Blocked IP addresses (can be populated from threat intelligence)
const blockedIPs = new Set<string>([
  // Add known malicious IPs here
  '192.168.1.100',
  '10.0.0.1',
  '172.16.0.1',
  // Common attack sources
  '185.220.100.240',
  '185.220.101.1'
])

// CSRF token validation
function validateCSRFToken(req: NextRequestWithAuth): boolean {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return true // CSRF not needed for safe methods
  }
  
  const token = req.headers.get('x-csrf-token') || req.headers.get('x-xsrf-token')
  const cookieToken = req.cookies.get('csrf-token')?.value
  
  return Boolean(token && cookieToken && token === cookieToken)
}

// Blocked user agents (malicious/suspicious only)
const blockedUserAgents = [
  /sqlmap/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /zap/i,
  /burp/i,
  /havij/i,
  /acunetix/i,
  /nessus/i,
  /openvas/i,
  /w3af/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /hydra/i,
  /medusa/i,
  /brutus/i,
]

// Security headers for API routes
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/onboarding',
  '/campaigns',
  '/funnels',
  '/analytics',
  '/settings'
]

// Auth is handled via modals, no dedicated auth routes needed

export default withAuth(
  async function middleware(req: NextRequestWithAuth) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''

    // Block suspicious patterns
    if (suspiciousPatterns.some(pattern => pattern.test(pathname))) {
      console.log(`Blocked suspicious request: ${pathname} from ${ip}`)
      return new NextResponse('Not Found', { status: 404 })
    }

    // Block suspicious user agents
    if (blockedUserAgents.some(pattern => pattern.test(userAgent))) {
      console.log(`Blocked suspicious user agent: ${userAgent} from ${ip}`)
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Block known malicious IPs
    if (blockedIPs.has(ip)) {
      console.log(`Blocked malicious IP: ${ip}`)
      return new NextResponse('Forbidden', { status: 403 })
    }

    // CSRF protection for API routes
     if (pathname.startsWith('/api/') && !validateCSRFToken(req)) {
       console.log(`CSRF validation failed for ${pathname} from ${ip}`)
       return new NextResponse('Forbidden', { status: 403 })
     }

    // Rate limiting for API routes
    if (pathname.startsWith('/api/')) {
      try {
        const { success, limit, reset, remaining } = await ratelimit.limit(ip)
        
        if (!success) {
          console.log(`Rate limit exceeded for ${ip} on ${pathname}`)
          return new NextResponse('Too Many Requests', { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(reset).toISOString(),
            }
          })
        }
      } catch (error) {
        console.error('Rate limiting error:', error)
        // Continue without rate limiting if Redis is unavailable
      }
    }

    // Auth is handled via modals, no dedicated auth routes to check

    // If user is not authenticated and trying to access protected routes
    if (!token && protectedRoutes.some(route => pathname.startsWith(route))) {
      // Check if the URL has a session_id parameter (coming from payment verification)
      const hasSessionId = req.nextUrl.searchParams.has('session_id')
      const hasEmail = req.nextUrl.searchParams.has('email')
      
      // Special case for onboarding - allow access with session_id parameter
      if (pathname.startsWith('/onboarding') && (hasSessionId || hasEmail)) {
        // Allow access to onboarding with session_id or email (session restoration in progress)
        return NextResponse.next()
      }
      
      // For onboarding without session_id or email, redirect to main page
      if (pathname.startsWith('/onboarding') && !hasSessionId && !hasEmail) {
        return NextResponse.redirect(new URL('/', req.url))
      }
      // For other protected routes, redirect to home page with auth modal
      return NextResponse.redirect(new URL('/?auth=signin', req.url))
    }

    // Add security headers to all responses
    const response = NextResponse.next()
    return addSecurityHeaders(response)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname, searchParams } = req.nextUrl
        
        // Allow access to public routes
        if (!protectedRoutes.some(route => pathname.startsWith(route))) {
          return true
        }
        
        // Allow access to onboarding during auth flow (when coming from checkout)
        if (pathname === '/onboarding' && searchParams.get('checkout') === 'success') {
          return true
        }
        
        // Require authentication for other protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}