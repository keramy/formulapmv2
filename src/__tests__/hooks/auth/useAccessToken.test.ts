import { renderHook, act, waitFor } from '@testing-library/react'
import { useAccessToken } from '@/hooks/auth/useAccessToken'
import { supabase } from '@/lib/supabase'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      refreshSession: jest.fn()
    }
  }
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useAccessToken Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('Token Retrieval', () => {
    it('should return valid token from session', async () => {
      const mockSession = {
        access_token: 'valid-token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('valid-token-123')
      })
      
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
    
    it('should return null when no session exists', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBeNull()
      })
    })
    
    it('should refresh expired token automatically', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100 // Expired
      }
      
      const refreshedSession = {
        access_token: 'fresh-token-456',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })
      
      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: refreshedSession },
        error: null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('fresh-token-456')
      })
      
      expect(supabase.auth.refreshSession).toHaveBeenCalled()
    })
    
    it('should handle token refresh failure', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })
      
      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh token expired' }
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBeNull()
      })
      
      expect(result.current.error).toBe('Refresh token expired')
    })
  })

  describe('Token Caching', () => {
    it('should cache valid tokens', async () => {
      const mockSession = {
        access_token: 'cached-token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      // First call should fetch and cache
      await act(async () => {
        const token1 = await result.current.getAccessToken()
        expect(token1).toBe('cached-token-123')
      })
      
      // Second call should use cache
      await act(async () => {
        const token2 = await result.current.getAccessToken()
        expect(token2).toBe('cached-token-123')
      })
      
      // getSession should only be called once due to caching
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
    })
    
    it('should invalidate cache when token expires', async () => {
      const validSession = {
        access_token: 'valid-token',
        expires_at: Math.floor(Date.now() / 1000) + 10 // Expires in 10 seconds
      }
      
      const newSession = {
        access_token: 'new-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      ;(supabase.auth.getSession as jest.Mock)
        .mockResolvedValueOnce({
          data: { session: validSession },
          error: null
        })
        .mockResolvedValueOnce({
          data: { session: newSession },
          error: null
        })
      
      const { result } = renderHook(() => useAccessToken())
      
      // First call
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('valid-token')
      })
      
      // Fast-forward time to expire the token
      jest.advanceTimersByTime(11000)
      
      // Second call should fetch new token
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('new-token')
      })
      
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2)
    })
    
    it('should clear cache on manual clear', async () => {
      const mockSession = {
        access_token: 'token-to-clear',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      // Cache the token
      await act(async () => {
        await result.current.getAccessToken()
      })
      
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(1)
      
      // Clear cache
      act(() => {
        result.current.clearCache()
      })
      
      // Next call should fetch again
      await act(async () => {
        await result.current.getAccessToken()
      })
      
      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('Circuit Breaker', () => {
    beforeEach(() => {
      // Mock circuit breaker state
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_circuit_breaker_state') {
          return JSON.stringify({
            refreshAttempts: 0,
            lastFailureTime: 0,
            isOpen: false,
            nextAttemptTime: 0,
            consecutiveFailures: 0
          })
        }
        return null
      })
    })
    
    it('should trigger circuit breaker after multiple failures', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })
      
      ;(supabase.auth.refreshSession as jest.Mock).mockRejectedValue(
        new Error('Refresh failed')
      )
      
      const { result } = renderHook(() => useAccessToken())
      
      // Trigger multiple failures
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          try {
            await result.current.getAccessToken()
          } catch (error) {
            // Expected to fail
          }
        })
      }
      
      // Circuit breaker should be triggered
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_circuit_breaker_state',
        expect.stringContaining('"isOpen":true')
      )
    })
    
    it('should prevent requests when circuit breaker is open', async () => {
      // Mock open circuit breaker
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_circuit_breaker_state') {
          return JSON.stringify({
            refreshAttempts: 5,
            lastFailureTime: Date.now(),
            isOpen: true,
            nextAttemptTime: Date.now() + 60000,
            consecutiveFailures: 3
          })
        }
        return null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBeNull()
      })
      
      expect(result.current.error).toContain('Circuit breaker')
    })
    
    it('should reset circuit breaker after successful refresh', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100
      }
      
      const refreshedSession = {
        access_token: 'fresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })
      
      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: refreshedSession },
        error: null
      })
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('fresh-token')
      })
      
      // Circuit breaker should be reset
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_circuit_breaker_state',
        expect.stringContaining('"consecutiveFailures":0')
      )
    })
  })

  describe('Concurrent Token Requests', () => {
    it('should handle concurrent token requests with mutex', async () => {
      let resolveRefresh: (value: any) => void
      const refreshPromise = new Promise(resolve => {
        resolveRefresh = resolve
      })
      
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })
      
      ;(supabase.auth.refreshSession as jest.Mock).mockReturnValue(refreshPromise)
      
      const { result } = renderHook(() => useAccessToken())
      
      // Start multiple concurrent requests
      const tokenPromises = [
        result.current.getAccessToken(),
        result.current.getAccessToken(),
        result.current.getAccessToken()
      ]
      
      // Resolve the refresh
      await act(async () => {
        resolveRefresh({
          data: {
            session: {
              access_token: 'refreshed-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600
            }
          },
          error: null
        })
        
        const tokens = await Promise.all(tokenPromises)
        
        // All requests should return the same token
        expect(tokens[0]).toBe('refreshed-token')
        expect(tokens[1]).toBe('refreshed-token')
        expect(tokens[2]).toBe('refreshed-token')
      })
      
      // Refresh should only be called once
      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading States', () => {
    it('should show loading state during token fetch', async () => {
      let resolveSession: (value: any) => void
      const sessionPromise = new Promise(resolve => {
        resolveSession = resolve
      })
      
      ;(supabase.auth.getSession as jest.Mock).mockReturnValue(sessionPromise)
      
      const { result } = renderHook(() => useAccessToken())
      
      // Start token fetch
      act(() => {
        result.current.getAccessToken()
      })
      
      expect(result.current.isLoading).toBe(true)
      
      // Resolve session fetch
      await act(async () => {
        resolveSession({
          data: {
            session: {
              access_token: 'token',
              expires_at: Math.floor(Date.now() / 1000) + 3600
            }
          },
          error: null
        })
        await sessionPromise
      })
      
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle session fetch errors', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Session fetch failed')
      )
      
      const { result } = renderHook(() => useAccessToken())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBeNull()
      })
      
      expect(result.current.error).toBe('Session fetch failed')
    })
    
    it('should clear errors on successful requests', async () => {
      // First request fails
      ;(supabase.auth.getSession as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: {
            session: {
              access_token: 'success-token',
              expires_at: Math.floor(Date.now() / 1000) + 3600
            }
          },
          error: null
        })
      
      const { result } = renderHook(() => useAccessToken())
      
      // First request should fail
      await act(async () => {
        await result.current.getAccessToken()
      })
      
      expect(result.current.error).toBe('Network error')
      
      // Clear cache to force new request
      act(() => {
        result.current.clearCache()
      })
      
      // Second request should succeed and clear error
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('success-token')
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0
      
      const { result } = renderHook(() => {
        renderCount++
        return useAccessToken()
      })
      
      const initialRenderCount = renderCount
      
      // Accessing the same properties should not cause re-renders
      const getToken1 = result.current.getAccessToken
      const getToken2 = result.current.getAccessToken
      const clearCache1 = result.current.clearCache
      const clearCache2 = result.current.clearCache
      
      expect(getToken1).toBe(getToken2)
      expect(clearCache1).toBe(clearCache2)
      expect(renderCount).toBe(initialRenderCount)
    })
  })
})
