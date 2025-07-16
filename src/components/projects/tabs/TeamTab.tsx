// ============================================================================
// V3 Team Management Tab - Project Team Assignments
// ============================================================================
// Built with optimization patterns: DataStateWrapper, withAuth integration
// Features: Add/remove team members, role assignments, responsibilities
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Search, 
  Filter,
  Mail,
  Phone,
  Building,
  Crown,
  Shield,
  User,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTeamManagement } from '@/hooks/useProjectTeam'

// ============================================================================
// TYPES
// ============================================================================

interface ProjectAssignment {
  id: string
  user_id: string
  project_id: string
  role: string
  responsibilities: string
  assigned_at: string
  assigned_by: string
  is_active: boolean
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    role: string
    department: string
    phone?: string
    avatar_url?: string
  }
  assigned_by_user: {
    first_name: string
    last_name: string
  }
}

interface TeamTabProps {
  projectId: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TeamTab: React.FC<TeamTabProps> = ({ projectId }) => {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)

  // Permissions
  const canManageTeam = profile && (
    hasPermission(profile.role, 'projects.update') ||
    ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager'].includes(profile.role)
  )

  // Data fetching using real API integration
  const { assignments: assignmentData, addMember, removeMember, availableUsers } = useTeamManagement(projectId)
  const assignments = assignmentData.data?.assignments || []
  const loading = assignmentData.loading
  const error = assignmentData.error
  const refetch = assignmentData.refetch

  // Filter assignments
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = 
      assignment.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.role.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = !roleFilter || assignment.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Group assignments by role
  const assignmentsByRole = filteredAssignments.reduce((acc, assignment) => {
    const role = assignment.role
    if (!acc[role]) acc[role] = []
    acc[role].push(assignment)
    return acc
  }, {} as Record<string, ProjectAssignment[]>)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRemoveMember = async (userId: string, userName: string, role?: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from this project?`)) {
      try {
        await removeMember.removeMember(userId, role)
        refetch()
        toast({
          title: "Success",
          description: "Team member has been removed successfully",
          variant: "default"
        })
      } catch (error) {
        console.error('Error removing team member:', error)
        toast({
          title: "Error",
          description: "Failed to remove team member. Please try again.",
          variant: "destructive"
        })
      }
    }
  }

  // ============================================================================
  // ROLE HELPERS
  // ============================================================================

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'project_manager': return <Crown className="h-4 w-4" />
      case 'architect': return <Building className="h-4 w-4" />
      case 'technical_engineer': return <Settings className="h-4 w-4" />
      case 'general_manager':
      case 'deputy_general_manager': return <Shield className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'project_manager': return 'bg-purple-100 text-purple-800'
      case 'architect': return 'bg-blue-100 text-blue-800'
      case 'technical_engineer': return 'bg-green-100 text-green-800'
      case 'general_manager':
      case 'deputy_general_manager': return 'bg-red-100 text-red-800'
      case 'field_worker': return 'bg-orange-100 text-orange-800'
      case 'purchase_specialist': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatRoleName = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  // ============================================================================
  // TEAM MEMBER CARD COMPONENT
  // ============================================================================

  const TeamMemberCard: React.FC<{ assignment: ProjectAssignment }> = ({ assignment }) => (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            
            {/* Member Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {assignment.user.first_name} {assignment.user.last_name}
                </h3>
                <Badge className={getRoleColor(assignment.role)} variant="secondary">
                  <div className="flex items-center gap-1">
                    {getRoleIcon(assignment.role)}
                    {formatRoleName(assignment.role)}
                  </div>
                </Badge>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{assignment.user.email}</span>
                </div>
                {assignment.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{assignment.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-3 w-3" />
                  <span>{assignment.user.department}</span>
                </div>
              </div>
              
              {assignment.responsibilities && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700">
                  <strong>Responsibilities:</strong> {assignment.responsibilities}
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                Assigned {new Date(assignment.assigned_at).toLocaleDateString()} by {assignment.assigned_by_user.first_name} {assignment.assigned_by_user.last_name}
              </div>
            </div>
          </div>
          
          {/* Actions */}
          {canManageTeam && (
            <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveMember(assignment.user_id, `${assignment.user.first_name} ${assignment.user.last_name}`, assignment.role)}
                className="text-red-600 hover:text-red-700"
              >
                <UserMinus className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Project Team</h2>
          <p className="text-gray-600">Manage project assignments and team members</p>
        </div>
        
        {canManageTeam && (
          <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <AddTeamMemberForm 
                projectId={projectId}
                onSuccess={() => {
                  setShowAddMemberDialog(false)
                  refetch()
                }}
                onCancel={() => setShowAddMemberDialog(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Roles</SelectItem>
            <SelectItem value="project_manager">Project Manager</SelectItem>
            <SelectItem value="architect">Architect</SelectItem>
            <SelectItem value="technical_engineer">Technical Engineer</SelectItem>
            <SelectItem value="field_worker">Field Worker</SelectItem>
            <SelectItem value="purchase_specialist">Purchase Specialist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{assignments.length}</div>
                <div className="text-sm text-gray-600">Total Members</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {assignments.filter(a => a.role === 'project_manager').length}
                </div>
                <div className="text-sm text-gray-600">Project Managers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {assignments.filter(a => a.role === 'architect').length}
                </div>
                <div className="text-sm text-gray-600">Architects</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {assignments.filter(a => a.role === 'technical_engineer').length}
                </div>
                <div className="text-sm text-gray-600">Engineers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <DataStateWrapper
        loading={loading}
        error={error}
        data={filteredAssignments}
        onRetry={refetch}
        emptyMessage="No team members found"
        emptyDescription="Add team members to get started"
        loadingComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-32"></div>
              </div>
            ))}
          </div>
        }
      >
        <div className="space-y-6">
          {Object.keys(assignmentsByRole).length > 0 ? (
            Object.entries(assignmentsByRole).map(([role, roleAssignments]) => (
              <div key={role}>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  {getRoleIcon(role)}
                  {formatRoleName(role)}s ({roleAssignments.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roleAssignments.map(assignment => (
                    <TeamMemberCard key={assignment.id} assignment={assignment} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAssignments.map(assignment => (
                <TeamMemberCard key={assignment.id} assignment={assignment} />
              ))}
            </div>
          )}
        </div>
      </DataStateWrapper>

      {/* Help */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Team members assigned to this project will have access to project data based on their role permissions. 
          Only users with management or project manager roles can modify team assignments.
        </AlertDescription>
      </Alert>
    </div>
  )
}

// ============================================================================
// ADD TEAM MEMBER FORM COMPONENT
// ============================================================================

interface AddTeamMemberFormProps {
  projectId: string
  onSuccess: () => void
  onCancel: () => void
}

const AddTeamMemberForm: React.FC<AddTeamMemberFormProps> = ({
  projectId,
  onSuccess,
  onCancel
}) => {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { availableUsers, addMember } = useTeamManagement(projectId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedRole) return

    setIsSubmitting(true)
    try {
      await addMember.addMember({
        user_id: selectedUserId,
        role: selectedRole,
        responsibilities: responsibilities || undefined
      })
      
      toast({
        title: "Success",
        description: "Team member has been added successfully",
        variant: "default"
      })
      onSuccess()
    } catch (error) {
      console.error('Error adding team member:', error)
      toast({
        title: "Error",
        description: "Failed to add team member. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add Team Member</DialogTitle>
        <DialogDescription>
          Assign a team member to this project with specific role and responsibilities
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Team Member *</Label>
          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.data?.map(user => (
                <SelectItem key={user.id} value={user.id}>
                  {user.first_name} {user.last_name} ({user.role.replace('_', ' ')})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Project Role *</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="project_manager">Project Manager</SelectItem>
              <SelectItem value="architect">Architect</SelectItem>
              <SelectItem value="technical_engineer">Technical Engineer</SelectItem>
              <SelectItem value="field_worker">Field Worker</SelectItem>
              <SelectItem value="purchase_specialist">Purchase Specialist</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Responsibilities</Label>
          <Textarea
            placeholder="Describe specific responsibilities for this project..."
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            rows={3}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={!selectedUserId || !selectedRole || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </div>
      </form>
    </>
  )
}

export default TeamTab