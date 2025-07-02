# Authentication System - Wave 1 Foundation
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive authentication system using Supabase Auth with custom role-based access control, supporting 13 distinct user types with granular permissions.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Spawn immediately):**
1. **Supabase Auth Configuration**: Provider setup and JWT configuration
2. **Custom User Profile System**: Extended user data with roles
3. **Role-Based Access Control**: Permission matrix implementation
4. **Session Management**: Token handling and refresh logic

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Multi-Factor Authentication**: Enhanced security for management users
6. **SSO Integration**: Future enterprise authentication

---

## **🔐 Supabase Authentication Setup**

### **Environment Configuration**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Server-side client with elevated permissions
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### **Custom Auth Hook**
```typescript
// hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export interface UserProfile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  department?: string
  permissions: Record<string, boolean>
  is_active: boolean
}

export type UserRole = 
  | 'company_owner'
  | 'general_manager'
  | 'deputy_general_manager'
  | 'technical_director'
  | 'admin'
  | 'project_manager'
  | 'architect'
  | 'technical_engineer'
  | 'purchase_director'
  | 'purchase_specialist'
  | 'field_worker'
  | 'client'
  | 'subcontractor'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchUserProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  }

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    
    if (error) throw error
    
    // Create user profile
    if (data.user) {
      await createUserProfile(data.user.id, userData)
    }
    
    return data
  }

  const createUserProfile = async (userId: string, userData: Partial<UserProfile>) => {
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        ...userData,
        created_at: new Date().toISOString()
      })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut
  }
}
```

---

## **🎯 Role-Based Access Control System**

### **Permission Matrix**
```typescript
// lib/permissions.ts
export const PERMISSIONS = {
  // Project Management
  'projects.create': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'projects.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'projects.read.assigned': ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'projects.read.own': ['client', 'subcontractor'],
  'projects.update': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'projects.delete': ['company_owner', 'general_manager', 'admin'],

  // Scope Management
  'scope.create': ['project_manager', 'technical_engineer'],
  'scope.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker'],
  'scope.update': ['project_manager', 'technical_engineer'],
  'scope.delete': ['project_manager', 'admin'],
  'scope.prices.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],

  // Document Management
  'documents.create': ['project_manager', 'architect', 'technical_engineer'],
  'documents.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'client'],
  'documents.update': ['project_manager', 'architect'],
  'documents.approve.internal': ['project_manager', 'technical_director'],
  'documents.approve.client': ['client'],

  // Shop Drawings
  'shop_drawings.create': ['architect'],
  'shop_drawings.edit': ['architect', 'project_manager'],
  'shop_drawings.approve': ['project_manager', 'technical_director', 'client'],
  'shop_drawings.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'client'],

  // Purchase Management
  'suppliers.create': ['purchase_director', 'purchase_specialist'],
  'suppliers.read': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'suppliers.approve': ['general_manager', 'deputy_general_manager'],
  'scope.assign_supplier': ['purchase_director', 'purchase_specialist'],

  // Reporting
  'reports.create': ['project_manager', 'field_worker', 'subcontractor'],
  'reports.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'reports.read.project': ['project_manager', 'architect', 'technical_engineer'],
  'reports.read.own': ['field_worker', 'subcontractor', 'client'],

  // User Management
  'users.create': ['company_owner', 'general_manager', 'admin'],
  'users.read.all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'users.update': ['company_owner', 'general_manager', 'admin'],
  'users.delete': ['company_owner', 'admin'],

  // Financial Data
  'financials.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director'],
  'budgets.approve': ['company_owner', 'general_manager', 'deputy_general_manager'],

  // System Administration
  'system.admin': ['company_owner', 'admin'],
  'system.settings': ['company_owner', 'general_manager', 'admin'],

  // Global Navigation Permissions
  'dashboard.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist', 'field_worker', 'client', 'subcontractor'],
  'tasks.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'field_worker', 'subcontractor'],
  'tasks.create': ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
  'tasks.manage_all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
  'scope.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
  'shop_drawings.view_all': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'architect', 'technical_engineer'],
  'clients.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager'],
  'clients.manage': ['company_owner', 'general_manager', 'deputy_general_manager', 'admin'],
  'procurement.view': ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
  'procurement.manage': ['purchase_director', 'purchase_specialist'],
  'procurement.approve': ['company_owner', 'general_manager', 'deputy_general_manager']
} as const

export type Permission = keyof typeof PERMISSIONS

export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return PERMISSIONS[permission]?.includes(userRole) ?? false
}

export const getUserPermissions = (userRole: UserRole): Permission[] => {
  return Object.keys(PERMISSIONS).filter(permission => 
    hasPermission(userRole, permission as Permission)
  ) as Permission[]
}
```

### **Permission Hook**
```typescript
// hooks/usePermissions.ts
import { useAuth } from './useAuth'
import { hasPermission, getUserPermissions, Permission } from '@/lib/permissions'

export const usePermissions = () => {
  const { profile } = useAuth()

  const checkPermission = (permission: Permission): boolean => {
    if (!profile) return false
    return hasPermission(profile.role, permission)
  }

  const canAccessProject = (projectId: string): boolean => {
    if (!profile) return false
    
    // Management can access all projects
    if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(profile.role)) {
      return true
    }
    
    // Other roles need to be assigned to the project
    // This would require a separate query to project_assignments
    return false
  }

  const canViewPricing = (): boolean => {
    return checkPermission('scope.prices.view')
  }

  const isManagementLevel = (): boolean => {
    if (!profile) return false
    return ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'].includes(profile.role)
  }

  const canCreateProject = (): boolean => {
    return checkPermission('projects.create')
  }

  const canApproveSuppliers = (): boolean => {
    return checkPermission('suppliers.approve')
  }

  // Global Navigation Permissions
  const canViewTasks = (): boolean => {
    return checkPermission('tasks.view')
  }

  const canCreateTasks = (): boolean => {
    return checkPermission('tasks.create')
  }

  const canManageAllTasks = (): boolean => {
    return checkPermission('tasks.manage_all')
  }

  const canViewScope = (): boolean => {
    return checkPermission('scope.view')
  }

  const canViewShopDrawings = (): boolean => {
    return checkPermission('shop_drawings.view_all')
  }

  const canViewClients = (): boolean => {
    return checkPermission('clients.view')
  }

  const canManageClients = (): boolean => {
    return checkPermission('clients.manage')
  }

  const canViewProcurement = (): boolean => {
    return checkPermission('procurement.view')
  }

  const canManageProcurement = (): boolean => {
    return checkPermission('procurement.manage')
  }

  const canApproveProcurement = (): boolean => {
    return checkPermission('procurement.approve')
  }

  const allPermissions = profile ? getUserPermissions(profile.role) : []

  return {
    checkPermission,
    canAccessProject,
    canViewPricing,
    isManagementLevel,
    canCreateProject,
    canApproveSuppliers,
    // Global Navigation Permissions
    canViewTasks,
    canCreateTasks,
    canManageAllTasks,
    canViewScope,
    canViewShopDrawings,
    canViewClients,
    canManageClients,
    canViewProcurement,
    canManageProcurement,
    canApproveProcurement,
    allPermissions
  }
}
```

---

## **🔒 Authentication Components**

### **Login Component**
```typescript
// components/auth/LoginForm.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await signIn(email, password)
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access Formula PM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

### **Auth Guard Component**
```typescript
// components/auth/AuthGuard.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Permission } from '@/lib/permissions'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredPermission?: Permission
  fallback?: React.ReactNode
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredPermission,
  fallback = <div>Access Denied</div>
}) => {
  const { user, loading } = useAuth()
  const { checkPermission } = usePermissions()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  if (requiredPermission && !checkPermission(requiredPermission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

---

## **🎛️ Role-Based Navigation**

### **Navigation Component**
```typescript
// components/navigation/Navigation.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  FolderOpen, 
  Users, 
  FileText, 
  Settings, 
  ShoppingCart,
  Hammer,
  PenTool
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  roles?: string[]
}

export const Navigation = () => {
  const { profile } = useAuth()
  const { checkPermission, isManagementLevel } = usePermissions()

  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: FolderOpen,
      roles: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager']
    },
    {
      name: 'My Projects',
      href: '/my-projects',
      icon: FolderOpen,
      roles: ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'subcontractor']
    },
    {
      name: 'Client Portal',
      href: '/client',
      icon: Users,
      roles: ['client']
    },
    {
      name: 'Shop Drawings',
      href: '/shop-drawings',
      icon: PenTool,
      roles: ['architect', 'project_manager', 'technical_director']
    },
    {
      name: 'Purchase',
      href: '/purchase',
      icon: ShoppingCart,
      roles: ['purchase_director', 'purchase_specialist']
    },
    {
      name: 'Field Work',
      href: '/field',
      icon: Hammer,
      roles: ['field_worker', 'subcontractor']
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: FileText,
      roles: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager']
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      roles: ['company_owner', 'general_manager', 'admin']
    }
  ]

  const hasAccessToNavItem = (item: NavigationItem): boolean => {
    if (!profile) return false
    
    // If no roles specified, everyone can access
    if (!item.roles || item.roles.length === 0) {
      return true
    }
    
    // Check if user's role is in allowed roles
    return item.roles.includes(profile.role)
  }

  return (
    <nav className="space-y-2">
      {navigationItems
        .filter(item => hasAccessToNavItem(item))
        .map(item => (
          <Button
            key={item.name}
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <a href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.name}
            </a>
          </Button>
        ))}
    </nav>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Authentication System Implementation
OBJECTIVE: Deploy secure multi-role authentication with granular permissions
CONTEXT: Foundation security layer for all 13 user types in construction PM system

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Database: @Planing App/Wave-1-Foundation/database-schema-design.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Configure Supabase Auth with proper JWT settings
2. Implement all 13 user roles with permission matrix
3. Create role-based navigation and access control
4. Test authentication flows for all user types

DELIVERABLES:
1. Complete authentication system implementation
2. Role-based permission testing report
3. Security audit compliance verification
4. User onboarding flow documentation
```

### **Quality Gates**
- ✅ All 13 user types can authenticate successfully
- ✅ Permission matrix prevents unauthorized access
- ✅ JWT tokens properly configured with roles
- ✅ Session management handles refresh tokens
- ✅ Navigation adapts correctly for each role

### **Dependencies for Next Wave**
- Authentication system must be fully functional
- All user roles tested and verified
- Permission system integrated with database RLS
- User profile management complete

---

## **🎯 SUCCESS CRITERIA**
1. **Security Validation**: All user types authenticate with proper permissions
2. **Role Enforcement**: Navigation and features restricted by role
3. **Session Management**: Proper token handling and refresh
4. **Integration Ready**: Auth system supports all planned features

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md