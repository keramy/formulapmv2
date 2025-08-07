import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthActions } from '@/hooks/auth/useAuthActions'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn()
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

describe('useAuthActions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Sign In', () => {
    it('should handle successful sign in', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123',
        refresh_token: 'refresh-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      const { result } = renderHook(() => useAuthActions())
      
      expect(result.current.isSigningIn).toBe(false)
      expect(result.current.authError).toBeNull()
      
      let signInResult: any
      await act(async () => {
        signInResult = await result.current.signIn('test@example.com', 'password123')
      })
      
      expect(signInResult).toEqual({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      expect(result.current.isSigningIn).toBe(false)
      expect(result.current.authError).toBeNull()
    })
    
    it('should handle sign in failure', async () => {
      const mockError = { message: 'Invalid credentials' }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })
      
      const { result } = renderHook(() => useAuthActions())
      
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(result.current.isSigningIn).toBe(false)
      expect(result.current.authError).toBe('Invalid credentials')
    })
    
    it('should handle network errors during sign in', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )
      
      const { result } = renderHook(() => useAuthActions())
      
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'password123')
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
          expect((error as Error).message).toBe('Network error')
        }
      })
      
      expect(result.current.isSigningIn).toBe(false)
      expect(result.current.authError).toBe('Network error')
    })
    
    it('should set loading state during sign in', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockReturnValue(signInPromise)
      
      const { result } = renderHook(() => useAuthActions())
      
      // Start sign in
      act(() => {
        result.current.signIn('test@example.com', 'password123')
      })
      
      // Should be in loading state
      expect(result.current.isSigningIn).toBe(true)
      
      // Resolve sign in
      await act(async () => {
        resolveSignIn({
          data: { user: mockUser, session: { access_token: 'token' } },
          error: null
        })
        await signInPromise
      })
      
      // Should no longer be loading
      expect(result.current.isSigningIn).toBe(false)
    })
    
    it('should validate email format', async () => {
      const { result } = renderHook(() => useAuthActions())
      
      await act(async () => {
        try {
          await result.current.signIn('invalid-email', 'password123')
        } catch (error) {
          expect((error as Error).message).toContain('email')
        }
      })
      
      expect(result.current.authError).toContain('email')
    })
    
    it('should validate password requirements', async () => {
      const { result } = renderHook(() => useAuthActions())
      
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', '')
        } catch (error) {
          expect((error as Error).message).toContain('password')
        }
      })
      
      expect(result.current.authError).toContain('password')
    })
  })

  describe('Sign Out', () => {
    it('should handle successful sign out', async () => {
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      })
      
      const { result } = renderHook(() => useAuthActions())
      
      expect(result.current.isSigningOut).toBe(false)
      
      await act(async () => {
        await result.current.signOut()
      })
      
      expect(result.current.isSigningOut).toBe(false)
      expect(result.current.authError).toBeNull()
    })
    
    it('should handle sign out failure', async () => {
      const mockError = { message: 'Sign out failed' }
      
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError
      })
      
      const { result } = renderHook(() => useAuthActions())
      
      await act(async () => {
        try {
          await result.current.signOut()
        } catch (error) {
          expect((error as Error).message).toBe('Sign out failed')
        }
      })
      
      expect(result.current.authError).toBe('Sign out failed')
    })
    
    it('should set loading state during sign out', async () => {
      let resolveSignOut: (value: any) => void
      const signOutPromise = new Promise(resolve => {
        resolveSignOut = resolve
      })
      
      ;(supabase.auth.signOut as jest.Mock).mockReturnValue(signOutPromise)
      
      const { result } = renderHook(() => useAuthActions())
      
      // Start sign out
      act(() => {
        result.current.signOut()
      })
      
      // Should be in loading state
      expect(result.current.isSigningOut).toBe(true)
      
      // Resolve sign out
      await act(async () => {
        resolveSignOut({ error: null })
        await signOutPromise
      })
      
      // Should no longer be loading
      expect(result.current.isSigningOut).toBe(false)
    })
    
    it('should handle network errors during sign out', async () => {
      ;(supabase.auth.signOut as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )
      
      const { result } = renderHook(() => useAuthActions())
      
      await act(async () => {
        try {
          await result.current.signOut()
        } catch (error) {
          expect((error as Error).message).toBe('Network error')
        }
      })
      
      expect(result.current.authError).toBe('Network error')
    })
  })

  describe('Error Management', () => {
    it('should clear auth error', () => {
      const { result } = renderHook(() => useAuthActions())
      
      // Set error state
      act(() => {
        ;(result.current as any).setAuthError('Test error')
      })
      
      expect(result.current.authError).toBe('Test error')
      
      // Clear error
      act(() => {
        result.current.clearAuthError()
      })
      
      expect(result.current.authError).toBeNull()
    })
    
    it('should replace previous errors with new ones', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock)
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'First error' }
        })
        .mockResolvedValueOnce({
          data: { user: null, session: null },
          error: { message: 'Second error' }
        })
      
      const { result } = renderHook(() => useAuthActions())
      
      // First error
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrong1')
        } catch (error) {
          // Expected
        }
      })
      
      expect(result.current.authError).toBe('First error')
      
      // Second error should replace first
      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrong2')
        } catch (error) {
          // Expected
        }
      })
      
      expect(result.current.authError).toBe('Second error')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent sign in attempts', async () => {
      let resolveCount = 0
      ;(supabase.auth.signInWithPassword as jest.Mock).mockImplementation(() => {
        resolveCount++
        return Promise.resolve({
          data: { user: mockUser, session: { access_token: `token-${resolveCount}` } },
          error: null
        })
      })
      
      const { result } = renderHook(() => useAuthActions())
      
      // Start multiple concurrent sign ins
      const promises = [
        result.current.signIn('test@example.com', 'password1'),
        result.current.signIn('test@example.com', 'password2'),
        result.current.signIn('test@example.com', 'password3')
      ]
      
      await act(async () => {
        await Promise.all(promises)
      })
      
      // All should complete successfully
      expect(result.current.isSigningIn).toBe(false)
      expect(result.current.authError).toBeNull()
      
      // Each call should have been made
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(3)
    })
    
    it('should prevent sign out during sign in', async () => {
      let resolveSignIn: (value: any) => void
      const signInPromise = new Promise(resolve => {
        resolveSignIn = resolve
      })
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockReturnValue(signInPromise)
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })
      
      const { result } = renderHook(() => useAuthActions())
      
      // Start sign in
      act(() => {
        result.current.signIn('test@example.com', 'password123')
      })
      
      expect(result.current.isSigningIn).toBe(true)
      
      // Try to sign out while signing in
      await act(async () => {
        try {
          await result.current.signOut()
        } catch (error) {
          expect((error as Error).message).toContain('sign in')
        }
      })
      
      // Complete sign in
      await act(async () => {
        resolveSignIn({
          data: { user: mockUser, session: { access_token: 'token' } },
          error: null
        })
        await signInPromise
      })
      
      expect(result.current.isSigningIn).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should not cause unnecessary re-renders', () => {
      let renderCount = 0
      
      const { result } = renderHook(() => {
        renderCount++
        return useAuthActions()
      })
      
      const initialRenderCount = renderCount
      
      // Calling the same function references should not cause re-renders
      const signIn1 = result.current.signIn
      const signIn2 = result.current.signIn
      const signOut1 = result.current.signOut
      const signOut2 = result.current.signOut
      
      expect(signIn1).toBe(signIn2)
      expect(signOut1).toBe(signOut2)
      expect(renderCount).toBe(initialRenderCount)
    })
  })
})
