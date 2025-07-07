'use client'

import { useState } from 'react'
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
import { User, Settings, LogOut, ChevronDown, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuClick?: () => void
}

export const Header = ({ onMenuClick }: HeaderProps = {}) => {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Get page title based on current route
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean)
    
    if (segments.length === 0 || segments[0] === 'dashboard') {
      return 'Dashboard'
    }
    
    if (segments[0] === 'projects') {
      if (segments.length === 1) {
        return 'Projects'
      } else if (segments.length >= 2) {
        return 'Project Details'
      }
    }
    
    if (segments[0] === 'settings') {
      return 'Settings'
    }
    
    // Capitalize first letter of the first segment
    return segments[0].charAt(0).toUpperCase() + segments[0].slice(1)
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

  return (
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
                {getInitials(profile?.first_name, profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            {profile && (
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.role.replace(/_/g, ' ')}
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
                {getInitials(profile?.first_name, profile?.last_name)}
              </AvatarFallback>
            </Avatar>
            {profile && (
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {profile.first_name} {profile.last_name}
                </p>
                <p className="text-xs text-gray-500">
                  {profile.email}
                </p>
              </div>
            )}
          </div>
          
          <DropdownMenuSeparator />
          
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
  )
}