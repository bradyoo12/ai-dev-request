/**
 * Simple in-memory cache for API responses with TTL support
 * Implements stale-while-revalidate pattern for better UX
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  promise?: Promise<T>
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 30000 // 30 seconds default

  /**
   * Get cached data or fetch new data
   * @param key Cache key
   * @param fetcher Function to fetch fresh data
   * @param ttl Time to live in milliseconds (default: 30s)
   * @param staleWhileRevalidate If true, return stale data immediately while fetching fresh data
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL,
    staleWhileRevalidate: boolean = false
  ): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)

    // Cache hit - data is fresh
    if (cached && now - cached.timestamp < ttl) {
      return cached.data
    }

    // Cache hit - data is stale but we can use stale-while-revalidate
    if (cached && staleWhileRevalidate) {
      // Return stale data immediately
      const staleData = cached.data

      // Fetch fresh data in background (but don't await it)
      if (!cached.promise) {
        cached.promise = fetcher()
          .then(data => {
            this.cache.set(key, { data, timestamp: Date.now() })
            return data
          })
          .catch(err => {
            // On error, keep using stale data
            console.warn(`Failed to revalidate cache for ${key}:`, err)
            return cached.data
          })
          .finally(() => {
            // Clear promise reference
            const entry = this.cache.get(key)
            if (entry) {
              delete entry.promise
            }
          })
      }

      return staleData
    }

    // Cache miss or expired - fetch fresh data
    const promise = fetcher()
    const data = await promise
    this.cache.set(key, { data, timestamp: now })
    return data
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }
}

export const apiCache = new ApiCache()
