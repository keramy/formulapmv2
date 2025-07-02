# Project Creation System - Wave 1 Foundation
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive project creation and management system that supports complex team assignments, multi-user access control, and workflow initialization for all 13 user types in the Formula PM 2.0 construction management system.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Spawn immediately):**
1. **Project Creation Form**: Multi-step form with validation
2. **Team Assignment System**: Role-based team member assignment
3. **Project Templates**: Predefined project structures
4. **Initial Workflow Setup**: Automatic scope and document initialization

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Project Dashboard**: Individual project overview
6. **Bulk Project Operations**: Import/export and batch operations

---

## **🏗️ Project Creation Workflow**

### **Project Data Structure**
```typescript
// types/project.ts
export interface Project {
  id: string
  name: string
  description: string
  client_id: string
  project_manager_id: string
  status: ProjectStatus
  priority: ProjectPriority
  project_type: ProjectType
  location: string
  start_date: string
  end_date: string
  estimated_duration_days: number
  budget: number
  actual_cost: number
  currency: string
  billing_type: 'fixed_price' | 'time_materials' | 'cost_plus'
  
  // Project specifications
  building_type: string
  square_footage: number
  number_of_floors: number
  special_requirements: string[]
  
  // Workflow settings
  approval_workflow_enabled: boolean
  client_portal_enabled: boolean
  mobile_reporting_enabled: boolean
  
  // Metadata
  created_by: string
  created_at: string
  updated_at: string
  metadata: Record<string, any>
}

export type ProjectStatus = 
  | 'planning'
  | 'bidding'
  | 'design'
  | 'permits'
  | 'construction'
  | 'finishing'
  | 'closeout'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent'

export type ProjectType = 
  | 'commercial'
  | 'residential'
  | 'industrial'
  | 'renovation'
  | 'tenant_improvement'
  | 'infrastructure'

export interface ProjectAssignment {
  id: string
  project_id: string
  user_id: string
  role: string
  responsibilities: string[]
  access_level: 'full' | 'limited' | 'read_only'
  assigned_by: string
  assigned_at: string
  is_active: boolean
}

export interface ProjectTemplate {
  id: string
  name: string
  description: string
  project_type: ProjectType
  default_scope_categories: string[]
  default_team_roles: string[]
  default_workflows: string[]
  template_data: Partial<Project>
}
```

### **Multi-Step Project Creation Form**
```typescript
// components/projects/CreateProjectForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'

const projectSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  project_type: z.enum(['commercial', 'residential', 'industrial', 'renovation', 'tenant_improvement', 'infrastructure']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  location: z.string().min(1, 'Location is required'),
  
  // Client Information
  client_id: z.string().min(1, 'Client selection is required'),
  
  // Timeline
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  
  // Budget
  budget: z.number().min(0, 'Budget must be positive'),
  currency: z.string().default('USD'),
  billing_type: z.enum(['fixed_price', 'time_materials', 'cost_plus']),
  
  // Project Specifications
  building_type: z.string().optional(),
  square_footage: z.number().optional(),
  number_of_floors: z.number().optional(),
  special_requirements: z.array(z.string()).default([]),
  
  // Team Assignments
  project_manager_id: z.string().min(1, 'Project manager is required'),
  team_assignments: z.array(z.object({
    user_id: z.string(),
    role: z.string(),
    responsibilities: z.array(z.string()),
    access_level: z.enum(['full', 'limited', 'read_only'])
  })).default([]),
  
  // Workflow Settings
  approval_workflow_enabled: z.boolean().default(true),
  client_portal_enabled: z.boolean().default(true),
  mobile_reporting_enabled: z.boolean().default(true),
  
  // Template Selection
  template_id: z.string().optional()
})

type ProjectFormData = z.infer<typeof projectSchema>

const FORM_STEPS = [
  { id: 1, title: 'Basic Information', description: 'Project details and type' },
  { id: 2, title: 'Client & Location', description: 'Client selection and project location' },
  { id: 3, title: 'Timeline & Budget', description: 'Schedule and financial planning' },
  { id: 4, title: 'Specifications', description: 'Technical project requirements' },
  { id: 5, title: 'Team Assignment', description: 'Project team and roles' },
  { id: 6, title: 'Workflow Settings', description: 'Process configuration' },
  { id: 7, title: 'Review & Create', description: 'Final review and submission' }
]

export const CreateProjectForm = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { profile } = useAuth()
  const { canCreateProject } = usePermissions()

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      priority: 'medium',
      currency: 'USD',
      billing_type: 'fixed_price',
      approval_workflow_enabled: true,
      client_portal_enabled: true,
      mobile_reporting_enabled: true,
      team_assignments: [],
      special_requirements: []
    }
  })

  if (!canCreateProject()) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            You don't have permission to create projects.
          </div>
        </CardContent>
      </Card>
    )
  }

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true)
    try {
      await createProject(data)
      // Handle success - redirect or show success message
    } catch (error) {
      console.error('Error creating project:', error)
      // Handle error
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => {
    if (currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const progressPercentage = (currentStep / FORM_STEPS.length) * 100

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create New Project</CardTitle>
              <CardDescription>
                Step {currentStep} of {FORM_STEPS.length}: {FORM_STEPS[currentStep - 1].description}
              </CardDescription>
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </CardHeader>
      </Card>

      {/* Form Content */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && <BasicInformationStep form={form} />}
            {currentStep === 2 && <ClientLocationStep form={form} />}
            {currentStep === 3 && <TimelineBudgetStep form={form} />}
            {currentStep === 4 && <SpecificationsStep form={form} />}
            {currentStep === 5 && <TeamAssignmentStep form={form} />}
            {currentStep === 6 && <WorkflowSettingsStep form={form} />}
            {currentStep === 7 && <ReviewStep form={form} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>

              {currentStep < FORM_STEPS.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Creating Project...</>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Create Project
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
```

### **Team Assignment Component**
```typescript
// components/projects/TeamAssignmentStep.tsx
'use client'

import { useState, useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, X, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TeamAssignmentStepProps {
  form: UseFormReturn<any>
}

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  department?: string
  avatar_url?: string
}

interface TeamAssignment {
  user_id: string
  role: string
  responsibilities: string[]
  access_level: 'full' | 'limited' | 'read_only'
  user?: User
}

const ROLE_RESPONSIBILITIES = {
  'project_manager': [
    'Overall project coordination',
    'Client communication',
    'Timeline management',
    'Budget oversight',
    'Team leadership'
  ],
  'architect': [
    'Design development',
    'Shop drawing creation',
    'Client design reviews',
    'Design specifications',
    'Permit coordination'
  ],
  'technical_engineer': [
    'Technical analysis',
    'BOQ preparation',
    'Cost estimation',
    'Technical documentation',
    'Quality assurance'
  ],
  'field_worker': [
    'On-site execution',
    'Progress reporting',
    'Quality control',
    'Safety compliance',
    'Material handling'
  ],
  'purchase_specialist': [
    'Material procurement',
    'Supplier coordination',
    'Cost tracking',
    'Purchase orders',
    'Delivery scheduling'
  ]
}

export const TeamAssignmentStep: React.FC<TeamAssignmentStepProps> = ({ form }) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<TeamAssignment[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')

  useEffect(() => {
    fetchAvailableUsers()
  }, [])

  const fetchAvailableUsers = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('is_active', true)
      .in('role', ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'purchase_specialist'])
      .order('first_name')

    if (!error && data) {
      setAvailableUsers(data)
    }
  }

  const addTeamMember = () => {
    if (!selectedUser || !selectedRole) return

    const user = availableUsers.find(u => u.id === selectedUser)
    if (!user) return

    const newAssignment: TeamAssignment = {
      user_id: selectedUser,
      role: selectedRole,
      responsibilities: ROLE_RESPONSIBILITIES[selectedRole as keyof typeof ROLE_RESPONSIBILITIES] || [],
      access_level: selectedRole === 'project_manager' ? 'full' : 'limited',
      user
    }

    const updatedAssignments = [...assignments, newAssignment]
    setAssignments(updatedAssignments)
    form.setValue('team_assignments', updatedAssignments)

    setSelectedUser('')
    setSelectedRole('')
  }

  const removeTeamMember = (userId: string) => {
    const updatedAssignments = assignments.filter(a => a.user_id !== userId)
    setAssignments(updatedAssignments)
    form.setValue('team_assignments', updatedAssignments)
  }

  const updateAccessLevel = (userId: string, accessLevel: 'full' | 'limited' | 'read_only') => {
    const updatedAssignments = assignments.map(a => 
      a.user_id === userId ? { ...a, access_level: accessLevel } : a
    )
    setAssignments(updatedAssignments)
    form.setValue('team_assignments', updatedAssignments)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Project Team Assignment</h3>
        <p className="text-muted-foreground">
          Assign team members to this project and define their roles and responsibilities.
        </p>
      </div>

      {/* Add Team Member */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            Add Team Member
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="user-select">Team Member</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers
                    .filter(user => !assignments.some(a => a.user_id === user.id))
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="text-xs">
                              {user.first_name[0]}{user.last_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.first_name} {user.last_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="role-select">Project Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project role" />
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

            <div className="flex items-end">
              <Button 
                type="button" 
                onClick={addTeamMember}
                disabled={!selectedUser || !selectedRole}
                className="w-full"
              >
                Add Member
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Team */}
      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Project Team ({assignments.length} members)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src={assignment.user?.avatar_url} />
                      <AvatarFallback>
                        {assignment.user?.first_name[0]}{assignment.user?.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="font-medium">
                        {assignment.user?.first_name} {assignment.user?.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.user?.email}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">
                          {assignment.role.replace('_', ' ')}
                        </Badge>
                        <Badge variant={
                          assignment.access_level === 'full' ? 'default' :
                          assignment.access_level === 'limited' ? 'secondary' : 'outline'
                        }>
                          {assignment.access_level.replace('_', ' ')} access
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Select 
                      value={assignment.access_level} 
                      onValueChange={(value: 'full' | 'limited' | 'read_only') => 
                        updateAccessLevel(assignment.user_id, value)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Access</SelectItem>
                        <SelectItem value="limited">Limited Access</SelectItem>
                        <SelectItem value="read_only">Read Only</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeTeamMember(assignment.user_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {assignments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No team members assigned yet. Add team members to get started.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## **🏗️ Project Creation Service**

### **Project Creation Logic**
```typescript
// lib/services/projectService.ts
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { Project, ProjectFormData, ProjectTemplate } from '@/types/project'

export class ProjectService {
  async createProject(data: ProjectFormData, createdBy: string): Promise<Project> {
    try {
      // Start transaction
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          ...data,
          created_by: createdBy,
          actual_cost: 0,
          status: 'planning'
        })
        .select()
        .single()

      if (projectError) throw projectError

      // Create team assignments
      if (data.team_assignments && data.team_assignments.length > 0) {
        const assignments = data.team_assignments.map(assignment => ({
          project_id: project.id,
          user_id: assignment.user_id,
          role: assignment.role,
          responsibilities: assignment.responsibilities,
          access_level: assignment.access_level,
          assigned_by: createdBy,
          is_active: true
        }))

        const { error: assignmentError } = await supabase
          .from('project_assignments')
          .insert(assignments)

        if (assignmentError) throw assignmentError
      }

      // Initialize default scope items if template is used
      if (data.template_id) {
        await this.initializeFromTemplate(project.id, data.template_id)
      } else {
        await this.createDefaultScopeItems(project.id, data.project_type)
      }

      // Create default project folders and structure
      await this.initializeProjectStructure(project.id)

      // Send notifications to assigned team members
      await this.notifyTeamMembers(project.id, data.team_assignments || [])

      return project
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async initializeFromTemplate(projectId: string, templateId: string) {
    const { data: template } = await supabase
      .from('project_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (!template) return

    // Create scope items from template
    if (template.default_scope_categories) {
      const scopeItems = template.default_scope_categories.map((category: string) => ({
        project_id: projectId,
        category,
        title: `${category} Work`,
        description: `Default ${category} scope item`,
        status: 'not_started',
        progress_percentage: 0
      }))

      await supabase
        .from('scope_items')
        .insert(scopeItems)
    }

    // Initialize workflows from template
    if (template.default_workflows) {
      // Implementation for workflow initialization
    }
  }

  async createDefaultScopeItems(projectId: string, projectType: string) {
    const defaultCategories = this.getDefaultCategoriesForType(projectType)
    
    const scopeItems = defaultCategories.map(category => ({
      project_id: projectId,
      category,
      title: `${category} Work`,
      description: `Default ${category} scope for ${projectType} project`,
      status: 'not_started',
      progress_percentage: 0,
      priority: 1
    }))

    await supabase
      .from('scope_items')
      .insert(scopeItems)
  }

  private getDefaultCategoriesForType(projectType: string): string[] {
    const categoryMap = {
      'commercial': ['construction', 'electrical', 'mechanical', 'millwork'],
      'residential': ['construction', 'electrical', 'mechanical'],
      'industrial': ['construction', 'electrical', 'mechanical'],
      'renovation': ['construction', 'electrical', 'millwork'],
      'tenant_improvement': ['construction', 'electrical', 'mechanical', 'millwork'],
      'infrastructure': ['construction', 'electrical', 'mechanical']
    }

    return categoryMap[projectType as keyof typeof categoryMap] || ['construction']
  }

  async initializeProjectStructure(projectId: string) {
    // Create default document folders
    const folders = [
      'contracts',
      'shop_drawings',
      'material_specs', 
      'reports',
      'photos',
      'permits',
      'correspondence'
    ]

    // This would create folder structure in Supabase Storage
    for (const folder of folders) {
      await supabase.storage
        .from('project-documents')
        .upload(`${projectId}/${folder}/.keep`, new Blob(['']))
    }
  }

  async notifyTeamMembers(projectId: string, assignments: any[]) {
    const notifications = assignments.map(assignment => ({
      user_id: assignment.user_id,
      title: 'New Project Assignment',
      message: `You have been assigned to a new project as ${assignment.role.replace('_', ' ')}`,
      type: 'project_assignment',
      action_url: `/projects/${projectId}`,
      project_id: projectId
    }))

    await supabase
      .from('notifications')
      .insert(notifications)
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    const { data, error } = await supabase
      .from('project_templates')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  async duplicateProject(sourceProjectId: string, newProjectData: Partial<Project>): Promise<Project> {
    // Implementation for project duplication
    // This would copy structure, scope items, team assignments, etc.
    throw new Error('Not implemented yet')
  }
}

export const projectService = new ProjectService()
```

---

## **📊 Project Dashboard Overview**

### **Individual Project Dashboard**
```typescript
// components/projects/ProjectDashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  DollarSign, 
  Users, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'

interface ProjectDashboardProps {
  projectId: string
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ projectId }) => {
  const [project, setProject] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const { canViewPricing } = usePermissions()

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    // Fetch project details and statistics
    // This would be implemented with actual API calls
  }

  if (!project) {
    return <div>Loading project...</div>
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
          <div className="flex items-center space-x-4 mt-4">
            <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
              {project.status.replace('_', ' ')}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {new Date(project.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.progress}%</div>
            <Progress value={project.progress} className="mt-2" />
          </CardContent>
        </Card>

        {canViewPricing() && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(project.actual_cost || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                of ${project.budget.toLocaleString()} budget
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.team_size || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.days_remaining || 0}</div>
            <p className="text-xs text-muted-foreground">
              Until project completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Project Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="scope">Scope</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Project overview content */}
        </TabsContent>

        <TabsContent value="scope" className="space-y-4">
          {/* Scope management content */}
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          {/* Team management content */}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          {/* Document management content */}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Reporting content */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Project Creation System Implementation
OBJECTIVE: Deploy comprehensive project creation with team assignments and workflow initialization
CONTEXT: Complete project management foundation with multi-user support and template system

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Database: @Planing App/Wave-1-Foundation/database-schema-design.md
- Auth: @Planing App/Wave-1-Foundation/authentication-system.md
- UI Framework: @Planing App/Wave-1-Foundation/core-ui-framework.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement multi-step project creation form with validation
2. Create team assignment system with role-based access
3. Build project template system for standardization
4. Implement project dashboard with role-appropriate views
5. Set up project initialization workflows

DELIVERABLES:
1. Complete project creation form with all 7 steps
2. Team assignment interface with permission controls
3. Project service with template and initialization logic
4. Project dashboard with metrics and navigation
5. Project template management system
```

### **Quality Gates**
- ✅ Multi-step form validates all required project data
- ✅ Team assignment respects user roles and permissions
- ✅ Project creation initializes all required workflows
- ✅ Dashboard adapts to user permissions and role
- ✅ Template system accelerates project setup

### **Dependencies for Next Wave**
- Project creation system must be fully functional
- Team assignment workflow validated for all roles
- Dashboard provides appropriate access for each user type
- Template system ready for scope management integration

---

## **🎯 SUCCESS CRITERIA**
1. **Project Creation**: Complete multi-step form with validation and team assignment
2. **Team Management**: Role-based assignment with appropriate access levels
3. **Dashboard Functionality**: Comprehensive project overview with role-appropriate data
4. **Template System**: Standardized project initialization workflows
5. **Integration Ready**: Foundation supports Wave 2 scope and document management

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md