'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useImpersonation } from '@/hooks/useImpersonation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Users, 
  AlertCircle, 
  Loader2, 
  UserCheck,
  Shield,
  Building,
  Wrench,
  HardHat,
  ShoppingCart,
  Zap
} from 'lucide-react'
import { UserProfile } from '@/types/auth'

interface UserImpersonationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ImpersonationUser extends UserProfile {
  display_name: string
  role_display: string
}

export const UserImpersonationModal = ({ open, onOpenChange }: UserImpersonationModalProps) => {
  const { getAccessToken, profile: currentProfile } = useAuth()
  const { impersonateUser } = useImpersonation()
  
  const [users, setUsers] = useState<ImpersonationUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<ImpersonationUser[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [impersonating, setImpersonating] = useState(false)

  // Fetch users when modal opens
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  // Filter users based on search and role
  useEffect(() => {
    let filtered = users

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user =>
        user.display_name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role_display.toLowerCase().includes(term) ||
        user.company?.toLowerCase().includes(term) ||
        user.department?.toLowerCase().includes(term)
      )
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, selectedRole])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = await getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const data = await response.json()
      if (data.success) {
        setUsers(data.data.available_for_impersonation || [])
      } else {
        throw new Error(data.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users for impersonation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleImpersonate = async (targetUser: ImpersonationUser) => {
    if (!currentProfile) {
      setError('Current profile not available')
      return
    }

    try {
      setImpersonating(true)
      setError(null)

      const success = impersonateUser(currentProfile, targetUser)
      
      if (success) {
        console.log('🎭 [UserImpersonationModal] Impersonation started successfully')
        onOpenChange(false) // Close modal
        
        // Reset form state
        setSearchTerm('')
        setSelectedRole('all')
        
        // Refresh the page to ensure all components reflect the new user state
        setTimeout(() => {
          window.location.reload()
        }, 100)
      } else {
        setError('Failed to start impersonation')
      }
    } catch (err) {
      console.error('Error starting impersonation:', err)
      setError(err instanceof Error ? err.message : 'Failed to start impersonation')
    } finally {
      setImpersonating(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'company_owner':
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'general_manager':
      case 'deputy_general_manager':
      case 'technical_director':
        return <Building className="h-4 w-4" />
      case 'project_manager':
      case 'architect':
      case 'technical_engineer':
        return <Wrench className="h-4 w-4" />
      case 'purchase_director':
      case 'purchase_specialist':
        return <ShoppingCart className="h-4 w-4" />
      case 'field_worker':
        return <HardHat className="h-4 w-4" />
      case 'client':
        return <UserCheck className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'company_owner':
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'general_manager':
      case 'deputy_general_manager':
      case 'technical_director':
        return 'bg-blue-100 text-blue-800'
      case 'project_manager':
      case 'architect':
      case 'technical_engineer':
        return 'bg-green-100 text-green-800'
      case 'purchase_director':
      case 'purchase_specialist':
        return 'bg-orange-100 text-orange-800'
      case 'field_worker':
        return 'bg-yellow-100 text-yellow-800'
      case 'client':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U'
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Get unique roles for filter dropdown
  const availableRoles = Array.from(new Set(users.map(user => user.role)))
    .sort((a, b) => {
      const roleOrder = ['company_owner', 'admin', 'general_manager', 'deputy_general_manager', 'technical_director', 'project_manager', 'purchase_director', 'architect', 'technical_engineer', 'purchase_specialist', 'field_worker', 'client']
      return roleOrder.indexOf(a) - roleOrder.indexOf(b)
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Switch User (Impersonation)
          </DialogTitle>
          <DialogDescription>
            Select a user to impersonate. You'll experience the application as that user while maintaining your admin privileges.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name, email, role, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            {availableRoles.map(role => (
              <option key={role} value={role}>
                {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Users List */}
        <ScrollArea className="flex-1 -mx-6 px-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {users.length === 0 ? 'No users available for impersonation' : 'No users match your search criteria'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {getInitials(user.first_name, user.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{user.display_name}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <span className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {user.role_display}
                          </span>
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {(user.company || user.department) && (
                        <p className="text-xs text-gray-500">
                          {[user.company, user.department].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleImpersonate(user)}
                    disabled={impersonating || !user.is_active}
                    size="sm"
                    className="ml-4"
                  >
                    {impersonating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Impersonate'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-500">
            {filteredUsers.length} of {users.length} users shown
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}