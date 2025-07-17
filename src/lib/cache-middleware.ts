/**
 * API Caching Middleware
 * Implements Redis and memory caching for API endpoints
 */
import Redis from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  keyPrefix: 'formulapm:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

const memoryCache = new Map<string, { data: any, expires: number }>()

interface CacheConfig {
  ttl: number
  strategy: 'redis' | 'memory'
  invalidateOn: string[]
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  "/api/dashboard/stats": {
    "ttl": 300,
    "strategy": "redis",
    "invalidateOn": [
      "project_update",
      "task_update",
      "scope_update"
    ],
    "priority": "HIGH"
  },
  "/api/projects": {
    "ttl": 180,
    "strategy": "redis",
    "invalidateOn": [
      "project_create",
      "project_update"
    ],
    "priority": "HIGH"
  },
  "/api/scope": {
    "ttl": 120,
    "strategy": "redis",
    "invalidateOn": [
      "scope_create",
      "scope_update"
    ],
    "priority": "CRITICAL"
  },
  "/api/tasks": {
    "ttl": 60,
    "strategy": "redis",
    "invalidateOn": [
      "task_create",
      "task_update",
      "task_assign"
    ],
    "priority": "HIGH"
  },
  "/api/auth/profile": {
    "ttl": 900,
    "strategy": "memory",
    "invalidateOn": [
      "profile_update"
    ],
    "priority": "MEDIUM"
  }
}

export async function getCachedResponse(
  key: string, 
  endpoint: string,
  fetchFn: () => Promise<any>
): Promise<any> {
  const config = CACHE_CONFIG[endpoint]
  if (!config) {
    return await fetchFn()
  }

  try {
    // Try to get from cache
    let cachedData: any = null
    
    if (config.strategy === 'redis') {
      const cached = await redis.get(key)
      if (cached) {
        cachedData = JSON.parse(cached)
      }
    } else if (config.strategy === 'memory') {
      const cached = memoryCache.get(key)
      if (cached && cached.expires > Date.now()) {
        cachedData = cached.data
      }
    }

    if (cachedData) {
      console.log(`Cache HIT for ${endpoint}`)
      return cachedData
    }

    // Cache miss - fetch fresh data
    console.log(`Cache MISS for ${endpoint}`)
    const freshData = await fetchFn()

    // Store in cache
    if (config.strategy === 'redis') {
      await redis.setex(key, config.ttl, JSON.stringify(freshData))
    } else if (config.strategy === 'memory') {
      memoryCache.set(key, {
        data: freshData,
        expires: Date.now() + (config.ttl * 1000)
      })
    }

    return freshData

  } catch (error) {
    console.error(`Cache error for ${endpoint}:`, error)
    // Fallback to direct fetch on cache error
    return await fetchFn()
  }
}

export async function invalidateCache(patterns: string[]) {
  try {
    // Invalidate Redis cache
    for (const pattern of patterns) {
      const keys = await redis.keys(`*${pattern}*`)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    }

    // Invalidate memory cache
    for (const [key] of memoryCache) {
      if (patterns.some(pattern => key.includes(pattern))) {
        memoryCache.delete(key)
      }
    }

    console.log(`Invalidated cache for patterns: ${patterns.join(', ')}`)
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}

// Cache key generator
export function generateCacheKey(endpoint: string, userId: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : ''
  return `${endpoint}:${userId}:${Buffer.from(paramString).toString('base64')}`
}
