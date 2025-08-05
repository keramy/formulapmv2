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
  maxRetriesPerRequest: 1, // Reduce retries to fail fast
  connectTimeout: 1000,    // Quick connection timeout
  lazyConnect: true        // Don't connect until first use
})

// Handle Redis connection errors gracefully
redis.on('error', (err) => {
  console.log('Redis connection error (fallback to memory cache):', err.message)
})

redis.on('connect', () => {
  console.log('Redis connected successfully')
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
    "strategy": "memory", // Use memory cache when Redis unavailable
    "invalidateOn": [
      "project_update",
      "task_update",
      "scope_update"
    ],
    "priority": "HIGH"
  },
  "/api/projects": {
    "ttl": 180,
    "strategy": "memory", // Use memory cache when Redis unavailable
    "invalidateOn": [
      "project_create",
      "project_update"
    ],
    "priority": "HIGH"
  },
  "/api/scope": {
    "ttl": 120,
    "strategy": "memory", // Use memory cache when Redis unavailable
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
      try {
        const cached = await redis.get(key)
        if (cached) {
          cachedData = JSON.parse(cached)
        }
      } catch (redisError) {
        // Silently fallback to memory cache if Redis fails
        const memoryCached = memoryCache.get(key)
        if (memoryCached && memoryCached.expires > Date.now()) {
          cachedData = memoryCached.data
        }
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
      try {
        await redis.setex(key, config.ttl, JSON.stringify(freshData))
      } catch (redisError) {
        // Fallback to memory cache if Redis fails
        memoryCache.set(key, {
          data: freshData,
          expires: Date.now() + (config.ttl * 1000)
        })
      }
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

// Enhanced cache key generators
export function generateCacheKey(endpoint: string, userId: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : ''
  return `${endpoint}:${userId}:${Buffer.from(paramString).toString('base64')}`
}

export const cacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  userPermissions: (role: string) => `permissions:${role}`,
  userToken: (token: string) => `token:${token}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  queryResult: (table: string, query: string) => `query:${table}:${query}`
}

// Authentication caching functions
export async function getCachedUserProfile(userId: string): Promise<any | null> {
  try {
    const cached = await redis.get(cacheKeys.userProfile(userId))
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Error getting cached user profile:', error)
    return null
  }
}

export async function setCachedUserProfile(userId: string, profile: any, ttl: number = 3600): Promise<void> {
  try {
    await redis.setex(cacheKeys.userProfile(userId), ttl, JSON.stringify(profile))
  } catch (error) {
    console.error('Error setting cached user profile:', error)
  }
}

export async function getCachedUserPermissions(role: string): Promise<string[] | null> {
  try {
    const cached = await redis.get(cacheKeys.userPermissions(role))
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Error getting cached user permissions:', error)
    return null
  }
}

export async function setCachedUserPermissions(role: string, permissions: string[], ttl: number = 86400): Promise<void> {
  try {
    await redis.setex(cacheKeys.userPermissions(role), ttl, JSON.stringify(permissions))
  } catch (error) {
    console.error('Error setting cached user permissions:', error)
  }
}

export async function getCachedToken(token: string): Promise<any | null> {
  try {
    const cached = await redis.get(cacheKeys.userToken(token))
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Error getting cached token:', error)
    return null
  }
}

export async function setCachedToken(token: string, user: any, ttl: number = 600): Promise<void> {
  try {
    await redis.setex(cacheKeys.userToken(token), ttl, JSON.stringify(user))
  } catch (error) {
    console.error('Error setting cached token:', error)
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await redis.del(cacheKeys.userProfile(userId))
    // Also invalidate any API responses for this user
    const keys = await redis.keys(`*:${userId}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Error invalidating user cache:', error)
  }
}
