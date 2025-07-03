/**
 * Client Portal Mobile Navigation Component
 * Mobile-optimized bottom navigation for external client portal
 * Integrates with Formula PM mobile navigation patterns while maintaining security isolation
 */

'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Bell,
  Menu,
  User,
  HelpCircle,
  LogOut,
  Settings,
  Building
} from 'lucide-react'
import { useClientAuth, useClientNotifications } from '@/hooks/useClientPortal'

interface ClientMobileNavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
  exact?: boolean
}

export const ClientPortalMobileNav = () => {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useClientAuth()
  const { unreadCount } = useClientNotifications()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Primary navigation items for bottom bar
  const primaryItems: ClientMobileNavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      href: '/client-portal',
      icon: LayoutDashboard,
      exact: true
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/client-portal/projects',
      icon: FolderOpen
    },
    {
      id: 'documents',
      label: 'Documents',
      href: '/client-portal/documents',
      icon: FileText
    },
    {
      id: 'messages',
      label: 'Messages',
      href: '/client-portal/communications',
      icon: MessageSquare
    }
  ]

  // Secondary items for overflow menu
  const secondaryItems: ClientMobileNavItem[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      href: '/client-portal/notifications',
      icon: Bell,
      badge: unreadCount
    },
    {
      id: 'profile',
      label: 'Profile',
      href: '/client-portal/profile',
      icon: User
    },
    {
      id: 'preferences',
      label: 'Preferences',
      href: '/client-portal/preferences',
      icon: Settings
    },
    {
      id: 'help',
      label: 'Help & Support',
      href: '/client-portal/help',
      icon: HelpCircle
    }
  ]

  // Check if route is active
  const isActiveRoute = (href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  // Handle logout
  const handleLogout = async () => {
    await logout()
    router.push('/client-portal/login')
    setIsMenuOpen(false)
  }

  // Close menu
  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t border-gray-200 lg:hidden z-50 safe-area-pb">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Primary navigation items */}
          {primaryItems.map((item) => {
            const isActive = isActiveRoute(item.href, item.exact)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] max-w-[80px] relative",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </Link>
            )
          })}

          {/* More menu */}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-[60px] max-w-[80px] h-auto text-gray-600 hover:text-gray-900 hover:bg-gray-50 relative"
              >
                <Menu className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">More</span>
                
                {/* Notification indicator */}
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-auto rounded-t-xl">
              <div className="py-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {user?.name || user?.email}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {user?.company_name}
                    </p>
                  </div>
                </div>

                {/* Secondary navigation items */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {secondaryItems.map((item) => {
                    const isActive = isActiveRoute(item.href)
                    
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={closeMenu}
                        className={cn(
                          "flex items-center gap-3 py-3 px-4 rounded-lg transition-all duration-200 relative",
                          isActive
                            ? "text-blue-600 bg-blue-50"
                            : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        )}
                      >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium flex-1">
                          {item.label}
                        </span>
                        
                        {/* Badge for notifications */}
                        {item.badge && item.badge > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="text-xs"
                          >
                            {item.badge > 99 ? '99+' : item.badge}
                          </Badge>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 pt-4">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Safe area padding for content */}
      <div className="h-16 lg:hidden" />
    </>
  )
}

/**
 * Client Portal Mobile Header
 * Companion component for mobile header when needed
 */
export const ClientPortalMobileHeader = () => {
  const { user } = useClientAuth()
  const { unreadCount } = useClientNotifications()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
      {/* Logo/Title */}
      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
          <Building className="w-4 h-4 text-white" />
        </div>
        <h1 className="font-semibold text-gray-900">Client Portal</h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Link href="/client-portal/notifications">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center text-xs p-0"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </Link>

        {/* Profile Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-72">
            <div className="py-4">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-6 pb-4 border-b">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    {user?.company_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.access_level || 'Client'}
                  </p>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-2">
                <Link 
                  href="/client-portal/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </Link>
                
                <Link 
                  href="/client-portal/preferences"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Preferences
                </Link>
                
                <Link 
                  href="/client-portal/help"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  <HelpCircle className="w-4 h-4" />
                  Help & Support
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}