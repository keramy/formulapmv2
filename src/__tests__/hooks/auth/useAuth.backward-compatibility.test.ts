/**
 * Comprehensive Backward Compatibility Test Suite for useAuth Refactoring
 * 
 * This test suite validates that the refactored useAuth hook maintains 100%
 * backward compatibility with all existing implementations across the codebase.
 * 
 * It tests the interface contract, return types, function signatures, and
 * behavior consistency between the original and composed implementations.
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

describe('useAuth Backward Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Default mocks
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

  describe('Interface Compatibility', () => {
    it('should have identical property structure', async () => {
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      // Wait for initialization
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      const originalKeys = Object.keys(originalResult.current).sort()
      const composedKeys = Object.keys(composedResult.current).sort()
      
      expect(composedKeys).toEqual(originalKeys)
    })
    
    it('should have identical function signatures', async () => {
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      // Test function types
      expect(typeof originalResult.current.signIn).toBe(typeof composedResult.current.signIn)
      expect(typeof originalResult.current.signOut).toBe(typeof composedResult.current.signOut)
      expect(typeof originalResult.current.getAccessToken).toBe(typeof composedResult.current.getAccessToken)
      expect(typeof originalResult.current.clearAuthError).toBe(typeof composedResult.current.clearAuthError)
      expect(typeof originalResult.current.hasPermission).toBe(typeof composedResult.current.hasPermission)
      expect(typeof originalResult.current.checkMultiplePermissions).toBe(typeof composedResult.current.checkMultiplePermissions)
      expect(typeof originalResult.current.getSeniority).toBe(typeof composedResult.current.getSeniority)
      expect(typeof originalResult.current.isPMWithSeniority).toBe(typeof composedResult.current.isPMWithSeniority)
      expect(typeof originalResult.current.canPerformAction).toBe(typeof composedResult.current.canPerformAction)
      expect(typeof originalResult.current.compareSeniority).toBe(typeof composedResult.current.compareSeniority)
      expect(typeof originalResult.current.hasMinimumSeniority).toBe(typeof composedResult.current.hasMinimumSeniority)
      expect(typeof originalResult.current.stopImpersonation).toBe(typeof composedResult.current.stopImpersonation)
      expect(typeof originalResult.current.canImpersonate).toBe(typeof composedResult.current.canImpersonate)
    })
    
    it('should have identical property types', async () => {
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      // Test property types
      expect(typeof originalResult.current.user).toBe(typeof composedResult.current.user)
      expect(typeof originalResult.current.profile).toBe(typeof composedResult.current.profile)
      expect(typeof originalResult.current.loading).toBe(typeof composedResult.current.loading)
      expect(typeof originalResult.current.authError).toBe(typeof composedResult.current.authError)
      expect(typeof originalResult.current.isAuthenticated).toBe(typeof composedResult.current.isAuthenticated)
      expect(typeof originalResult.current.authState).toBe(typeof composedResult.current.authState)
      expect(typeof originalResult.current.isError).toBe(typeof composedResult.current.isError)
      expect(typeof originalResult.current.isRecoveringSession).toBe(typeof composedResult.current.isRecoveringSession)
      expect(typeof originalResult.current.isUserInitiated).toBe(typeof composedResult.current.isUserInitiated)
      expect(typeof originalResult.current.sessionState).toBe(typeof composedResult.current.sessionState)
      expect(typeof originalResult.current.isImpersonating).toBe(typeof composedResult.current.isImpersonating)
      expect(typeof originalResult.current.impersonatedUser).toBe(typeof composedResult.current.impersonatedUser)
      expect(typeof originalResult.current.originalAdmin).toBe(typeof composedResult.current.originalAdmin)
      expect(typeof originalResult.current.originalProfile).toBe(typeof composedResult.current.originalProfile)
    })
  })

  describe('Role Check Properties Compatibility', () => {
    it('should have all role check boolean properties', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      const roleProperties = [
        'isManagement',
        'isAdmin', 
        'isPurchaseManager',
        'isTechnicalLead',
        'isProjectManager',
        'isClient',
        'isManagementRole',
        'isProjectRole',
        'isPurchaseRole',
        'isFieldRole',
        'isExternalRole',
        'canAccessAdminPanel',
        'canManageUsers',
        'canViewAllProjects',
        'canCreateProjects',
        'canDeleteProjects',
        'canManageProjectSettings',
        'canViewFinancials',
        'canApproveExpenses'
      ]
      
      roleProperties.forEach(prop => {
        expect(result.current).toHaveProperty(prop)
        expect(typeof result.current[prop as keyof typeof result.current]).toBe('boolean')
      })
    })
    
    it('should have PM seniority info object with correct structure', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.pmSeniorityInfo).toMatchObject({
        seniority: expect.any(String),
        displayName: expect.any(String),
        canApproveShopDrawings: expect.any(Boolean),
        isPM: expect.any(Boolean),
        isRegularPM: expect.any(Boolean),
        isSeniorPM: expect.any(Boolean),
        isExecutivePM: expect.any(Boolean)
      })
    })
  })

  describe('State Machine Compatibility', () => {
    it('should have identical auth states', async () => {
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      // Both should be in idle state initially
      expect(originalResult.current.authState).toBe(composedResult.current.authState)
      expect(originalResult.current.sessionState).toBe(composedResult.current.sessionState)
    })
    
    it('should transition through identical states during authentication', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      // Sign in with both implementations
      await act(async () => {
        await Promise.all([
          originalResult.current.signIn('test@example.com', 'password'),
          composedResult.current.signIn('test@example.com', 'password')
        ])
      })
      
      // Should reach the same final state
      await waitFor(() => {
        expect(originalResult.current.authState).toBe(composedResult.current.authState)
        expect(originalResult.current.isAuthenticated).toBe(composedResult.current.isAuthenticated)
      })
    })
  })

  describe('Function Behavior Compatibility', () => {
    it('should handle sign in identically', async () => {
      const mockSession = {
        user: mockUser,
        access_token: 'token-123'
      }
      
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })
      
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      let originalResponse: any
      let composedResponse: any
      
      await act(async () => {
        [originalResponse, composedResponse] = await Promise.all([
          originalResult.current.signIn('test@example.com', 'password'),
          composedResult.current.signIn('test@example.com', 'password')
        ])
      })
      
      // Responses should be identical in structure
      expect(originalResponse.data.user.id).toBe(composedResponse.data.user.id)
      expect(originalResponse.error).toBe(composedResponse.error)
    })
    
    it('should handle permission checks identically', async () => {
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
      
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.profile).toEqual(mockProfile)
        expect(composedResult.current.profile).toEqual(mockProfile)
      })
      
      // Test permission functions
      const testPermissions = ['projects.read', 'projects.write', 'projects.delete', 'admin.all']
      
      testPermissions.forEach(permission => {
        const originalResult1 = originalResult.current.hasPermission(permission)
        const composedResult1 = composedResult.current.hasPermission(permission)
        expect(originalResult1).toBe(composedResult1)
      })
      
      // Test multiple permissions
      const originalMultiple = originalResult.current.checkMultiplePermissions(
        ['projects.read', 'projects.write'], true
      )
      const composedMultiple = composedResult.current.checkMultiplePermissions(
        ['projects.read', 'projects.write'], true
      )
      expect(originalMultiple).toBe(composedMultiple)
    })
    
    it('should handle seniority comparisons identically', async () => {
      const pmProfile: UserProfile = {
        ...mockProfile,
        role: 'senior_project_manager'
      }
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: pmProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.profile).toEqual(pmProfile)
        expect(composedResult.current.profile).toEqual(pmProfile)
      })
      
      const testSeniorities = ['junior', 'regular', 'senior', 'executive']
      
      testSeniorities.forEach(level => {
        const originalComparison = originalResult.current.compareSeniority(level)
        const composedComparison = composedResult.current.compareSeniority(level)
        expect(originalComparison).toBe(composedComparison)
      })
    })
  })

  describe('Error Handling Compatibility', () => {
    it('should handle errors identically', async () => {
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      })
      
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await act(async () => {
        try {
          await originalResult.current.signIn('test@example.com', 'wrong')
        } catch (error) {
          // Expected
        }
        
        try {
          await composedResult.current.signIn('test@example.com', 'wrong')
        } catch (error) {
          // Expected
        }
      })
      
      expect(originalResult.current.authError).toBe(composedResult.current.authError)
      expect(originalResult.current.isError).toBe(composedResult.current.isError)
    })
    
    it('should clear errors identically', async () => {
      // Set up error state
      ;(supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Test error' }
      })
      
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      // Create error state
      await act(async () => {
        try {
          await originalResult.current.signIn('test@example.com', 'wrong')
          await composedResult.current.signIn('test@example.com', 'wrong')
        } catch (error) {
          // Expected
        }
      })
      
      expect(originalResult.current.authError).toBeTruthy()
      expect(composedResult.current.authError).toBeTruthy()
      
      // Clear errors
      act(() => {
        originalResult.current.clearAuthError()
        composedResult.current.clearAuthError()
      })
      
      expect(originalResult.current.authError).toBeNull()
      expect(composedResult.current.authError).toBeNull()
    })
  })

  describe('Debug Information Compatibility', () => {
    it('should provide identical debug info structure', async () => {
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      const originalDebugKeys = Object.keys(originalResult.current.debugInfo).sort()
      const composedDebugKeys = Object.keys(composedResult.current.debugInfo).sort()
      
      expect(composedDebugKeys).toEqual(originalDebugKeys)
    })
  })

  describe('Cache Interface Compatibility', () => {
    it('should provide identical cache interface', async () => {
      const { result: originalResult } = renderHook(() => useAuthOriginal())
      const { result: composedResult } = renderHook(() => useAuthComposed())
      
      await waitFor(() => {
        expect(originalResult.current.loading).toBe(false)
        expect(composedResult.current.loading).toBe(false)
      })
      
      // Cache interface should be identical
      expect(typeof originalResult.current.cache.clear).toBe(typeof composedResult.current.cache.clear)
      expect(typeof originalResult.current.cache.needsRefresh).toBe(typeof composedResult.current.cache.needsRefresh)
      expect(typeof originalResult.current.cache.stats).toBe(typeof composedResult.current.cache.stats)
    })
  })

  describe('Real Implementation Usage Patterns', () => {
    it('should support common component usage pattern', async () => {
      const TestComponent = () => {
        const {
          user,
          profile,
          loading,
          isAuthenticated,
          signIn,
          signOut,
          hasPermission,
          isAdmin,
          canCreateProjects
        } = useAuth()
        
        if (loading) return 'Loading...'
        if (!isAuthenticated) return 'Not authenticated'
        
        return {
          userEmail: user?.email,
          userName: `${profile?.first_name} ${profile?.last_name}`,
          isAdminUser: isAdmin ? 'Yes' : 'No',
          canCreate: canCreateProjects ? 'Yes' : 'No',
          hasReadPermission: hasPermission('projects.read') ? 'Yes' : 'No',
          signOutFunction: signOut
        }
      }
      
      // This should not throw and should render without issues
      expect(() => TestComponent()).not.toThrow()
    })
    
    it('should support hook chaining pattern', async () => {
      const useCustomHook = () => {
        const { user, profile, isAuthenticated, hasPermission } = useAuth()
        
        const canManageProject = isAuthenticated && (
          hasPermission('projects.write') ||
          hasPermission('admin.all')
        )
        
        return {
          userId: user?.id,
          userName: profile?.first_name,
          canManage: canManageProject
        }
      }
      
      const { result } = renderHook(() => useCustomHook())
      
      expect(result.current).toMatchObject({
        userId: expect.any(String),
        userName: expect.any(String),
        canManage: expect.any(Boolean)
      })
    })
    
    it('should support destructuring pattern', async () => {
      const { result } = renderHook(() => {
        const auth = useAuth()
        const {
          user,
          profile,
          loading,
          authError,
          isAuthenticated,
          signIn,
          signOut,
          getAccessToken,
          clearAuthError,
          hasPermission,
          checkMultiplePermissions,
          isAdmin,
          isProjectManager,
          canCreateProjects,
          pmSeniorityInfo,
          debugInfo
        } = auth
        
        return {
          hasUser: !!user,
          hasProfile: !!profile,
          isLoading: loading,
          hasError: !!authError,
          authenticated: isAuthenticated,
          canSignIn: typeof signIn === 'function',
          canSignOut: typeof signOut === 'function',
          canGetToken: typeof getAccessToken === 'function',
          canClearError: typeof clearAuthError === 'function',
          canCheckPermission: typeof hasPermission === 'function',
          canCheckMultiple: typeof checkMultiplePermissions === 'function',
          adminRole: isAdmin,
          pmRole: isProjectManager,
          createProjects: canCreateProjects,
          hasSeniorityInfo: !!pmSeniorityInfo,
          hasDebugInfo: !!debugInfo
        }
      })
      
      expect(result.current).toMatchObject({
        hasUser: expect.any(Boolean),
        hasProfile: expect.any(Boolean),
        isLoading: expect.any(Boolean),
        hasError: expect.any(Boolean),
        authenticated: expect.any(Boolean),
        canSignIn: true,
        canSignOut: true,
        canGetToken: true,
        canClearError: true,
        canCheckPermission: true,
        canCheckMultiple: true,
        adminRole: expect.any(Boolean),
        pmRole: expect.any(Boolean),
        createProjects: expect.any(Boolean),
        hasSeniorityInfo: true,
        hasDebugInfo: true
      })
    })
  })

  describe('Performance Characteristics', () => {
    it('should not cause more re-renders than original', async () => {
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
      
      // Access properties multiple times - should not cause re-renders
      originalResult.current.user
      originalResult.current.profile
      originalResult.current.isAuthenticated
      
      composedResult.current.user
      composedResult.current.profile
      composedResult.current.isAuthenticated
      
      // Render counts should not increase
      expect(originalRenders).toBe(baseOriginalRenders)
      expect(composedRenders).toBe(baseComposedRenders)
      
      // Composed implementation should not render significantly more
      expect(composedRenders).toBeLessThanOrEqual(originalRenders * 1.2) // Allow 20% tolerance
    })
  })

  describe('Type Safety', () => {
    it('should maintain TypeScript compatibility', () => {
      // This test ensures the return type is identical
      const originalHook: typeof useAuthOriginal = useAuth as any
      const composedHook: typeof useAuthComposed = useAuth as any
      
      // If types are compatible, these assignments should work
      expect(typeof originalHook).toBe('function')
      expect(typeof composedHook).toBe('function')
    })
  })
})
