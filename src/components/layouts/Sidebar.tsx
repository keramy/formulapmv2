'use client'

import { useAuth } from '@/hooks/useAuth'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { DataStateWrapper } from '@/components/ui/loading-states'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Briefcase,
  Settings,
  Building,
  X,
  CheckSquare,
  Target,
  Package,
  Layers,
  FileImage,
  FileText,
  Users,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles?: string[] // Optional role restriction
  badge?: string // Optional badge for new features
}

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export const Sidebar = ({ className, onClose }: SidebarProps = {}) => {
  const { profile } = useAuth()
  const pathname = usePathname()

  // Complete V3 navigation items - all implemented features
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: Briefcase
    },
    {
      id: 'scope',
      label: 'Scope Management',
      href: '/scope',
      icon: Layers,
      badge: 'Enhanced'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['project_manager', 'company_owner']
    },
    {
      id: 'milestones',
      label: 'Milestones',
      href: '/milestones',
      icon: Target,
      roles: ['project_manager', 'company_owner']
    },
    {
      id: 'material-specs',
      label: 'Material Specs',
      href: '/material-specs',
      icon: Package,
      roles: ['project_manager', 'company_owner', 'architect']
    },
    {
      id: 'shop-drawings',
      label: 'Shop Drawings',
      href: '/shop-drawings',
      icon: FileImage,
      badge: 'New'
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: FileText,
      badge: 'New'
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      href: '/suppliers',
      icon: Building
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ]

  // Filter navigation items based on user role
  const getFilteredNavigation = () => {
    if (!profile) return navigationItems
    
    return navigationItems.filter(item => {
      // If no role restriction, show to everyone
      if (!item.roles) return true
      
      // Check if user's role is in the allowed roles
      return item.roles.includes(profile.role)
    })
  }

  const filteredNavigation = getFilteredNavigation()

  return (
    <aside className={cn("fixed left-0 top-0 h-full w-64 bg-gray-900 text-white", className)}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-sm">FP</span>
            </div>
            <span className="text-lg font-semibold">Formula PM</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      item.badge === 'New' 
                        ? "bg-green-600 text-white" 
                        : "bg-blue-600 text-white"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-300">
                {profile?.first_name?.[0] || 'U'}{profile?.last_name?.[0] || ''}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {profile?.role?.replace(/_/g, ' ') || 'Loading...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

/**
 * Enhanced Sidebar with DataStateWrapper integration
 * This provides consistent loading states for navigation and user profile
 */
export const SidebarEnhanced = ({ className, onClose }: SidebarProps = {}) => {
  const { profile } = useAuth()
  const pathname = usePathname()

  // Complete V3 navigation items - all implemented features
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: Briefcase
    },
    {
      id: 'scope',
      label: 'Scope Management',
      href: '/scope',
      icon: Layers,
      badge: 'Enhanced'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      roles: ['project_manager', 'company_owner']
    },
    {
      id: 'milestones',
      label: 'Milestones',
      href: '/milestones',
      icon: Target,
      roles: ['project_manager', 'company_owner']
    },
    {
      id: 'material-specs',
      label: 'Material Specs',
      href: '/material-specs',
      icon: Package,
      roles: ['project_manager', 'company_owner', 'architect']
    },
    {
      id: 'shop-drawings',
      label: 'Shop Drawings',
      href: '/shop-drawings',
      icon: FileImage,
      badge: 'New'
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: FileText,
      badge: 'New'
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      href: '/suppliers',
      icon: Building
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ]

  // Filter navigation items based on user role
  const getFilteredNavigation = () => {
    if (!profile) return navigationItems
    
    return navigationItems.filter(item => {
      // If no role restriction, show to everyone
      if (!item.roles) return true
      
      // Check if user's role is in the allowed roles
      return item.roles.includes(profile.role)
    })
  }

  const filteredNavigation = getFilteredNavigation()

  return (
    <DataStateWrapper
      loading={!profile}
      error={null}
      data={profile}
      emptyComponent={
        <aside className={cn('w-64 bg-gray-900 text-white flex flex-col', className)}>
          <div className="p-4">
            <div className="text-center text-muted-foreground">
              Loading navigation...
            </div>
          </div>
        </aside>
      }
    >
      <aside className={cn('w-64 bg-gray-900 text-white flex flex-col', className)}>
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Formula PM</h2>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-gray-700 lg:hidden"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    )}
                  >
                    <div className="flex items-center">
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        item.badge === 'New' 
                          ? "bg-green-600 text-white" 
                          : "bg-blue-600 text-white"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {profile?.first_name?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile ? `${profile.first_name} ${profile.last_name}` : 'User'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {profile?.role?.replace(/_/g, ' ') || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </DataStateWrapper>
  )
}