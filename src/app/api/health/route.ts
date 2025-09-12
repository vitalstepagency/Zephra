import { NextRequest } from 'next/server'
import { performHealthCheck } from '@/lib/monitoring'
import { secureResponse, secureErrorResponse } from '@/lib/security'

export async function GET(req: NextRequest) {
  try {
    const healthStatus = await performHealthCheck()
    
    // Return appropriate HTTP status based on health
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 207 : 503
    
    return secureResponse(healthStatus, httpStatus)
  } catch (error) {
    console.error('Health check failed:', error)
    
    return secureErrorResponse('Health check failed', 503)
  }
}

// Allow health checks without authentication
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'