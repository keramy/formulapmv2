/**
 * Client Portal Login Page
 * Standalone login page for external clients
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ClientLoginForm } from '@/components/client-portal/auth/ClientLoginForm'
import { useClientAuth } from '@/hooks/useClientPortal'

export default function ClientPortalLoginPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useClientAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !loading) {
      router.push('/client-portal')
    }
  }, [isAuthenticated, loading, router])

  // Handle successful login
  const handleLoginSuccess = () => {
    router.push('/client-portal')
  }

  // Handle password reset
  const handleForgotPassword = (email: string, companyCode?: string) => {
    // You could show a success message or redirect to a confirmation page
    console.log('Password reset initiated for:', email, companyCode)
  }

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Don't show login form if already authenticated
  if (isAuthenticated) {
    return null
  }

  return (
    <ClientLoginForm
      onLoginSuccess={handleLoginSuccess}
      onForgotPassword={handleForgotPassword}
      mobileOptimized={true}
      companyBranding={{
        company_name: 'Formula PM',
        brand_colors: {
          primary: '#2563eb',
          background: '#ffffff'
        }
      }}
    />
  )
}