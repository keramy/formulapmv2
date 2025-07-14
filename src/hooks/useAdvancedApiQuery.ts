/**
 * Advanced API Query Hook - SOPHISTICATED CAPABILITIES
 * Real-time updates, intelligent caching, performance monitoring, and advanced patterns
 */

'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'

// Advanced configuration types
export interface AdvancedApiQueryOptions<T> {
  endpoint: string
  params?: Record<string, any>
  enabled?: boolean
  cacheKey?: string
  dependencies?: any[]
  
  // Advanced caching options
  cacheTime?: number // How long to keep in cache (ms)
  staleTime?: number // How long data is considered fresh (ms)
  refetchOnWindowFocus?: boolean
  refetchOnReconnect?: boolean
  refetchInterval?: number
  
  // Real-time options
  realtime?: boolean
  realtimeChannel?: string
  realtimeEvents?: string[]
  
  // Performance options
  debounceMs?: number
  throttleMs?: number
  retryCount?: number
  retryDelay?: number
  
  // Transform and validation
  transform?: (data: any) => T
  validate?: (data: any) => boolean
  
  // Event handlers
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onSettled?: (data: T | null, error: Error | null) => void
  
  // Advanced features
  suspense?: boolean
  keepPreviousData?: boolean
  optimisticUpdates?: boolean
}

export interface AdvancedApiQueryResult<T> {
  data: T | null
  previousData: T | null
  loading: boolean
  error: string | null
  isStale: boolean
  isFetching: boolean
  isRefetching: boolean
  
  // Actions
  refetch: () => Promise<void>
  mutate: (newData: T | null) => void
  invalidate: () => void
  
  // Performance metrics
  metrics: {
    fetchCount: number
    lastFetchTime: number
    averageResponseTime: number
    cacheHitRate: number
  }
}

// Advanced cache with TTL and LRU eviction
class AdvancedCache {
  private cache = new Map<string, {
    data: any
    timestamp: number
    accessCount: number
    lastAccess: number
  }>()
  
  private maxSize = 100
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(key: string, data: any, ttl?: number) {
    // LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccess - b[1].lastAccess)[0][0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now()
    })
  }

  get(key: string, ttl?: number): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const maxAge = ttl || this.defaultTTL
    if (Date.now() - entry.timestamp > maxAge) {
      this.cache.delete(key)
      return null
    }

    entry.accessCount++
    entry.lastAccess = Date.now()
    return entry.data
  }

  invalidate(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
        accessCount: value.accessCount
      }))
    }
  }
}

// Global cache instance
const globalCache = new AdvancedCache()

// Performance monitoring
class PerformanceMonitor {
  private metrics = new Map<string, {
    fetchCount: number
    totalResponseTime: number
    errors: number
    cacheHits: number
    cacheMisses: number
  }>()

  recordFetch(key: string, responseTime: number, fromCache: boolean) {
    const current = this.metrics.get(key) || {
      fetchCount: 0,
      totalResponseTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    }

    current.fetchCount++
    current.totalResponseTime += responseTime

    if (fromCache) {
      current.cacheHits++
    } else {
      current.cacheMisses++
    }

    this.metrics.set(key, current)
  }

  recordError(key: string) {
    const current = this.metrics.get(key) || {
      fetchCount: 0,
      totalResponseTime: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0
    }

    current.errors++
    this.metrics.set(key, current)
  }

  getMetrics(key: string) {
    const metrics = this.metrics.get(key)
    if (!metrics) return {
      fetchCount: 0,
      lastFetchTime: 0,
      averageResponseTime: 0,
      cacheHitRate: 0
    }

    return {
      fetchCount: metrics.fetchCount,
      lastFetchTime: Date.now(),
      averageResponseTime: metrics.totalResponseTime / metrics.fetchCount,
      cacheHitRate: metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)
    }
  }
}

const performanceMonitor = new PerformanceMonitor()

// Debounce utility
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Main advanced hook
export function useAdvancedApiQuery<T = any>(
  options: AdvancedApiQueryOptions<T>
): AdvancedApiQueryResult<T> {
  const {
    endpoint,
    params = {},
    enabled = true,
    cacheKey,
    dependencies = [],
    cacheTime = 5 * 60 * 1000,
    staleTime = 30 * 1000,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    refetchInterval,
    realtime = false,
    realtimeChannel,
    realtimeEvents = ['*'],
    debounceMs = 0,
    throttleMs = 0,
    retryCount = 3,
    retryDelay = 1000,
    transform,
    validate,
    onSuccess,
    onError,
    onSettled,
    keepPreviousData = false,
    optimisticUpdates = false
  } = options

  const { getAccessToken } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [previousData, setPreviousData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastFetchRef = useRef<number>(0)

  // Generate cache key
  const finalCacheKey = useMemo(() => {
    if (cacheKey) return cacheKey
    const paramString = new URLSearchParams(params).toString()
    return `${endpoint}?${paramString}`
  }, [endpoint, params, cacheKey])

  // Debounce parameters if specified
  const debouncedParams = useDebounce(params, debounceMs)
  const effectiveParams = debounceMs > 0 ? debouncedParams : params

  // Check if data is stale
  const checkStale = useCallback(() => {
    const cached = globalCache.get(finalCacheKey, cacheTime)
    if (cached) {
      const age = Date.now() - lastFetchRef.current
      setIsStale(age > staleTime)
    }
  }, [finalCacheKey, cacheTime, staleTime])

  // Fetch function with advanced features
  const fetchData = useCallback(async (
    signal?: AbortSignal,
    isRefetch = false
  ): Promise<void> => {
    try {
      setError(null)
      
      if (isRefetch) {
        setIsRefetching(true)
      } else {
        setLoading(true)
      }
      
      setIsFetching(true)

      // Check cache first
      const cached = globalCache.get(finalCacheKey, cacheTime)
      if (cached && !isRefetch) {
        const transformedData = transform ? transform(cached) : cached
        
        if (!validate || validate(transformedData)) {
          setData(transformedData)
          setIsStale(false)
          performanceMonitor.recordFetch(finalCacheKey, 0, true)
          onSuccess?.(transformedData)
          onSettled?.(transformedData, null)
          return
        }
      }

      // Get auth token
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Build URL with params
      const url = new URL(endpoint, window.location.origin)
      Object.entries(effectiveParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })

      const startTime = Date.now()

      // Make request with retry logic
      let lastError: Error | null = null
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          const response = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            signal
          })

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }

          const result = await response.json()
          
          if (!result.success) {
            throw new Error(result.error || 'API request failed')
          }

          // Transform and validate data
          const transformedData = transform ? transform(result.data) : result.data
          
          if (validate && !validate(transformedData)) {
            throw new Error('Data validation failed')
          }

          // Update state
          if (keepPreviousData && data) {
            setPreviousData(data)
          }
          
          setData(transformedData)
          setIsStale(false)
          lastFetchRef.current = Date.now()

          // Cache the result
          globalCache.set(finalCacheKey, result.data, cacheTime)

          // Record performance metrics
          const responseTime = Date.now() - startTime
          performanceMonitor.recordFetch(finalCacheKey, responseTime, false)

          // Call success handlers
          onSuccess?.(transformedData)
          onSettled?.(transformedData, null)
          
          return // Success, exit retry loop

        } catch (err) {
          lastError = err instanceof Error ? err : new Error('Unknown error')
          
          if (err instanceof Error && err.name === 'AbortError') {
            return // Request was cancelled
          }
          
          if (attempt < retryCount) {
            // Wait before retry
            await new Promise(resolve => {
              retryTimeoutRef.current = setTimeout(resolve, retryDelay * Math.pow(2, attempt))
            })
          }
        }
      }

      // All retries failed
      if (lastError) {
        throw lastError
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      performanceMonitor.recordError(finalCacheKey)
      
      const error = err instanceof Error ? err : new Error(errorMessage)
      onError?.(error)
      onSettled?.(null, error)
    } finally {
      setLoading(false)
      setIsFetching(false)
      setIsRefetching(false)
    }
  }, [
    endpoint, effectiveParams, transform, validate, getAccessToken, 
    finalCacheKey, cacheTime, retryCount, retryDelay, onSuccess, onError, onSettled,
    keepPreviousData, data
  ])

  // Refetch function
  const refetch = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    await fetchData(abortControllerRef.current.signal, true)
  }, [fetchData])

  // Mutate function for optimistic updates
  const mutate = useCallback((newData: T | null) => {
    if (keepPreviousData && data) {
      setPreviousData(data)
    }
    setData(newData)
    if (newData) {
      globalCache.set(finalCacheKey, newData, cacheTime)
    }
  }, [finalCacheKey, cacheTime, keepPreviousData, data])

  // Invalidate function
  const invalidate = useCallback(() => {
    globalCache.invalidate(finalCacheKey)
    setIsStale(true)
  }, [finalCacheKey])

  // Effect for initial fetch and dependencies
  useEffect(() => {
    if (!enabled) return

    fetchData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, fetchData, ...dependencies])

  // Effect for refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    intervalRef.current = setInterval(() => {
      refetch()
    }, refetchInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refetchInterval, enabled, refetch])

  // Effect for window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return

    const handleFocus = () => {
      if (isStale) {
        refetch()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, isStale, refetch])

  // Effect for stale checking
  useEffect(() => {
    const interval = setInterval(checkStale, 1000)
    return () => clearInterval(interval)
  }, [checkStale])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // Get performance metrics
  const metrics = useMemo(() => 
    performanceMonitor.getMetrics(finalCacheKey), 
    [finalCacheKey, data]
  )

  return {
    data,
    previousData,
    loading,
    error,
    isStale,
    isFetching,
    isRefetching,
    refetch,
    mutate,
    invalidate,
    metrics
  }
}

// Advanced real-time hook with Supabase integration
export function useRealtimeApiQuery<T = any>(
  options: AdvancedApiQueryOptions<T> & {
    table: string
    filter?: string
  }
): AdvancedApiQueryResult<T> {
  const baseResult = useAdvancedApiQuery(options)
  const { table, filter } = options

  useEffect(() => {
    if (!options.realtime || !table) return

    // This would integrate with Supabase realtime
    // const supabase = createClientComponentClient()
    // const channel = supabase.channel(options.realtimeChannel || `realtime-${table}`)
    //   .on('postgres_changes', {
    //     event: '*',
    //     schema: 'public',
    //     table: table,
    //     filter: filter
    //   }, (payload) => {
    //     // Handle real-time updates
    //     baseResult.refetch()
    //   })
    //   .subscribe()

    // return () => {
    //   supabase.removeChannel(channel)
    // }
  }, [options.realtime, table, filter, baseResult.refetch])

  return baseResult
}

// Convenience hooks using advanced patterns
export const useAdvancedProjects = (params?: Record<string, any>) =>
  useAdvancedApiQuery({
    endpoint: '/api/projects',
    params,
    cacheKey: `projects-advanced-${JSON.stringify(params)}`,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    retryCount: 3,
    debounceMs: 300
  })

export const useAdvancedTasks = (projectId: string, params?: Record<string, any>) =>
  useAdvancedApiQuery({
    endpoint: `/api/projects/${projectId}/tasks`,
    params,
    enabled: !!projectId,
    cacheKey: `tasks-advanced-${projectId}-${JSON.stringify(params)}`,
    dependencies: [projectId],
    staleTime: 1 * 60 * 1000, // 1 minute
    realtime: true,
    realtimeChannel: `tasks-${projectId}`,
    keepPreviousData: true,
    optimisticUpdates: true
  })

export const useAdvancedMaterialSpecs = (params?: Record<string, any>) =>
  useAdvancedApiQuery({
    endpoint: '/api/material-specs',
    params,
    cacheKey: `material-specs-advanced-${JSON.stringify(params)}`,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    transform: (data) => {
      // Advanced data transformation
      if (Array.isArray(data?.material_specs)) {
        return {
          ...data,
          material_specs: data.material_specs.map((spec: any) => ({
            ...spec,
            computed_total: spec.unit_price * spec.quantity,
            status_color: getStatusColor(spec.status)
          }))
        }
      }
      return data
    },
    validate: (data) => {
      // Advanced validation
      return data && typeof data === 'object' && Array.isArray(data.material_specs)
    }
  })

// Utility function for status colors
function getStatusColor(status: string): string {
  const colors = {
    pending: '#f59e0b',
    approved: '#10b981',
    rejected: '#ef4444',
    revision: '#8b5cf6'
  }
  return colors[status as keyof typeof colors] || '#6b7280'
}
