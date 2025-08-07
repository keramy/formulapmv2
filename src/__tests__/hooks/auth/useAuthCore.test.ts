import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthCore } from '@/hooks/auth/useAuthCore'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }
}))

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

describe('useAuthCore Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Default mock implementations
    ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: null
    })
    
    ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
  })

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useAuthCore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.loading).toBe(true) // Initially loading
      expect(result.current.error).toBeNull()
      expect(result.current.isInitialized).toBe(false)
    })
    
    it('should fetch session on initialization', async () => {
      const { result } = renderHook(() => useAuthCore())
      
      await waitFor(() => {
        expect(supabase.auth.getSession).toHaveBeenCalled()
      })
      
      expect(result.current.loading).toBe(false)
      expect(result.current.isInitialized).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should handle existing session on initialization', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        expires_in: 3600,
        token_type: 'bearer'
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      })
      
      const { result } = renderHook(() => useAuthCore())
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.loading).toBe(false)
        expect(result.current.isInitialized).toBe(true)
      })
    })
    
    it('should handle session fetch error', async () => {
      const mockError = { message: 'Failed to fetch session' }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError
      })
      
      const { result } = renderHook(() => useAuthCore())
      
      await waitFor(() => {
        expect(result.current.user).toBeNull()
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe(mockError.message)
        expect(result.current.isInitialized).toBe(true)
      })
    })
  })

  describe('Auth State Changes', () => {
    it('should listen for auth state changes', () => {
      const mockCallback = jest.fn()
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        mockCallback.mockImplementation(callback)
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
      
      renderHook(() => useAuthCore())
      
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled()
    })
    
    it('should update user state on auth state change', async () => {
      let authChangeCallback: any
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
      
      const { result } = renderHook(() => useAuthCore())
      
      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })
      
      // Simulate auth state change
      act(() => {
        authChangeCallback('SIGNED_IN', {
          user: mockUser,
          access_token: 'new-token'
        })
      })
      
      expect(result.current.user).toEqual(mockUser)
    })
    
    it('should handle sign out event', async () => {
      let authChangeCallback: any
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
      
      const { result } = renderHook(() => useAuthCore())
      
      // Set initial user state
      act(() => {
        authChangeCallback('SIGNED_IN', {
          user: mockUser,
          access_token: 'token'
        })
      })
      
      expect(result.current.user).toEqual(mockUser)
      
      // Simulate sign out
      act(() => {
        authChangeCallback('SIGNED_OUT', null)
      })
      
      expect(result.current.user).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors during session fetch', async () => {
      ;(supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )
      
      const { result } = renderHook(() => useAuthCore())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Network error')
        expect(result.current.isInitialized).toBe(true)
      })
    })
    
    it('should recover from transient errors', async () => {
      // First call fails
      ;(supabase.auth.getSession as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          data: { session: { user: mockUser } },
          error: null
        })
      
      const { result, rerender } = renderHook(() => useAuthCore())
      
      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBe('Network error')
      })
      
      // Trigger retry by rerendering (simulates component update)
      rerender()
      
      // Should eventually recover
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.error).toBeNull()
      })
    })
  })

  describe('Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const unsubscribeMock = jest.fn()
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: unsubscribeMock } }
      })
      
      const { unmount } = renderHook(() => useAuthCore())
      
      unmount()
      
      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily when user object is the same', async () => {
      let renderCount = 0
      let authChangeCallback: any
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
      
      const { result } = renderHook(() => {
        renderCount++
        return useAuthCore()
      })
      
      // Wait for initial render
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })
      
      const initialRenderCount = renderCount
      
      // Trigger auth state change with same user object
      act(() => {
        authChangeCallback('TOKEN_REFRESHED', {
          user: mockUser,
          access_token: 'refreshed-token'
        })
      })
      
      act(() => {
        authChangeCallback('TOKEN_REFRESHED', {
          user: mockUser, // Same user object
          access_token: 'refreshed-token-2'
        })
      })
      
      // Should only render once for the state change
      expect(renderCount).toBe(initialRenderCount + 1)
    })
  })

  describe('State Consistency', () => {
    it('should maintain consistent state during rapid auth changes', async () => {
      let authChangeCallback: any
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
      
      const { result } = renderHook(() => useAuthCore())
      
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true)
      })
      
      // Rapid state changes
      act(() => {
        authChangeCallback('SIGNED_IN', { user: mockUser })
        authChangeCallback('TOKEN_REFRESHED', { user: mockUser })
        authChangeCallback('SIGNED_OUT', null)
      })
      
      // Final state should be signed out
      expect(result.current.user).toBeNull()
    })
  })
})
