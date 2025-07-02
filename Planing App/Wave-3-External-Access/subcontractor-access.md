# Subcontractor Access System - Wave 3 External Access
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a secure subcontractor access system providing limited external access for progress reporting, task management, and project coordination for external construction subcontractors.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Client Portal ready - spawn after client portal complete):**
1. **Subcontractor Authentication**: Secure external access with limited permissions
2. **Task Assignment Interface**: View and update assigned tasks and deliverables
3. **Progress Reporting System**: Mobile-optimized reporting with photo upload
4. **Document Access Control**: Limited document access for assigned work

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Subcontractor Performance Tracking**: Quality and delivery metrics
6. **Payment Coordination Interface**: Invoice and payment status tracking

---

## **🔨 Subcontractor Access Data Structure**

### **Enhanced Subcontractor Schema**
```typescript
// types/subcontractorAccess.ts
export interface SubcontractorUser {
  id: string
  user_profile_id: string
  
  // Company Information
  company_name: string
  company_license: string
  insurance_certificate: string
  bonding_capacity: number
  
  // Contact Information
  primary_contact: ContactInfo
  field_supervisor: ContactInfo
  office_contact: ContactInfo
  
  // Access Control
  access_level: SubcontractorAccessLevel
  assigned_projects: SubcontractorProjectAssignment[]
  permissions: SubcontractorPermission[]
  portal_access_enabled: boolean
  
  // Specializations
  trade_specializations: TradeSpecialization[]
  equipment_capabilities: EquipmentCapability[]
  crew_size_range: CrewSizeRange
  geographic_coverage: string[]
  
  // Performance & Compliance
  safety_rating: number
  quality_rating: number
  timeliness_rating: number
  communication_rating: number
  overall_performance: number
  
  // Compliance Status
  insurance_valid: boolean
  license_valid: boolean
  safety_training_current: boolean
  drug_testing_compliant: boolean
  
  // Financial
  payment_terms: string
  preferred_payment_method: string
  w9_on_file: boolean
  credit_approved: boolean
  
  // Tracking
  created_by: string
  created_at: string
  last_activity: string
  active_status: SubcontractorStatus
}

export type SubcontractorAccessLevel = 
  | 'basic'
  | 'standard'
  | 'premium'
  | 'restricted'

export type SubcontractorStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'probation'
  | 'blacklisted'

export interface ContactInfo {
  name: string
  title: string
  email: string
  phone: string
  mobile: string
  emergency_contact: boolean
}

export interface SubcontractorProjectAssignment {
  id: string
  project_id: string
  subcontractor_id: string
  
  // Assignment Details
  scope_items: string[]
  work_description: string
  contract_value: number
  start_date: string
  completion_date: string
  
  // Work Authorization
  work_order_number: string
  purchase_order_reference: string
  contract_reference: string
  
  // Access Permissions
  document_access_level: 'none' | 'limited' | 'full'
  drawing_access: boolean
  specification_access: boolean
  can_upload_documents: boolean
  
  // Progress Tracking
  completion_percentage: number
  milestones: SubcontractorMilestone[]
  deliverables: SubcontractorDeliverable[]
  
  // Status
  assignment_status: AssignmentStatus
  performance_rating: number
  
  // Relationships
  reports_to: string // PM or supervisor ID
  coordinates_with: string[] // Other subcontractor IDs
  
  created_at: string
  updated_at: string
}

export type AssignmentStatus = 
  | 'pending'
  | 'active'
  | 'in_progress'
  | 'completed'
  | 'suspended'
  | 'terminated'

export interface SubcontractorPermission {
  resource: string
  actions: string[]
  project_id?: string
  scope_item_id?: string
  granted_by: string
  granted_at: string
  expires_at?: string
}

export interface TradeSpecialization {
  trade_name: string
  experience_years: number
  certifications: string[]
  speciality_areas: string[]
  crew_capacity: number
}

export interface EquipmentCapability {
  equipment_type: string
  equipment_models: string[]
  capacity: string
  availability: 'owned' | 'leased' | 'partner'
}

export interface CrewSizeRange {
  minimum_crew: number
  maximum_crew: number
  typical_crew: number
  surge_capacity: number
}

export interface SubcontractorMilestone {
  id: string
  name: string
  description: string
  target_date: string
  completion_date?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  completion_percentage: number
  deliverables_required: string[]
}

export interface SubcontractorDeliverable {
  id: string
  name: string
  description: string
  deliverable_type: DeliverableType
  due_date: string
  submitted_date?: string
  approval_status: 'pending' | 'submitted' | 'approved' | 'rejected'
  rejection_reason?: string
  file_attachments: string[]
}

export type DeliverableType = 
  | 'progress_report'
  | 'quality_documentation'
  | 'safety_documentation'
  | 'material_certificates'
  | 'test_results'
  | 'as_built_documentation'
  | 'warranty_information'

export interface SubcontractorTask {
  id: string
  project_id: string
  subcontractor_id: string
  scope_item_id?: string
  
  // Task Information
  task_title: string
  task_description: string
  work_location: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Scheduling
  scheduled_start: string
  scheduled_end: string
  actual_start?: string
  actual_end?: string
  estimated_hours: number
  actual_hours?: number
  
  // Resources
  crew_size_required: number
  equipment_required: string[]
  materials_required: MaterialRequirement[]
  
  // Dependencies
  prerequisite_tasks: string[]
  blocking_tasks: string[]
  coordinates_with: string[]
  
  // Progress
  completion_percentage: number
  status: TaskStatus
  quality_checkpoints: QualityCheckpoint[]
  
  // Reporting
  daily_reports: DailyProgressReport[]
  issues_reported: TaskIssue[]
  photos_uploaded: TaskPhoto[]
  
  // Approval
  requires_inspection: boolean
  inspection_status: 'pending' | 'scheduled' | 'completed' | 'failed'
  inspector_notes?: string
  
  created_by: string
  assigned_by: string
  created_at: string
  updated_at: string
}

export type TaskStatus = 
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'pending_materials'
  | 'pending_inspection'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export interface MaterialRequirement {
  material_name: string
  quantity: number
  unit: string
  specification: string
  supplier_provided: boolean
  delivery_date?: string
}

export interface QualityCheckpoint {
  id: string
  checkpoint_name: string
  description: string
  required_at_percentage: number
  status: 'pending' | 'completed' | 'failed'
  inspection_date?: string
  inspector: string
  notes?: string
  photos: string[]
}

export interface DailyProgressReport {
  id: string
  report_date: string
  weather_conditions: WeatherConditions
  crew_present: CrewInfo[]
  work_completed: string
  percentage_progress: number
  hours_worked: number
  materials_used: MaterialUsage[]
  equipment_used: EquipmentUsage[]
  safety_incidents: SafetyIncident[]
  quality_issues: QualityIssue[]
  delays_encountered: DelayReport[]
  next_day_plan: string
  photos: string[]
  submitted_by: string
  submitted_at: string
}

export interface WeatherConditions {
  temperature_high: number
  temperature_low: number
  humidity: number
  wind_speed: number
  precipitation: number
  conditions: string
  work_impact: 'none' | 'minor' | 'moderate' | 'severe'
}

export interface CrewInfo {
  worker_name: string
  trade: string
  hours_worked: number
  overtime_hours: number
  safety_training_current: boolean
}

export interface MaterialUsage {
  material_name: string
  quantity_used: number
  unit: string
  waste_percentage: number
  supplier: string
}

export interface EquipmentUsage {
  equipment_type: string
  equipment_id: string
  hours_used: number
  operator: string
  fuel_consumption?: number
  maintenance_notes?: string
}

export interface SafetyIncident {
  incident_type: string
  severity: 'near_miss' | 'first_aid' | 'medical_attention' | 'lost_time'
  description: string
  people_involved: string[]
  corrective_actions: string
  reported_to: string[]
}

export interface QualityIssue {
  issue_type: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  description: string
  location: string
  corrective_action: string
  responsible_party: string
  resolution_date?: string
}

export interface DelayReport {
  delay_type: string
  delay_cause: string
  duration_hours: number
  impact_description: string
  mitigation_actions: string
  responsible_party: string
}

export interface TaskIssue {
  id: string
  issue_type: IssueType
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: string
  reported_date: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to?: string
  resolution_notes?: string
  resolution_date?: string
  photos: string[]
}

export type IssueType = 
  | 'safety_concern'
  | 'quality_defect'
  | 'material_shortage'
  | 'equipment_failure'
  | 'design_clarification'
  | 'access_problem'
  | 'weather_delay'
  | 'coordination_conflict'

export interface TaskPhoto {
  id: string
  photo_path: string
  photo_type: PhotoType
  description: string
  location: string
  timestamp: string
  gps_coordinates?: GPSCoordinates
  uploaded_by: string
  tags: string[]
}

export type PhotoType = 
  | 'progress'
  | 'quality_control'
  | 'safety_documentation'
  | 'before_work'
  | 'after_work'
  | 'issue_documentation'
  | 'material_delivery'
  | 'equipment_setup'

export interface GPSCoordinates {
  latitude: number
  longitude: number
  accuracy: number
}
```

---

## **🔨 Subcontractor Dashboard Interface**

### **Main Subcontractor Dashboard**
```typescript
// components/subcontractor/SubcontractorDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Hammer, 
  ClipboardList, 
  Camera, 
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Users,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react'
import { SubcontractorProjectAssignment, SubcontractorTask } from '@/types/subcontractorAccess'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

export const SubcontractorDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'reports' | 'documents'>('overview')
  const { profile } = useAuth()
  const { toast } = useToast()

  // Fetch subcontractor assignments
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['subcontractor-assignments', profile?.id],
    queryFn: () => fetchSubcontractorAssignments(profile?.id),
    enabled: !!profile?.id
  })

  // Fetch active tasks
  const { data: activeTasks } = useQuery({
    queryKey: ['subcontractor-tasks', profile?.id],
    queryFn: () => fetchSubcontractorTasks(profile?.id),
    enabled: !!profile?.id
  })

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['subcontractor-stats', profile?.id],
    queryFn: () => fetchSubcontractorStats(profile?.id),
    enabled: !!profile?.id
  })

  if (isLoading) {
    return <div>Loading your assignments...</div>
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-800 text-white p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {profile?.company_name}!</h1>
            <p className="text-orange-100 mt-1">
              Manage your assignments and track progress
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{assignments?.length || 0}</div>
            <div className="text-orange-200 text-sm">Active Projects</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.activeTasks || 0}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.completedThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tasks finished
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.pendingReports || 0}</div>
            <p className="text-xs text-muted-foreground">
              Due today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.performanceScore || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Overall rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Active Assignments</CardTitle>
                <CardDescription>
                  Your current project assignments and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments?.slice(0, 3).map((assignment) => (
                    <AssignmentCard 
                      key={assignment.id}
                      assignment={assignment}
                    />
                  ))}
                </div>
                
                {assignments && assignments.length > 3 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All {assignments.length} Assignments
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Urgent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Urgent Tasks
                </CardTitle>
                <CardDescription>
                  High priority tasks requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeTasks?.filter(task => task.priority === 'urgent' || task.priority === 'high')
                    .slice(0, 4).map((task) => (
                    <UrgentTaskCard 
                      key={task.id}
                      task={task}
                    />
                  ))}
                </div>
                
                {!activeTasks?.some(task => task.priority === 'urgent' || task.priority === 'high') && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No urgent tasks at this time
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                Tasks and activities scheduled for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TodaySchedule tasks={activeTasks || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <SubcontractorTasksView 
            tasks={activeTasks || []}
            subcontractorId={profile?.id || ''}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <SubcontractorReportsView 
            subcontractorId={profile?.id || ''}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <SubcontractorDocumentsView 
            assignments={assignments || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Assignment Card Component
const AssignmentCard: React.FC<{ 
  assignment: SubcontractorProjectAssignment 
}> = ({ assignment }) => {
  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'active': 'bg-green-100 text-green-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors['pending']
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold">Project Assignment #{assignment.work_order_number}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {assignment.work_description}
            </p>
          </div>
          <Badge className={getStatusColor(assignment.assignment_status)}>
            {assignment.assignment_status.replace('_', ' ')}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{assignment.completion_percentage}%</span>
          </div>
          <Progress value={assignment.completion_percentage} className="h-2" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div>
            <div className="text-muted-foreground">Start Date</div>
            <div>{new Date(assignment.start_date).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Due Date</div>
            <div>{new Date(assignment.completion_date).toLocaleDateString()}</div>
          </div>
        </div>
        
        <Button size="sm" variant="outline" className="w-full mt-3">
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

// Urgent Task Card Component
const UrgentTaskCard: React.FC<{ task: SubcontractorTask }> = ({ task }) => {
  const isOverdue = new Date(task.scheduled_end) < new Date()
  
  return (
    <div className={`p-3 border rounded-lg ${isOverdue ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h5 className="font-medium text-sm">{task.task_title}</h5>
          <p className="text-xs text-muted-foreground">
            {task.work_location} • Due {new Date(task.scheduled_end).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={task.priority === 'urgent' ? 'destructive' : 'default'} className="text-xs">
            {task.priority}
          </Badge>
          <Button size="sm">
            Start
          </Button>
        </div>
      </div>
    </div>
  )
}

// Today's Schedule Component
const TodaySchedule: React.FC<{ tasks: SubcontractorTask[] }> = ({ tasks }) => {
  const today = new Date().toDateString()
  const todayTasks = tasks.filter(task => 
    new Date(task.scheduled_start).toDateString() === today ||
    new Date(task.scheduled_end).toDateString() === today ||
    (new Date(task.scheduled_start) <= new Date() && new Date(task.scheduled_end) >= new Date())
  )

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks scheduled for today
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todayTasks.map((task) => (
        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <div>
              <div className="font-medium">{task.task_title}</div>
              <div className="text-sm text-muted-foreground">
                {task.work_location} • {task.estimated_hours}h estimated
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{task.status.replace('_', ' ')}</Badge>
            <Button size="sm" variant="outline">
              <Camera className="h-3 w-3 mr-1" />
              Report
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## **📱 Mobile Progress Reporting**

### **Mobile Reporting Interface**
```typescript
// components/subcontractor/MobileProgressReporting.tsx
'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Camera, 
  MapPin, 
  Clock, 
  Users,
  AlertTriangle,
  CheckCircle,
  Upload,
  X,
  Plus
} from 'lucide-react'
import { DailyProgressReport, TaskPhoto, WeatherConditions } from '@/types/subcontractorAccess'
import { useToast } from '@/components/ui/use-toast'

interface MobileProgressReportingProps {
  taskId: string
  projectId: string
  onSubmit: (report: Partial<DailyProgressReport>) => void
}

export const MobileProgressReporting: React.FC<MobileProgressReportingProps> = ({
  taskId,
  projectId,
  onSubmit
}) => {
  const [reportData, setReportData] = useState<Partial<DailyProgressReport>>({
    report_date: new Date().toISOString().split('T')[0],
    weather_conditions: {
      temperature_high: 0,
      temperature_low: 0,
      humidity: 0,
      wind_speed: 0,
      precipitation: 0,
      conditions: '',
      work_impact: 'none'
    },
    crew_present: [],
    work_completed: '',
    percentage_progress: 0,
    hours_worked: 0,
    materials_used: [],
    equipment_used: [],
    safety_incidents: [],
    quality_issues: [],
    delays_encountered: [],
    next_day_plan: '',
    photos: []
  })
  
  const [photos, setPhotos] = useState<File[]>([])
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Get GPS location
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => console.log('Location access denied:', error)
      )
    }
  }, [])

  const handlePhotoCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newPhotos = Array.from(files)
      setPhotos(prev => [...prev, ...newPhotos])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    try {
      // Upload photos first
      const photoUrls: string[] = []
      for (const photo of photos) {
        const formData = new FormData()
        formData.append('photo', photo)
        formData.append('task_id', taskId)
        formData.append('photo_type', 'progress')
        
        if (location) {
          formData.append('gps_lat', location.coords.latitude.toString())
          formData.append('gps_lng', location.coords.longitude.toString())
        }

        const response = await fetch('/api/subcontractor/upload-photo', {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const result = await response.json()
          photoUrls.push(result.photo_url)
        }
      }

      // Submit report with photo URLs
      const completeReport = {
        ...reportData,
        photos: photoUrls,
        submitted_by: 'current_user_id', // Replace with actual user ID
        submitted_at: new Date().toISOString()
      }

      onSubmit(completeReport)
      
      toast({
        title: "Report Submitted",
        description: "Your daily progress report has been submitted successfully.",
      })
      
      // Reset form
      setReportData({})
      setPhotos([])
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit progress report. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClipboardList className="h-5 w-5 mr-2" />
            Daily Progress Report
          </CardTitle>
          {location && (
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" />
              Location: {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-date">Report Date</Label>
              <Input
                id="report-date"
                type="date"
                value={reportData.report_date}
                onChange={(e) => setReportData(prev => ({ ...prev, report_date: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="hours-worked">Hours Worked</Label>
              <Input
                id="hours-worked"
                type="number"
                placeholder="8.0"
                value={reportData.hours_worked}
                onChange={(e) => setReportData(prev => ({ ...prev, hours_worked: parseFloat(e.target.value) }))}
              />
            </div>
          </div>

          {/* Weather Conditions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weather Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temp-high">High Temperature (°F)</Label>
                  <Input
                    id="temp-high"
                    type="number"
                    placeholder="75"
                    value={reportData.weather_conditions?.temperature_high}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      weather_conditions: {
                        ...prev.weather_conditions!,
                        temperature_high: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="temp-low">Low Temperature (°F)</Label>
                  <Input
                    id="temp-low"
                    type="number"
                    placeholder="65"
                    value={reportData.weather_conditions?.temperature_low}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      weather_conditions: {
                        ...prev.weather_conditions!,
                        temperature_low: parseInt(e.target.value)
                      }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="conditions">Conditions</Label>
                  <Select 
                    value={reportData.weather_conditions?.conditions}
                    onValueChange={(value) => setReportData(prev => ({
                      ...prev,
                      weather_conditions: {
                        ...prev.weather_conditions!,
                        conditions: value
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="partly_cloudy">Partly Cloudy</SelectItem>
                      <SelectItem value="overcast">Overcast</SelectItem>
                      <SelectItem value="light_rain">Light Rain</SelectItem>
                      <SelectItem value="heavy_rain">Heavy Rain</SelectItem>
                      <SelectItem value="snow">Snow</SelectItem>
                      <SelectItem value="windy">Windy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="work-impact">Work Impact</Label>
                  <Select 
                    value={reportData.weather_conditions?.work_impact}
                    onValueChange={(value: any) => setReportData(prev => ({
                      ...prev,
                      weather_conditions: {
                        ...prev.weather_conditions!,
                        work_impact: value
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Impact</SelectItem>
                      <SelectItem value="minor">Minor Impact</SelectItem>
                      <SelectItem value="moderate">Moderate Impact</SelectItem>
                      <SelectItem value="severe">Severe Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Progress */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="work-completed">Work Completed Today</Label>
              <Textarea
                id="work-completed"
                placeholder="Describe the work completed today..."
                value={reportData.work_completed}
                onChange={(e) => setReportData(prev => ({ ...prev, work_completed: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="progress-percentage">Progress Percentage</Label>
              <Input
                id="progress-percentage"
                type="number"
                min="0"
                max="100"
                placeholder="75"
                value={reportData.percentage_progress}
                onChange={(e) => setReportData(prev => ({ ...prev, percentage_progress: parseInt(e.target.value) }))}
              />
            </div>
            
            <div>
              <Label htmlFor="next-day-plan">Next Day Plan</Label>
              <Textarea
                id="next-day-plan"
                placeholder="Plan for tomorrow's work..."
                value={reportData.next_day_plan}
                onChange={(e) => setReportData(prev => ({ ...prev, next_day_plan: e.target.value }))}
                rows={2}
              />
            </div>
          </div>

          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Camera className="h-4 w-4 mr-2" />
                Progress Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Take Photos
                </Button>
                
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Progress photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button onClick={handleSubmit} className="w-full" size="lg">
            <Upload className="h-4 w-4 mr-2" />
            Submit Daily Report
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Subcontractor Access System Implementation
OBJECTIVE: Deploy secure external access system for subcontractors with limited permissions, task management, and mobile reporting
CONTEXT: External-facing system for construction subcontractors with role-based access, progress reporting, and project coordination

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Client Portal: @Planing App/Wave-3-External-Access/client-portal-system.md
- Authentication: @Planing App/Wave-1-Foundation/authentication-system.md
- Task Management: Scope and project systems from Wave 2
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement secure subcontractor authentication with limited permissions
2. Build subcontractor-focused dashboard with assigned tasks and projects
3. Create mobile-optimized progress reporting system with photo upload
4. Develop task assignment and tracking interface
5. Implement limited document access control for assigned work
6. Build performance tracking and evaluation system
7. Create payment coordination and invoice management
8. Implement safety and compliance tracking

DELIVERABLES:
1. Complete subcontractor authentication and access control system
2. Subcontractor dashboard with task and assignment management
3. Mobile progress reporting interface with GPS and photo capabilities
4. Task assignment and tracking system
5. Limited document access control system
6. Performance tracking and evaluation dashboard
7. Payment coordination interface
8. Safety and compliance monitoring system
```

### **Quality Gates**
- ✅ Subcontractor authentication provides secure limited external access
- ✅ Dashboard displays only assigned tasks and authorized project information
- ✅ Mobile reporting system works offline and syncs when connected
- ✅ Task management enables clear assignment and progress tracking
- ✅ Document access restricts viewing to authorized project materials
- ✅ Performance tracking provides fair and transparent evaluation
- ✅ Payment interface facilitates invoice and payment coordination
- ✅ Safety tracking ensures compliance monitoring and reporting

### **Dependencies for Next Wave**
- Subcontractor access system must be fully secure and functional
- Mobile reporting validated for field use and photo upload
- Task assignment integration tested with project management
- Document access controls verified for security compliance
- Performance tracking ready for evaluation workflows

---

## **🎯 SUCCESS CRITERIA**
1. **Secure Limited Access**: Robust external authentication with subcontractor-specific permissions
2. **Task Management**: Clear assignment visibility and progress tracking
3. **Mobile Reporting**: Field-optimized interface with GPS and photo capabilities
4. **Performance Tracking**: Fair and transparent evaluation system
5. **Safety Compliance**: Comprehensive safety monitoring and reporting

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md