'use client'

import { Sidebar } from '@/components/layouts/Sidebar'
import { Header } from '@/components/layouts/Header'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, WifiOff, RefreshCw } from 'lucide-react'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { FeatureErrorBoundary, ComponentErrorBoundary } from '@/components/ErrorBoundary'
import { Toaster } from '@/components/ui/toaster'

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Always call useAuth hook to avoid conditional hook calls
  const { 
    user, 
    authState, 
    authError, 
    isError, 
    isRecoveringSession,
    isAuthenticated,
    clearAuthError,
    signOut,
    debugInfo 
  } = useAuth()

  // List of paths that should not show the sidebar/header
  const noLayoutPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password']
  const isNoLayoutPath = noLayoutPaths.includes(pathname)

  // Handle authentication redirection for protected routes
  useEffect(() => {
    // Only redirect if we're on a protected route, not authenticated, and auth is stable (not loading)
    const shouldRedirect = !isNoLayoutPath && !isAuthenticated && authState === 'idle' && !user
    
    if (shouldRedirect) {
      console.log('🔐 [LayoutWrapper] Redirecting to login from protected route:', {
        pathname,
        authState,
        isAuthenticated,
        hasUser: !!user
      })
      router.push('/auth/login')
    }
  }, [isNoLayoutPath, isAuthenticated, authState, pathname, router, user])

  // If on a no-layout path, render children directly without auth loading
  if (isNoLayoutPath) {
    return <>{children}</>
  }

  // Show loading state for auth operations
  if (authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your session...</p>
        </div>
      </div>
    )
  }

  // Show recovery state
  if (isRecoveringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <WifiOff className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Recovering Session</CardTitle>
            <CardDescription>
              We're attempting to recover your session. Please wait...
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Attempt {debugInfo?.recoveryAttempts || 0} of 3
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error state with recovery options
  if (isError && authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>
              There was a problem with your session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {authError || 'An authentication error occurred'}
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  clearAuthError()
                  router.push('/auth/login')
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => {
                  clearAuthError()
                  router.push('/auth/login')
                }}
              >
                Sign In Again
              </Button>
            </div>
            
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={async () => {
                await signOut()
                router.push('/auth/login')
              }}
            >
              Sign Out & Retry
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-muted rounded text-xs">
                <div><strong>Debug Info:</strong></div>
                <div>State: {authState}</div>
                <div>Error: {authError}</div>
                <div>Recovery Attempts: {debugInfo?.recoveryAttempts}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not authenticated and on a protected path, render children (might be login redirect)
  if (!user || !isAuthenticated) {
    return <>{children}</>
  }

  return (
    <FeatureErrorBoundary featureName="Application Layout">
      <RealtimeProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Mobile sidebar backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <ComponentErrorBoundary componentName="Sidebar">
            <Sidebar 
              className={cn(
                "z-50 transition-transform duration-300 ease-in-out",
                "lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
              )}
              onClose={() => setSidebarOpen(false)}
            />
          </ComponentErrorBoundary>
          
          {/* Main content */}
          <main className="flex-1 flex flex-col overflow-y-auto lg:ml-64">
            <ComponentErrorBoundary componentName="Header">
              <Header onMenuClick={() => setSidebarOpen(true)} />
            </ComponentErrorBoundary>
            <div className="p-4 lg:p-6 flex-1">
              <FeatureErrorBoundary featureName="Page Content">
                {children}
              </FeatureErrorBoundary>
            </div>
          </main>
        </div>
        <Toaster />
      </RealtimeProvider>
    </FeatureErrorBoundary>
  )
}

/**
 * Enhanced LayoutWrapper using DataStateWrapper pattern (claude.md aligned)
 * Following the proven UI component optimization pattern from claude.md
 */
export const LayoutWrapperEnhanced = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const {
    user,
    authState,
    authError,
    isError,
    isRecoveringSession,
    isAuthenticated,
    clearAuthError,
    signOut,
    debugInfo
  } = useAuth()

  // Check if current path should not have layout
  const isNoLayoutPath = pathname?.startsWith('/auth/') || pathname === '/login' || pathname === '/register'

  // Handle authentication redirection for protected routes
  useEffect(() => {
    // Only redirect if we're on a protected route, not authenticated, and auth is stable (not loading)
    const shouldRedirect = !isNoLayoutPath && !isAuthenticated && authState === 'idle' && !user

    if (shouldRedirect) {
      console.log('🔐 [LayoutWrapper] Redirecting to login - not authenticated')
      router.push('/auth/login')
    }
  }, [isNoLayoutPath, isAuthenticated, authState, pathname, router, user])

  // If on a no-layout path, render children directly without auth loading
  if (isNoLayoutPath) {
    return <>{children}</>
  }

  return (
    <DataStateWrapper
      loading={authState === 'loading'}
      error={isError && authError ? authError : null}
      data={isAuthenticated ? user : null}
      onRetry={() => {
        clearAuthError()
        router.push('/auth/login')
      }}
      loadingComponent={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading your session...</p>
          </div>
        </div>
      }
      errorComponent={
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <CardTitle>Authentication Error</CardTitle>
              <CardDescription>
                There was a problem with your session
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {authError || 'An authentication error occurred'}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearAuthError()
                    router.push('/auth/login')
                  }}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    clearAuthError()
                    router.push('/auth/login')
                  }}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>

              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' && debugInfo && (
                <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                  <div><strong>Debug Info:</strong></div>
                  <div>State: {authState}</div>
                  <div>Error: {authError}</div>
                  <div>Recovery Attempts: {debugInfo?.recoveryAttempts}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      }
      emptyComponent={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <WifiOff className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Please log in to continue</p>
          </div>
        </div>
      }
    >
      <FeatureErrorBoundary featureName="Enhanced Application Layout">
        <RealtimeProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <ComponentErrorBoundary componentName="Enhanced Sidebar">
              <Sidebar
                className={cn(
                  "z-50 transition-transform duration-300 ease-in-out",
                  "lg:translate-x-0",
                  sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
                onClose={() => setSidebarOpen(false)}
              />
            </ComponentErrorBoundary>

            {/* Main content */}
            <main className="flex-1 flex flex-col overflow-y-auto lg:ml-64">
              <ComponentErrorBoundary componentName="Enhanced Header">
                <Header onMenuClick={() => setSidebarOpen(true)} />
              </ComponentErrorBoundary>
              <div className="p-4 lg:p-6 flex-1">
                <FeatureErrorBoundary featureName="Enhanced Page Content">
                  {children}
                </FeatureErrorBoundary>
              </div>
            </main>
          </div>
          <Toaster />
        </RealtimeProvider>
      </FeatureErrorBoundary>
    </DataStateWrapper>
  )
}