'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import Input from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, AlertCircle, RefreshCw, WifiOff } from 'lucide-react'
import Link from 'next/link'

interface LoginFormProps {
  redirectTo?: string
  showSignupLink?: boolean
  showForgotPassword?: boolean
}

const LoginForm = ({ 
  redirectTo = '/dashboard',
  showSignupLink = false,
  showForgotPassword = true
}: LoginFormProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  
  // Initialize auth hook first
  const { 
    signIn, 
    user,
    authState, 
    authError, 
    isError, 
    isRecoveringSession,
    clearAuthError,
    clearStaleSession,
    isAuthenticated,
    debugInfo 
  } = useAuth()
  const router = useRouter()

  // Determine loading state early
  const isLoading = authState === 'loading' || authState === 'recovering'
  
  // Add component mount logging and clear any existing auth state
  useEffect(() => {
    console.log('🔐 [LoginForm] Component mounted with auth state:', {
      authState,
      isError,
      isRecoveringSession,
      hasError: !!authError,
      userEmail: user?.email
    })
    
    // Clear any existing errors on mount to prevent interference
    if (authError) {
      console.log('🔐 [LoginForm] Clearing existing auth error on mount')
      clearAuthError()
    }
  }, [authState, isAuthenticated, isRecoveringSession, authError, isLoading, clearAuthError])

  // Handle successful authentication - ONLY redirect if user explicitly submitted form
  useEffect(() => {
    console.log('🔐 [LoginForm] Auth state changed:', { 
      isAuthenticated, 
      authState, 
      hasAuthError: !!authError,
      hasUserInteracted,
      hasUser: !!user
    })
    
    // Only redirect if:
    // 1. User is authenticated (has both user and profile)
    // 2. Auth state is 'authenticated' 
    // 3. User has actually interacted with the form (not auto-login)
    // 4. No auth errors
    if (isAuthenticated && authState === 'authenticated' && hasUserInteracted && !authError) {
      console.log('✅ Authentication successful, redirecting to:', redirectTo)
      router.push(redirectTo)
    } else if (isAuthenticated && authState === 'authenticated' && !hasUserInteracted) {
      console.log('🔐 [LoginForm] Auto-authentication detected - not redirecting without user interaction')
    } else if (authState === 'authenticated' && !isAuthenticated) {
      console.log('🔐 [LoginForm] Auth state is authenticated but isAuthenticated is false - session/profile issue')
    }
  }, [isAuthenticated, authState, redirectTo, router, authError, hasUserInteracted, user])

  // Clear local error when auth error is cleared
  useEffect(() => {
    if (!authError) {
      setLocalError(null)
    }
  }, [authError])

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🔐 [LoginForm] Form submitted!', { 
      email: email.substring(0, 3) + '***',
      hasPassword: !!password,
      authState,
      isLoading,
      hasUserInteracted
    });
    
    e.preventDefault()
    setLocalError(null)
    clearAuthError()

    // Prevent submission during loading states
    if (isLoading) {
      console.log('🔐 [LoginForm] Submission blocked - system is loading');
      return;
    }

    // Prevent submission if user hasn't interacted with form
    if (!hasUserInteracted) {
      console.log('🔐 [LoginForm] Submission blocked - user has not interacted with form');
      return;
    }

    // Basic validation
    if (!email.trim()) {
      setLocalError('Email is required')
      return
    }

    if (!password) {
      setLocalError('Password is required')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Please enter a valid email address')
      return
    }

    try {
      console.log('🔐 [LoginForm] Starting login process...')
      await signIn(email.trim().toLowerCase(), password)
      // Success handling is now done in useEffect above
    } catch (error: any) {
      console.error('Login error:', error)
      // The useAuth hook now handles error state, but we can still show custom messages
      // for better UX based on the error type
      if (error.message?.includes('Invalid login credentials')) {
        setLocalError('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        setLocalError('Please check your email and click the confirmation link.')
      } else if (error.message?.includes('Too many requests')) {
        setLocalError('Too many login attempts. Please wait a moment and try again.')
      } else if (error.message?.includes('deactivated')) {
        setLocalError('Your account has been deactivated. Please contact administrator.')
      }
      // For other errors, let the authError from useAuth handle it
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setLocalError('Please enter your email address first')
      return
    }

    try {
      // Reset password functionality not implemented yet
      setLocalError('Password reset is not available. Please contact administrator.')
    } catch (error: any) {
      setLocalError('Failed to send reset link. Please try again.')
    }
  }

  const handleRetry = async () => {
    clearAuthError()
    setLocalError(null)
    // Try to re-authenticate or refresh the page
    window.location.reload()
  }

  const handleClearError = () => {
    clearAuthError()
    setLocalError(null)
  }

  const handleClearSession = async () => {
    console.log('🔐 [LoginForm] Clearing stale session')
    try {
      await clearStaleSession()
      setLocalError(null)
    } catch (error) {
      console.error('Error clearing session:', error)
      setLocalError('Failed to clear session')
    }
  }

  // Determine current recovery state
  const isRecovering = authState === 'recovering'
  const hasError = isError || authError || localError
  const canRetry = authError && authError.retryCount < 3

  // Get appropriate error message
  const getErrorMessage = () => {
    if (localError) return localError
    if (authError) {
      switch (authError.code) {
        case 'AUTH_TIMEOUT':
          return 'Login timed out. Please try again.'
        case 'SIGNIN_ERROR':
        case 'SIGNIN_EXCEPTION':
          return authError.message || 'Authentication failed. Please try again.'
        case 'PROFILE_FETCH_ERROR':
          return 'Login successful but failed to load profile. Please refresh the page.'
        case 'SESSION_ERROR':
          return 'Session error. Please try signing in again.'
        default:
          return authError.message || 'An error occurred. Please try again.'
      }
    }
    return null
  }

  const errorMessage = getErrorMessage()

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Formula PM</CardTitle>
          <CardDescription>
            {false ? (
              <span className="flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                Recovering your session...
              </span>
            ) : (
              'Sign in to your account to continue'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setHasUserInteracted(true)
                }}
                disabled={isLoading || false}
                autoComplete="email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setHasUserInteracted(true)
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Enhanced error display with retry option */}
            {hasError && errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{errorMessage}</span>
                  {canRetry && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetry}
                      className="ml-2 h-6 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Recovery state indicator */}
            {false && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  Attempting to recover your session... Please wait.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !hasUserInteracted}
              onClick={() => setHasUserInteracted(true)}
            >
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {false ? 'Recovering Session...' : 
               isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Clear error button when there's an error */}
            {hasError && !isLoading && (
              <div className="space-y-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleClearError}
                >
                  Clear Error & Try Again
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleClearSession}
                >
                  Clear Session & Start Fresh
                </Button>
              </div>
            )}

            {showForgotPassword && (
              <div className="text-center">
                <Button 
                  type="button" 
                  variant="link" 
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                >
                  Forgot your password?
                </Button>
              </div>
            )}

            {showSignupLink && (
              <div className="text-center text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:underline">
                  Contact your administrator
                </Link>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Development helper */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-4 border-dashed">
          <CardHeader>
            <CardTitle className="text-sm">Development Helper</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>
              <strong>Test Accounts:</strong>
            </div>
            <div>Admin: owner.test@formulapm.com / password123</div>
            <div>PM: pm.test@formulapm.com / password123</div>
            <div>GM: gm.test@formulapm.com / password123</div>
            <div>Architect: architect.test@formulapm.com / password123</div>
            <div>Client: client.test@formulapm.com / password123</div>
            
            {/* Auth debug info */}
            <div className="mt-4 pt-2 border-t">
              <strong>Auth Debug Info:</strong>
            </div>
            <div>State: {authState}</div>
            <div>Recovery Attempts: {debugInfo.recoveryAttempts}</div>
            <div>Has Error: {debugInfo.hasError ? 'Yes' : 'No'}</div>
            {debugInfo.errorCode && <div>Error Code: {debugInfo.errorCode}</div>}
            <div>Is Recovering: {debugInfo.isRecovering ? 'Yes' : 'No'}</div>
            <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LoginForm
export { LoginForm }