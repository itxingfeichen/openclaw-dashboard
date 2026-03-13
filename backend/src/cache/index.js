/**
 * 缓存模块导出
 */

export {
  CacheService,
  CacheType,
  createCacheService,
} from './cache-service.js'

export { MemoryCache } from './memory-cache.js'
export { RedisCache } from './redis-cache.js'

export {
  CacheStrategy,
  CacheStrategyType,
  TTLStrategy,
  LRUStrategy,
  LFUStrategy,
  FIFOStrategy,
  MRUStrategy,
  StrategyFactory,
} from './cache-strategy.js'

export {
  CacheManager,
  CacheStats,
  WarmupConfig,
  createCacheManager,
} from './cache-manager.js'

export default {
  CacheService,
  CacheType,
  createCacheService,
  MemoryCache,
  RedisCache,
  CacheStrategy,
  CacheStrategyType,
  TTLStrategy,
  LRUStrategy,
  LFUStrategy,
  FIFOStrategy,
  MRUStrategy,
  StrategyFactory,
  CacheManager,
  CacheStats,
  WarmupConfig,
  createCacheManager,
}
