'use client'

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
  BarChart3
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
  const { checkPermission } = usePermissions()
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
      permission: 'shop_drawings.view_all'
    },
    {
      id: 'clients',
      label: 'Clients',
      href: '/clients',
      icon: Users,
      permission: 'clients.view'
    },
    {
      id: 'purchase',
      label: 'Purchase',
      href: '/purchase',
      icon: ShoppingCart,
      permission: 'purchase.requests.read'
    },
    {
      id: 'reports',
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      permission: 'reports.read.all'
    }
  ]

  const visiblePrimaryItems = primaryItems.filter(item => 
    checkPermission(item.permission as any)
  )

  const visibleSecondaryItems = secondaryItems.filter(item => 
    checkPermission(item.permission as any)
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border lg:hidden z-50">
      <div className="safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2 px-2">
          {/* Primary navigation items */}
          {visiblePrimaryItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-[60px] max-w-[80px]",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            )
          })}

          {/* More menu */}
          {visibleSecondaryItems.length > 0 && (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center py-2 px-3 rounded-lg min-w-[60px] max-w-[80px] h-auto text-muted-foreground hover:text-foreground hover:bg-accent/50"
                >
                  <Menu className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">More</span>
                </Button>
              </SheetTrigger>
              
              <SheetContent side="bottom" className="h-auto">
                <div className="py-4">
                  <h3 className="font-semibold text-lg mb-4">More Options</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {visibleSecondaryItems.map((item) => {
                      const isActive = pathname.startsWith(item.href)
                      
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "flex flex-col items-center justify-center py-4 px-2 rounded-lg transition-all duration-200",
                            isActive
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                        >
                          <item.icon className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium text-center">
                            {item.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </div>
  )
}