'use client'

import { useEffect } from 'react'

/**
 * Development Error Suppressor Component
 * Suppresses console spam from auth errors during development
 */
export function DevErrorSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    
    // Store original console methods
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    
    // Pattern to match refresh token errors
    const refreshTokenErrorPatterns = [
      'Invalid Refresh Token',
      'Refresh Token Not Found',
      'AuthApiError',
      'refresh_token_not_found'
    ]
    
    // Check if error message contains refresh token issues
    function isRefreshTokenError(...args: any[]): boolean {
      const message = args.join(' ')
      return refreshTokenErrorPatterns.some(pattern => 
        message.includes(pattern)
      )
    }
    
    // Override console.error to suppress auth errors
    console.error = (...args: any[]) => {
      if (isRefreshTokenError(...args)) {
        // Show a single suppressed message instead of spam
        if (!(window as any).__authErrorSuppressed) {
          console.log('🔇 [DevMode] Suppressing refresh token errors (expected during development)')
          ;(window as any).__authErrorSuppressed = true
        }
        return
      }
      
      // Call original console.error for other errors
      originalConsoleError.apply(console, args)
    }
    
    // Override console.warn for auth warnings
    console.warn = (...args: any[]) => {
      if (isRefreshTokenError(...args)) {
        return // Suppress auth warnings too
      }
      
      originalConsoleWarn.apply(console, args)
    }
    
    // Restore original console methods when component unmounts
    return () => {
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
    }
  }, [])
  
  return null // This component doesn't render anything
}