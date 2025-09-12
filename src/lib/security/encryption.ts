import crypto from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16 // 128 bits
const TAG_LENGTH = 16 // 128 bits

// Get encryption key from environment or generate one
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required')
  }
  
  // Ensure key is exactly 32 bytes
  const keyBuffer = Buffer.from(key, 'base64')
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits)`)
  }
  
  return keyBuffer
}

interface EncryptedData {
  encrypted: string
  iv: string
  tag: string
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encrypt(text: string): EncryptedData {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipher(ALGORITHM, key)
    cipher.setAAD(Buffer.from('stripe-webhook-data'))
    
    let encrypted = cipher.update(text, 'utf8', 'base64')
    encrypted += cipher.final('base64')
    
    const tag = cipher.getAuthTag()
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    }
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data encrypted with encrypt()
 */
export function decrypt(encryptedData: EncryptedData): string {
  try {
    const key = getEncryptionKey()
    const iv = Buffer.from(encryptedData.iv, 'base64')
    const tag = Buffer.from(encryptedData.tag, 'base64')
    
    const decipher = crypto.createDecipher(ALGORITHM, key)
    decipher.setAAD(Buffer.from('stripe-webhook-data'))
    decipher.setAuthTag(tag)
    
    let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt ?? crypto.randomBytes(16).toString('base64')
  const hash = crypto.pbkdf2Sync(data, actualSalt, 100000, 64, 'sha512')
  return `${actualSalt}:${hash.toString('base64')}`
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hashedData: string): boolean {
  try {
    const [salt, hash] = hashedData.split(':')
    const newHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512')
    return hash === newHash.toString('base64')
  } catch (error) {
    console.error('Hash verification error:', error)
    return false
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url')
}

/**
 * Securely compare two strings to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  
  return crypto.timingSafeEqual(
    Buffer.from(a, 'utf8'),
    Buffer.from(b, 'utf8')
  )
}

/**
 * Sanitize and mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data
  }
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'key', 'credit_card',
    'ssn', 'social_security', 'bank_account', 'routing_number',
    'cvv', 'cvc', 'pin', 'stripe_customer_id'
  ]
  
  const masked = { ...data }
  
  for (const field of sensitiveFields) {
    if (field in masked && typeof masked[field] === 'string') {
      const value = masked[field] as string
      if (value.length > 4) {
        masked[field] = `${value.slice(0, 2)}***${value.slice(-2)}`
      } else {
        masked[field] = '***'
      }
    }
  }
  
  return masked
}

/**
 * Generate encryption key for environment setup
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('base64')
}