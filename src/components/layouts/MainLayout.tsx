'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useResponsive } from '@/hooks/useResponsive'
import { GlobalSidebar } from '@/components/navigation/GlobalSidebar'
import { MobileBottomNav } from '@/components/navigation/MobileBottomNav'
import { UserProfileHeader } from '@/components/navigation/UserProfileHeader'
import { cn, getRoleColorClass } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
  className?: string
}

export const MainLayout = ({ children, className }: MainLayoutProps) => {
  const { profile, loading } = useAuth()
  const { isManagement } = usePermissions()
  const { isMobile } = useResponsive()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please sign in to continue</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-background",
      getRoleColorClass(profile.role),
      "border-l-4",
      className
    )}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-40">
        <div className="container-mobile flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-sm">FP</span>
              </div>
              <div>
                <h1 className="text-xl font-bold md:text-2xl">Formula PM 2.0</h1>
                {!isMobile && (
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Construction Project Management
                  </p>
                )}
              </div>
            </div>
            
            {!isMobile && (
              <div className="hidden md:block">
                <span className={cn(
                  "px-2 py-1 text-xs font-medium rounded-full",
                  isManagement() ? "bg-management/10 text-management border border-management/20" : "bg-muted text-muted-foreground"
                )}>
                  {profile.role.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <UserProfileHeader />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        {!isMobile && (
          <aside className="w-64 border-r bg-card/30 min-h-[calc(100vh-4rem)] sticky top-16">
            <GlobalSidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className={cn(
            "p-4 pb-20", // Extra bottom padding for mobile nav
            !isMobile && "p-6 pb-6"
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  )
}