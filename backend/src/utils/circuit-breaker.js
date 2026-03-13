/**
 * 熔断器实现
 * 支持失败阈值、恢复超时、状态查询
 */

import { logInfo, logWarn, logError } from './logger.js'

/**
 * 熔断器状态
 */
export const CircuitState = {
  CLOSED: 'CLOSED',       // 正常状态，请求正常通过
  OPEN: 'OPEN',           // 熔断状态，拒绝所有请求
  HALF_OPEN: 'HALF_OPEN', // 半开状态，允许少量请求测试
}

/**
 * 熔断器配置
 * @typedef {Object} CircuitBreakerOptions
 * @property {number} [failureThreshold=5] - 失败阈值（连续失败次数）
 * @property {number} [successThreshold=2] - 成功阈值（半开状态需要的成功次数）
 * @property {number} [resetTimeout=60000] - 恢复超时（毫秒）
 * @property {number} [halfOpenMaxRequests=3] - 半开状态最大请求数
 * @property {Function} [shouldTrip] - 自定义熔断判断函数
 * @property {Function} [onStateChange] - 状态变化回调
 */

/**
 * 熔断器类
 */
export class CircuitBreaker {
  /**
   * @param {string} name - 熔断器名称
   * @param {CircuitBreakerOptions} [options] - 配置选项
   */
  constructor(name, options = {}) {
    const {
      failureThreshold = 5,
      successThreshold = 2,
      resetTimeout = 60000,
      halfOpenMaxRequests = 3,
      shouldTrip,
      onStateChange,
    } = options

    this.name = name
    this.failureThreshold = failureThreshold
    this.successThreshold = successThreshold
    this.resetTimeout = resetTimeout
    this.halfOpenMaxRequests = halfOpenMaxRequests

    this.shouldTripFn = shouldTrip
    this.onStateChangeFn = onStateChange

    // 状态
    this.state = CircuitState.CLOSED
    this.failureCount = 0
    this.successCount = 0
    this.lastFailureTime = null
    this.nextAttemptTime = null
    this.halfOpenRequests = 0

    // 统计信息
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      rejectedRequests: 0,
      lastFailureTime: null,
      lastSuccessTime: null,
      stateChanges: [],
    }
  }

  /**
   * 执行带熔断保护的函数
   * @param {Function} fn - 要执行的异步函数
   * @returns {Promise<any>} 函数执行结果
   * @throws {CircuitBreakerError} 当熔断器打开时抛出错误
   */
  async execute(fn) {
    this.stats.totalRequests++

    // 检查是否允许请求
    if (!this.canExecute()) {
      this.stats.rejectedRequests++
      logWarn('Circuit breaker is OPEN', {
        name: this.name,
        state: this.state,
      })
      throw new CircuitBreakerError(
        `Circuit breaker '${this.name}' is OPEN`,
        this.getStateInfo()
      )
    }

    // 半开状态增加请求计数
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenRequests++
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  /**
   * 检查是否可以执行请求
   * @returns {boolean} 是否可以执行
   */
  canExecute() {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true

      case CircuitState.OPEN:
        // 检查是否到了恢复时间
        if (Date.now() >= this.nextAttemptTime) {
          this.transitionTo(CircuitState.HALF_OPEN)
          return true
        }
        return false

      case CircuitState.HALF_OPEN:
        // 半开状态限制请求数
        return this.halfOpenRequests < this.halfOpenMaxRequests

      default:
        return false
    }
  }

  /**
   * 成功回调
   */
  onSuccess() {
    this.stats.successfulRequests++
    this.stats.lastSuccessTime = Date.now()
    this.successCount++

    if (this.state === CircuitState.HALF_OPEN) {
      // 半开状态达到成功阈值，关闭熔断器
      if (this.successCount >= this.successThreshold) {
        this.reset()
        this.transitionTo(CircuitState.CLOSED)
        logInfo('Circuit breaker CLOSED', { name: this.name })
      }
    } else if (this.state === CircuitState.CLOSED) {
      // 成功时重置失败计数
      this.failureCount = 0
    }
  }

  /**
   * 失败回调
   * @param {Error} error - 错误对象
   */
  onFailure(error) {
    this.stats.failedRequests++
    this.stats.lastFailureTime = Date.now()
    this.failureCount++
    this.lastFailureTime = Date.now()

    // 检查是否应该触发熔断
    const shouldTrip = this.shouldTripFn
      ? this.shouldTripFn({ failureCount: this.failureCount, error })
      : this.failureCount >= this.failureThreshold

    if (shouldTrip) {
      this.nextAttemptTime = Date.now() + this.resetTimeout
      this.transitionTo(CircuitState.OPEN)
      logError('Circuit breaker OPENED', {
        name: this.name,
        failureCount: this.failureCount,
        resetTimeout: this.resetTimeout,
      })
    }

    if (this.state === CircuitState.HALF_OPEN) {
      // 半开状态失败，重新打开
      this.nextAttemptTime = Date.now() + this.resetTimeout
      this.transitionTo(CircuitState.OPEN)
    }
  }

  /**
   * 重置熔断器
   */
  reset() {
    this.failureCount = 0
    this.successCount = 0
    this.halfOpenRequests = 0
    this.lastFailureTime = null
    this.nextAttemptTime = null
  }

  /**
   * 状态转换
   * @param {string} newState - 新状态
   */
  transitionTo(newState) {
    const oldState = this.state
    this.state = newState

    if (newState === CircuitState.HALF_OPEN) {
      this.halfOpenRequests = 0
      this.successCount = 0
    }

    // 记录状态变化
    this.stats.stateChanges.push({
      from: oldState,
      to: newState,
      timestamp: Date.now(),
    })

    // 调用状态变化回调
    if (this.onStateChangeFn) {
      this.onStateChangeFn({ oldState, newState, name: this.name })
    }
  }

  /**
   * 获取状态信息
   * @returns {Object} 状态信息
   */
  getStateInfo() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      failureThreshold: this.failureThreshold,
      successThreshold: this.successThreshold,
      resetTimeout: this.resetTimeout,
      nextAttemptTime: this.nextAttemptTime,
      halfOpenRequests: this.halfOpenRequests,
      halfOpenMaxRequests: this.halfOpenMaxRequests,
      stats: {
        totalRequests: this.stats.totalRequests,
        successfulRequests: this.stats.successfulRequests,
        failedRequests: this.stats.failedRequests,
        rejectedRequests: this.stats.rejectedRequests,
        successRate: this.stats.totalRequests > 0
          ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2)
          : 0,
      },
    }
  }

  /**
   * 获取当前状态
   * @returns {string} 当前状态
   */
  getState() {
    return this.state
  }

  /**
   * 强制打开熔断器
   */
  forceOpen() {
    this.nextAttemptTime = Date.now() + this.resetTimeout
    this.transitionTo(CircuitState.OPEN)
  }

  /**
   * 强制关闭熔断器
   */
  forceClose() {
    this.reset()
    this.transitionTo(CircuitState.CLOSED)
  }
}

/**
 * 熔断器错误
 */
export class CircuitBreakerError extends Error {
  constructor(message, stateInfo = {}) {
    super(message)
    this.name = 'CircuitBreakerError'
    this.code = 'ERR_CIRCUIT_BREAKER_OPEN'
    this.httpStatus = 503
    this.stateInfo = stateInfo
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
      stateInfo: this.stateInfo,
    }
  }
}

/**
 * 熔断器管理器
 * 管理多个熔断器实例
 */
export class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map()
  }

  /**
   * 获取或创建熔断器
   * @param {string} name - 熔断器名称
   * @param {CircuitBreakerOptions} [options] - 配置选项
   * @returns {CircuitBreaker} 熔断器实例
   */
  getOrCreate(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options))
    }
    return this.breakers.get(name)
  }

  /**
   * 获取熔断器
   * @param {string} name - 熔断器名称
   * @returns {CircuitBreaker|null} 熔断器实例
   */
  get(name) {
    return this.breakers.get(name) || null
  }

  /**
   * 获取所有熔断器状态
   * @returns {Object[]} 所有熔断器状态
   */
  getAllStates() {
    const states = {}
    for (const [name, breaker] of this.breakers) {
      states[name] = breaker.getStateInfo()
    }
    return states
  }

  /**
   * 重置所有熔断器
   */
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset()
    }
  }
}

// 创建全局熔断器管理器实例
export const circuitBreakerManager = new CircuitBreakerManager()

export default {
  CircuitBreaker,
  CircuitBreakerManager,
  CircuitBreakerError,
  CircuitState,
  circuitBreakerManager,
}
