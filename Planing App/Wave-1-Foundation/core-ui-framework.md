# Core UI Framework - Wave 1 Foundation
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Establish a comprehensive UI foundation using Next.js 15, Shadcn/ui, and Tailwind CSS that provides consistent, accessible, and role-adaptive components for all 13 user types in the Formula PM 2.0 system.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Spawn immediately):**
1. **Next.js 15 Project Setup**: App router, TypeScript configuration
2. **Shadcn/ui Component Library**: Core component installation and customization
3. **Design System Implementation**: Colors, typography, spacing standards
4. **Role-Adaptive Layout System**: Dynamic UI based on user permissions

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Mobile-First Responsive Design**: PWA-ready mobile optimization
6. **Accessibility Compliance**: WCAG 2.1 AA standard implementation

---

## **🚀 Next.js 15 Project Foundation**

### **Project Structure**
```bash
formula-pm-2/
├── app/                          # App Router (Next.js 15)
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── tasks/                # Global tasks page
│   │   ├── scope/                # Global scope page
│   │   ├── shop-drawings/        # Global shop drawings page
│   │   ├── clients/              # Global clients page
│   │   ├── procurement/          # Global procurement page
│   │   ├── documents/
│   │   ├── reports/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Reusable components
│   ├── ui/                      # Shadcn/ui components
│   ├── auth/                    # Authentication components
│   ├── dashboard/               # Dashboard-specific components
│   ├── forms/                   # Form components
│   ├── navigation/              # Navigation components
│   └── layouts/                 # Layout components
├── hooks/                       # Custom React hooks
├── lib/                         # Utility libraries
├── types/                       # TypeScript type definitions
└── styles/                      # Additional styling
```

### **Next.js Configuration**
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  images: {
    domains: ['your-supabase-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  // PWA Configuration for mobile field workers
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching: [
      {
        urlPattern: /^https?.*\.(png|jpg|jpeg|svg|gif)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
          },
        },
      },
    ],
  }),
}

module.exports = nextConfig
```

### **TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/hooks/*": ["./hooks/*"],
      "@/lib/*": ["./lib/*"],
      "@/types/*": ["./types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## **🎨 Shadcn/ui Setup & Customization**

### **Installation & Configuration**
```bash
# Initialize Shadcn/ui
npx shadcn-ui@latest init

# Install essential components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add navigation-menu
```

### **Custom Design System**
```typescript
// lib/design-system.ts
export const designSystem = {
  colors: {
    // Brand colors for construction industry
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // Main brand color
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    // Role-based accent colors
    management: '#1a237e',     // Deep blue for management
    project: '#4a148c',        // Purple for project level
    technical: '#2e7d32',      // Green for technical roles
    purchase: '#d84315',       // Orange for purchase dept
    field: '#5d4037',          // Brown for field workers
    client: '#9c27b0',         // Magenta for clients
    external: '#795548',       // Gray-brown for subcontractors
  },
  typography: {
    // Construction-appropriate font stack
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',     // 12px
      sm: '0.875rem',    // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',    // 18px
      xl: '1.25rem',     // 20px
      '2xl': '1.5rem',   // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    }
  },
  spacing: {
    // Consistent spacing scale
    unit: '0.25rem', // 4px base unit
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
}
```

### **Tailwind Configuration**
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Role-specific colors
        management: "#1a237e",
        project: "#4a148c",
        technical: "#2e7d32",
        purchase: "#d84315",
        field: "#5d4037",
        client: "#9c27b0",
        external: "#795548",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## **📱 Role-Adaptive Layout System**

### **Main Layout Component**
```typescript
// components/layouts/MainLayout.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { MainNavigation } from '@/components/navigation/MainNavigation'
import { UserProfileHeader } from '@/components/navigation/UserProfileHeader'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  className?: string
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, className }) => {
  const { profile } = useAuth()
  const { isManagementLevel } = usePermissions()

  if (!profile) {
    return <div>Loading...</div>
  }

  const getRoleColorClass = (role: string): string => {
    const roleColors = {
      company_owner: 'border-l-management',
      general_manager: 'border-l-management',
      deputy_general_manager: 'border-l-management',
      technical_director: 'border-l-management',
      admin: 'border-l-management',
      project_manager: 'border-l-project',
      architect: 'border-l-project',
      technical_engineer: 'border-l-technical',
      purchase_director: 'border-l-purchase',
      purchase_specialist: 'border-l-purchase',
      field_worker: 'border-l-field',
      client: 'border-l-client',
      subcontractor: 'border-l-external',
    }
    return roleColors[role as keyof typeof roleColors] || 'border-l-gray-300'
  }

  return (
    <div className={cn(
      "min-h-screen bg-background",
      getRoleColorClass(profile.role),
      "border-l-4",
      className
    )}>
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">Formula PM 2.0</h1>
            <div className="hidden md:block">
              <span className={cn(
                "px-2 py-1 text-xs font-medium rounded-full",
                isManagementLevel() ? "bg-management/10 text-management" : "bg-muted text-muted-foreground"
              )}>
                {profile.role.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationCenter />
            <UserProfileHeader />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r bg-card/30 min-h-[calc(100vh-4rem)]">
          <MainNavigation />
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### **Global Sidebar Navigation**
```typescript
// components/navigation/GlobalSidebar.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
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
  Menu,
  X
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string
  badge?: () => Promise<number> // Function to get dynamic badge count
  description?: string
}

export const GlobalSidebar = () => {
  const { user, profile } = useAuth()
  const { hasPermission } = usePermissions()
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
      badge: async () => await fetchPendingTasksCount(user.id),
      description: 'Global tasks view'
    },
    {
      id: 'scope',
      label: 'Scope',
      href: '/scope',
      icon: Layers,
      permission: 'scope.view',
      description: 'Project scope items across all accessible projects'
    },
    {
      id: 'shop-drawings',
      label: 'Shop Drawings',
      href: '/shop-drawings',
      icon: FileImage,
      permission: 'drawings.view',
      badge: async () => await fetchPendingApprovalsCount(user.id),
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
      id: 'procurement',
      label: 'Procurement',
      href: '/procurement',
      icon: ShoppingCart,
      permission: 'procurement.view',
      description: 'Supplier management and purchasing'
    }
  ]

  // Filter items based on user permissions
  const visibleItems = navigationItems.filter(item => 
    hasPermission(item.permission)
  )

  // Get badge counts for navigation items
  const { data: badgeCounts } = useQuery({
    queryKey: ['navigation-badges', user.id],
    queryFn: async () => {
      const counts: Record<string, number> = {}
      
      for (const item of visibleItems) {
        if (item.badge) {
          counts[item.id] = await item.badge()
        }
      }
      
      return counts
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user
  })

  return (
    <aside className="w-64 bg-gray-900 text-white h-screen flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-sm">FP</span>
          </div>
          <div>
            <h2 className="font-semibold text-lg">Formula PM</h2>
            <p className="text-gray-400 text-xs">v2.0</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {profile?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="space-y-1 px-3">
          {visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const badgeCount = badgeCounts?.[item.id]
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="flex-1">{item.label}</span>
                {badgeCount && badgeCount > 0 && (
                  <Badge 
                    variant="secondary" 
                    className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center"
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Settings & Notifications */}
      <div className="p-3 border-t border-gray-800 space-y-1">
        <Link
          href="/notifications"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span>Notifications</span>
          {/* Notification badge would go here */}
        </Link>
        
        <Link
          href="/settings"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  )
}

// Helper functions for badge counts
const fetchPendingTasksCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .or(`assigned_to.cs.{${userId}},created_by.eq.${userId}`)
    .in('status', ['todo', 'in_progress'])
  
  return count || 0
}

const fetchPendingApprovalsCount = async (userId: string): Promise<number> => {
  const { count } = await supabase
    .from('document_approvals')
    .select('*', { count: 'exact', head: true })
    .eq('approver_id', userId)
    .eq('status', 'pending')
  
  return count || 0
}

### **Mobile Bottom Navigation**
```typescript
// components/navigation/MobileBottomNav.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
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
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

interface MobileNavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission: string
}

export const MobileBottomNav = () => {
  const { hasPermission } = usePermissions()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Primary navigation items (always visible on mobile)
  const primaryItems: MobileNavItem[] = [
    {
      id: 'dashboard',
      label: 'Home',
      href: '/dashboard',
      icon: Home,
      permission: 'dashboard.view'
    },
    {
      id: 'projects',
      label: 'Projects',
      href: '/projects',
      icon: Briefcase,
      permission: 'projects.view'
    },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: ListTodo,
      permission: 'tasks.view'
    }
  ]

  // Secondary navigation items (in "More" menu)
  const secondaryItems: MobileNavItem[] = [
    {
      id: 'scope',
      label: 'Scope',
      href: '/scope',
      icon: Layers,
      permission: 'scope.view'
    },
    {
      id: 'shop-drawings',
      label: 'Drawings',
      href: '/shop-drawings',
      icon: FileImage,
      permission: 'drawings.view'
    },
    {
      id: 'clients',
      label: 'Clients',
      href: '/clients',
      icon: Users,
      permission: 'clients.view'
    },
    {
      id: 'procurement',
      label: 'Procurement',
      href: '/procurement',
      icon: ShoppingCart,
      permission: 'procurement.view'
    }
  ]

  const visiblePrimaryItems = primaryItems.filter(item => 
    hasPermission(item.permission)
  )

  const visibleSecondaryItems = secondaryItems.filter(item => 
    hasPermission(item.permission)
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {/* Primary navigation items */}
        {visiblePrimaryItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors min-w-[60px]",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* More menu */}
        {visibleSecondaryItems.length > 0 && (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-[60px]"
              >
                <Menu className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">More</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent side="bottom" className="h-auto">
              <div className="py-4">
                <h3 className="font-semibold text-lg mb-4">More Options</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {visibleSecondaryItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex flex-col items-center justify-center py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <item.icon className="w-6 h-6 mb-2 text-gray-600" />
                      <span className="text-sm font-medium text-center">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </div>
  )
}
```

---

## **🧩 Reusable Component Library**

### **Project Card Component**
```typescript
// components/projects/ProjectCard.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, Users, AlertTriangle } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
    progress: number
    startDate: string
    endDate: string
    budget?: number
    actualCost?: number
    projectManager: {
      name: string
      avatar?: string
    }
    teamSize: number
    priority: 'low' | 'medium' | 'high' | 'urgent'
    clientName: string
  }
  onClick?: () => void
  className?: string
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  className 
}) => {
  const { canViewPricing } = usePermissions()

  const getStatusColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors.planning
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {project.description}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
            <div className={cn("flex items-center text-sm", getPriorityColor(project.priority))}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {project.priority}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {new Date(project.startDate).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {project.teamSize} members
            </span>
          </div>

          {canViewPricing() && project.budget && (
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                ${project.budget.toLocaleString()}
              </span>
            </div>
          )}

          <div className="text-muted-foreground">
            Client: {project.clientName}
          </div>
        </div>

        {/* Project Manager */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={project.projectManager.avatar} />
              <AvatarFallback className="text-xs">
                {project.projectManager.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {project.projectManager.name}
            </span>
          </div>
          
          <Button size="sm" variant="outline">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### **Data Table Component**
```typescript
// components/ui/data-table.tsx
'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  searchPlaceholder?: string
  pagination?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = "Search...",
  pagination = true,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center py-4">
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
```

---

## **📱 Mobile-First Design System**

### **Responsive Utilities**
```typescript
// hooks/useResponsive.ts
import { useState, useEffect } from 'react'

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    windowSize,
  }
}
```

### **Mobile Navigation**
```typescript
// components/navigation/MobileNavigation.tsx
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { MainNavigation } from './MainNavigation'

export const MobileNavigation = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Formula PM 2.0</h2>
          <MainNavigation />
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Core UI Framework Implementation  
OBJECTIVE: Deploy comprehensive UI foundation with role-adaptive components
CONTEXT: Design system foundation for 13 user types with mobile-first approach

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Auth: @Planing App/Wave-1-Foundation/authentication-system.md
- Roles: @Planing App/Wave-1-Foundation/user-roles-permissions.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Set up Next.js 15 with App Router and TypeScript
2. Configure Shadcn/ui with custom design system
3. Implement role-adaptive layouts and navigation
4. Create reusable component library
5. Ensure mobile-first responsive design

DELIVERABLES:
1. Complete Next.js project setup with all configurations
2. Shadcn/ui component library with custom theming
3. Role-based navigation and layout systems
4. Reusable component library (cards, tables, forms)
5. Mobile-responsive design implementation
```

### **Quality Gates**
- ✅ Next.js 15 project properly configured and running
- ✅ Shadcn/ui components installed and customized
- ✅ Role-based navigation adapts to all 13 user types
- ✅ Design system consistently applied across components
- ✅ Mobile-first responsive design verified on all screen sizes

### **Dependencies for Next Wave**
- UI framework must be fully functional
- All role-based components tested
- Design system documentation complete
- Mobile responsiveness verified

---

## **🎯 SUCCESS CRITERIA**
1. **Framework Foundation**: Next.js 15 with optimal configuration
2. **Component Library**: Comprehensive, accessible UI components
3. **Role Adaptation**: UI adapts correctly for all user types
4. **Mobile First**: Responsive design works on all devices
5. **Design Consistency**: Unified visual language throughout

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md