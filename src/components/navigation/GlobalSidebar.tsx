'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Briefcase, 
  ListTodo,
  Layers,
  FileImage,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Bell,
  BarChart3,
  Building2
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string
  badge?: number
  description?: string
}

export const GlobalSidebar = () => {
  const { profile } = useAuth()
  const { 
    canViewDashboard,
    canViewTasks,
    canViewScope,
    canViewShopDrawings,
    canViewClients,
    canViewProcurement,
    canViewReports,
    canViewDocuments,
    canAccessSystemSettings,
    checkPermission
  } = usePermissions()
  const pathname = usePathname()

  // Navigation items with global access
  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      permission: 'dashboard.view',
      description: 'Project overview and insights'
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: Briefcase,
      permission: 'projects.view',
      description: 'All accessible projects'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: ListTodo,
      permission: 'tasks.view',
      description: 'Global tasks view'
    },
    {
      id: 'scope',
      label: 'Scope',
      href: '/scope',
      icon: Layers,
      permission: 'scope.view',
      description: 'Project scope items across all projects'
    },
    {
      id: 'shop-drawings',
      label: 'Shop Drawings',
      href: '/shop-drawings',
      icon: FileImage,
      permission: 'shop_drawings.view_all',
      description: 'Drawing management and approvals'
    },
    {
      id: 'clients',
      label: 'Clients',
      href: '/clients',
      icon: Users,
      permission: 'clients.view',
      description: 'Client management and communication'
    },
    {
      id: 'purchase',
      label: 'Purchase',
      href: '/purchase',
      icon: ShoppingCart,
      permission: 'purchase.requests.read',
      description: 'Purchase requests, orders, and vendor management'
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      permission: 'reports.read.all',
      description: 'Project reports and analytics'
    },
    {
      id: 'documents',
      label: 'Documents',
      href: '/documents',
      icon: FileText,
      permission: 'documents.read.all',
      description: 'Document management'
    }
  ]

  // Filter items based on user permissions
  const visibleItems = navigationItems.filter(item => 
    checkPermission(item.permission as any)
  )

  return (
    <div className="flex flex-col h-full">
      {/* User Info */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                title={item.description}
              >
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 min-w-[18px] h-5 flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-foreground rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Settings & Footer */}
      <div className="p-3 border-t space-y-1">
        <Link
          href="/notifications"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </Link>
        
        {canAccessSystemSettings() && (
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        )}
        
        <div className="pt-2 border-t">
          <div className="flex items-center space-x-2 px-3 py-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{profile?.company || 'Formula PM'}</p>
              <p className="text-xs text-muted-foreground">v2.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}