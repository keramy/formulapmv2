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
        <Sidebar 
          className={cn(
            "z-50 transition-transform duration-300 ease-in-out",
            "lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-y-auto lg:ml-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="p-4 lg:p-6 flex-1">
            {children}
          </div>
        </main>
      </div>
    </RealtimeProvider>
  )
}