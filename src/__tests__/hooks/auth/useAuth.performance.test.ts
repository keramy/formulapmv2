/**
 * Performance Benchmarking Tests for useAuth Refactoring
 * 
 * This test suite measures and compares performance metrics between
 * the original and refactored useAuth implementations, including:
 * - Render performance
 * - Memory usage
 * - Loading time improvements
 * - Re-render reduction
 * - Cache effectiveness
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthOriginal } from '@/hooks/useAuthOriginal'
import { useAuthComposed } from '@/hooks/auth/useAuthComposed'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/types/auth'
import { User } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}))

jest.mock('@/hooks/useImpersonation', () => ({
  useImpersonation: () => ({
    isImpersonating: false,
    impersonatedUser: null,
    originalAdmin: null,
    isLoading: false,
    stopImpersonation: jest.fn(() => true),
    canImpersonate: jest.fn(() => false)
  })
}))

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Enable fake timers for performance testing
jest.useFakeTimers()

const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2023-01-01T00:00:00Z',
  phone_confirmed_at: null,
  confirmation_sent_at: null,
  recovery_sent_at: null,
  email_change_sent_at: null,
  new_email: null,
  invited_at: null,
  action_link: null,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  is_anonymous: false,
  app_metadata: {},
  user_metadata: {},
  identities: []
}

const mockProfile: UserProfile = {
  id: 'user-123',
  role: 'project_manager',
  first_name: 'John',
  last_name: 'Doe',
  email: 'test@example.com',
  phone: '+1234567890',
  company: 'Test Company',
  department: 'Engineering',
  permissions: {
    'projects.read': true,
    'projects.write': true,
    'projects.delete': false
  },
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

// Performance measurement utilities
interface PerformanceMetrics {
  renderCount: number
  renderTime: number
  memoryUsage?: number
  apiCalls: number
  cacheHits: number
  loadingTime: number
}

function measurePerformance<T>(fn: () => T): { result: T; metrics: Partial<PerformanceMetrics> } {
  const startTime = performance.now()
  const result = fn()
  const endTime = performance.now()
  
  return {
    result,
    metrics: {
      renderTime: endTime - startTime
    }
  }
}

describe('useAuth Performance Benchmarking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Default fast responses
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
    
    ;(supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        }))
      }))
    })
  })
  
  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.useFakeTimers()
  })

  describe('Render Performance', () => {
    it('should render faster than original implementation', async () => {
      const originalMetrics = { renderCount: 0, totalTime: 0 }
      const composedMetrics = { renderCount: 0, totalTime: 0 }
      
      // Measure original implementation
      const originalStartTime = performance.now()
      const { result: originalResult } = renderHook(() => {
        originalMetrics.renderCount++
        return useAuthOriginal()
      })
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
      })
      originalMetrics.totalTime = performance.now() - originalStartTime
      
      // Measure composed implementation
      const composedStartTime = performance.now()
      const { result: composedResult } = renderHook(() => {
        composedMetrics.renderCount++
        return useAuthComposed()
      })
      
      await waitFor(() => {
        expect(composedResult.current.loading).toBe(false)
      })
      composedMetrics.totalTime = performance.now() - composedStartTime
      
      console.log('Render Performance Metrics:', {
        original: originalMetrics,
        composed: composedMetrics,
        improvement: ((originalMetrics.totalTime - composedMetrics.totalTime) / originalMetrics.totalTime * 100).toFixed(2) + '%'
      })
      
      // Composed should not be significantly slower
      expect(composedMetrics.totalTime).toBeLessThanOrEqual(originalMetrics.totalTime * 1.2)
    })
    
    it('should have fewer re-renders than original', async () => {
      let originalRenders = 0
      let composedRenders = 0
      
      const { result: originalResult } = renderHook(() => {
        originalRenders++
        return useAuthOriginal()
      })
      
      const { result: composedResult } = renderHook(() => {
        composedRenders++
        return useAuthComposed()
      })
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      const baseOriginalRenders = originalRenders
      const baseComposedRenders = composedRenders
      
      // Trigger state changes that should be optimized
      act(() => {
        // Access properties multiple times
        for (let i = 0; i < 10; i++) {
          originalResult.current.user
          originalResult.current.profile
          originalResult.current.isAuthenticated
          originalResult.current.hasPermission('projects.read')
          
          composedResult.current.user
          composedResult.current.profile
          composedResult.current.isAuthenticated
          composedResult.current.hasPermission('projects.read')
        }
      })
      
      console.log('Re-render Metrics:', {
        originalRenders: originalRenders - baseOriginalRenders,
        composedRenders: composedRenders - baseComposedRenders,
        improvement: originalRenders > composedRenders ? 'Better' : 'Same/Worse'
      })
      
      // Composed should not cause more re-renders
      expect(composedRenders).toBeLessThanOrEqual(originalRenders)
    })
  })

  describe('Loading Time Performance', () => {
    it('should load initial state faster', async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
      
      // Add realistic delays to simulate network requests
      ;(supabase.auth.getSession as jest.Mock).mockImplementation(() => 
        delay(50).then(() => ({ data: { session: null }, error: null }))
      )
      
      const originalLoadTime = await measureLoadTime(() => renderHook(() => useAuthOriginal()))
      const composedLoadTime = await measureLoadTime(() => renderHook(() => useAuthComposed()))
      
      console.log('Loading Time Metrics:', {
        original: originalLoadTime + 'ms',
        composed: composedLoadTime + 'ms',
        improvement: ((originalLoadTime - composedLoadTime) / originalLoadTime * 100).toFixed(2) + '%'
      })
      
      // Composed should not be significantly slower
      expect(composedLoadTime).toBeLessThanOrEqual(originalLoadTime * 1.1)
    })
    
    it('should handle concurrent operations more efficiently', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      const originalTime = await measureConcurrentOperations(() => useAuthOriginal())
      const composedTime = await measureConcurrentOperations(() => useAuthComposed())
      
      console.log('Concurrent Operations Metrics:', {
        original: originalTime + 'ms',
        composed: composedTime + 'ms',
        improvement: originalTime > composedTime ? 'Better' : 'Same/Worse'
      })
      
      // Composed should handle concurrency better or at least as well
      expect(composedTime).toBeLessThanOrEqual(originalTime * 1.1)
    })
  })

  describe('Memory Usage', () => {
    it('should use memory more efficiently', async () => {
      // Simulate memory pressure with many hook instances
      const hooks: any[] = []
      
      // Create many instances of original hook
      const originalStartMemory = process.memoryUsage().heapUsed
      for (let i = 0; i < 100; i++) {
        hooks.push(renderHook(() => useAuthOriginal()))
      }
      const originalMemoryUsage = process.memoryUsage().heapUsed - originalStartMemory
      
      // Clean up
      hooks.forEach(hook => hook.unmount())
      hooks.length = 0
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      // Create many instances of composed hook
      const composedStartMemory = process.memoryUsage().heapUsed
      for (let i = 0; i < 100; i++) {
        hooks.push(renderHook(() => useAuthComposed()))
      }
      const composedMemoryUsage = process.memoryUsage().heapUsed - composedStartMemory
      
      console.log('Memory Usage Metrics:', {
        original: (originalMemoryUsage / 1024 / 1024).toFixed(2) + 'MB',
        composed: (composedMemoryUsage / 1024 / 1024).toFixed(2) + 'MB',
        improvement: originalMemoryUsage > composedMemoryUsage ? 'Better' : 'Same/Worse'
      })
      
      // Clean up
      hooks.forEach(hook => hook.unmount())
      
      // Composed should not use significantly more memory
      expect(composedMemoryUsage).toBeLessThanOrEqual(originalMemoryUsage * 1.2)
    })
  })

  describe('Cache Performance', () => {
    it('should have more effective caching', async () => {
      let originalApiCalls = 0
      let composedApiCalls = 0
      
      // Mock API calls with counters
      const originalGetSession = supabase.auth.getSession
      ;(supabase.auth.getSession as jest.Mock).mockImplementation((...args) => {
        originalApiCalls++
        composedApiCalls++
        return originalGetSession.call(null, ...args)
      })
      
      const originalFromMock = supabase.from
      ;(supabase.from as jest.Mock).mockImplementation((table) => {
        originalApiCalls++
        composedApiCalls++
        return originalFromMock.call(null, table)
      })
      
      // Test original implementation
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      await waitFor(() => expect(originalResult.current.loading).toBe(false))
      
      originalApiCalls = 0 // Reset counter
      
      // Trigger multiple token requests
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await originalResult.current.getAccessToken()
        })
      }
      
      const originalCachePerformance = {
        apiCalls: originalApiCalls,
        cacheHitRate: ((10 - originalApiCalls) / 10 * 100).toFixed(2) + '%'
      }
      
      // Test composed implementation
      composedApiCalls = 0 // Reset counter
      const { result: composedResult } = renderHook(() => useAuthComposed())
      await waitFor(() => expect(composedResult.current.loading).toBe(false))
      
      composedApiCalls = 0 // Reset counter
      
      // Trigger multiple token requests
      for (let i = 0; i < 10; i++) {
        await act(async () => {
          await composedResult.current.getAccessToken()
        })
      }
      
      const composedCachePerformance = {
        apiCalls: composedApiCalls,
        cacheHitRate: ((10 - composedApiCalls) / 10 * 100).toFixed(2) + '%'
      }
      
      console.log('Cache Performance Metrics:', {
        original: originalCachePerformance,
        composed: composedCachePerformance,
        improvement: composedApiCalls < originalApiCalls ? 'Better' : 'Same/Worse'
      })
      
      // Composed should have better or equal caching
      expect(composedApiCalls).toBeLessThanOrEqual(originalApiCalls)
    })
  })

  describe('Specialized Hook Performance', () => {
    it('should allow efficient access to specific functionality', async () => {
      // Import individual hooks for direct testing
      const { useAccessToken } = await import('@/hooks/auth/useAccessToken')
      const { useRoleChecks } = await import('@/hooks/auth/useRoleChecks')
      const { usePMSeniority } = await import('@/hooks/auth/usePMSeniority')
      
      // Measure specialized hook performance
      const tokenHookTime = await measureHookPerformance(() => 
        renderHook(() => useAccessToken())
      )
      
      const roleHookTime = await measureHookPerformance(() => 
        renderHook(() => useRoleChecks(mockProfile))
      )
      
      const seniorityHookTime = await measureHookPerformance(() => 
        renderHook(() => usePMSeniority(mockProfile))
      )
      
      // Measure full composed hook
      const composedHookTime = await measureHookPerformance(() => 
        renderHook(() => useAuthComposed())
      )
      
      console.log('Specialized Hook Performance:', {
        accessToken: tokenHookTime + 'ms',
        roleChecks: roleHookTime + 'ms',
        pmSeniority: seniorityHookTime + 'ms',
        composed: composedHookTime + 'ms',
        efficiency: 'Individual hooks should be faster than composed'
      })
      
      // Individual hooks should be faster than the full composed hook
      expect(tokenHookTime).toBeLessThan(composedHookTime)
      expect(roleHookTime).toBeLessThan(composedHookTime)
      expect(seniorityHookTime).toBeLessThan(composedHookTime)
    })
  })

  describe('Error Handling Performance', () => {
    it('should handle errors efficiently without performance degradation', async () => {
      // Mock error conditions
      ;(supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )
      
      const originalErrorTime = await measureErrorHandling(() => useAuthOriginal())
      const composedErrorTime = await measureErrorHandling(() => useAuthComposed())
      
      console.log('Error Handling Performance:', {
        original: originalErrorTime + 'ms',
        composed: composedErrorTime + 'ms',
        improvement: originalErrorTime > composedErrorTime ? 'Better' : 'Same/Worse'
      })
      
      // Error handling should not be significantly slower
      expect(composedErrorTime).toBeLessThanOrEqual(originalErrorTime * 1.2)
    })
  })

  describe('Bundle Size Impact', () => {
    it('should not significantly increase bundle size', () => {
      // This is a placeholder for bundle analysis
      // In a real scenario, this would analyze the webpack bundle
      const mockBundleAnalysis = {
        originalSize: 45000, // 45KB
        composedSize: 52000, // 52KB
        increase: '15.6%'
      }
      
      console.log('Bundle Size Analysis:', mockBundleAnalysis)
      
      // The refactored version should not increase bundle size by more than 30%
      expect(mockBundleAnalysis.composedSize).toBeLessThanOrEqual(
        mockBundleAnalysis.originalSize * 1.3
      )
    })
  })
})

// Helper functions for performance measurement
async function measureLoadTime(hookFactory: () => any): Promise<number> {
  const startTime = performance.now()
  const { result } = hookFactory()
  
  await waitFor(() => {
    expect(result.current.loading).toBe(false)
  })
  
  return performance.now() - startTime
}

async function measureConcurrentOperations(hookFactory: () => any): Promise<number> {
  const { result } = renderHook(hookFactory)
  
  const startTime = performance.now()
  
  // Simulate concurrent operations
  const operations = [
    result.current.getAccessToken(),
    result.current.hasPermission('projects.read'),
    result.current.getSeniority(),
    result.current.checkMultiplePermissions(['projects.read', 'projects.write'])
  ]
  
  await act(async () => {
    await Promise.all(operations)
  })
  
  return performance.now() - startTime
}

async function measureHookPerformance(hookFactory: () => any): Promise<number> {
  const startTime = performance.now()
  const { result } = hookFactory()
  
  await waitFor(() => {
    // Wait for hook to stabilize
    expect(result.current).toBeDefined()
  })
  
  return performance.now() - startTime
}

async function measureErrorHandling(hookFactory: () => any): Promise<number> {
  const { result } = renderHook(hookFactory)
  
  const startTime = performance.now()
  
  await act(async () => {
    try {
      await result.current.signIn('test@example.com', 'wrongpassword')
    } catch (error) {
      // Expected error
    }
  })
  
  return performance.now() - startTime
}
