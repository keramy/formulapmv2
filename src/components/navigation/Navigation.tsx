'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Home, 
  FolderOpen, 
  Users, 
  FileText, 
  Settings, 
  ShoppingCart,
  Hammer,
  PenTool,
  CheckSquare,
  DollarSign,
  Building,
  LogOut,
  User
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  requiresPermission?: () => boolean
  requiresRole?: string[]
}

export const Navigation = () => {
  const { profile, signOut } = useAuth()
  const { 
    canViewDashboard,
    canCreateProject,
    canViewTasks,
    canViewScope,
    canViewShopDrawings,
    canViewProcurement,
    canViewClients,
    canViewReports,
    canViewAllUsers,
    canAccessSystemSettings,
    isManagement,
    isProject,
    isPurchase,
    isField,
    isExternal
  } = usePermissions()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (!profile) return null

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      description: 'Main overview and statistics',
      requiresPermission: canViewDashboard
    },
    // Management and Project Access
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderOpen,
      description: 'Manage all projects',
      requiresPermission: () => isManagement() || canCreateProject()
    },
    // Project Team Access
    {
      name: 'My Projects',
      href: '/my-projects',
      icon: FolderOpen,
      description: 'Your assigned projects',
      requiresPermission: () => isProject() || isField()
    },
    // Task Management
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare,
      description: 'Task management and assignment',
      requiresPermission: canViewTasks
    },
    // Scope Management
    {
      name: 'Scope',
      href: '/scope',
      icon: FileText,
      description: 'Project scope and items',
      requiresPermission: canViewScope
    },
    // Shop Drawings
    {
      name: 'Shop Drawings',
      href: '/shop-drawings',
      icon: PenTool,
      description: 'Design and drawings management',
      requiresPermission: canViewShopDrawings
    },
    // Procurement
    {
      name: 'Procurement',
      href: '/procurement',
      icon: ShoppingCart,
      description: 'Supplier and purchase management',
      requiresPermission: canViewProcurement
    },
    // Client Portal
    {
      name: 'Client Portal',
      href: '/client',
      icon: Users,
      description: 'Client communication and approvals',
      requiresRole: ['client']
    },
    // Field Work
    {
      name: 'Field Work',
      href: '/field',
      icon: Hammer,
      description: 'Site work and progress reporting',
      requiresRole: ['field_worker', 'subcontractor']
    },
    // Clients Management
    {
      name: 'Clients',
      href: '/clients',
      icon: Building,
      description: 'Client relationship management',
      requiresPermission: canViewClients
    },
    // Reports
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      description: 'Generate and view reports',
      requiresPermission: canViewReports
    },
    // Financial (Management only)
    {
      name: 'Financial',
      href: '/financial',
      icon: DollarSign,
      description: 'Financial overview and budgets',
      requiresPermission: () => isManagement()
    },
    // User Management
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      description: 'User and team management',
      requiresPermission: canViewAllUsers
    },
    // Settings
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      description: 'System configuration',
      requiresPermission: canAccessSystemSettings
    }
  ]

  const hasAccessToNavItem = (item: NavigationItem): boolean => {
    // Check role requirement
    if (item.requiresRole) {
      return item.requiresRole.includes(profile.role)
    }
    
    // Check permission requirement
    if (item.requiresPermission) {
      return item.requiresPermission()
    }
    
    // Default: allow access
    return true
  }

  const visibleItems = navigationItems.filter(hasAccessToNavItem)

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* User Profile Header */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {visibleItems.map(item => (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className="w-full justify-start h-auto p-3 text-left"
              >
                <item.icon className="mr-3 h-4 w-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  )}
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t">
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

// Simplified navigation for mobile or condensed views
export const MobileNavigation = () => {
  const { profile } = useAuth()
  const { canViewDashboard, isManagement, isProject, isPurchase, isField } = usePermissions()

  if (!profile) return null

  const quickItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, show: canViewDashboard() },
    { name: 'Projects', href: isManagement() ? '/projects' : '/my-projects', icon: FolderOpen, show: true },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare, show: isProject() || isManagement() },
    { name: 'Procurement', href: '/procurement', icon: ShoppingCart, show: isPurchase() },
    { name: 'Field', href: '/field', icon: Hammer, show: isField() },
  ].filter(item => item.show)

  return (
    <div className="flex bg-white border-t p-2 space-x-1">
      {quickItems.map(item => (
        <Link key={item.name} href={item.href} className="flex-1">
          <Button variant="ghost" className="w-full flex-col h-auto p-2">
            <item.icon className="h-4 w-4 mb-1" />
            <span className="text-xs">{item.name}</span>
          </Button>
        </Link>
      ))}
    </div>
  )
}