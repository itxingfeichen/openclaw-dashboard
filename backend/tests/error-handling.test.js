/**
 * 错误处理框架单元测试
 */

import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { strictEqual, deepStrictEqual, ok, notStrictEqual } from 'node:assert/strict'

// 错误模块测试
import AppError from '../src/errors/AppError.js'
import * as ERROR_CODES from '../src/errors/error-codes.js'
import {
  ValidationError,
  AuthError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalError,
  DatabaseError,
  ExternalServiceError,
  FileError,
  BusinessError,
  RateLimitError,
  ServiceUnavailableError,
} from '../src/errors/errors.js'

// 工具函数测试
import { withRetry, calculateExponentialBackoff, createRetryableFunction } from '../src/utils/retry.js'
import { CircuitBreaker, CircuitState, CircuitBreakerError, circuitBreakerManager } from '../src/utils/circuit-breaker.js'
import { logInfo, logError, createLogger } from '../src/utils/logger.js'
import { errorTracker, trackError, getErrorStats } from '../src/utils/error-tracker.js'

// 中间件测试
import { formatError, formatValidationErrors } from '../src/middleware/error-formatter.js'
import { errorHandler, asyncHandler, notFoundHandler } from '../src/middleware/error-handler.js'

describe('Error Handling Framework', () => {
  describe('AppError', () => {
    it('should create basic error with default values', () => {
      const error = new AppError()
      
      strictEqual(error.name, 'AppError')
      strictEqual(error.code, 'ERR_INTERNAL')
      strictEqual(error.httpStatus, 500)
      ok(error.timestamp)
    })

    it('should create error with custom config', () => {
      const error = new AppError(ERROR_CODES.ERR_NOT_FOUND, 'Resource not found', { resourceId: '123' })
      
      strictEqual(error.code, 'ERR_NOT_FOUND')
      strictEqual(error.httpStatus, 404)
      strictEqual(error.message, 'Resource not found')
      deepStrictEqual(error.metadata, { resourceId: '123' })
    })

    it('should convert to JSON', () => {
      const error = new AppError(ERROR_CODES.ERR_VALIDATION, 'Invalid input', { field: 'email' })
      const json = error.toJSON()
      
      strictEqual(json.code, 'ERR_VALIDATION')
      strictEqual(json.httpStatus, 400)
      strictEqual(json.message, 'Invalid input')
      deepStrictEqual(json.metadata, { field: 'email' })
      ok(json.timestamp)
    })

    it('should identify AppError instances', () => {
      const appError = new AppError()
      const regularError = new Error('Regular error')
      
      ok(AppError.isAppError(appError))
      ok(!AppError.isAppError(regularError))
    })
  })

  describe('Error Types', () => {
    it('ValidationError should have correct properties', () => {
      const error = new ValidationError('Invalid email format')
      
      strictEqual(error.name, 'ValidationError')
      strictEqual(error.code, 'ERR_VALIDATION')
      strictEqual(error.httpStatus, 400)
    })

    it('AuthError should have correct properties', () => {
      const error = new AuthError('Token expired')
      
      strictEqual(error.name, 'AuthError')
      strictEqual(error.code, 'ERR_UNAUTHORIZED')
      strictEqual(error.httpStatus, 401)
    })

    it('NotFoundError should have correct properties', () => {
      const error = new NotFoundError('User not found')
      
      strictEqual(error.name, 'NotFoundError')
      strictEqual(error.code, 'ERR_NOT_FOUND')
      strictEqual(error.httpStatus, 404)
    })

    it('ConflictError should have correct properties', () => {
      const error = new ConflictError('Email already exists')
      
      strictEqual(error.name, 'ConflictError')
      strictEqual(error.code, 'ERR_CONFLICT')
      strictEqual(error.httpStatus, 409)
    })

    it('DatabaseError should have correct properties', () => {
      const error = new DatabaseError('Query failed')
      
      strictEqual(error.name, 'DatabaseError')
      strictEqual(error.code, 'ERR_DB_QUERY')
      strictEqual(error.httpStatus, 500)
    })

    it('ExternalServiceError should have correct properties', () => {
      const error = new ExternalServiceError('Service unavailable')
      
      strictEqual(error.name, 'ExternalServiceError')
      strictEqual(error.code, 'ERR_EXTERNAL_SERVICE')
      strictEqual(error.httpStatus, 502)
    })

    it('RateLimitError should have correct properties', () => {
      const error = new RateLimitError('Too many requests')
      
      strictEqual(error.name, 'RateLimitError')
      strictEqual(error.code, 'ERR_TOO_MANY_REQUESTS')
      strictEqual(error.httpStatus, 429)
    })
  })

  describe('Error Type Static Methods', () => {
    it('ValidationError.requiredField should create proper error', () => {
      const error = ValidationError.requiredField('email', 'Email is required')
      
      strictEqual(error.name, 'ValidationError')
      strictEqual(error.message, 'Email is required')
      deepStrictEqual(error.metadata, { field: 'email' })
    })

    it('AuthError.tokenMissing should create proper error', () => {
      const error = AuthError.tokenMissing()
      
      strictEqual(error.name, 'AuthError')
      strictEqual(error.code, 'ERR_UNAUTHORIZED')
    })

    it('NotFoundError.resource should create proper error', () => {
      const error = NotFoundError.resource('User', '123')
      
      strictEqual(error.message, 'User 不存在：123')
      deepStrictEqual(error.metadata, { type: 'User', id: '123' })
    })

    it('ConflictError.resourceExists should create proper error', () => {
      const error = ConflictError.resourceExists('Email', 'test@example.com')
      
      strictEqual(error.message, 'Email 已存在：test@example.com')
      deepStrictEqual(error.metadata, { type: 'Email', id: 'test@example.com' })
    })
  })

  describe('Retry Mechanism', () => {
    it('calculateExponentialBackoff should increase delay', () => {
      const delay0 = calculateExponentialBackoff(0, 1000, 30000)
      const delay1 = calculateExponentialBackoff(1, 1000, 30000)
      const delay2 = calculateExponentialBackoff(2, 1000, 30000)
      
      ok(delay1 > delay0)
      ok(delay2 > delay1)
    })

    it('calculateExponentialBackoff should respect maxDelay', () => {
      const delay = calculateExponentialBackoff(10, 1000, 5000)
      
      ok(delay <= 5000)
    })

    it('withRetry should succeed on first try', async () => {
      const fn = async () => 'success'
      const result = await withRetry(fn, { maxRetries: 3 })
      
      strictEqual(result, 'success')
    })

    it('withRetry should retry on failure', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        if (attempts < 3) {
          // 使用可重试的错误类型
          throw new ExternalServiceError('Temporary error')
        }
        return 'success'
      }
      
      const result = await withRetry(fn, { 
        maxRetries: 3,
        baseDelay: 10,
        useExponentialBackoff: false,
      })
      
      strictEqual(result, 'success')
      strictEqual(attempts, 3)
    })

    it('withRetry should throw after max retries', async () => {
      const fn = async () => {
        throw new Error('Persistent error')
      }
      
      await assert.rejects(
        async () => withRetry(fn, { 
          maxRetries: 2,
          baseDelay: 10,
          useExponentialBackoff: false,
        }),
        { message: 'Persistent error' }
      )
    })

    it('withRetry should not retry non-retryable errors', async () => {
      let attempts = 0
      const fn = async () => {
        attempts++
        const error = new ValidationError('Invalid input')
        throw error
      }
      
      await assert.rejects(async () => withRetry(fn, { maxRetries: 3 }))
      strictEqual(attempts, 1)
    })

    it('createRetryableFunction should wrap function', async () => {
      const fn = async (x, y) => x + y
      const retryableFn = createRetryableFunction(fn, { maxRetries: 3 })
      
      const result = await retryableFn(2, 3)
      strictEqual(result, 5)
    })
  })

  describe('Circuit Breaker', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker('test')
      
      strictEqual(breaker.getState(), CircuitState.CLOSED)
    })

    it('should execute function in CLOSED state', async () => {
      const breaker = new CircuitBreaker('test')
      const result = await breaker.execute(async () => 'success')
      
      strictEqual(result, 'success')
      strictEqual(breaker.getState(), CircuitState.CLOSED)
    })

    it('should open after failure threshold', async () => {
      const breaker = new CircuitBreaker('test', { failureThreshold: 3, resetTimeout: 1000 })
      
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => { throw new Error('Failed') })
        } catch (e) {
          // Expected
        }
      }
      
      strictEqual(breaker.getState(), CircuitState.OPEN)
    })

    it('should reject requests when OPEN', async () => {
      const breaker = new CircuitBreaker('test', { failureThreshold: 1, resetTimeout: 10000 })
      
      try {
        await breaker.execute(async () => { throw new Error('Failed') })
      } catch (e) {
        // Expected
      }
      
      await assert.rejects(
        async () => breaker.execute(async () => 'success'),
        { name: 'CircuitBreakerError' }
      )
    })

    it('should transition to HALF_OPEN after resetTimeout', async () => {
      const breaker = new CircuitBreaker('test', { failureThreshold: 1, resetTimeout: 100 })
      
      try {
        await breaker.execute(async () => { throw new Error('Failed') })
      } catch (e) {
        // Expected
      }
      
      strictEqual(breaker.getState(), CircuitState.OPEN)
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Next request should trigger HALF_OPEN
      ok(breaker.canExecute())
      strictEqual(breaker.getState(), CircuitState.HALF_OPEN)
    })

    it('should close after successful requests in HALF_OPEN', async () => {
      const breaker = new CircuitBreaker('test', { 
        failureThreshold: 1, 
        resetTimeout: 100,
        successThreshold: 2,
      })
      
      // Trip the breaker
      try {
        await breaker.execute(async () => { throw new Error('Failed') })
      } catch (e) {
        // Expected
      }
      
      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Successful requests
      await breaker.execute(async () => 'success')
      strictEqual(breaker.getState(), CircuitState.HALF_OPEN)
      
      await breaker.execute(async () => 'success')
      strictEqual(breaker.getState(), CircuitState.CLOSED)
    })

    it('should track statistics', async () => {
      const breaker = new CircuitBreaker('test')
      
      await breaker.execute(async () => 'success')
      await breaker.execute(async () => 'success')
      
      try {
        await breaker.execute(async () => { throw new Error('Failed') })
      } catch (e) {
        // Expected
      }
      
      const stats = breaker.getStateInfo().stats
      strictEqual(stats.totalRequests, 3)
      strictEqual(stats.successfulRequests, 2)
      strictEqual(stats.failedRequests, 1)
    })

    it('should provide state info', () => {
      const breaker = new CircuitBreaker('test', { failureThreshold: 5 })
      const info = breaker.getStateInfo()
      
      strictEqual(info.name, 'test')
      strictEqual(info.state, CircuitState.CLOSED)
      strictEqual(info.failureThreshold, 5)
      ok(info.stats)
    })

    it('CircuitBreakerError should have state info', () => {
      const error = new CircuitBreakerError('Test error', { state: 'OPEN' })
      
      strictEqual(error.name, 'CircuitBreakerError')
      strictEqual(error.code, 'ERR_CIRCUIT_BREAKER_OPEN')
      strictEqual(error.httpStatus, 503)
      deepStrictEqual(error.stateInfo, { state: 'OPEN' })
    })

    it('CircuitBreakerManager should manage breakers', () => {
      const manager = circuitBreakerManager
      const breaker1 = manager.getOrCreate('service1')
      const breaker2 = manager.getOrCreate('service2')
      const breaker1Again = manager.get('service1')
      
      ok(breaker1)
      ok(breaker2)
      strictEqual(breaker1, breaker1Again)
    })
  })

  describe('Error Formatter', () => {
    it('should format AppError correctly', () => {
      const error = new AppError(ERROR_CODES.ERR_VALIDATION, 'Invalid input', { field: 'email' })
      const formatted = formatError(error)
      
      strictEqual(formatted.success, false)
      strictEqual(formatted.error.code, 'ERR_VALIDATION')
      strictEqual(formatted.error.httpStatus, 400)
      strictEqual(formatted.error.message, 'Invalid input')
      ok(formatted.timestamp)
    })

    it('should format regular Error correctly', () => {
      const error = new Error('Something went wrong')
      const formatted = formatError(error)
      
      strictEqual(formatted.success, false)
      strictEqual(formatted.error.code, 'ERR_UNKNOWN')
      strictEqual(formatted.error.httpStatus, 500)
    })

    it('should include stack in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = new AppError(ERROR_CODES.ERR_INTERNAL)
      const formatted = formatError(error, { includeStack: true })
      
      ok(formatted.error.stack)
      
      process.env.NODE_ENV = originalEnv
    })

    it('should format validation errors with details', () => {
      const details = [
        { field: 'email', message: 'Invalid email', code: 'invalid' },
        { field: 'password', message: 'Too short', code: 'min_length' },
      ]
      
      const formatted = formatValidationErrors(details)
      
      strictEqual(formatted.success, false)
      strictEqual(formatted.error.code, 'ERR_VALIDATION')
      strictEqual(formatted.error.details.length, 2)
    })
  })

  describe('Error Handler Middleware', () => {
    it('asyncHandler should catch errors', async () => {
      const handler = asyncHandler(async (req, res, next) => {
        throw new Error('Test error')
      })
      
      const mockReq = {}
      const mockRes = {}
      let caughtError
      
      const mockNext = (error) => {
        caughtError = error
      }
      
      await handler(mockReq, mockRes, mockNext)
      
      ok(caughtError)
      strictEqual(caughtError.message, 'Test error')
    })

    it('asyncHandler should pass successful results', async () => {
      const handler = asyncHandler(async (req, res, next) => {
        res.sent = true
      })
      
      const mockReq = {}
      const mockRes = {}
      let calledNext = false
      
      const mockNext = () => {
        calledNext = true
      }
      
      await handler(mockReq, mockRes, mockNext)
      
      ok(mockRes.sent)
      ok(!calledNext)
    })

    it('notFoundHandler should create 404 error', () => {
      const handler = notFoundHandler()
      
      const mockReq = { method: 'GET', url: '/unknown' }
      const mockRes = {}
      let caughtError
      
      const mockNext = (error) => {
        caughtError = error
      }
      
      handler(mockReq, mockRes, mockNext)
      
      ok(caughtError)
      strictEqual(caughtError.code, 'ERR_NOT_FOUND')
      strictEqual(caughtError.httpStatus, 404)
    })
  })

  describe('Error Tracker', () => {
    it('should track errors', () => {
      const error = new ValidationError('Test validation error')
      trackError(error, { url: '/api/test', method: 'POST' })
      
      const stats = getErrorStats()
      ok(stats.totalCount >= 1)
    })

    it('should track error codes', () => {
      const error = new AuthError('Token expired')
      trackError(error)
      
      const stats = getErrorStats()
      const authErrorStats = stats.topErrors.find(e => e.code === 'ERR_UNAUTHORIZED')
      ok(authErrorStats)
      ok(authErrorStats.count >= 1)
    })

    it('should provide error history', () => {
      const error = new NotFoundError('Resource not found')
      trackError(error, { url: '/api/users/123' })
      
      const history = errorTracker.getHistory(10)
      ok(history.length >= 1)
      
      const recentError = history.find(e => e.code === 'ERR_NOT_FOUND')
      ok(recentError)
      strictEqual(recentError.context.url, '/api/users/123')
    })

    it('should filter error history', () => {
      const error = new DatabaseError('Query failed')
      trackError(error)
      
      const history = errorTracker.getHistory(10, { code: 'ERR_DB_QUERY' })
      ok(history.length >= 1)
      
      history.forEach(e => {
        strictEqual(e.code, 'ERR_DB_QUERY')
      })
    })
  })

  describe('Logger', () => {
    it('createLogger should create prefixed logger', () => {
      const logger = createLogger('TestModule')
      
      ok(logger.debug)
      ok(logger.info)
      ok(logger.warn)
      ok(logger.error)
    })

    it('should log without errors', () => {
      // Just verify these don't throw
      logInfo('Test info message', { test: true })
      logError(new Error('Test error'), { context: 'test' })
      
      ok(true)
    })
  })

  describe('Integration', () => {
    it('should handle complete error flow', async () => {
      const breaker = new CircuitBreaker('integration-test', { 
        failureThreshold: 2,
        resetTimeout: 100,
      })
      
      // Execute with retry and circuit breaker
      const executeWithProtection = async () => {
        return await breaker.execute(async () => {
          return await withRetry(
            async () => {
              throw new ExternalServiceError('Service down')
            },
            { maxRetries: 1, baseDelay: 10 }
          )
        })
      }
      
      // First call - will fail and be tracked
      try {
        await executeWithProtection()
      } catch (e) {
        trackError(e, { operation: 'integration-test' })
      }
      
      // Second call - will trip circuit breaker
      try {
        await executeWithProtection()
      } catch (e) {
        trackError(e, { operation: 'integration-test' })
      }
      
      // Third call - circuit breaker should be open
      try {
        await executeWithProtection()
      } catch (e) {
        strictEqual(e.name, 'CircuitBreakerError')
      }
      
      // Verify error was tracked
      const stats = getErrorStats()
      ok(stats.totalCount >= 2)
    })
  })
})
