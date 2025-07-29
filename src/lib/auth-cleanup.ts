/**
 * Authentication Cleanup Utilities
 * Helps resolve persistent refresh token issues in development
 */

import { supabase } from './supabase'

/**
 * Comprehensive cleanup of all authentication data
 * Use this when experiencing persistent token issues
 */
export async function clearAllAuthData(): Promise<void> {
  console.log('🧹 [AuthCleanup] Starting comprehensive auth cleanup...')
  
  try {
    // 1. Sign out from Supabase (this invalidates server-side sessions)
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      console.warn('🧹 [AuthCleanup] Sign out error (continuing cleanup):', signOutError.message)
    }
    
    // 2. Clear all browser storage
    if (typeof window !== 'undefined') {
      // Clear localStorage
      const localStorageKeys = Object.keys(window.localStorage)
      localStorageKeys.forEach(key => {
        if (key.startsWith('sb-') || 
            key.startsWith('supabase') || 
            key.includes('auth') || 
            key.includes('token')) {
          window.localStorage.removeItem(key)
          console.log(`🧹 [AuthCleanup] Cleared localStorage: ${key}`)
        }
      })
      
      // Clear sessionStorage
      const sessionStorageKeys = Object.keys(window.sessionStorage)
      sessionStorageKeys.forEach(key => {
        if (key.startsWith('sb-') || 
            key.startsWith('supabase') || 
            key.includes('auth') || 
            key.includes('token')) {
          window.sessionStorage.removeItem(key)
          console.log(`🧹 [AuthCleanup] Cleared sessionStorage: ${key}`)
        }
      })
    }
    
    console.log('✅ [AuthCleanup] Comprehensive cleanup completed successfully')
    
  } catch (error) {
    console.error('❌ [AuthCleanup] Error during cleanup:', error)
    throw error
  }
}

/**
 * Check for stale authentication data that might cause conflicts
 */
export function detectStaleAuthData(): { hasStaleData: boolean, staleKeys: string[] } {
  if (typeof window === 'undefined') {
    return { hasStaleData: false, staleKeys: [] }
  }
  
  const staleKeys: string[] = []
  
  // Check localStorage for potentially problematic keys
  Object.keys(window.localStorage).forEach(key => {
    if (key.startsWith('sb-') || key.startsWith('supabase')) {
      staleKeys.push(`localStorage: ${key}`)
    }
  })
  
  // Check sessionStorage for potentially problematic keys
  Object.keys(window.sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || key.startsWith('supabase')) {
      staleKeys.push(`sessionStorage: ${key}`)
    }
  })
  
  return {
    hasStaleData: staleKeys.length > 0,
    staleKeys
  }
}

/**
 * Development helper: Clear auth data after database reset
 * Call this after running `supabase db reset` or `supabase db push`
 */
export async function clearAuthAfterDBReset(): Promise<void> {
  console.log('🔄 [AuthCleanup] Clearing auth data after database reset...')
  
  await clearAllAuthData()
  
  // Force reload to ensure clean state
  if (typeof window !== 'undefined') {
    console.log('🔄 [AuthCleanup] Forcing page reload for clean state...')
    window.location.reload()
  }
}

/**
 * Add this to your browser console during development to fix token issues:
 * 
 * ```javascript
 * // In browser console:
 * localStorage.clear(); sessionStorage.clear(); location.reload();
 * ```
 */
export const DEV_QUICK_FIX = `
// Development Quick Fix for Token Issues
// Run this in browser console:
localStorage.clear(); 
sessionStorage.clear(); 
console.log('🧹 Cleared all storage, reloading...'); 
location.reload();
`

console.log('🧹 [AuthCleanup] Development quick fix available:', DEV_QUICK_FIX)