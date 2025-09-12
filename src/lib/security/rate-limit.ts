import { NextRequest } from 'next/server'

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100
const WEBHOOK_MAX_REQUESTS = 1000 // Higher limit for webhooks

// Simple in-memory cache for rate limiting (use Redis in production)
interface CacheEntry {
  count: number
  resetTime: number
}

const cache = new Map<string, CacheEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []
  cache.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key)
    }
  })
  keysToDelete.forEach(key => cache.delete(key))
}, 5 * 60 * 1000)

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export async function ratelimit(
  identifier: string,
  limit: number = MAX_REQUESTS_PER_WINDOW
): Promise<RateLimitResult> {
  const key = `rate_limit:${identifier}`
  const now = Date.now()
  const windowStart = Math.floor(now / RATE_LIMIT_WINDOW) * RATE_LIMIT_WINDOW
  const windowKey = `${key}:${windowStart}`
  const reset = windowStart + RATE_LIMIT_WINDOW
  
  const entry = cache.get(windowKey)
  const current = entry ? entry.count : 0
  const remaining = Math.max(0, limit - current - 1)
  
  if (current >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset
    }
  }
  
  cache.set(windowKey, {
    count: current + 1,
    resetTime: reset
  })
  
  return {
    success: true,
    limit,
    remaining,
    reset
  }
}

export async function webhookRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  // Create composite identifier for webhook rate limiting
  const identifier = `webhook:${ip}:${userAgent.slice(0, 50)}`
  
  return ratelimit(identifier, WEBHOOK_MAX_REQUESTS)
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString()
  }
}