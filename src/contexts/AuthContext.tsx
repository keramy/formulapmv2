'use client'

import React, { createContext, useContext, ReactNode, useMemo, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import type { AuthResponse } from '@supabase/supabase-js'
import { UserProfile } from '@/types/auth'
import { authService, type AuthState, type AuthEventData } from '@/services/AuthenticationService'

/**
 * Simplified Authentication Context using AuthenticationService
 * 
 * This context provides a clean interface to the centralized AuthenticationService,
 * eliminating the circular dependencies and infinite loops that occurred with 
 * the previous hook-based approach.
 * 
 * Benefits:
 * - No circular dependencies between hooks
 * - Centralized authentication state management
 * - Event-driven updates preventing unnecessary re-renders
 * - Built-in error recovery and circuit breaker patterns
 * - Consistent authentication state across the application
 * - Maintains backward compatibility with existing useAuth interface
 */

/**
 * Extended auth interface for context consumers
 * Maintains compatibility with existing useAuth interface
 */
export interface AuthContextInterface {
  // Core auth state
  user: User | null
  profile: UserProfile | null
  loading: boolean
  authError: string | null
  
  // Auth actions  
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
  clearAuthError: () => void
  
  // Authentication status
  isAuthenticated: boolean
  isRecoveringSession: boolean
  authState: string
  sessionState: string
  isError: boolean
  isUserInitiated: boolean
  
  // Role checks - basic compatibility
  isManagement: boolean
  isAdmin: boolean
  isPurchaseManager: boolean
  isTechnicalLead: boolean
  isProjectManager: boolean
  isClient: boolean
  isManagementRole: boolean
  isProjectRole: boolean
  isPurchaseRole: boolean
  isFieldRole: boolean
  isExternalRole: boolean
  canAccessAdminPanel: boolean
  canManageUsers: boolean
  canViewAllProjects: boolean
  canCreateProjects: boolean
  canDeleteProjects: boolean
  canManageProjectSettings: boolean
  canViewFinancials: boolean
  canApproveExpenses: boolean
  hasPermission: (permission: string) => boolean
  checkMultiplePermissions: (permissions: string[], requireAll?: boolean) => boolean
  
  // PM Seniority helpers - basic compatibility
  getSeniority: () => string | null
  isPMWithSeniority: () => boolean
  canPerformAction: (action: string) => boolean
  compareSeniority: (otherLevel: any) => 'higher' | 'equal' | 'lower' | 'not_pm'
  hasMinimumSeniority: (minSeniority: string) => boolean
  pmSeniorityInfo: {
    seniority: string | null
    displayName: string
    canApproveShopDrawings: boolean
    isPM: boolean
    isRegularPM: boolean
    isSeniorPM: boolean
    isExecutivePM: boolean
  }
  
  // Cache management utilities - basic compatibility
  cache: {
    stats: any
    clear: () => void
    needsRefresh: () => boolean
  }
  
  // Debug info - basic compatibility
  debugInfo: {
    authState: string
    hasError: boolean
    errorCode?: string
    isRecovering: boolean
    isUserInitiated: boolean
    sessionState: string
    pmSeniority: string | null
    roleChecks: {
      isManagement: boolean
      isProjectRole: boolean
      isPurchaseRole: boolean
      isFieldRole: boolean
      isExternalRole: boolean
    }
    cache: any
  }
  
  // Service info
  lastUpdated: number
}

// Create the context with undefined as initial value
const AuthContext = createContext<AuthContextInterface | undefined>(undefined)

/**
 * AuthProvider Props
 */
interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider Component using AuthenticationService
 * 
 * This provider initializes the AuthenticationService and provides
 * authentication state to all child components via React Context.
 * 
 * The service is initialized once and uses event listeners to notify
 * the context of state changes, preventing the circular dependencies
 * that occurred with the previous hook-based approach.
 * 
 * @param children - Child components that need access to authentication
 */
export function AuthProvider({ children }: AuthProviderProps) {
  console.log('🔐 [AuthProvider] Initializing service-based authentication provider')
  
  // Local state that mirrors the authentication service state
  const [authState, setAuthState] = useState<AuthState>(() => authService.getState())
  
  // Initialize the authentication service and set up listeners
  useEffect(() => {
    console.log('🔐 [AuthProvider] Setting up authentication service')
    
    // Initialize the service and wait for it to complete
    const initializeService = async () => {
      try {
        await authService.initialize()
        console.log('🔐 [AuthProvider] Service initialization completed')
        
        // Update state after initialization
        setAuthState(authService.getState())
      } catch (error) {
        console.error('🔐 [AuthProvider] Service initialization failed:', error)
      }
    }
    
    initializeService()
    
    // Set up event listener for state changes
    const unsubscribe = authService.addListener((event: AuthEventData) => {
      console.log('🔐 [AuthProvider] Auth event received:', event.type)
      
      // Update local state to trigger React re-renders
      setAuthState(authService.getState())
    })
    
    // Initial state sync
    setAuthState(authService.getState())
    
    // Cleanup function
    return () => {
      console.log('🔐 [AuthProvider] Cleaning up authentication service listeners')
      unsubscribe()
    }
  }, [])
  
  // Create context value with service methods and current state
  const contextValue = useMemo((): AuthContextInterface => {
    // Helper function to get role-based boolean
    const hasRole = (role: string): boolean => {
      return authState.profile?.role === role
    }

    // Helper function for permission checks
    const hasPermission = (permission: string): boolean => {
      if (!authState.profile?.permissions) return false
      return !!authState.profile.permissions[permission]
    }

    // Helper function for multiple permission checks
    const checkMultiplePermissions = (permissions: string[], requireAll: boolean = true): boolean => {
      if (!authState.profile?.permissions) return false
      
      const checks = permissions.map(permission => hasPermission(permission))
      return requireAll ? checks.every(check => check) : checks.some(check => check)
    }

    // Basic PM seniority helpers (simplified fallbacks)
    const getSeniority = (): string | null => {
      return authState.profile?.seniority_level || null
    }

    const isPMWithSeniority = (): boolean => {
      return hasRole('project_manager') && !!authState.profile?.seniority_level
    }

    const canPerformAction = (action: string): boolean => {
      // Basic implementation - could be expanded based on seniority rules
      return hasPermission(action) || hasRole('project_manager')
    }

    const compareSeniority = (otherLevel: any): 'higher' | 'equal' | 'lower' | 'not_pm' => {
      if (!hasRole('project_manager')) return 'not_pm'
      if (!authState.profile?.seniority_level) return 'not_pm'
      
      // Simple comparison - could be improved with actual seniority hierarchy
      if (authState.profile.seniority_level === otherLevel) return 'equal'
      return 'equal' // Fallback
    }

    const hasMinimumSeniority = (minSeniority: string): boolean => {
      if (!authState.profile?.seniority_level) return false
      // Simple check - could be improved with actual seniority hierarchy
      return authState.profile.seniority_level === minSeniority
    }

    return {
      // Current state from service
      user: authState.user,
      profile: authState.profile,
      loading: authState.loading,
      authError: authState.error,
      isAuthenticated: authState.isAuthenticated,
      isRecoveringSession: authState.loading && !!authState.user,
      lastUpdated: authState.lastUpdated,
      
      // Authentication status properties
      authState: authState.loading ? 'loading' : (authState.isAuthenticated ? 'authenticated' : 'idle'),
      sessionState: authState.loading ? 'checking' : (authState.isAuthenticated ? 'authenticated' : 'idle'),
      isError: !!authState.error,
      isUserInitiated: false, // Service doesn't track this currently
      
      // Role checks - computed from profile
      isManagement: hasRole('admin') || hasRole('project_manager'),
      isAdmin: hasRole('admin'),
      isPurchaseManager: hasRole('purchase_manager'),
      isTechnicalLead: hasRole('technical_lead'),
      isProjectManager: hasRole('project_manager'),
      isClient: hasRole('client'),
      isManagementRole: hasRole('admin') || hasRole('project_manager'),
      isProjectRole: hasRole('project_manager'),
      isPurchaseRole: hasRole('purchase_manager'),
      isFieldRole: hasRole('field_worker'),
      isExternalRole: hasRole('client'),
      canAccessAdminPanel: hasRole('admin'),
      canManageUsers: hasRole('admin'),
      canViewAllProjects: hasRole('admin') || hasRole('project_manager'),
      canCreateProjects: hasRole('admin') || hasRole('project_manager'),
      canDeleteProjects: hasRole('admin'),
      canManageProjectSettings: hasRole('admin') || hasRole('project_manager'),
      canViewFinancials: hasRole('admin') || hasRole('project_manager'),
      canApproveExpenses: hasRole('admin') || hasRole('project_manager'),
      hasPermission,
      checkMultiplePermissions,
      
      // PM Seniority helpers
      getSeniority,
      isPMWithSeniority,
      canPerformAction,
      compareSeniority,
      hasMinimumSeniority,
      pmSeniorityInfo: {
        seniority: getSeniority(),
        displayName: authState.profile?.seniority_level || 'No seniority',
        canApproveShopDrawings: hasRole('project_manager'),
        isPM: hasRole('project_manager'),
        isRegularPM: hasRole('project_manager') && authState.profile?.seniority_level === 'regular',
        isSeniorPM: hasRole('project_manager') && authState.profile?.seniority_level === 'senior',
        isExecutivePM: hasRole('project_manager') && authState.profile?.seniority_level === 'executive'
      },
      
      // Cache management utilities (basic fallbacks)
      cache: {
        stats: { lastUpdated: authState.lastUpdated },
        clear: () => {}, // Service handles caching internally
        needsRefresh: () => false // Service handles refresh logic internally
      },
      
      // Debug info
      debugInfo: {
        authState: authState.loading ? 'loading' : (authState.isAuthenticated ? 'authenticated' : 'idle'),
        hasError: !!authState.error,
        errorCode: authState.error ? 'AUTH_ERROR' : undefined,
        isRecovering: authState.loading,
        isUserInitiated: false,
        sessionState: authState.loading ? 'checking' : (authState.isAuthenticated ? 'authenticated' : 'idle'),
        pmSeniority: getSeniority(),
        roleChecks: {
          isManagement: hasRole('admin') || hasRole('project_manager'),
          isProjectRole: hasRole('project_manager'),
          isPurchaseRole: hasRole('purchase_manager'),
          isFieldRole: hasRole('field_worker'),
          isExternalRole: hasRole('client')
        },
        cache: { lastUpdated: authState.lastUpdated }
      },
      
      // Service methods
      signIn: authService.signIn.bind(authService),
      signOut: authService.signOut.bind(authService),
      getAccessToken: authService.getAccessToken.bind(authService),
      clearAuthError: authService.clearError.bind(authService)
    }
  }, [
    authState.user,
    authState.profile,
    authState.loading,
    authState.error,
    authState.isAuthenticated,
    authState.lastUpdated
  ])
  
  // Log state for debugging (reduced to prevent spam)
  useEffect(() => {
    const debugEnabled = false // Only enable when debugging
    if (!debugEnabled) return
    
    console.log('🔐 [AuthProvider] State updated:', {
      hasUser: !!authState.user,
      hasProfile: !!authState.profile,
      isAuthenticated: authState.isAuthenticated,
      loading: authState.loading,
      error: authState.error
    })
  }, [authState])

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth Hook - Service-based Context Consumer
 * 
 * This hook provides access to the centralized AuthenticationService
 * through React Context. It maintains backward compatibility with
 * existing components while providing a much more stable and
 * performant authentication interface.
 * 
 * Benefits over the previous hook-based approach:
 * - No circular dependencies
 * - No infinite re-render loops
 * - Stable auto-refresh functionality
 * - Centralized error handling
 * - Event-driven state updates
 * 
 * @returns Authentication interface from centralized service
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextInterface {
  const authContext = useContext(AuthContext)
  
  if (authContext === undefined) {
    throw new Error(
      '🔐 useAuth must be used within an AuthProvider. ' +
      'Make sure your component is wrapped with <AuthProvider> in the component tree.'
    )
  }
  
  return authContext
}

/**
 * useAuthContext Hook - Direct Context Access
 * 
 * Alternative hook name for explicit context usage.
 * Useful when you want to be explicit about using context-based auth.
 * 
 * @returns Authentication interface from centralized service
 * @throws Error if used outside of AuthProvider
 */
export function useAuthContext(): AuthContextInterface {
  return useAuth()
}

/**
 * AuthContext Consumer Component
 * 
 * Render prop component for accessing auth state.
 * Useful for class components or when you need conditional rendering
 * based on auth state at the component level.
 * 
 * @example
 * <AuthContext.Consumer>
 *   {(auth) => auth.isAuthenticated ? <Dashboard /> : <Login />}
 * </AuthContext.Consumer>
 */
AuthContext.Consumer.displayName = 'AuthContextConsumer'

/**
 * Hook for checking if AuthProvider is available
 * 
 * @returns boolean - true if AuthProvider is available in the component tree
 */
export function useAuthProviderAvailable(): boolean {
  const authContext = useContext(AuthContext)
  return authContext !== undefined
}

/**
 * HOC for components that require authentication
 * 
 * @param Component - Component to wrap
 * @returns Component that only renders if user is authenticated
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  const WrappedComponent = (props: P) => {
    const { isAuthenticated, loading } = useAuth()
    
    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }
    
    if (!isAuthenticated) {
      return <div className="flex items-center justify-center min-h-screen">Please log in</div>
    }
    
    return <Component {...props} />
  }
  
  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Export the context for advanced usage
 */
export { AuthContext }

/**
 * Type exports for TypeScript users
 */
export type { AuthContextInterface as AuthContextType }

/**
 * Default export for convenience
 */
export default AuthProvider