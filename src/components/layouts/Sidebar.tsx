'use client'

import { useAuth } from '@/hooks/useAuth'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Briefcase,
  Settings,
  Building,
  X,
  FileText,
  CheckSquare,
  Target,
  FileImage,
  Package,
  ClipboardList,
  Users,
  Bell,
  Globe,
  FileSearch
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface SidebarProps {
  className?: string
  onClose?: () => void
}

export const Sidebar = ({ className, onClose }: SidebarProps = {}) => {
  const { profile } = useAuth()
  const pathname = usePathname()

  // Navigation items based on V3 P1 features with existing APIs
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
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: CheckSquare
    },
    {
      id: 'milestones',
      label: 'Milestones',
      href: '/milestones',
      icon: Target
    },
    {
      id: 'scope',
      label: 'Scope Management',
      href: '/scope',
      icon: FileText
    },
    {
      id: 'shop-drawings',
      label: 'Shop Drawings',
      href: '/shop-drawings',
      icon: FileImage
    },
    {
      id: 'material-specs',
      label: 'Material Approvals',
      href: '/material-specs',
      icon: Package
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: ClipboardList
    },
    {
      id: 'suppliers',
      label: 'Suppliers',
      href: '/suppliers',
      icon: Building
    },
    {
      id: 'users',
      label: 'User Management',
      href: '/users',
      icon: Users
    },
    {
      id: 'client-portal',
      label: 'Client Portal',
      href: '/client-portal',
      icon: Globe
    },
    {
      id: 'settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings
    }
  ]

  // Filter navigation items based on user role
  const filteredNavigationItems = navigationItems.filter(item => {
    // Everyone can see dashboard and settings
    if (['dashboard', 'settings'].includes(item.id)) return true
    
    // Admin can see everything
    if (profile?.role === 'admin') return true
    
    // Role-based access for V3 features
    switch (item.id) {
      case 'projects':
      case 'tasks':
      case 'milestones':
      case 'scope':
      case 'shop-drawings':
      case 'material-specs':
      case 'reports':
        return ['management', 'project_manager', 'technical_lead'].includes(profile?.role || '')
      case 'suppliers':
        return ['management', 'purchase_manager', 'project_manager'].includes(profile?.role || '')
      case 'users':
        return ['management'].includes(profile?.role || '')
      case 'client-portal':
        return ['management', 'client'].includes(profile?.role || '')
      default:
        return false
    }
  })

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
            {filteredNavigationItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-gray-800 text-white" 
                      : "text-gray-300 hover:text-white hover:bg-gray-800/50"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
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