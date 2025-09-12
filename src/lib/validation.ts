import DOMPurify from 'isomorphic-dompurify'
import { z } from 'zod'

// Enhanced email validation with stricter regex
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email) && email.length <= 254
}

// Phone number validation (international format)
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Check if it's a valid international format (7-15 digits)
  const phoneRegex = /^\d{7,15}$/
  return phoneRegex.test(cleanPhone)
}

// Enhanced password strength validation
export interface PasswordStrength {
  score: number
  label: string
  isValid: boolean
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
    noCommon: boolean
  }
}

// Common weak passwords to check against
const commonPasswords = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'welcome123', 'admin123', '12345678', 'iloveyou'
]

export function validatePasswordStrength(password: string): PasswordStrength {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>\[\]\\;'`~_+=\-]/.test(password),
    noCommon: !commonPasswords.includes(password.toLowerCase())
  }

  const score = Object.values(requirements).filter(Boolean).length
  
  let label: string
  let isValid: boolean

  if (score <= 2) {
    label = 'Very Weak'
    isValid = false
  } else if (score <= 3) {
    label = 'Weak'
    isValid = false
  } else if (score <= 4) {
    label = 'Fair'
    isValid = false
  } else if (score === 5) {
    label = 'Good'
    isValid = true
  } else {
    label = 'Excellent'
    isValid = true
  }

  return {
    score,
    label,
    isValid,
    requirements
  }
}

// XSS Prevention - Sanitize HTML input
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}

// XSS Prevention - Sanitize for HTML attributes
export function sanitizeAttribute(input: string): string {
  return input
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match] || match
    })
}

// SQL Injection Prevention - Basic input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/[';"\\]/g, '') // Remove dangerous SQL characters
    .trim()
    .substring(0, 1000) // Limit length
}

// CSRF Token Generation
export function generateCSRFToken(): string {
  const array = new Uint8Array(32)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// CSRF Token Validation
export function validateCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false
  if (token.length !== expectedToken.length) return false
  
  // Constant-time comparison to prevent timing attacks
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expectedToken.charCodeAt(i)
  }
  return result === 0
}

// Input validation schemas using Zod
export const emailSchema = z.string()
  .email('Invalid email format')
  .max(254, 'Email too long')
  .refine(isValidEmail, 'Invalid email format')

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine((password) => validatePasswordStrength(password).isValid, 
    'Password does not meet security requirements')

export const phoneSchema = z.string()
  .min(7, 'Phone number too short')
  .max(20, 'Phone number too long')
  .refine(isValidPhone, 'Invalid phone number format')

export const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name too long')
  .refine((name) => !/[<>"'&]/.test(name), 'Name contains invalid characters')

// Comprehensive signup validation schema
export const signupValidationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
  phone: phoneSchema.optional(),
  csrfToken: z.string().min(32, 'Invalid CSRF token')
})

// Rate limiting helper
export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
}

// IP address extraction from request
export function getClientIP(request: Request): string {
  const headers = request.headers
  if (!headers) return 'unknown'
  
  const forwarded = headers.get('x-forwarded-for')
  const realIP = headers.get('x-real-ip')
  const remoteAddr = headers.get('remote-addr')
  
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  
  return realIP || remoteAddr || 'unknown'
}

// User agent validation
export function isValidUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ]
  
  return !suspiciousPatterns.some(pattern => pattern.test(userAgent))
}

// Content Security Policy helpers
export function generateNonce(): string {
  const array = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array)
  } else {
    // Fallback for environments without crypto.getRandomValues
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
}

// Validate file uploads
export function validateFileUpload(file: File, allowedTypes: string[], maxSize: number): boolean {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return false
  }
  
  // Check file size
  if (file.size > maxSize) {
    return false
  }
  
  // Check file name for suspicious patterns
  const suspiciousExtensions = /\.(exe|bat|cmd|scr|pif|com|vbs|js|jar|php|asp|jsp)$/i
  if (suspiciousExtensions.test(file.name)) {
    return false
  }
  
  return true
}

// Honeypot field validation (anti-bot)
export function validateHoneypot(honeypotValue: string | undefined): boolean {
  // Honeypot field should be empty (filled by bots)
  return !honeypotValue || honeypotValue.trim() === ''
}

// Time-based validation (prevent replay attacks)
export function validateTimestamp(timestamp: number, maxAge: number = 300000): boolean {
  const now = Date.now()
  const age = now - timestamp
  return age >= 0 && age <= maxAge
}

export default {
  isValidEmail,
  isValidPhone,
  validatePasswordStrength,
  sanitizeHtml,
  sanitizeAttribute,
  sanitizeInput,
  generateCSRFToken,
  validateCSRFToken,
  emailSchema,
  passwordSchema,
  phoneSchema,
  nameSchema,
  signupValidationSchema,
  getClientIP,
  isValidUserAgent,
  generateNonce,
  validateFileUpload,
  validateHoneypot,
  validateTimestamp
}