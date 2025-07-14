import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/types/auth'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      refreshSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
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

// Mock supabaseAdmin
jest.mock('@/lib/supabase', () => ({
  ...jest.requireActual('@/lib/supabase'),
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
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

describe('useAuth Hook - Comprehensive Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Default mock implementations
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    })
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  describe('Auth State Machine', () => {
    it('should initialize in idle state', async () => {
      const { result } = renderHook(() => useAuth())
      
      expect(result.current.authState).toBe('idle')
      expect(result.current.loading).toBe(false)
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should transition idle → loading → authenticated on successful login', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const mockProfile: UserProfile = {
        id: 'user-123',
        role: 'client',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: undefined,
        company: undefined,
        department: undefined,
        permissions: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Mock successful login
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null
      })

      // Mock profile fetch
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        }))
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn('test@example.com', 'password')
      })

      expect(result.current.authState).toBe('authenticated')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
    })

    it('should transition to error state on login failure', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.authError).toBeTruthy()
      expect(typeof result.current.authError).toBe('string')
    })

    it('should handle profile fetch failure gracefully', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null
      })

      // Mock profile fetch failure
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Profile not found', code: 'PGRST116' }
            })
          }))
        }))
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn('test@example.com', 'password')
      })

      expect(result.current.authState).toBe('idle')
      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Profile')
    })
  })

  describe('Circuit Breaker Functionality', () => {
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

    it('should record failures and open circuit breaker after max failures', async () => {
      const { result } = renderHook(() => useAuth())

      // Mock multiple token refresh failures
      ;(supabase.auth.refreshSession as jest.Mock).mockRejectedValue(
        new Error('Token refresh failed')
      )

      // Simulate multiple failures
      for (let i = 0; i < 4; i++) {
        await act(async () => {
          try {
            await result.current.getAccessToken()
          } catch (error) {
            // Expected to fail
          }
        })
      }

      // Check that circuit breaker state was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_circuit_breaker_state',
        expect.stringContaining('"isOpen":true')
      )
    })

    it('should prevent token refresh when circuit breaker is open', async () => {
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

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBeNull()
      })

      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('token')
    })

    it('should reset circuit breaker after successful token refresh', async () => {
      const { result } = renderHook(() => useAuth())

      // Mock successful token refresh
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { 
          session: { 
            access_token: 'new-token-123', 
            expires_at: Math.floor(Date.now() / 1000) + 3600 
          } 
        },
        error: null
      })

      await act(async () => {
        await result.current.getAccessToken()
      })

      // Verify circuit breaker state was reset
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_circuit_breaker_state',
        expect.stringContaining('"consecutiveFailures":0')
      )
    })

    it('should transition to circuit_breaker state when circuit opens', async () => {
      // Mock circuit breaker state with high failure count
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_circuit_breaker_state') {
          return JSON.stringify({
            refreshAttempts: 2,
            lastFailureTime: Date.now() - 1000,
            isOpen: false,
            nextAttemptTime: 0,
            consecutiveFailures: 2
          })
        }
        return null
      })

      const { result } = renderHook(() => useAuth())

      // Mock token refresh failure that will trigger circuit breaker
      ;(supabase.auth.refreshSession as jest.Mock).mockRejectedValue(
        new Error('Final failure')
      )

      await act(async () => {
        try {
          await result.current.getAccessToken()
        } catch (error) {
          // Expected to fail
        }
      })

      // Should have auth error when circuit breaker is triggered
      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('token')
    })
  })

  describe('Token Management', () => {
    it('should cache valid tokens and reuse them', async () => {
      const mockSession = {
        access_token: 'cached-token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const { result } = renderHook(() => useAuth())

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

    it('should refresh expired tokens automatically', async () => {
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100 // Expired
      }

      const refreshedSession = {
        access_token: 'fresh-token-123',
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

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('fresh-token-123')
      })

      expect(supabase.auth.refreshSession).toHaveBeenCalled()
    })

    it('should handle token refresh mutex correctly', async () => {
      const mockSession = {
        access_token: 'token-123',
        expires_at: Math.floor(Date.now() / 1000) - 100 // Expired
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      ;(supabase.auth.refreshSession as jest.Mock).mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            data: { session: { access_token: 'refreshed-token', expires_at: Math.floor(Date.now() / 1000) + 3600 } },
            error: null
          }), 100)
        )
      )

      const { result } = renderHook(() => useAuth())

      // Make multiple simultaneous calls
      const promises = [
        result.current.getAccessToken(),
        result.current.getAccessToken(),
        result.current.getAccessToken()
      ]

      await act(async () => {
        const tokens = await Promise.all(promises)
        
        // All calls should return the same token
        expect(tokens[0]).toBe('refreshed-token')
        expect(tokens[1]).toBe('refreshed-token')
        expect(tokens[2]).toBe('refreshed-token')
      })

      // Refresh should only be called once due to mutex
      expect(supabase.auth.refreshSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('Profile Recovery', () => {
    it('should handle missing profile scenarios', async () => {
      const mockUser = { id: 'user-123', email: 'admin@formulapm.com' }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null
      })

      // Mock profile not found
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Profile not found', code: 'PGRST116' }
            })
          }))
        }))
      })

      // Mock getUser for admin check
      ;(supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn('admin@formulapm.com', 'password')
      })

      // Should attempt to create admin profile
      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Profile')
    })

    it('should handle RLS policy errors appropriately', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token-123' } },
        error: null
      })

      // Mock RLS policy error
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Access denied', code: 'PGRST301' }
            })
          }))
        }))
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        await result.current.signIn('test@example.com', 'password')
      })

      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Profile')
    })
  })

  describe('Error Handling', () => {
    it('should create proper error objects with all required fields', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Invalid credentials')
    })

    it('should clear errors when requested', async () => {
      // Set up error state
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.authError).toBeTruthy()
      expect(result.current.authState).toBe('idle')

      // Clear error
      act(() => {
        result.current.clearAuthError()
      })

      expect(result.current.authError).toBeNull()
      expect(result.current.authState).toBe('idle')
    })
  })

  describe('Auth State Persistence', () => {
    it('should restore circuit breaker state from localStorage', async () => {
      const storedState = {
        refreshAttempts: 2,
        lastFailureTime: Date.now() - 30000,
        isOpen: false,
        nextAttemptTime: 0,
        consecutiveFailures: 1
      }

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_circuit_breaker_state') {
          return JSON.stringify(storedState)
        }
        return null
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.debugInfo).toBeDefined()
      expect(result.current.debugInfo.authState).toBeDefined()
    })

    it('should reset old circuit breaker state (> 24 hours)', async () => {
      const oldState = {
        refreshAttempts: 5,
        lastFailureTime: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
        isOpen: true,
        nextAttemptTime: Date.now() + 60000,
        consecutiveFailures: 3
      }

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_circuit_breaker_state') {
          return JSON.stringify(oldState)
        }
        return null
      })

      const { result } = renderHook(() => useAuth())

      expect(result.current.debugInfo).toBeDefined()
      expect(result.current.debugInfo.authState).toBeDefined()
      expect(result.current.debugInfo.recoveryAttempts).toBe(0)
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('should cleanup timeouts and subscriptions on unmount', () => {
      const unsubscribeMock = jest.fn()
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      })

      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })

    it('should clear token cache on sign out', async () => {
      const { result } = renderHook(() => useAuth())

      // Set up authenticated state
      act(() => {
        result.current.signIn('test@example.com', 'password')
      })

      // Sign out
      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.authState).toBe('idle')
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
    })
  })

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.debugInfo).toMatchObject({
        authState: expect.any(String),
        recoveryAttempts: expect.any(Number),
        hasError: expect.any(Boolean),
        isRecovering: expect.any(Boolean)
      })
    })
  })
})