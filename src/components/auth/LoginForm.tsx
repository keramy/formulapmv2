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
import { projectSchemas, validateData } from '@/lib/form-validation'

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
    isUserInitiated,
    sessionState,
    debugInfo 
  } = useAuth()
  const router = useRouter()

  // Simplified loading state management
  const isLoading = authState === 'loading'
  const isRecovering = authState === 'recovering'
  
  // Simplified component initialization
  useEffect(() => {
    console.log('🔐 [LoginForm] Component mounted with auth state:', {
      authState,
      isAuthenticated,
      userEmail: user?.email
    })
    
    // Clear any existing errors on mount
    if (authError) {
      clearAuthError()
    }
  }, [])

  // Simplified authentication success handling
  useEffect(() => {
    // Redirect on successful authentication if user interacted with form
    if (isAuthenticated && authState === 'authenticated' && hasUserInteracted && !authError) {
      console.log('✅ Authentication successful, redirecting to:', redirectTo)
      router.push(redirectTo)
    }
  }, [isAuthenticated, authState, redirectTo, router, authError, hasUserInteracted])

  // Clear local error when auth error is cleared
  useEffect(() => {
    if (!authError) {
      setLocalError(null)
    }
  }, [authError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    clearAuthError()

    // Prevent submission during loading states
    if (isLoading || isRecovering) {
      return
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
      // Success handling is done in useEffect
    } catch (error: any) {
      console.error('Login error:', error)
      // Enhanced error messages for better UX
      if (error.message?.includes('Invalid login credentials')) {
        setLocalError('Invalid email or password. Please try again.')
      } else if (error.message?.includes('Email not confirmed')) {
        setLocalError('Please check your email and click the confirmation link.')
      } else if (error.message?.includes('Too many requests')) {
        setLocalError('Too many login attempts. Please wait a moment and try again.')
      } else if (error.message?.includes('deactivated')) {
        setLocalError('Your account has been deactivated. Please contact administrator.')
      }
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
      setHasUserInteracted(false)
    } catch (error) {
      console.error('Error clearing session:', error)
      setLocalError('Failed to clear session')
    }
  }

  const handleContinueWithExistingSession = () => {
    console.log('🔐 [LoginForm] User chose to continue with existing session')
    setHasUserInteracted(true)
    // This will trigger the redirect in the useEffect
  }

  const handleLogoutAndLoginFresh = async () => {
    console.log('🔐 [LoginForm] User chose to logout and login fresh')
    try {
      await clearStaleSession()
      setHasUserInteracted(false)
      setLocalError(null)
      // Clear form fields
      setEmail('')
      setPassword('')
    } catch (error) {
      console.error('Error logging out:', error)
      setLocalError('Failed to logout')
    }
  }

  // Simplified error handling
  const hasError = isError || authError || localError
  const canRetry = authError // Simplified retry logic

  // Get appropriate error message
  const getErrorMessage = () => {
    if (localError) return localError
    if (authError) {
      // authError is now a simple string
      if (authError.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please try again.'
      } else if (authError.includes('Email not confirmed')) {
        return 'Please check your email and click the confirmation link.'
      } else if (authError.includes('Too many requests')) {
        return 'Too many login attempts. Please wait a moment and try again.'
      } else if (authError.includes('deactivated')) {
        return 'Your account has been deactivated. Please contact administrator.'
      } else {
        return authError || 'An error occurred. Please try again.'
      }
    }
    return null
  }

  const errorMessage = getErrorMessage()

  // Show "Already logged in" state if authenticated but user hasn't chosen to proceed
  const showAlreadyLoggedIn = isAuthenticated && authState === 'authenticated' && !hasUserInteracted && !isRecovering

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Formula PM</CardTitle>
          <CardDescription>
            {isRecovering ? (
              <span className="flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4 text-muted-foreground" />
                Loading...
              </span>
            ) : showAlreadyLoggedIn ? (
              <span className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                You are already signed in
              </span>
            ) : (
              'Sign in to your account to continue'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showAlreadyLoggedIn ? (
            // Already logged in state
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You are already signed in as <strong>{user?.email}</strong>.
                  Choose an option below to continue.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={handleContinueWithExistingSession}
                >
                  Continue to Dashboard
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleLogoutAndLoginFresh}
                >
                  Switch Account
                </Button>
              </div>
            </div>
          ) : (
            // Normal login form
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
                disabled={isLoading}
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
            {isRecovering && (
              <Alert>
                <WifiOff className="h-4 w-4" />
                <AlertDescription>
                  Loading... Please wait.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isRecovering}
              onClick={() => setHasUserInteracted(true)}
            >
              {(isLoading || isRecovering) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isRecovering ? 'Loading...' : 
               isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            {/* Session management controls */}
            {(hasError || isRecovering) && !isLoading && (
              <div className="space-y-2">
                {hasError && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    onClick={handleClearError}
                  >
                    Clear Error & Try Again
                  </Button>
                )}
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={handleClearSession}
                >
                  Clear Stored Session
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
          )}
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
            <div>Auth State: {authState}</div>
            <div>Session State: {sessionState}</div>
            <div>User Initiated: {isUserInitiated ? 'Yes' : 'No'}</div>
            <div>Show Already Logged In: {showAlreadyLoggedIn ? 'Yes' : 'No'}</div>
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