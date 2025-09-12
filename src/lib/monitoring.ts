import { NextRequest } from 'next/server'

// Error tracking and monitoring utilities
export interface MonitoringEvent {
  level: 'info' | 'warn' | 'error' | 'critical'
  message: string
  metadata?: Record<string, any>
  timestamp?: string
  userId?: string
  sessionId?: string
  requestId?: string
}

// Error categories for better organization
export enum ErrorCategory {
  PAYMENT = 'payment',
  WEBHOOK = 'webhook',
  AUTH = 'auth',
  DATABASE = 'database',
  SECURITY = 'security',
  SYSTEM = 'system'
}

// Performance metrics tracking
export interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'count' | 'bytes' | 'percentage'
  tags?: Record<string, string>
  timestamp?: string
}

// Health check status
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: {
    database: boolean
    stripe: boolean
    supabase: boolean
    redis?: boolean
  }
  timestamp: string
  uptime: number
}

class MonitoringService {
  private static instance: MonitoringService
  private isProduction = process.env.NODE_ENV === 'production'
  private sentryDsn = process.env.SENTRY_DSN
  private logTailToken = process.env.LOGTAIL_TOKEN

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  // Log events with structured data
  async logEvent(event: MonitoringEvent): Promise<void> {
    const enrichedEvent = {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
      environment: process.env.NODE_ENV,
      service: 'copy-trade-app'
    }

    // Console logging for development
    if (!this.isProduction) {
      console.log(`[${event.level.toUpperCase()}]`, enrichedEvent)
      return
    }

    // Send to external monitoring services in production
    await Promise.allSettled([
      this.sendToSentry(enrichedEvent),
      this.sendToLogTail(enrichedEvent)
    ])
  }

  // Track performance metrics
  async trackMetric(metric: PerformanceMetric): Promise<void> {
    const enrichedMetric = {
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
      environment: process.env.NODE_ENV
    }

    if (!this.isProduction) {
      console.log('[METRIC]', enrichedMetric)
      return
    }

    // Send metrics to monitoring service
    await this.sendMetricToService(enrichedMetric)
  }

  // Error tracking with context
  async trackError(error: Error, category: ErrorCategory, context?: Record<string, any>): Promise<void> {
    const errorEvent: MonitoringEvent = {
      level: 'error',
      message: error.message,
      metadata: {
        category,
        stack: error.stack,
        name: error.name,
        ...context
      }
    }

    await this.logEvent(errorEvent)
  }

  // Critical alerts for immediate attention
  async sendAlert(message: string, severity: 'high' | 'critical', metadata?: Record<string, any>): Promise<void> {
    const alertEvent: MonitoringEvent = {
      level: severity === 'critical' ? 'critical' : 'error',
      message: `ALERT: ${message}`,
      metadata: {
        alert: true,
        severity,
        ...metadata
      }
    }

    await this.logEvent(alertEvent)

    // Send immediate notifications for critical alerts
    if (severity === 'critical') {
      await this.sendImmediateNotification(alertEvent)
    }
  }

  // Health check monitoring
  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now()
    const checks = {
      database: await this.checkDatabase(),
      stripe: await this.checkStripe(),
      supabase: await this.checkSupabase(),
      redis: await this.checkRedis()
    }

    const allHealthy = Object.values(checks).every(check => check === true)
    const someUnhealthy = Object.values(checks).some(check => check === false)

    const status: HealthStatus['status'] = allHealthy ? 'healthy' : someUnhealthy ? 'degraded' : 'unhealthy'

    const healthStatus: HealthStatus = {
      status,
      checks,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }

    // Log health status
    await this.logEvent({
      level: status === 'healthy' ? 'info' : 'warn',
      message: `Health check completed: ${status}`,
      metadata: healthStatus
    })

    return healthStatus
  }

  // Request tracking middleware
  trackRequest(req: NextRequest, startTime: number): () => Promise<void> {
    const requestId = crypto.randomUUID()
    
    return async () => {
      const duration = Date.now() - startTime
      
      await this.trackMetric({
        name: 'request_duration',
        value: duration,
        unit: 'ms',
        tags: {
          method: req.method,
          path: req.nextUrl.pathname,
          requestId
        }
      })
    }
  }

  // Private methods for external service integration
  private async sendToSentry(event: MonitoringEvent): Promise<void> {
    if (!this.sentryDsn) return

    try {
      // Sentry integration would go here
      // const Sentry = await import('@sentry/nextjs')
      // Sentry.captureMessage(event.message, event.level as any)
    } catch (error) {
      console.error('Failed to send to Sentry:', error)
    }
  }

  private async sendToLogTail(event: MonitoringEvent): Promise<void> {
    if (!this.logTailToken) return

    try {
      // LogTail integration would go here
      // await fetch('https://in.logtail.com/', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.logTailToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.error('Failed to send to LogTail:', error)
    }
  }

  private async sendMetricToService(metric: PerformanceMetric): Promise<void> {
    try {
      // Send to metrics service (e.g., DataDog, New Relic)
    } catch (error) {
      console.error('Failed to send metric:', error)
    }
  }

  private async sendImmediateNotification(event: MonitoringEvent): Promise<void> {
    try {
      // Send to Slack, Discord, or email for critical alerts
      // const webhook = process.env.SLACK_WEBHOOK_URL
      // if (webhook) {
      //   await fetch(webhook, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({
      //       text: `🚨 CRITICAL ALERT: ${event.message}`,
      //       attachments: [{
      //         color: 'danger',
      //         fields: Object.entries(event.metadata || {}).map(([key, value]) => ({
      //           title: key,
      //           value: String(value),
      //           short: true
      //         }))
      //       }]
      //     })
      //   })
      // }
    } catch (error) {
      console.error('Failed to send immediate notification:', error)
    }
  }

  // Health check implementations
  private async checkDatabase(): Promise<boolean> {
    try {
      // Simple database connectivity check
      return true // Implement actual check
    } catch {
      return false
    }
  }

  private async checkStripe(): Promise<boolean> {
    try {
      // Check Stripe API connectivity
      return true // Implement actual check
    } catch {
      return false
    }
  }

  private async checkSupabase(): Promise<boolean> {
    try {
      // Check Supabase connectivity
      return true // Implement actual check
    } catch {
      return false
    }
  }

  private async checkRedis(): Promise<boolean> {
    try {
      // Check Redis connectivity if used
      return true // Implement actual check
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance()

// Convenience functions
export const logError = (error: Error, category: ErrorCategory, context?: Record<string, any>) => 
  monitoring.trackError(error, category, context)

export const logEvent = (event: MonitoringEvent) => 
  monitoring.logEvent(event)

export const trackMetric = (metric: PerformanceMetric) => 
  monitoring.trackMetric(metric)

export const sendAlert = (message: string, severity: 'high' | 'critical', metadata?: Record<string, any>) => 
  monitoring.sendAlert(message, severity, metadata)

export const performHealthCheck = () => 
  monitoring.performHealthCheck()

export const trackRequest = (req: NextRequest, startTime: number) => 
  monitoring.trackRequest(req, startTime)