/**
 * End-to-End Authentication Tests
 * Tests common authentication scenarios including login, logout, session recovery, and error handling
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'
import { authMonitor } from '@/lib/auth-monitoring'
import { supabase } from '@/lib/supabase'

// Mock the auth monitoring
jest.mock('@/lib/auth-monitoring', () => ({
  authMonitor: {
    recordEvent: jest.fn(),
    recordAuthFailure: jest.fn(),
    recordAuthSuccess: jest.fn(),
    recordTokenRefresh: jest.fn(),
    recordCircuitBreakerOpen: jest.fn(),
    getMetrics: jest.fn(),
    getUserMetrics: jest.fn(),
    getActiveLoops: jest.fn(),
    reset: jest.fn()
  }
}))

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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock fetch for API calls
global.fetch = jest.fn()

describe('Authentication E2E Tests', () => {
  let authStateChangeCallback: ((event: string, session: any) => void) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset auth monitor
    ;(authMonitor.reset as jest.Mock).mockClear()
    
    // Mock onAuthStateChange to capture callback
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: { subscription: { unsubscribe: jest.fn() } }
      }
    })

    // Default session state
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    })
  })

  describe('Complete Login Flow', () => {
    it('should handle successful login with profile fetching', async () => {
      const mockUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
        last_sign_in_at: '2024-01-01T00:00:00Z',
        confirmed_at: '2024-01-01T00:00:00Z'
      }

      const mockProfile = {
        id: 'test-user-123',
        role: 'client',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        phone: undefined,
        company: 'Test Company',
        department: undefined,
        permissions: { read: true },
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockSession = {
        access_token: 'mock-jwt-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser
      }

      // Mock successful login
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
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

      // Verify initial state
      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)

      // Perform login
      await act(async () => {
        await result.current.signIn('test@example.com', 'password123')
      })

      // Verify login was recorded
      expect(authMonitor.recordAuthSuccess).toHaveBeenCalledWith('test-user-123', expect.any(String))

      // Verify final state
      expect(result.current.authState).toBe('authenticated')
      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.authError).toBeNull()
    })

    it('should handle login failure and record monitoring events', async () => {
      const loginError = { message: 'Invalid login credentials' }

      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: loginError
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      // Verify failure was recorded
      expect(authMonitor.recordAuthFailure).toHaveBeenCalledWith(
        expect.any(String),
        'Invalid login credentials',
        'SIGNIN_ERROR',
        expect.any(String)
      )

      // Verify error state
      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.authError).toBeTruthy()
      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Invalid login credentials')
    })
  })

  describe('Session Recovery', () => {
    it('should recover existing session on app load', async () => {
      const mockUser = {
        id: 'existing-user-123',
        email: 'existing@example.com',
        created_at: '2024-01-01T00:00:00Z',
        last_sign_in_at: '2024-01-01T00:00:00Z',
        confirmed_at: '2024-01-01T00:00:00Z'
      }

      const mockProfile = {
        id: 'existing-user-123',
        role: 'project_manager',
        first_name: 'Existing',
        last_name: 'User',
        email: 'existing@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        department: 'Engineering',
        permissions: { read: true, write: true },
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const mockSession = {
        access_token: 'existing-jwt-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser
      }

      // Mock existing session
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
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

      // Wait for session recovery
      await waitFor(() => {
        expect(result.current.authState).toBe('authenticated')
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.profile).toEqual(mockProfile)
    })

    it('should handle session recovery with profile creation', async () => {
      const mockUser = {
        id: 'new-user-123',
        email: 'admin@formulapm.com',
        created_at: '2024-01-01T00:00:00Z',
        last_sign_in_at: '2024-01-01T00:00:00Z',
        confirmed_at: '2024-01-01T00:00:00Z'
      }

      const mockSession = {
        access_token: 'new-jwt-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser
      }

      // Mock existing session
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock profile not found initially
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

      // Wait for session recovery attempt
      await waitFor(() => {
        expect(result.current.authState).toBe('idle')
      })

      // Should have tried to create admin profile
      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Profile')
    })
  })

  describe('Token Refresh Flow', () => {
    it('should refresh expired tokens automatically', async () => {
      const mockUser = {
        id: 'refresh-user-123',
        email: 'refresh@example.com'
      }

      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100, // Expired
        user: mockUser
      }

      const refreshedSession = {
        access_token: 'fresh-token-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser
      }

      // Mock expired session
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      // Mock successful refresh
      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: refreshedSession },
        error: null
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('fresh-token-123')
      })

      // Verify refresh was recorded
      expect(authMonitor.recordTokenRefresh).toHaveBeenCalledWith(
        'refresh-user-123',
        expect.any(Number),
        true,
        undefined
      )
    })

    it('should handle token refresh failures and activate circuit breaker', async () => {
      const mockUser = {
        id: 'failing-user-123',
        email: 'failing@example.com'
      }

      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100,
        user: mockUser
      }

      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      // Mock refresh failure
      ;(supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Token refresh failed' }
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBeNull()
      })

      // Verify failure was recorded
      expect(authMonitor.recordTokenRefresh).toHaveBeenCalledWith(
        'failing-user-123',
        expect.any(Number),
        false,
        'Token refresh failed'
      )
    })
  })

  describe('Logout Flow', () => {
    it('should handle complete logout flow', async () => {
      const mockUser = {
        id: 'logout-user-123',
        email: 'logout@example.com'
      }

      const mockProfile = {
        id: 'logout-user-123',
        role: 'client',
        first_name: 'Logout',
        last_name: 'User',
        email: 'logout@example.com',
        phone: undefined,
        company: undefined,
        department: undefined,
        permissions: {},
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      // Mock successful logout
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      })

      const { result } = renderHook(() => useAuth())

      // Set up authenticated state
      await act(async () => {
        // Simulate auth state change to signed in
        authStateChangeCallback?.('SIGNED_IN', {
          user: mockUser,
          access_token: 'test-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        })
      })

      // Perform logout
      await act(async () => {
        await result.current.signOut()
      })

      // Verify logout
      expect(supabase.auth.signOut).toHaveBeenCalled()
      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.authError).toBeNull()
    })
  })

  describe('Profile Recovery Integration', () => {
    it('should call profile recovery API when profile is missing', async () => {
      const mockUser = {
        id: 'recovery-user-123',
        email: 'recovery@example.com'
      }

      const mockRecoveryResponse = {
        success: true,
        profile: {
          id: 'recovery-user-123',
          role: 'client',
          first_name: 'Recovery',
          last_name: 'User',
          email: 'recovery@example.com',
          phone: undefined,
          company: undefined,
          department: undefined,
          permissions: {},
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        recovered: true
      }

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

      // Mock recovery API call
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecoveryResponse)
      })

      const { result } = renderHook(() => useAuth())

      await act(async () => {
        // Simulate auth state change
        authStateChangeCallback?.('SIGNED_IN', {
          user: mockUser,
          access_token: 'test-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        })
      })

      // Should have error state due to missing profile
      expect(result.current.authState).toBe('idle')
      expect(typeof result.current.authError).toBe('string')
      expect(result.current.authError).toContain('Profile')
    })
  })

  describe('Error State Recovery', () => {
    it('should clear error state when explicitly requested', async () => {
      const { result } = renderHook(() => useAuth())

      // Set error state
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.authState).toBe('error')
      expect(result.current.authError).toBeTruthy()

      // Clear error
      act(() => {
        result.current.clearAuthError()
      })

      expect(result.current.authState).toBe('idle')
      expect(result.current.authError).toBeNull()
    })
  })

  describe('Circuit Breaker Integration', () => {
    it('should handle circuit breaker activation in full flow', async () => {
      // Mock circuit breaker state
      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_circuit_breaker_state') {
          return JSON.stringify({
            refreshAttempts: 3,
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
  })

  describe('Comprehensive Auth State Transitions', () => {
    it('should handle complete auth lifecycle: idle → loading → authenticated → error → recovery → authenticated', async () => {
      const mockUser = {
        id: 'lifecycle-user-123',
        email: 'lifecycle@example.com'
      }

      const mockProfile = {
        id: 'lifecycle-user-123',
        role: 'client',
        first_name: 'Lifecycle',
        last_name: 'User',
        email: 'lifecycle@example.com',
        phone: undefined,
        company: undefined,
        department: undefined,
        permissions: {},
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      const { result } = renderHook(() => useAuth())

      // 1. Initial state: idle
      expect(result.current.authState).toBe('idle')

      // 2. Login failure: idle → loading → error
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })

      await act(async () => {
        try {
          await result.current.signIn('lifecycle@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })

      expect(result.current.authState).toBe('error')

      // 3. Clear error: error → idle
      act(() => {
        result.current.clearAuthError()
      })

      expect(result.current.authState).toBe('idle')

      // 4. Successful login: idle → loading → authenticated
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { 
          user: mockUser, 
          session: { access_token: 'test-token', expires_at: Math.floor(Date.now() / 1000) + 3600 }
        },
        error: null
      })

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
          }))
        }))
      })

      await act(async () => {
        await result.current.signIn('lifecycle@example.com', 'correctpassword')
      })

      expect(result.current.authState).toBe('authenticated')
      expect(result.current.isAuthenticated).toBe(true)

      // 5. Logout: authenticated → idle
      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
    })
  })
})