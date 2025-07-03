/**
 * Client Portal Navigation Component
 * Mobile-first responsive navigation for external client portal
 * Includes sidebar and mobile menu with role-based access
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  LayoutDashboard, 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  Bell,
  LogOut,
  Menu,
  X,
  Settings,
  User,
  HelpCircle,
  Building,
  Phone,
  Mail
} from 'lucide-react'
import { useClientAuth, useClientNotifications } from '@/hooks/useClientPortal'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface ClientPortalNavigationProps {
  user: any
}

export const ClientPortalNavigation: React.FC<ClientPortalNavigationProps> = ({
  user
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const { logout } = useClientAuth()
  const { unreadCount } = useClientNotifications()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Navigation items
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/client-portal',
      icon: LayoutDashboard,
      description: 'Overview and quick actions',
      exact: true
    },
    {
      name: 'Projects',
      href: '/client-portal/projects',
      icon: FolderOpen,
      description: 'View project details and progress'
    },
    {
      name: 'Documents',
      href: '/client-portal/documents',
      icon: FileText,
      description: 'Review and approve documents'
    },
    {
      name: 'Communications',
      href: '/client-portal/communications',
      icon: MessageSquare,
      description: 'Messages and team communication'
    },
    {
      name: 'Notifications',
      href: '/client-portal/notifications',
      icon: Bell,
      description: 'Updates and alerts',
      badge: unreadCount > 0 ? unreadCount : undefined
    }
  ]

  // Check if route is active
  const isActiveRoute = useCallback((href: string, exact = false) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }, [pathname])

  // Handle logout
  const handleLogout = useCallback(async () => {
    await logout()
    router.push('/client-portal/login')
  }, [logout, router])

  // Close mobile menu
  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false)
  }, [])

  // Navigation content component
  const NavigationContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Building className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">Client Portal</h1>
          <p className="text-sm text-gray-600">{user?.company_name || 'Formula PM'}</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = isActiveRoute(item.href, item.exact)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={mobile ? closeMobileMenu : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="destructive" className="text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto p-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar_url} alt={user?.email} />
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name || user?.email}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {user?.access_level || 'Client'}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/client-portal/profile" onClick={mobile ? closeMobileMenu : undefined}>
                <User className="w-4 h-4 mr-2" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/client-portal/preferences" onClick={mobile ? closeMobileMenu : undefined}>
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/client-portal/help" onClick={mobile ? closeMobileMenu : undefined}>
                <HelpCircle className="w-4 h-4 mr-2" />
                Help & Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Phone className="w-4 h-4 mr-2" />
              Contact Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r">
          <NavigationContent />
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm lg:hidden">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="-ml-2">
              <Menu className="w-6 h-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavigationContent mobile />
          </SheetContent>
        </Sheet>

        {/* Mobile Header Content */}
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Building className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-gray-900">Client Portal</h1>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications Badge */}
            <Link href="/client-portal/notifications">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Avatar */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user?.avatar_url} alt={user?.email} />
                    <AvatarFallback>
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium text-gray-900 truncate">
                    {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.company_name}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client-portal/profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/client-portal/preferences">
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/client-portal/help">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Mail className="w-4 h-4 mr-2" />
                  Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </>
  )
}