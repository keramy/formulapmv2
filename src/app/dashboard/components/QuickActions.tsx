'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
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
    canCreateTasks,
    canCreateDocuments,
    canCreateUsers,
    canViewProcurement,
    canViewShopDrawings,
    canViewFinancials,
    canAccessSystemSettings,
    isManagement,
    isProject,
    isPurchase,
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
    {
      title: 'Create Task',
      description: 'Add a new task',
      href: '/tasks/new',
      icon: CheckSquare,
      requiresPermission: canCreateTasks
    },
    {
      title: 'Upload Document',
      description: 'Upload project files',
      href: '/documents/upload',
      icon: Upload,
      requiresPermission: canCreateDocuments
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
      title: 'Shop Drawings',
      description: 'Create new drawing',
      href: '/shop-drawings/new',
      icon: PenTool,
      requiresPermission: canViewShopDrawings
    },
    {
      title: 'Procurement',
      description: 'Manage suppliers',
      href: '/procurement',
      icon: ShoppingCart,
      requiresPermission: canViewProcurement
    },
    
    // Client-specific actions
    {
      title: 'Review Documents',
      description: 'Pending approvals',
      href: '/client/approvals',
      icon: FileText,
      requiresRole: ['client']
    },
    
    // Field worker actions
    {
      title: 'Field Report',
      description: 'Submit progress',
      href: '/field/reports/new',
      icon: CheckSquare,
      requiresRole: ['field_worker']
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
            {isPurchase() && !isManagement() && "Procurement Dashboard"}
            {isField() && !isManagement() && "Field Operations Dashboard"}
            {isExternal() && "External User Dashboard"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}