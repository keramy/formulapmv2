import { renderHook, act, waitFor } from '@testing-library/react'
import { useAuthComposed } from '@/hooks/auth/useAuthComposed'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/types/auth'
import { User } from '@supabase/supabase-js'

// Mock all dependencies
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

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// Mock impersonation
jest.mock('@/hooks/useImpersonation', () => ({
  useImpersonation: () => ({
    isImpersonating: false,
    impersonatedUser: null,
    originalAdmin: null,
    isLoading: false,
    stopImpersonation: jest.fn(),
    canImpersonate: jest.fn(() => false)
  })
}))

const mockUser: User = {
  id: 'user-123',
  email: 'john.doe@example.com',
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
  email: 'john.doe@example.com',
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

describe('useAuthComposed Integration Tests', () => {
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

  describe('Full Authentication Flow', () => {
    it('should complete full sign-in flow with profile loading', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }
      
      // Mock successful sign in
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      // Mock profile fetch
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      // Initial state
      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      
      // Perform sign in
      await act(async () => {
        await result.current.signIn('john.doe@example.com', 'password123')
      })
      
      // Wait for profile loading to complete
      await waitFor(() => {
        expect(result.current.authState).toBe('authenticated')
        expect(result.current.isAuthenticated).toBe(true)
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toEqual(mockProfile)
        expect(result.current.loading).toBe(false)
      })
      
      // Role checks should work
      expect(result.current.isProjectManager).toBe(true)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.canCreateProjects).toBe(true)
      
      // PM seniority should be calculated
      expect(result.current.pmSeniorityInfo.isPM).toBe(true)
      expect(result.current.pmSeniorityInfo.seniority).toBe('regular')
    })
    
    it('should handle sign-in failure gracefully', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })
      
      const { result } = renderHook(() => useAuthComposed())
      
      await act(async () => {
        try {
          await result.current.signIn('john.doe@example.com', 'wrongpassword')
        } catch (error) {
          // Expected to throw
        }
      })
      
      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.authError).toBe('Invalid credentials')
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
    })
    
    it('should handle complete sign-out flow', async () => {
      // Set up authenticated state first
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
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
      
      ;(supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null })
      
      const { result } = renderHook(() => useAuthComposed())
      
      // Sign in first
      await act(async () => {
        await result.current.signIn('john.doe@example.com', 'password123')
      })
      
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true)
      })
      
      // Sign out
      await act(async () => {
        await result.current.signOut()
      })
      
      expect(result.current.authState).toBe('idle')
      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.authError).toBeNull()
    })
  })

  describe('Profile Loading and Error Handling', () => {
    it('should handle profile fetch failure after successful login', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      await act(async () => {
        await result.current.signIn('john.doe@example.com', 'password123')
      })
      
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser)
        expect(result.current.profile).toBeNull()
        expect(result.current.authError).toBe('Profile not found')
        expect(result.current.isAuthenticated).toBe(false) // No active profile
      })
    })
    
    it('should handle RLS policy errors', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      // Mock RLS policy error
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Access denied by RLS policy', code: 'PGRST301' }
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => useAuthComposed())
      
      await act(async () => {
        await result.current.signIn('john.doe@example.com', 'password123')
      })
      
      await waitFor(() => {
        expect(result.current.authError).toBe('Access denied by RLS policy')
        expect(result.current.isAuthenticated).toBe(false)
      })
    })
  })

  describe('Token Management Integration', () => {
    it('should get access token with automatic refresh', async () => {
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      await act(async () => {
        const token = await result.current.getAccessToken()
        expect(token).toBe('fresh-token-456')
      })
      
      expect(supabase.auth.refreshSession).toHaveBeenCalled()
    })
    
    it('should handle token refresh failure with circuit breaker', async () => {
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
      
      const expiredSession = {
        access_token: 'expired-token',
        expires_at: Math.floor(Date.now() / 1000) - 100
      }
      
      ;(supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })
      
      ;(supabase.auth.refreshSession as jest.Mock).mockRejectedValue(
        new Error('Network error')
      )
      
      const { result } = renderHook(() => useAuthComposed())
      
      // Trigger multiple failures to open circuit breaker
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          try {
            await result.current.getAccessToken()
          } catch (error) {
            // Expected to fail
          }
        })
      }
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'auth_circuit_breaker_state',
        expect.stringContaining('"isOpen":true')
      )
    })
  })

  describe('Role-Based Access Control Integration', () => {
    it('should provide correct role checks for different user types', async () => {
      const adminProfile: UserProfile = {
        ...mockProfile,
        role: 'admin',
        permissions: {
          'admin.all': true,
          'users.manage': true,
          'projects.all': true
        }
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: adminProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => useAuthComposed())
      
      // Wait for profile to load
      await waitFor(() => {
        expect(result.current.profile).toEqual(adminProfile)
      })
      
      // Admin role checks
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isManagement).toBe(true)
      expect(result.current.canAccessAdminPanel).toBe(true)
      expect(result.current.canManageUsers).toBe(true)
      expect(result.current.canViewAllProjects).toBe(true)
      expect(result.current.canCreateProjects).toBe(true)
      expect(result.current.canDeleteProjects).toBe(true)
      
      // Permission checks
      expect(result.current.hasPermission('admin.all')).toBe(true)
      expect(result.current.hasPermission('users.manage')).toBe(true)
      expect(result.current.hasPermission('projects.all')).toBe(true)
      expect(result.current.hasPermission('nonexistent.permission')).toBe(false)
    })
    
    it('should provide correct PM seniority information', async () => {
      const seniorPMProfile: UserProfile = {
        ...mockProfile,
        role: 'senior_project_manager',
        permissions: {
          'projects.read': true,
          'projects.write': true,
          'shop_drawings.approve': true
        }
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: seniorPMProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(seniorPMProfile)
      })
      
      // PM seniority checks
      expect(result.current.pmSeniorityInfo.seniority).toBe('senior')
      expect(result.current.pmSeniorityInfo.isPM).toBe(true)
      expect(result.current.pmSeniorityInfo.isSeniorPM).toBe(true)
      expect(result.current.pmSeniorityInfo.canApproveShopDrawings).toBe(true)
      expect(result.current.pmSeniorityInfo.displayName).toBe('Senior PM')
      
      // Seniority comparison
      expect(result.current.compareSeniority('regular')).toBe('higher')
      expect(result.current.compareSeniority('senior')).toBe('equal')
      expect(result.current.compareSeniority('executive')).toBe('lower')
    })
  })

  describe('State Consistency and Loading States', () => {
    it('should maintain consistent loading states across all hooks', async () => {
      let resolveProfile: (value: any) => void
      const profilePromise = new Promise(resolve => {
        resolveProfile = resolve
      })
      
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockReturnValue(profilePromise)
          }))
        }))
      })
      
      const { result } = renderHook(() => useAuthComposed())
      
      // Start sign in
      act(() => {
        result.current.signIn('john.doe@example.com', 'password123')
      })
      
      // Should be in loading state
      await waitFor(() => {
        expect(result.current.loading).toBe(true)
        expect(result.current.authState).toBe('loading')
      })
      
      // Resolve profile loading
      await act(async () => {
        resolveProfile({ data: mockProfile, error: null })
        await profilePromise
      })
      
      // Should complete loading
      expect(result.current.loading).toBe(false)
      expect(result.current.authState).toBe('authenticated')
      expect(result.current.isAuthenticated).toBe(true)
    })
    
    it('should handle rapid state changes consistently', async () => {
      let authChangeCallback: any
      
      ;(supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
        authChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      // Wait for initialization
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Simulate rapid auth changes
      act(() => {
        authChangeCallback('SIGNED_IN', { user: mockUser })
        authChangeCallback('TOKEN_REFRESHED', { user: mockUser })
        authChangeCallback('SIGNED_OUT', null)
      })
      
      // Final state should be signed out
      expect(result.current.user).toBeNull()
      expect(result.current.profile).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should recover from transient errors', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      // First profile fetch fails, second succeeds
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
              .mockRejectedValueOnce(new Error('Network timeout'))
              .mockResolvedValueOnce({ data: mockProfile, error: null })
          }))
        }))
      })
      
      const { result, rerender } = renderHook(() => useAuthComposed())
      
      await act(async () => {
        await result.current.signIn('john.doe@example.com', 'password123')
      })
      
      // Should have error from first attempt
      await waitFor(() => {
        expect(result.current.authError).toBe('Network timeout')
      })
      
      // Trigger retry by rerendering
      rerender()
      
      // Should eventually succeed
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
        expect(result.current.authError).toBeNull()
        expect(result.current.isAuthenticated).toBe(true)
      })
    })
  })

  describe('Cache and Performance Integration', () => {
    it('should provide cache management utilities', async () => {
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Cache utilities should be available
      expect(result.current.cache).toBeDefined()
      expect(result.current.cache.stats).toBeDefined()
      expect(typeof result.current.cache.clear).toBe('function')
      expect(typeof result.current.cache.needsRefresh).toBe('function')
      
      // Should be able to clear cache
      act(() => {
        result.current.cache.clear()
      })
      
      // Cache stats should reflect clearing
      expect(result.current.cache.stats).toBeDefined()
    })
  })

  describe('Debug Information', () => {
    it('should provide comprehensive debug information', async () => {
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Debug info should be comprehensive
      expect(result.current.debugInfo).toMatchObject({
        authState: expect.any(String),
        hasError: expect.any(Boolean),
        errorCode: expect.any(String),
        isRecovering: expect.any(Boolean),
        isUserInitiated: expect.any(Boolean),
        sessionState: expect.any(String),
        isImpersonating: expect.any(Boolean),
        pmSeniority: expect.any(String),
        roleChecks: expect.objectContaining({
          isManagement: expect.any(Boolean),
          isProjectRole: expect.any(Boolean),
          isPurchaseRole: expect.any(Boolean),
          isFieldRole: expect.any(Boolean),
          isExternalRole: expect.any(Boolean)
        }),
        cache: expect.any(Object)
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should match original useAuth interface exactly', async () => {
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
      
      const { result } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Core properties
      expect(result.current).toHaveProperty('user')
      expect(result.current).toHaveProperty('profile')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('authError')
      
      // Auth actions
      expect(typeof result.current.signIn).toBe('function')
      expect(typeof result.current.signOut).toBe('function')
      expect(typeof result.current.getAccessToken).toBe('function')
      expect(typeof result.current.clearAuthError).toBe('function')
      
      // Auth state
      expect(result.current).toHaveProperty('isAuthenticated')
      expect(result.current).toHaveProperty('authState')
      expect(result.current).toHaveProperty('isError')
      expect(result.current).toHaveProperty('isRecoveringSession')
      expect(result.current).toHaveProperty('isUserInitiated')
      expect(result.current).toHaveProperty('sessionState')
      
      // Role checks - verify all role properties exist
      const roleProperties = [
        'isManagement', 'isAdmin', 'isPurchaseManager', 'isTechnicalLead',
        'isProjectManager', 'isClient', 'isManagementRole', 'isProjectRole',
        'isPurchaseRole', 'isFieldRole', 'isExternalRole', 'canAccessAdminPanel',
        'canManageUsers', 'canViewAllProjects', 'canCreateProjects',
        'canDeleteProjects', 'canManageProjectSettings', 'canViewFinancials',
        'canApproveExpenses'
      ]
      
      roleProperties.forEach(prop => {
        expect(result.current).toHaveProperty(prop)
        expect(typeof result.current[prop as keyof typeof result.current]).toBe('boolean')
      })
      
      // Role functions
      expect(typeof result.current.hasPermission).toBe('function')
      expect(typeof result.current.checkMultiplePermissions).toBe('function')
      
      // PM seniority
      expect(typeof result.current.getSeniority).toBe('function')
      expect(typeof result.current.isPMWithSeniority).toBe('function')
      expect(typeof result.current.canPerformAction).toBe('function')
      expect(typeof result.current.compareSeniority).toBe('function')
      expect(typeof result.current.hasMinimumSeniority).toBe('function')
      expect(result.current).toHaveProperty('pmSeniorityInfo')
      
      // Impersonation
      expect(result.current).toHaveProperty('isImpersonating')
      expect(result.current).toHaveProperty('impersonatedUser')
      expect(result.current).toHaveProperty('originalAdmin')
      expect(result.current).toHaveProperty('originalProfile')
      expect(typeof result.current.stopImpersonation).toBe('function')
      expect(typeof result.current.canImpersonate).toBe('function')
      
      // Cache and debug
      expect(result.current).toHaveProperty('cache')
      expect(result.current).toHaveProperty('debugInfo')
    })
  })
})
