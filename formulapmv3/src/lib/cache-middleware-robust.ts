/**
 * ROBUST API Caching Middleware
 * Implements Redis and memory caching with graceful fallback
 */
import Redis from 'ioredis'
import { NextRequest, NextResponse } from 'next/server'

// Create Redis client with robust error handling
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  keyPrefix: 'formulapm:',
  maxRetriesPerRequest: 2,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  connectTimeout: 2000,
  commandTimeout: 1000
})

// Handle Redis connection errors gracefully
redis.on('error', (error) => {
  console.warn('Redis connection error (fallback to memory cache):', error.message)
})

redis.on('connect', () => {
  console.log('✅ Redis connected successfully')
})

const memoryCache = new Map<string, { data: any, expires: number }>()

interface CacheConfig {
  ttl: number
  strategy: 'redis' | 'memory' | 'auto'
  invalidateOn: string[]
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

const CACHE_CONFIG: Record<string, CacheConfig> = {
  "/api/dashboard/stats": {
    "ttl": 300,
    "strategy": "auto",
    "invalidateOn": [
      "project_update",
      "task_update",
      "scope_update"
    ],
    "priority": "HIGH"
  },
  "/api/projects": {
    "ttl": 180,
    "strategy": "auto",
    "invalidateOn": [
      "project_create",
      "project_update"
    ],
    "priority": "HIGH"
  },
  "/api/scope": {
    "ttl": 120,
    "strategy": "auto",
    "invalidateOn": [
      "scope_create",
      "scope_update"
    ],
    "priority": "CRITICAL"
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

// Check if Redis is available
let redisAvailable = false
async function checkRedisHealth() {
  try {
    await redis.ping()
    redisAvailable = true
    return true
  } catch (error) {
    redisAvailable = false
    return false
  }
}

// Initialize Redis health check
checkRedisHealth()

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
    
    // Auto strategy: try Redis first, fallback to memory
    if (config.strategy === 'auto' || config.strategy === 'redis') {
      if (redisAvailable) {
        try {
          const cached = await redis.get(key)
          if (cached) {
            cachedData = JSON.parse(cached)
          }
        } catch (redisError) {
          console.warn(`Redis get failed for ${endpoint}, using memory cache:`, redisError.message)
          redisAvailable = false
        }
      }
    }
    
    // Fallback to memory cache
    if (!cachedData && (config.strategy === 'memory' || config.strategy === 'auto')) {
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

    // Store in cache with graceful error handling
    if (config.strategy === 'auto' || config.strategy === 'redis') {
      if (redisAvailable) {
        try {
          await redis.setex(key, config.ttl, JSON.stringify(freshData))
        } catch (redisError) {
          console.warn(`Redis set failed for ${endpoint}:`, redisError.message)
          redisAvailable = false
          // Fallback to memory cache
          memoryCache.set(key, {
            data: freshData,
            expires: Date.now() + (config.ttl * 1000)
          })
        }
      } else {
        // Use memory cache as fallback
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
    console.error(`Cache error for ${endpoint}:`, error.message)
    // Always fallback to direct fetch on any cache error
    return await fetchFn()
  }
}

// Authentication caching functions with robust error handling
export async function getCachedUserProfile(userId: string): Promise<any | null> {
  try {
    if (redisAvailable) {
      const cached = await redis.get(`user:profile:${userId}`)
      return cached ? JSON.parse(cached) : null
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(`user:profile:${userId}`)
      if (cached && cached.expires > Date.now()) {
        return cached.data
      }
      return null
    }
  } catch (error) {
    console.warn('Error getting cached user profile:', error.message)
    return null
  }
}

export async function setCachedUserProfile(userId: string, profile: any, ttl: number = 3600): Promise<void> {
  try {
    if (redisAvailable) {
      await redis.setex(`user:profile:${userId}`, ttl, JSON.stringify(profile))
    } else {
      // Fallback to memory cache
      memoryCache.set(`user:profile:${userId}`, {
        data: profile,
        expires: Date.now() + (ttl * 1000)
      })
    }
  } catch (error) {
    console.warn('Error setting cached user profile:', error.message)
  }
}

export async function getCachedToken(token: string): Promise<any | null> {
  try {
    if (redisAvailable) {
      const cached = await redis.get(`token:${token}`)
      return cached ? JSON.parse(cached) : null
    } else {
      // Fallback to memory cache
      const cached = memoryCache.get(`token:${token}`)
      if (cached && cached.expires > Date.now()) {
        return cached.data
      }
      return null
    }
  } catch (error) {
    console.warn('Error getting cached token:', error.message)
    return null
  }
}

export async function setCachedToken(token: string, user: any, ttl: number = 600): Promise<void> {
  try {
    if (redisAvailable) {
      await redis.setex(`token:${token}`, ttl, JSON.stringify(user))
    } else {
      // Fallback to memory cache
      memoryCache.set(`token:${token}`, {
        data: user,
        expires: Date.now() + (ttl * 1000)
      })
    }
  } catch (error) {
    console.warn('Error setting cached token:', error.message)
  }
}

export async function invalidateCache(patterns: string[]) {
  try {
    // Try Redis invalidation
    if (redisAvailable) {
      for (const pattern of patterns) {
        try {
          const keys = await redis.keys(`*${pattern}*`)
          if (keys.length > 0) {
            await redis.del(...keys)
          }
        } catch (error) {
          console.warn(`Redis invalidation failed for pattern ${pattern}:`, error.message)
        }
      }
    }

    // Always invalidate memory cache
    for (const [key] of memoryCache) {
      if (patterns.some(pattern => key.includes(pattern))) {
        memoryCache.delete(key)
      }
    }

    console.log(`Cache invalidated for patterns: ${patterns.join(', ')}`)
  } catch (error) {
    console.error('Cache invalidation error:', error.message)
  }
}

// Health check function
export async function getCacheHealth() {
  const redisHealth = await checkRedisHealth()
  return {
    redis: redisHealth,
    memory: memoryCache.size,
    strategy: redisHealth ? 'redis+memory' : 'memory-only'
  }
}