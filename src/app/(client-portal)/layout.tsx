/**
 * Client Portal Layout
 * Layout wrapper for external client portal pages
 * Includes authentication, session management, and mobile navigation
 */

'use client'

import { ClientAuthGuard } from '@/components/client-portal/auth/ClientAuthGuard'
import { ClientSessionManager } from '@/components/client-portal/auth/ClientSessionManager'
import { ClientPortalNavigation } from '@/components/client-portal/navigation/ClientPortalNavigation'
import { ClientPortalMobileNav, ClientPortalMobileHeader } from '@/components/client-portal/navigation/ClientPortalMobileNav'
import { useClientAuth } from '@/hooks/useClientPortal'

interface ClientPortalLayoutProps {
  children: React.ReactNode
}

export default function ClientPortalLayout({ children }: ClientPortalLayoutProps) {
  const { user } = useClientAuth()

  return (
    <ClientAuthGuard requireAuth={true}>
      <ClientSessionManager>
        <div className="min-h-screen bg-gray-50">
          {/* Desktop Navigation */}
          <ClientPortalNavigation user={user} />
          
          {/* Mobile Header */}
          <ClientPortalMobileHeader />
          
          {/* Main Content */}
          <main className="lg:pl-64 pb-16 lg:pb-0">
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
          
          {/* Mobile Bottom Navigation */}
          <ClientPortalMobileNav />
        </div>
      </ClientSessionManager>
    </ClientAuthGuard>
  )
}