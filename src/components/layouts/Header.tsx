'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { User, Settings, LogOut, ChevronDown, Menu, Zap, UserCheck, RotateCcw } from 'lucide-react'
import { DataStateWrapper } from '@/components/ui/loading-states'

// Dynamic import for admin-only modal - reduces bundle size for non-admin users
const UserImpersonationModal = dynamic(
  () => import('@/components/admin/UserImpersonationModal').then(mod => ({ 
    default: mod.UserImpersonationModal 
  })),
  { 
    ssr: false,
    loading: () => null // No loading state needed for modals
  }
)

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header = ({ onMenuClick }: HeaderProps = {}) => {
  const { 
    profile, 
    signOut, 
    isImpersonating, 
    impersonatedUser, 
    originalAdmin, 
    stopImpersonation, 
    canImpersonate 
  } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showImpersonationModal, setShowImpersonationModal] = useState(false)

  // Get page title based on current route
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return 'Dashboard'
    }
    
    switch (segments[0]) {
      case 'projects':
        if (segments.length === 1) {
          return 'Projects'
        } else if (segments.length >= 2) {
          return 'Project Details'
        }
        break
      case 'scope':
        return 'Scope Management'
      case 'tasks':
        return 'Tasks'
      case 'milestones':
        return 'Milestones'
      case 'material-specs':
        return 'Material Specifications'
      case 'shop-drawings':
        return 'Shop Drawings'
      case 'reports':
        return 'Reports'
      case 'suppliers':
        return 'Suppliers'
      case 'settings':
        return 'Settings'
      default:
        // Capitalize first letter of the first segment
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    }
    
    return 'Formula PM'
  }

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U'
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const handleStopImpersonation = async () => {
    try {
      console.log('🎭 [Header] Attempting to stop impersonation...')
      const success = stopImpersonation()
      
      if (success) {
        console.log('🎭 [Header] Stopped impersonation successfully - refreshing page')
        // Refresh the page to ensure all components reset to admin state
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        console.error('🎭 [Header] Failed to stop impersonation')
      }
    } catch (error) {
      console.error('🎭 [Header] Error stopping impersonation:', error)
    }
  }

  // Show admin capabilities and current impersonation status
  const showAdminFeatures = profile && canImpersonate(profile.role)
  const effectiveProfile = isImpersonating ? impersonatedUser : profile

  return (
    <>
      {/* Impersonation Banner */}
      {isImpersonating && effectiveProfile && originalAdmin && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>
                🎭 <strong>Impersonating:</strong> {effectiveProfile.first_name} {effectiveProfile.last_name} 
                ({effectiveProfile.role.replace(/_/g, ' ')}) 
                • <strong>Admin:</strong> {originalAdmin.first_name} {originalAdmin.last_name}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleStopImpersonation}
              className="text-white hover:bg-white/20 h-6 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Return to Admin
            </Button>
          </div>
        </div>
      )}

      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button */}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          {/* Page Title */}
          <h1 className="text-2xl font-semibold text-gray-900">
            {getPageTitle()}
          </h1>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(effectiveProfile?.first_name, effectiveProfile?.last_name)}
                </AvatarFallback>
              </Avatar>
              {effectiveProfile && (
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium">
                      {effectiveProfile.first_name} {effectiveProfile.last_name}
                    </p>
                    {isImpersonating && (
                      <Zap className="h-3 w-3 text-blue-600" aria-label="Impersonating" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {effectiveProfile.role.replace(/_/g, ' ')}
                    {isImpersonating && ' (Impersonated)'}
                  </p>
                </div>
              )}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
        
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(effectiveProfile?.first_name, effectiveProfile?.last_name)}
                </AvatarFallback>
              </Avatar>
              {effectiveProfile && (
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium">
                      {effectiveProfile.first_name} {effectiveProfile.last_name}
                    </p>
                    {isImpersonating && (
                      <Zap className="h-3 w-3 text-blue-600" aria-label="Impersonating" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {effectiveProfile.email}
                  </p>
                </div>
              )}
            </div>
            
            {/* Impersonation Status */}
            {isImpersonating && originalAdmin && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <Alert className="py-2">
                    <UserCheck className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Impersonating</strong><br />
                      Admin: {originalAdmin.first_name} {originalAdmin.last_name}
                    </AlertDescription>
                  </Alert>
                </div>
                <DropdownMenuItem onClick={handleStopImpersonation}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Return to Admin
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            
            {/* Admin Impersonation Feature */}
            {showAdminFeatures && !isImpersonating && (
              <>
                <DropdownMenuItem onClick={() => setShowImpersonationModal(true)}>
                  <Zap className="mr-2 h-4 w-4" />
                  Switch User
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleSignOut} 
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Signing out...' : 'Sign out'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Impersonation Modal */}
      <UserImpersonationModal 
        open={showImpersonationModal}
        onOpenChange={setShowImpersonationModal}
      />
    </>
  )
}

/**
 * Enhanced Header using DataStateWrapper pattern (claude.md aligned)
 * Following the proven UI component optimization pattern from claude.md
 */
export const HeaderEnhanced = ({ onMenuClick }: HeaderProps = {}) => {
  const {
    profile,
    signOut,
    isImpersonating,
    impersonatedUser,
    originalAdmin,
    stopImpersonation,
    canImpersonate
  } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [showImpersonationModal, setShowImpersonationModal] = useState(false)

  // Get page title based on current route
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return 'Dashboard'
    }
    
    switch (segments[0]) {
      case 'projects':
        if (segments.length === 1) {
          return 'Projects'
        } else if (segments.length >= 2) {
          return 'Project Details'
        }
        break
      case 'scope':
        return 'Scope Management'
      case 'tasks':
        return 'Tasks'
      case 'milestones':
        return 'Milestones'
      case 'material-specs':
        return 'Material Specifications'
      case 'shop-drawings':
        return 'Shop Drawings'
      case 'reports':
        return 'Reports'
      case 'suppliers':
        return 'Suppliers'
      case 'settings':
        return 'Settings'
      default:
        // Capitalize first letter of the first segment
        return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
    }
    
    return 'Formula PM'
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleStopImpersonation = async () => {
    try {
      const success = await stopImpersonation()
      if (success) {
        // Small delay to allow state to update
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        console.error('🎭 [Header] Failed to stop impersonation')
      }
    } catch (error) {
      console.error('🎭 [Header] Error stopping impersonation:', error)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U'
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <DataStateWrapper
      loading={!profile}
      error={null}
      data={profile}
      emptyComponent={
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-semibold text-gray-900">Loading...</div>
          </div>
        </header>
      }
    >
      <>
        {/* Impersonation Banner */}
        {isImpersonating && impersonatedUser && originalAdmin && (
          <div className="bg-yellow-100 border-b border-yellow-200 px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  🎭 Impersonating: {impersonatedUser.first_name} {impersonatedUser.last_name} ({impersonatedUser.role})
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopImpersonation}
                className="text-yellow-800 border-yellow-300 hover:bg-yellow-200"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Stop Impersonation
              </Button>
            </div>
          </div>
        )}

        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onMenuClick}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}

            {/* Page Title */}
            <h1 className="text-2xl font-semibold text-gray-900">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                      {getInitials(profile?.first_name, profile?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {profile?.first_name} {profile?.last_name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {profile?.role?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>

                {canImpersonate && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowImpersonationModal(true)}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      User Impersonation
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* User Impersonation Modal */}
        {canImpersonate && (
          <UserImpersonationModal
            open={showImpersonationModal}
            onOpenChange={setShowImpersonationModal}
          />
        )}
      </>
    </DataStateWrapper>
  )
}