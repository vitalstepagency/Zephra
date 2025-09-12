import { NextRequest } from 'next/server'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

// Input validation schemas
export const emailSchema = z.string().email().max(255)
export const passwordSchema = z.string().min(8).max(128).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
)
export const nameSchema = z.string().min(1).max(100).regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
export const uuidSchema = z.string().uuid()

// Sanitization functions
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return sanitizeHtml(input.trim())
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeHtml(key)] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}

// Request validation
export async function validateRequest(req: NextRequest, schema: z.ZodSchema) {
  try {
    const body = await req.json()
    const sanitizedBody = sanitizeInput(body)
    return schema.parse(sanitizedBody)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

// SQL injection prevention
export function escapeSqlString(input: string): string {
  return input.replace(/'/g, "''")
}

// XSS prevention
export function escapeHtml(input: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  }
  return input.replace(/[&<>"'/]/g, (s) => map[s] || s)
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}

// Secure headers utility
export function getSecureHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}

// API response wrapper with security headers
export function secureResponse(data: any, status: number = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecureHeaders(),
    },
  })
}

// Error response with security headers
export function secureErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getSecureHeaders(),
    },
  })
}

// IP whitelist/blacklist
const ipBlacklist = new Set<string>([
  // Add known malicious IPs here
])

const ipWhitelist = new Set<string>([
  '127.0.0.1',
  '::1',
  // Add trusted IPs here
])

export function isIpBlocked(ip: string): boolean {
  return ipBlacklist.has(ip)
}

export function isIpWhitelisted(ip: string): boolean {
  return ipWhitelist.has(ip)
}

// Request logging for security monitoring
export function logSecurityEvent(event: {
  type: 'SUSPICIOUS_REQUEST' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_INPUT' | 'UNAUTHORIZED_ACCESS'
  ip: string
  userAgent?: string
  path: string
  details?: any
}) {
  console.log(`[SECURITY] ${event.type}:`, {
    timestamp: new Date().toISOString(),
    ...event,
  })
  
  // In production, send to monitoring service
  // await sendToMonitoringService(event)
}

// Password hashing utilities
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs')
  return bcrypt.compare(password, hash)
}

// Session security
export function generateSecureSessionId(): string {
  const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? 
    crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  return uuid + '-' + Date.now().toString(36)
}

// File upload security
export function validateFileUpload(file: File) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File type not allowed')
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large')
  }
  
  // Check for malicious file names
  if (/[<>:"/\\|?*]/.test(file.name)) {
    throw new Error('Invalid file name')
  }
  
  return true
}

// Environment variable validation
export function validateEnvironmentVariables() {
  const required = [
    'NEXTAUTH_SECRET',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET'
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Database query security
export function sanitizeDbQuery(query: string): string {
  // Remove potentially dangerous SQL keywords
  const dangerousKeywords = [
    'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 'UPDATE',
    'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', 'DECLARE'
  ]
  
  let sanitized = query
  dangerousKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })
  
  return sanitized
}