/**
 * Development Error Suppression for Auth Issues
 * Suppresses console errors related to refresh token issues during development
 */

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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
  function isRefreshTokenError(message: string): boolean {
    return refreshTokenErrorPatterns.some(pattern => 
      message.includes(pattern)
    )
  }
  
  // Override console.error to suppress auth errors
  console.error = (...args: any[]) => {
    const message = args.join(' ')
    
    // If it's a refresh token error, suppress it in development
    if (isRefreshTokenError(message)) {
      // Optional: Show a single suppressed message instead of spam
      if (!window.__authErrorSuppressed) {
        console.log('🔇 [DevMode] Suppressing refresh token errors (expected during development)')
        window.__authErrorSuppressed = true
      }
      return
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args)
  }
  
  // Override console.warn for auth warnings
  console.warn = (...args: any[]) => {
    const message = args.join(' ')
    
    if (isRefreshTokenError(message)) {
      return // Suppress auth warnings too
    }
    
    originalConsoleWarn.apply(console, args)
  }
  
  // Restore original console methods when needed
  ;(window as any).__restoreConsole = () => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
    console.log('✅ Console methods restored')
  }
  
  // Handle unhandled promise rejections for auth errors
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && isRefreshTokenError(event.reason.toString())) {
      console.log('🔇 [DevMode] Suppressed unhandled auth promise rejection')
      event.preventDefault() // Prevent the error from being logged
    }
  })
  
  console.log('🔇 [DevMode] Auth error suppression active. Run __restoreConsole() to restore normal logging.')
}

// Add global type declaration
declare global {
  interface Window {
    __authErrorSuppressed?: boolean
    __restoreConsole?: () => void
  }
}