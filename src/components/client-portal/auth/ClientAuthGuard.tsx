/**
 * Client Portal Auth Guard Component
 * Protects client portal routes and handles authentication state
 * Mobile-optimized authentication flow
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClientAuth } from '@/hooks/useClientPortal'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Shield, AlertCircle } from 'lucide-react'
import { ClientLoginForm } from './ClientLoginForm'

interface ClientAuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
  fallback?: React.ReactNode
  companyBranding?: {
    logo_url?: string
    brand_colors?: Record<string, string>
    company_name?: string
  }
}

export const ClientAuthGuard: React.FC<ClientAuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/client-portal/login',
  fallback,
  companyBranding
}) => {
  const router = useRouter()
  const { user, isAuthenticated, loading, error, checkAuth } = useClientAuth()
  const [initialCheckComplete, setInitialCheckComplete] = useState(false)

  // Perform initial auth check
  useEffect(() => {
    const performInitialCheck = async () => {
      try {
        await checkAuth()
      } finally {
        setInitialCheckComplete(true)
      }
    }

    if (!initialCheckComplete) {
      performInitialCheck()
    }
  }, [checkAuth, initialCheckComplete])

  // Handle authentication redirects
  useEffect(() => {
    if (initialCheckComplete && requireAuth && !isAuthenticated && !loading) {
      router.push(redirectTo)
    }
  }, [initialCheckComplete, requireAuth, isAuthenticated, loading, router, redirectTo])

  // Show loading during initial auth check
  if (!initialCheckComplete || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm text-gray-600">Checking authentication...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if auth check failed
  if (error && initialCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="py-8 space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-red-800">
                Authentication service is currently unavailable. Please try again later.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <button
                onClick={() => window.location.reload()}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Retry
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show login form if authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <ClientLoginForm
        companyBranding={companyBranding}
        onLoginSuccess={() => {
          // Refresh the page or navigate to dashboard
          window.location.href = '/client-portal'
        }}
      />
    )
  }

  // Show children if authenticated or authentication not required
  return <>{children}</>
}