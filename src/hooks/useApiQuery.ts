/**
 * Generic API Query Hook - OPTIMIZATION PHASE 2.1
 * Centralized data fetching pattern to reduce hook duplication
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

export interface ApiQueryOptions<T> {
  // API endpoint
  endpoint: string
  
  // Query parameters
  params?: Record<string, any>
  
  // Auto-fetch on mount
  enabled?: boolean
  
  // Refetch interval (ms)
  refetchInterval?: number
  
  // Transform response data
  transform?: (data: any) => T
  
  // Cache key for deduplication
  cacheKey?: string
  
  // Dependencies for refetch
  dependencies?: any[]
  
  // Error handler
  onError?: (error: Error) => void
  
  // Success handler
  onSuccess?: (data: T) => void
}

export interface ApiQueryResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  mutate: (newData: T | null) => void
}

// Simple in-memory cache
const queryCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useApiQuery<T = any>(options: ApiQueryOptions<T>): ApiQueryResult<T> {
  const {
    endpoint,
    params = {},
    enabled = true,
    refetchInterval,
    transform,
    cacheKey,
    dependencies = [],
    onError,
    onSuccess
  } = options

  const { getAccessToken } = useAuth()
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate cache key
  const getCacheKey = useCallback(() => {
    if (cacheKey) return cacheKey
    const paramString = new URLSearchParams(params).toString()
    return `${endpoint}?${paramString}`
  }, [endpoint, params, cacheKey])

  // Check cache
  const getCachedData = useCallback(() => {
    const key = getCacheKey()
    const cached = queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data
    }
    return null
  }, [getCacheKey])

  // Set cache
  const setCachedData = useCallback((newData: any) => {
    const key = getCacheKey()
    queryCache.set(key, { data: newData, timestamp: Date.now() })
  }, [getCacheKey])

  // Fetch function
  const fetchData = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null)
      
      // Check cache first
      const cachedData = getCachedData()
      if (cachedData && !loading) {
        const transformedData = transform ? transform(cachedData) : cachedData
        setData(transformedData)
        onSuccess?.(transformedData)
        return
      }

      setLoading(true)

      // Get auth token
      const token = await getAccessToken()
      if (!token) {
        throw new Error('Authentication required')
      }

      // Build URL with params
      const url = new URL(endpoint, window.location.origin)
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })

      // Make request
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

      // Transform and set data
      const transformedData = transform ? transform(result.data) : result.data
      setData(transformedData)
      
      // Cache the result
      setCachedData(result.data)
      
      // Call success handler
      onSuccess?.(transformedData)

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was cancelled
      }
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setLoading(false)
    }
  }, [endpoint, params, transform, getAccessToken, getCachedData, setCachedData, onSuccess, onError, loading])

  // Refetch function
  const refetch = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    await fetchData(abortControllerRef.current.signal)
  }, [fetchData])

  // Mutate function for optimistic updates
  const mutate = useCallback((newData: T | null) => {
    setData(newData)
    if (newData) {
      setCachedData(newData)
    }
  }, [setCachedData])

  // Effect for initial fetch and dependencies
  useEffect(() => {
    if (!enabled) return

    refetch()

    // Cleanup on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [enabled, refetch, ...dependencies])

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return {
    data,
    loading,
    error,
    refetch,
    mutate
  }
}

// Convenience hooks for common endpoints
export const useProjects = (params?: Record<string, any>) =>
  useApiQuery({
    endpoint: '/api/projects',
    params,
    cacheKey: `projects-${JSON.stringify(params)}`
  })

export const useTasks = (projectId?: string, params?: Record<string, any>) =>
  useApiQuery({
    endpoint: projectId ? `/api/projects/${projectId}/tasks` : '/api/tasks',
    params,
    enabled: !!projectId || !projectId,
    dependencies: [projectId]
  })

export const useScopeItems = (params?: Record<string, any>) =>
  useApiQuery({
    endpoint: '/api/scope',
    params,
    cacheKey: `scope-${JSON.stringify(params)}`
  })

export const useMaterialSpecs = (params?: Record<string, any>) =>
  useApiQuery({
    endpoint: '/api/material-specs',
    params,
    cacheKey: `material-specs-${JSON.stringify(params)}`
  })
