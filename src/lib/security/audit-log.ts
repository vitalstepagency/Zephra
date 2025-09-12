import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Security event types
export enum SecurityEventType {
  WEBHOOK_RECEIVED = 'webhook_received',
  WEBHOOK_VALIDATION_FAILED = 'webhook_validation_failed',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_REQUEST = 'suspicious_request',
  PAYMENT_FRAUD_DETECTED = 'payment_fraud_detected',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  WEBHOOK_SIGNATURE_INVALID = 'webhook_signature_invalid',
  IP_BLOCKED = 'ip_blocked',
  ENCRYPTION_ERROR = 'encryption_error'
}

export enum SecuritySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

interface SecurityEvent {
  id?: string
  event_type: SecurityEventType
  severity: SecuritySeverity
  source_ip: string
  user_agent: string
  request_id: string
  user_id?: string
  metadata: Record<string, any>
  message: string
  created_at?: string
}

// Initialize Supabase client for audit logging
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function logSecurityEvent(
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  message: string,
  req?: NextRequest,
  metadata: Record<string, any> = {},
  userId?: string
): Promise<void> {
  try {
    const supabase = getSupabaseClient()
    
    const event: SecurityEvent = {
      event_type: eventType,
      severity,
      source_ip: req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip') || 'unknown',
      user_agent: req?.headers.get('user-agent') || 'unknown',
      request_id: req?.headers.get('x-request-id') || crypto.randomUUID(),
      ...(userId && { user_id: userId }),
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        url: req?.url,
        method: req?.method
      },
      message
    }
    
    // Insert into audit log table
    const { error } = await supabase
      .from('security_audit_log')
      .insert(event)
    
    if (error) {
      console.error('Failed to log security event:', error)
      // Fallback to console logging if database fails
      console.warn('Security Event:', JSON.stringify(event, null, 2))
    }
    
    // For critical events, also log to console immediately
    if (severity === SecuritySeverity.CRITICAL) {
      console.error('CRITICAL SECURITY EVENT:', JSON.stringify(event, null, 2))
    }
    
  } catch (error) {
    console.error('Error logging security event:', error)
    // Always fallback to console logging
    console.warn('Security Event (fallback):', {
      eventType,
      severity,
      message,
      metadata,
      timestamp: new Date().toISOString()
    })
  }
}

// Helper function for webhook-specific logging
export async function logWebhookEvent(
  eventType: string,
  success: boolean,
  req: NextRequest,
  metadata: Record<string, any> = {}
): Promise<void> {
  const severity = success ? SecuritySeverity.LOW : SecuritySeverity.MEDIUM
  const message = success 
    ? `Webhook processed successfully: ${eventType}`
    : `Webhook processing failed: ${eventType}`
  
  await logSecurityEvent(
    SecurityEventType.WEBHOOK_RECEIVED,
    severity,
    message,
    req,
    {
      webhook_event_type: eventType,
      success,
      ...metadata
    }
  )
}

// Helper function for rate limit logging
export async function logRateLimitExceeded(
  identifier: string,
  req: NextRequest,
  limit: number
): Promise<void> {
  await logSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    SecuritySeverity.MEDIUM,
    `Rate limit exceeded for identifier: ${identifier}`,
    req,
    {
      identifier,
      limit,
      blocked: true
    }
  )
}

// Helper function for fraud detection
export async function logFraudAttempt(
  reason: string,
  req: NextRequest,
  metadata: Record<string, any> = {}
): Promise<void> {
  await logSecurityEvent(
    SecurityEventType.PAYMENT_FRAUD_DETECTED,
    SecuritySeverity.HIGH,
    `Potential fraud detected: ${reason}`,
    req,
    {
      fraud_reason: reason,
      ...metadata
    }
  )
}