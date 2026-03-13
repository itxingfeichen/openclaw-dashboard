/**
 * 错误追踪和统计工具
 * 记录错误发生频率、模式、趋势
 */

import { logInfo, logWarn } from './logger.js'

/**
 * 错误统计信息
 */
class ErrorStats {
  constructor() {
    this.totalCount = 0
    this.errorCounts = new Map() // code -> count
    this.hourlyCounts = new Map() // hour -> count
    this.lastOccurrence = null
    this.firstOccurrence = null
  }

  record(error) {
    this.totalCount++
    
    const code = error.code || 'UNKNOWN'
    const count = this.errorCounts.get(code) || 0
    this.errorCounts.set(code, count + 1)

    const hour = new Date().getHours()
    const hourlyCount = this.hourlyCounts.get(hour) || 0
    this.hourlyCounts.set(hour, hourlyCount + 1)

    const now = Date.now()
    if (!this.firstOccurrence) {
      this.firstOccurrence = now
    }
    this.lastOccurrence = now
  }

  getTopErrors(limit = 10) {
    return Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([code, count]) => ({ code, count }))
  }

  getHourlyDistribution() {
    return Array.from(this.hourlyCounts.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour, count }))
  }

  toJSON() {
    return {
      totalCount: this.totalCount,
      topErrors: this.getTopErrors(),
      hourlyDistribution: this.getHourlyDistribution(),
      firstOccurrence: this.firstOccurrence ? new Date(this.firstOccurrence).toISOString() : null,
      lastOccurrence: this.lastOccurrence ? new Date(this.lastOccurrence).toISOString() : null,
    }
  }
}

/**
 * 错误追踪器
 */
class ErrorTracker {
  constructor() {
    this.globalStats = new ErrorStats()
    this.errorHistory = []
    this.maxHistorySize = 1000
    this.alertThresholds = {
      perMinute: 10,
      perHour: 100,
      sameError: 5,
    }
    this.recentErrors = [] // 用于频率检测
  }

  /**
   * 追踪错误
   * @param {Error} error - 错误对象
   * @param {Object} [context] - 上下文信息
   */
  track(error, context = {}) {
    const trackedError = {
      code: error.code || 'UNKNOWN',
      name: error.name,
      message: error.message,
      httpStatus: error.httpStatus || 500,
      timestamp: Date.now(),
      context: {
        url: context.url,
        method: context.method,
        userId: context.userId,
        ip: context.ip,
        ...context.extra,
      },
      stack: error.stack,
    }

    // 记录统计
    this.globalStats.record(error)

    // 添加到历史记录
    this.errorHistory.push(trackedError)
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift()
    }

    // 检测错误频率
    this.checkErrorFrequency(trackedError)

    // 检测相同错误重复发生
    this.checkRepeatedError(trackedError)
  }

  /**
   * 检查错误频率
   * @param {Object} error - 追踪的错误
   */
  checkErrorFrequency(error) {
    const now = Date.now()
    const oneMinuteAgo = now - 60 * 1000
    const oneHourAgo = now - 60 * 60 * 1000

    // 清理旧数据
    this.recentErrors = this.recentErrors.filter((e) => e.timestamp > oneHourAgo)
    this.recentErrors.push(error)

    // 检查每分钟错误数
    const errorsLastMinute = this.recentErrors.filter((e) => e.timestamp > oneMinuteAgo).length
    if (errorsLastMinute >= this.alertThresholds.perMinute) {
      logWarn('High error rate detected', {
        errorsPerMinute: errorsLastMinute,
        threshold: this.alertThresholds.perMinute,
      })
    }

    // 检查每小时错误数
    const errorsLastHour = this.recentErrors.filter((e) => e.timestamp > oneHourAgo).length
    if (errorsLastHour >= this.alertThresholds.perHour) {
      logWarn('High error rate detected', {
        errorsPerHour: errorsLastHour,
        threshold: this.alertThresholds.perHour,
      })
    }
  }

  /**
   * 检查相同错误重复发生
   * @param {Object} error - 追踪的错误
   */
  checkRepeatedError(error) {
    const recentSameErrors = this.recentErrors.filter(
      (e) => e.code === error.code && Date.now() - e.timestamp < 5 * 60 * 1000
    )

    if (recentSameErrors.length >= this.alertThresholds.sameError) {
      logWarn('Repeated error detected', {
        errorCode: error.code,
        occurrences: recentSameErrors.length,
        threshold: this.alertThresholds.sameError,
      })
    }
  }

  /**
   * 获取错误统计
   * @returns {Object} 统计信息
   */
  getStats() {
    return this.globalStats.toJSON()
  }

  /**
   * 获取错误历史
   * @param {number} [limit=100] - 返回数量限制
   * @param {Object} [filters] - 过滤条件
   * @returns {Array} 错误历史
   */
  getHistory(limit = 100, filters = {}) {
    let history = [...this.errorHistory]

    // 应用过滤
    if (filters.code) {
      history = history.filter((e) => e.code === filters.code)
    }
    if (filters.httpStatus) {
      history = history.filter((e) => e.httpStatus === filters.httpStatus)
    }
    if (filters.since) {
      const sinceTime = typeof filters.since === 'number' ? filters.since : new Date(filters.since).getTime()
      history = history.filter((e) => e.timestamp > sinceTime)
    }

    // 按时间倒序
    history.sort((a, b) => b.timestamp - a.timestamp)

    return history.slice(0, limit)
  }

  /**
   * 获取特定错误码的统计
   * @param {string} code - 错误码
   * @returns {Object} 统计信息
   */
  getErrorStats(code) {
    const count = this.globalStats.errorCounts.get(code) || 0
    const history = this.getHistory(100, { code })
    
    return {
      code,
      count,
      recentOccurrences: history.length,
      lastOccurrence: history.length > 0 ? new Date(history[0].timestamp).toISOString() : null,
    }
  }

  /**
   * 清除历史记录
   */
  clearHistory() {
    this.errorHistory = []
    this.recentErrors = []
  }

  /**
   * 重置统计
   */
  resetStats() {
    this.globalStats = new ErrorStats()
  }

  /**
   * 设置告警阈值
   * @param {Object} thresholds - 阈值配置
   */
  setAlertThresholds(thresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds }
  }
}

// 创建全局错误追踪器实例
export const errorTracker = new ErrorTracker()

/**
 * 追踪错误（便捷函数）
 * @param {Error} error - 错误对象
 * @param {Object} [context] - 上下文信息
 */
export function trackError(error, context = {}) {
  errorTracker.track(error, context)
}

/**
 * 获取错误统计（便捷函数）
 * @returns {Object} 统计信息
 */
export function getErrorStats() {
  return errorTracker.getStats()
}

/**
 * 获取错误历史（便捷函数）
 * @param {number} [limit=100] - 返回数量限制
 * @param {Object} [filters] - 过滤条件
 * @returns {Array} 错误历史
 */
export function getErrorHistory(limit = 100, filters = {}) {
  return errorTracker.getHistory(limit, filters)
}

export default {
  ErrorTracker,
  errorTracker,
  trackError,
  getErrorStats,
  getErrorHistory,
}
