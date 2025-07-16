'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { 
  Plus, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Users, 
  ShoppingCart,
  PenTool,
  DollarSign,
  Settings,
  Upload
} from 'lucide-react';
import Link from 'next/link';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'secondary';
  requiresPermission?: () => boolean;
  requiresRole?: string[];
}

export function QuickActions() {
  const { user, profile } = useAuth();
  const { 
    hasPermission,
    canCreateProject,
    canCreateUsers,
    canViewFinancials,
    canAccessSystemSettings,
    isManagement,
    isProject,
    isField,
    isExternal
  } = usePermissions();

  if (!profile) return null;

  const quickActions: QuickAction[] = [
    // Universal actions
    {
      title: 'New Project',
      description: 'Start a new project',
      href: '/projects/new',
      icon: FolderOpen,
      variant: 'default',
      requiresPermission: canCreateProject
    },
    
    // Management actions
    {
      title: 'Add Team Member',
      description: 'Invite new user',
      href: '/users/new',
      icon: Users,
      requiresPermission: canCreateUsers
    },
    {
      title: 'Financial Overview',
      description: 'View budgets & costs',
      href: '/financial',
      icon: DollarSign,
      requiresPermission: () => isManagement()
    },
    {
      title: 'System Settings',
      description: 'Configure system',
      href: '/settings',
      icon: Settings,
      requiresPermission: canAccessSystemSettings
    },
    
    // Role-specific actions
    {
      title: 'Suppliers',
      description: 'Manage suppliers',
      href: '/suppliers',
      icon: ShoppingCart,
      requiresPermission: () => isManagement()
    },
    
    // Field worker actions
    {
      title: 'Scope Items',
      description: 'View project scope',
      href: '/scope',
      icon: CheckSquare,
      requiresPermission: () => hasPermission('projects.read.all') || hasPermission('projects.read.assigned')
    }
  ];

  // Filter actions based on permissions and roles
  const availableActions = quickActions.filter(action => {
    // Check role requirement
    if (action.requiresRole) {
      return action.requiresRole.includes(profile.role);
    }
    
    // Check permission requirement
    if (action.requiresPermission) {
      return action.requiresPermission();
    }
    
    // Default: allow if no specific requirements
    return true;
  });

  // Limit to most relevant actions (6 max)
  const displayActions = availableActions.slice(0, 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        {displayActions.length === 0 ? (
          <div className="text-center py-6">
            <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">No quick actions available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayActions.map((action, index) => {
              const Icon = action.icon;
              
              return (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  className="w-full justify-start h-auto p-3 text-left"
                  asChild
                >
                  <Link href={action.href}>
                    <div className="flex items-center space-x-3 w-full">
                      <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {action.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.description}
                        </div>
                      </div>
                    </div>
                  </Link>
                </Button>
              );
            })}
          </div>
        )}
        
        {/* Role-specific footer message */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 text-center">
            {isManagement() && "Management Dashboard"}
            {isProject() && !isManagement() && "Project Team Dashboard"}
            {isField() && !isManagement() && "Field Operations Dashboard"}
            {isExternal() && "External User Dashboard"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Enhanced QuickActions with DataStateWrapper integration
 * Following the proven dashboard component optimization pattern from claude.md
 */
export function QuickActionsEnhanced() {
  const { user, profile, loading: authLoading } = useAuth();
  const {
    hasPermission,
    canCreateProject,
    canCreateUsers,
    canViewFinancials,
    canAccessSystemSettings,
    isManagement,
    isProject,
    isField,
    isExternal
  } = usePermissions();

  const quickActions: QuickAction[] = [
    // Universal actions
    {
      title: 'New Project',
      description: 'Create a new project',
      href: '/projects/new',
      icon: Plus,
      requiresPermission: () => canCreateProject()
    },
    {
      title: 'View Projects',
      description: 'Browse all projects',
      href: '/projects',
      icon: FolderOpen,
      variant: 'outline'
    },
    {
      title: 'My Tasks',
      description: 'View assigned tasks',
      href: '/tasks',
      icon: CheckSquare,
      variant: 'outline'
    },

    // Management actions
    {
      title: 'Team Management',
      description: 'Manage team members',
      href: '/admin/users',
      icon: Users,
      requiresPermission: () => canCreateUsers()
    },
    {
      title: 'Reports',
      description: 'Generate reports',
      href: '/reports',
      icon: FileText,
      variant: 'outline',
      requiresPermission: () => hasPermission('reports.view')
    },
    {
      title: 'Material Specs',
      description: 'Manage specifications',
      href: '/material-specs',
      icon: ShoppingCart,
      variant: 'outline',
      requiresPermission: () => hasPermission('material_specs.read')
    },

    // Field/Project specific actions
    {
      title: 'Shop Drawings',
      description: 'Review drawings',
      href: '/shop-drawings',
      icon: PenTool,
      variant: 'outline',
      requiresPermission: () => hasPermission('shop_drawings.read')
    },
    {
      title: 'Scope Items',
      description: 'Manage scope',
      href: '/scope',
      icon: CheckSquare,
      variant: 'outline',
      requiresPermission: () => hasPermission('scope.read')
    },

    // Admin actions
    {
      title: 'System Settings',
      description: 'Configure system',
      href: '/admin/settings',
      icon: Settings,
      requiresPermission: () => canAccessSystemSettings()
    },
    {
      title: 'Import Data',
      description: 'Import Excel data',
      href: '/scope/import',
      icon: Upload,
      variant: 'outline',
      requiresPermission: () => hasPermission('scope.import')
    }
  ];

  // Filter actions based on permissions and role
  const availableActions = quickActions.filter(action => {
    if (action.requiresPermission && !action.requiresPermission()) {
      return false;
    }
    return true;
  });

  return (
    <DataStateWrapper
      loading={authLoading}
      error={null}
      data={profile}
      emptyComponent={
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <div className="text-muted-foreground">Please log in to see available actions</div>
            </div>
          </CardContent>
        </Card>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3">
            {availableActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'default'}
                size="sm"
                asChild
                className="justify-start h-auto p-3"
              >
                <Link href={action.href}>
                  <action.icon className="h-4 w-4 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </Link>
              </Button>
            ))}
          </div>

          {/* Role-based welcome message */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              {isManagement() && "Management Dashboard"}
              {isProject() && "Project Manager Dashboard"}
              {isField() && "Field User Dashboard"}
              {isExternal() && "External User Dashboard"}
            </p>
          </div>
        </CardContent>
      </Card>
    </DataStateWrapper>
  );
}