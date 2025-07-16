'use client'

import { useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, Permission } from '@/lib/permissions'
import { UserRole } from '@/types/auth'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataStateWrapper } from '@/components/ui/loading-states'

interface AuthGuardProps {
  children: ReactNode
  /** Specific permission required to access the component */
  requiredPermission?: Permission
  /** Specific roles allowed to access the component */
  allowedRoles?: UserRole[]
  /** Require management level access */
  requireManagement?: boolean
  /** Require admin level access */
  requireAdmin?: boolean
  /** Custom fallback component for unauthorized access */
  fallback?: ReactNode
  /** Redirect to login if not authenticated */
  redirectToLogin?: boolean
  /** Custom redirect path */
  redirectPath?: string
}

export const AuthGuard = ({
  children,
  requiredPermission,
  allowedRoles,
  requireManagement,
  requireAdmin,
  fallback,
  redirectToLogin = true,
  redirectPath = '/login'
}: AuthGuardProps) => {
  const { user, profile, loading, authState } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  // NOTE: Redirect logic removed to prevent conflicts with LayoutWrapper
  // LayoutWrapper handles authentication redirects at the application level
  // AuthGuard focuses purely on permission checking and UI feedback

  return (
    <DataStateWrapper
      loading={loading}
      error={!user ? "Authentication required" : !profile ? "Profile not found" : !profile.is_active ? "Account deactivated" : null}
      data={user && profile && profile.is_active ? user : null}
      onRetry={() => window.location.reload()}
      loadingComponent={
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
      errorComponent={
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant={!user ? "default" : "destructive"} className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {!user ? "You must be logged in to access this page." :
               !profile ? "User profile not found. Please contact administrator." :
               !profile.is_active ? "Your account has been deactivated. Please contact administrator." :
               "Access denied"}
            </AlertDescription>
          </Alert>
        </div>
      }
    >
      {(() => {
        // Check admin requirement
  if (requireAdmin) {
    const adminRoles: UserRole[] = ['company_owner', 'admin']
    if (!adminRoles.includes(profile.role)) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Admin access required. You don't have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  }

  // Check management requirement
  if (requireManagement) {
    const managementRoles: UserRole[] = [
      'company_owner',
      'general_manager',
      'deputy_general_manager',
      'technical_director',
      'admin'
    ]
    if (!managementRoles.includes(profile.role)) {
      return fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Management access required. You don't have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      )
    }
  }

  // Check specific roles
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Your role ({profile.role}) is not authorized to access this page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check specific permission
  if (requiredPermission && !hasPermission(profile.role, requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Insufficient permissions. You don't have the required permission: {requiredPermission}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

        // All checks passed, render children
        return <>{children}</>
      })()}
    </DataStateWrapper>
  )
}

// Convenience components for common use cases
export const ManagementGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <AuthGuard requireManagement fallback={fallback}>
    {children}
  </AuthGuard>
)

export const AdminGuard = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <AuthGuard requireAdmin fallback={fallback}>
    {children}
  </AuthGuard>
)

export const PermissionGuard = ({ 
  children, 
  permission, 
  fallback 
}: { 
  children: ReactNode
  permission: Permission
  fallback?: ReactNode 
}) => (
  <AuthGuard requiredPermission={permission} fallback={fallback}>
    {children}
  </AuthGuard>
)

export const RoleGuard = ({ 
  children, 
  roles, 
  fallback 
}: { 
  children: ReactNode
  roles: UserRole[]
  fallback?: ReactNode 
}) => (
  <AuthGuard allowedRoles={roles} fallback={fallback}>
    {children}
  </AuthGuard>
)