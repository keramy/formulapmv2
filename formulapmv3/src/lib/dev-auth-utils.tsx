/**
 * Development Authentication Utilities
 * Helper functions for resolving auth issues during development
 */

import React from 'react'
import { clearAllAuthData } from './auth-cleanup'

/**
 * Add this to your useAuth hook during development for automatic cleanup
 */
export const DEV_AUTO_CLEANUP_ON_REFRESH_ERROR = process.env.NODE_ENV === 'development'

/**
 * Development helper: Automatically clear auth data when refresh token errors occur
 * This prevents the persistent "Invalid Refresh Token" loops in development
 */
export async function handleDevRefreshTokenError(error: any): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    return false
  }
  
  const isRefreshTokenError = error?.message?.includes('Invalid Refresh Token') || 
                             error?.message?.includes('Refresh Token Not Found')
  
  if (isRefreshTokenError) {
    console.log('🔧 [DevUtils] Auto-clearing auth data due to refresh token error...')
    
    try {
      await clearAllAuthData()
      console.log('✅ [DevUtils] Auth data cleared successfully')
      
      // In development, we can be more aggressive and reload the page
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          console.log('🔄 [DevUtils] Reloading page for clean auth state...')
          window.location.reload()
        }, 1000)
      }
      
      return true
    } catch (cleanupError) {
      console.error('❌ [DevUtils] Error during auto-cleanup:', cleanupError)
      return false
    }
  }
  
  return false
}

/**
 * Development utility: Reset auth state after database operations
 * Call this after running supabase db reset, db push, etc.
 */
declare global {
  interface Window {
    __DEV_RESET_AUTH: () => Promise<void>
    __DEV_CLEAR_TOKENS: () => void
  }
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make development utilities available in browser console
  window.__DEV_RESET_AUTH = async () => {
    console.log('🔧 [DevUtils] Manual auth reset requested...')
    await clearAllAuthData()
    console.log('✅ [DevUtils] Auth reset complete, reloading...')
    window.location.reload()
  }
  
  window.__DEV_CLEAR_TOKENS = () => {
    console.log('🔧 [DevUtils] Clearing tokens only...')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-') || key.startsWith('supabase')) {
        localStorage.removeItem(key)
        console.log(`🧹 Cleared: ${key}`)
      }
    })
    console.log('✅ [DevUtils] Token cleanup complete')
  }
  
  console.log(`
🔧 Development Auth Utilities Available:

In browser console, you can run:
- __DEV_RESET_AUTH()    // Full reset + reload  
- __DEV_CLEAR_TOKENS()  // Clear tokens only

Or simply run:
localStorage.clear(); location.reload();
  `)
}

/**
 * Add this component to your development layout to show auth debug info
 */
export function DevAuthDebugger(): React.ReactElement | null {
  if (process.env.NODE_ENV === 'production') {
    return null
  }
  
  const debugInfo = {
    storageKeys: typeof window !== 'undefined' ? 
      Object.keys(window.localStorage).filter(k => k.startsWith('sb-') || k.startsWith('supabase')) : [],
    timestamp: new Date().toISOString()
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      fontFamily: 'monospace'
    }}>
      <div><strong>Auth Debug</strong></div>
      <div>Storage Keys: {debugInfo.storageKeys.length}</div>
      <div>
        <button 
          onClick={() => window.__DEV_RESET_AUTH?.()} 
          style={{ 
            background: '#ff4444', 
            color: 'white', 
            border: 'none', 
            padding: '4px 8px', 
            cursor: 'pointer',
            fontSize: '10px',
            marginTop: '5px'
          }}
        >
          Reset Auth
        </button>
      </div>
    </div>
  )
}

/**
 * Enhanced error boundary for development - automatically handles auth errors
 */
export class DevAuthErrorBoundary extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'DevAuthErrorBoundary'
    
    // In development, try to auto-recover from auth errors
    if (process.env.NODE_ENV === 'development' && originalError) {
      handleDevRefreshTokenError(originalError)
    }
  }
}