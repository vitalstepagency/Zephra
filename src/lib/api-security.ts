import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth/config'
import { logSecurityEvent, secureErrorResponse, secureResponse, validateRequest } from './security'
import { z } from 'zod'

// API route wrapper with built-in security
export function withSecurity(
  handler: (req: NextRequest, context: { session: any; userId: string }) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean
    allowedMethods?: string[]
    rateLimitKey?: string
    schema?: z.ZodSchema
  } = {}
) {
  return async function secureHandler(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const userAgent = req.headers.get('user-agent') || ''
    const method = req.method
    const pathname = new URL(req.url).pathname

    try {
      // Method validation
      if (options.allowedMethods && !options.allowedMethods.includes(method)) {
        logSecurityEvent({
          type: 'SUSPICIOUS_REQUEST',
          ip,
          userAgent,
          path: pathname,
          details: `Method ${method} not allowed`
        })
        return secureErrorResponse('Method not allowed', 405)
      }

      // Authentication check
      let session = null
      if (options.requireAuth) {
        session = await getServerSession(authOptions)
        if (!session?.user?.id) {
          logSecurityEvent({
            type: 'UNAUTHORIZED_ACCESS',
            ip,
            userAgent,
            path: pathname,
            details: 'No valid session'
          })
          return secureErrorResponse('Unauthorized', 401)
        }
      }

      // Input validation
      if (options.schema && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        try {
          await validateRequest(req, options.schema)
        } catch (error) {
          logSecurityEvent({
            type: 'INVALID_INPUT',
            ip,
            userAgent,
            path: pathname,
            details: error instanceof Error ? error.message : 'Invalid input'
          })
          return secureErrorResponse(
            error instanceof Error ? error.message : 'Invalid input',
            400
          )
        }
      }

      // Call the actual handler
      return await handler(req, {
        session,
        userId: session?.user?.id || ''
      })

    } catch (error) {
      console.error('API Error:', error)
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        ip,
        userAgent,
        path: pathname,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      })
      return secureErrorResponse('Internal server error', 500)
    }
  }
}

// Database query security wrapper
export async function secureDbQuery<T>(
  queryFn: () => Promise<T>,
  context: { userId?: string; operation: string }
): Promise<T> {
  try {
    console.log(`[DB] ${context.operation} by user ${context.userId || 'anonymous'}`)
    const result = await queryFn()
    return result
  } catch (error) {
    console.error(`[DB ERROR] ${context.operation}:`, error)
    logSecurityEvent({
      type: 'SUSPICIOUS_REQUEST',
      ip: 'internal',
      path: 'database',
      details: {
        operation: context.operation,
        userId: context.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    })
    throw error
  }
}

// Supabase RLS policy helper
export function createRLSPolicy(tableName: string, operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE') {
  const policies = {
    SELECT: `
      CREATE POLICY "Users can only read their own ${tableName}" ON ${tableName}
      FOR SELECT USING (auth.uid() = user_id);
    `,
    INSERT: `
      CREATE POLICY "Users can only insert their own ${tableName}" ON ${tableName}
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    `,
    UPDATE: `
      CREATE POLICY "Users can only update their own ${tableName}" ON ${tableName}
      FOR UPDATE USING (auth.uid() = user_id);
    `,
    DELETE: `
      CREATE POLICY "Users can only delete their own ${tableName}" ON ${tableName}
      FOR DELETE USING (auth.uid() = user_id);
    `
  }
  
  return policies[operation]
}

// Secure file upload handler
export async function handleSecureFileUpload(
  req: NextRequest,
  options: {
    maxSize?: number
    allowedTypes?: string[]
    uploadPath?: string
  } = {}
) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  
  if (!file) {
    return secureErrorResponse('No file provided', 400)
  }
  
  const maxSize = options.maxSize || 10 * 1024 * 1024 // 10MB default
  const allowedTypes = options.allowedTypes || [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'
  ]
  
  // Validate file
  if (!allowedTypes.includes(file.type)) {
    return secureErrorResponse('File type not allowed', 400)
  }
  
  if (file.size > maxSize) {
    return secureErrorResponse('File too large', 400)
  }
  
  // Validate filename
  if (/[<>:"/\\|?*]/.test(file.name)) {
    return secureErrorResponse('Invalid filename', 400)
  }
  
  return file
}

// API key validation
export function validateApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key')
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || []
  
  return apiKey ? validApiKeys.includes(apiKey) : false
}

// CORS configuration
export function setCorsHeaders(response: NextResponse, origin?: string) {
  const allowedOrigins = [
    'http://localhost:3001',
    'https://yourdomain.com',
    process.env.NEXT_PUBLIC_APP_URL
  ].filter(Boolean)
  
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  response.headers.set('Access-Control-Max-Age', '86400')
  
  return response
}

// Request timeout wrapper
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })
  ])
}