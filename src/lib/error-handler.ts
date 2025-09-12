import { NextResponse } from 'next/server'
import { supabaseAdmin } from './supabase/server'

// Error types for categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  RATE_LIMIT = 'RATE_LIMIT',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, any> | undefined
  public readonly timestamp: Date
  public readonly requestId?: string | undefined

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any> | undefined,
    requestId?: string | undefined
  ) {
    super(message)
    this.type = type
    this.severity = severity
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context
    this.timestamp = new Date()
    this.requestId = requestId

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError)
  }
}

// Error logging interface
interface ErrorLog {
  id?: string | undefined
  message: string
  type: ErrorType
  severity: ErrorSeverity
  stack?: string | undefined
  context?: Record<string, any> | undefined
  user_id?: string | undefined
  request_id?: string | undefined
  ip_address?: string | undefined
  user_agent?: string | undefined
  url?: string | undefined
  method?: string | undefined
  timestamp: Date
  resolved: boolean
}

// Secure error logger
export class ErrorLogger {
  private static instance: ErrorLogger
  private errorQueue: ErrorLog[] = []
  private isProcessing = false

  private constructor() {}

  public static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  // Log error to database and external services
  public async logError(
    error: Error | AppError,
    context?: {
      userId?: string | undefined
      requestId?: string | undefined
      ipAddress?: string | undefined
      userAgent?: string | undefined
      url?: string | undefined
      method?: string | undefined
    }
  ): Promise<void> {
    try {
      const errorLog: ErrorLog = {
        message: this.sanitizeErrorMessage(error.message),
        type: error instanceof AppError ? error.type : ErrorType.SYSTEM,
        severity: error instanceof AppError ? error.severity : ErrorSeverity.MEDIUM,
        stack: this.sanitizeStackTrace(error.stack) || undefined,
        context: error instanceof AppError ? error.context || undefined : undefined,
        user_id: context?.userId || undefined,
        request_id: context?.requestId || undefined,
        ip_address: context?.ipAddress || undefined,
        user_agent: context?.userAgent || undefined,
        url: context?.url || undefined,
        method: context?.method || undefined,
        timestamp: new Date(),
        resolved: false
      }

      // Add to queue for batch processing
      this.errorQueue.push(errorLog)

      // Process queue if not already processing
      if (!this.isProcessing) {
        await this.processErrorQueue()
      }

      // Log to console for development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', errorLog)
      }
    } catch (loggingError) {
      // Fallback logging if database fails
      console.error('Failed to log error:', loggingError)
      console.error('Original error:', error)
    }
  }

  // Process error queue in batches
  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      const batch = this.errorQueue.splice(0, 10) // Process 10 at a time

      // Insert errors into database
      const { error } = await supabaseAdmin
        .from('error_logs')
        .insert(batch)

      if (error) {
        console.error('Failed to insert error logs:', error)
        // Re-add to queue for retry
        this.errorQueue.unshift(...batch)
      }
    } catch (error) {
      console.error('Error processing error queue:', error)
    } finally {
      this.isProcessing = false

      // Process remaining items if any
      if (this.errorQueue.length > 0) {
        setTimeout(() => this.processErrorQueue(), 1000)
      }
    }
  }

  // Sanitize error message to remove sensitive information
  private sanitizeErrorMessage(message: string): string {
    return message
      .replace(/password[=:]\s*[^\s]+/gi, 'password=***')
      .replace(/token[=:]\s*[^\s]+/gi, 'token=***')
      .replace(/key[=:]\s*[^\s]+/gi, 'key=***')
      .replace(/secret[=:]\s*[^\s]+/gi, 'secret=***')
      .substring(0, 1000) // Limit length
  }

  // Sanitize stack trace
  private sanitizeStackTrace(stack?: string): string | undefined {
    if (!stack) return undefined
    
    return stack
      .split('\n')
      .slice(0, 20) // Limit stack trace depth
      .join('\n')
      .substring(0, 5000) // Limit total length
  }
}

// Database transaction rollback helper
export class TransactionManager {
  private static transactions = new Map<string, any>()

  public static async executeWithRollback<T>(
    transactionId: string,
    operations: () => Promise<T>,
    rollbackOperations?: () => Promise<void>
  ): Promise<T> {
    try {
      const result = await operations()
      this.transactions.delete(transactionId)
      return result
    } catch (error) {
      // Execute rollback operations
      if (rollbackOperations) {
        try {
          await rollbackOperations()
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError)
          // Log rollback failure
          await ErrorLogger.getInstance().logError(
            new AppError(
              'Transaction rollback failed',
              ErrorType.DATABASE,
              ErrorSeverity.CRITICAL,
              500,
              true,
              { transactionId, originalError: error, rollbackError }
            )
          )
        }
      }
      
      this.transactions.delete(transactionId)
      throw error
    }
  }
}

// Error response formatter
export function formatErrorResponse(
  error: Error | AppError,
  isDevelopment: boolean = process.env.NODE_ENV === 'development'
): { message: string; code?: string; details?: any } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.type,
      details: isDevelopment ? {
        severity: error.severity,
        context: error.context,
        stack: error.stack
      } : undefined
    }
  }

  // Generic error response
  return {
    message: isDevelopment ? error.message : 'An unexpected error occurred',
    details: isDevelopment ? { stack: error.stack } : undefined
  }
}

// Global error handler for API routes
export function withErrorHandler(
  handler: (req: any, context?: any) => Promise<NextResponse>
) {
  return async (req: any, context?: any): Promise<NextResponse> => {
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
    
    try {
      return await handler(req, context)
    } catch (error) {
      const logger = ErrorLogger.getInstance()
      
      // Extract request context
      const errorContext = {
        requestId,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
        userAgent: req.headers.get('user-agent'),
        url: req.url,
        method: req.method
      }

      // Log the error
      await logger.logError(error as Error, errorContext)

      // Return appropriate error response
      const statusCode = error instanceof AppError ? error.statusCode : 500
      const errorResponse = formatErrorResponse(error as Error)

      return NextResponse.json(
        { error: errorResponse.message, requestId },
        { status: statusCode }
      )
    }
  }
}

// Predefined error factories
export const ErrorFactories = {
  validation: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, 400, true, context),

  authentication: (message: string = 'Authentication required', context?: Record<string, any>) =>
    new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, 401, true, context),

  authorization: (message: string = 'Insufficient permissions', context?: Record<string, any>) =>
    new AppError(message, ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM, 403, true, context),

  notFound: (resource: string, context?: Record<string, any>) =>
    new AppError(`${resource} not found`, ErrorType.BUSINESS_LOGIC, ErrorSeverity.LOW, 404, true, context),

  rateLimit: (message: string = 'Rate limit exceeded', context?: Record<string, any>) =>
    new AppError(message, ErrorType.RATE_LIMIT, ErrorSeverity.MEDIUM, 429, true, context),

  database: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.DATABASE, ErrorSeverity.HIGH, 500, true, context),

  externalApi: (service: string, message: string, context?: Record<string, any>) =>
    new AppError(`${service}: ${message}`, ErrorType.EXTERNAL_API, ErrorSeverity.MEDIUM, 502, true, context),

  security: (message: string, context?: Record<string, any>) =>
    new AppError(message, ErrorType.SECURITY, ErrorSeverity.HIGH, 403, true, context)
}

export default {
  AppError,
  ErrorLogger,
  TransactionManager,
  formatErrorResponse,
  withErrorHandler,
  ErrorFactories,
  ErrorType,
  ErrorSeverity
}