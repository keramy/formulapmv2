'use client'

/**
 * Main Authentication Hook Export
 * 
 * This file provides the primary useAuth export that now uses AuthContext
 * to prevent hook re-initialization issues and enable proper token auto-refresh.
 * 
 * ## Architecture Change
 * 
 * Previously: Each component using useAuth instantiated the authentication hooks directly
 * Now: Authentication hooks are instantiated once in AuthProvider, shared via context
 * 
 * ## Benefits
 * 
 * - Prevents hook re-initialization on component re-renders
 * - Enables proper 30-minute token auto-refresh functionality  
 * - Improves performance by eliminating duplicate hook executions
 * - Maintains 100% backward compatibility - no component changes needed
 * - Centralizes authentication state management
 * 
 * ## Migration
 * 
 * Components continue to use useAuth() exactly as before. The only change is that
 * your app must be wrapped with AuthProvider in the root layout.
 */

// Import context-based authentication
import { useAuth as useAuthFromContext } from '@/contexts/AuthContext'

// Import direct hook implementations for fallback/testing
import { useAuthComposed } from './auth/useAuthComposed'
import { useAuthOriginal } from './useAuthOriginal'

/**
 * Configuration for authentication source
 * 
 * - 'context': Use AuthContext with AuthenticationService (recommended - eliminates circular dependencies)
 * - 'composed': Use direct hook composition (deprecated - has circular dependency issues)
 * - 'original': Use original monolithic hook (legacy - deprecated)
 */
const AUTH_SOURCE: 'context' | 'composed' | 'original' = 'context'

/**
 * Main useAuth hook export
 * 
 * Now uses the service-based AuthContext which eliminates all circular dependencies
 * and infinite re-render loops while providing stable authentication functionality.
 * 
 * @returns Complete authentication interface via AuthenticationService
 */
export const useAuth = AUTH_SOURCE === 'context' 
  ? useAuthFromContext 
  : AUTH_SOURCE === 'composed' 
    ? useAuthComposed 
    : useAuthOriginal

/**
 * Export the specific implementations for direct usage if needed
 * Components can import these directly for explicit behavior:
 * 
 * import { useAuthComposed } from '@/hooks/useAuth'
 * import { useAuthOriginal } from '@/hooks/useAuth'
 */
export { useAuthComposed, useAuthOriginal }

/**
 * Re-export individual specialized hooks for granular usage
 * This allows components to use focused hooks when appropriate:
 * 
 * import { useAccessToken, useRoleChecks } from '@/hooks/useAuth'
 */
export { useAuthCore } from './auth/useAuthCore'
export { useAuthActions } from './auth/useAuthActions'
export { useUserProfile } from './auth/useUserProfile'
export { useProfileCache } from './auth/useProfileCache'
export { useAccessToken } from './auth/useAccessToken'
export { useRoleChecks } from './auth/useRoleChecks'
export { usePMSeniority } from './auth/usePMSeniority'


/**
 * Default export for convenience
 */
export default useAuth