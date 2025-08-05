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
import { Loader2, AlertCircle } from 'lucide-react'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { DevErrorSuppressor } from '@/components/DevErrorSuppressor'

export const LayoutWrapper = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // Always call useAuth hook to avoid conditional hook calls
  const { 
    user, 
    loading,
    authError, 
    isAuthenticated,
    signOut
  } = useAuth()

  // List of paths that should not show the sidebar/header
  const noLayoutPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password']
  const isNoLayoutPath = noLayoutPaths.includes(pathname)

  // Simplified client-side redirect logic
  useEffect(() => {
    // Don't redirect while loading
    if (loading) return
    
    // Redirect unauthenticated users away from protected pages
    const shouldRedirectToLogin = !isNoLayoutPath && !isAuthenticated && !user
    if (shouldRedirectToLogin) {
      console.log('🔐 [LayoutWrapper] Redirecting to login - user not authenticated')
      router.push('/auth/login')
      return
    }
    
    // Redirect authenticated users away from auth pages
    const isAuthPage = pathname.startsWith('/auth/')
    const shouldRedirectToDashboard = isAuthPage && isAuthenticated && user
    if (shouldRedirectToDashboard) {
      console.log('🔐 [LayoutWrapper] Redirecting to dashboard - user already authenticated')
      router.push('/dashboard')
    }
  }, [isNoLayoutPath, isAuthenticated, pathname, router, user, loading])

  // If on a no-layout path, render children directly without auth loading
  if (isNoLayoutPath) {
    return <>{children}</>
  }

  // Simplified loading state - only 2 states: loading or authenticated
  if (loading || (!isAuthenticated && !authError)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show error state if authentication failed
  if (authError) {
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
                {authError}
              </AlertDescription>
            </Alert>
            
            <Button 
              className="w-full"
              onClick={() => router.push('/auth/login')}
            >
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If not authenticated, redirect (this should not happen with proper redirect logic)
  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <RealtimeProvider>
      <DevErrorSuppressor />
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