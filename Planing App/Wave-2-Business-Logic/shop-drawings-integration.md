# Shop Drawings Integration - Wave 2 Business Logic
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive shop drawings management system with architectural team integration, version control, markup capabilities, and seamless approval workflows specifically designed for construction project documentation.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Wave 1 and Document Approval ready - spawn after both complete):**
1. **Architectural Drawing Management**: Drawing creation, upload, and organization system
2. **Drawing Markup & Annotation**: Interactive markup tools for review and feedback
3. **Version Control Integration**: Drawing version management with approval workflow
4. **Architectural Team Workflow**: Role-based access for design team members

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Auto-Drawing Generation**: Integration with CAD systems and automated processing
6. **Drawing Comparison Tools**: Visual diff between drawing versions

---

## **🏗️ Shop Drawings Data Structure**

### **Enhanced Shop Drawing Schema**
```typescript
// types/shopDrawings.ts
export interface ShopDrawing {
  id: string
  project_id: string
  scope_item_id?: string
  
  // Drawing Information
  drawing_number: string
  title: string
  description: string
  discipline: DrawingDiscipline
  drawing_type: DrawingType
  sheet_size: SheetSize
  scale: string
  
  // File Management
  file_path: string
  file_name: string
  file_size: number
  original_file_name: string
  thumbnail_path?: string
  preview_images: string[]
  
  // Version Control
  version: number
  revision_letter: string
  version_history: DrawingVersion[]
  is_latest_version: boolean
  supersedes_drawing_id?: string
  
  // Drawing Details
  drawing_date: string
  drawn_by: string
  checked_by?: string
  approved_by?: string
  
  // Approval Workflow
  approval_workflow_id: string
  approval_status: DrawingApprovalStatus
  current_approval_stage: string
  internal_approval_date?: string
  client_submission_date?: string
  client_approval_date?: string
  
  // Markup & Comments
  markups: DrawingMarkup[]
  comments: DrawingComment[]
  revision_clouds: RevisionCloud[]
  
  // Relations
  related_drawings: string[]
  dependent_drawings: string[]
  material_specs: string[]
  
  // Construction Details
  construction_phase: ConstructionPhase
  priority: number
  fabrication_start_date?: string
  installation_date?: string
  
  // Quality Control
  quality_check_required: boolean
  quality_check_passed: boolean
  quality_check_date?: string
  quality_check_by?: string
  
  // Client Interaction
  client_visible: boolean
  client_comments: ClientComment[]
  client_approval_required: boolean
  client_deadline?: string
  
  // Metadata
  tags: string[]
  keywords: string[]
  custom_fields: Record<string, any>
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  last_modified_by: string
}

export type DrawingDiscipline = 
  | 'architectural'
  | 'structural'
  | 'mechanical'
  | 'electrical'
  | 'plumbing'
  | 'fire_protection'
  | 'millwork'
  | 'interior'

export type DrawingType = 
  | 'floor_plan'
  | 'elevation'
  | 'section'
  | 'detail'
  | 'schedule'
  | 'specification'
  | 'assembly'
  | '3d_view'
  | 'isometric'

export type SheetSize = 
  | 'A0' | 'A1' | 'A2' | 'A3' | 'A4'
  | 'ARCH_A' | 'ARCH_B' | 'ARCH_C' | 'ARCH_D' | 'ARCH_E'
  | 'ANSI_A' | 'ANSI_B' | 'ANSI_C' | 'ANSI_D' | 'ANSI_E'

export type DrawingApprovalStatus = 
  | 'draft'
  | 'internal_review'
  | 'internal_approved'
  | 'submitted_to_client'
  | 'client_review'
  | 'client_approved'
  | 'client_rejected'
  | 'revision_required'
  | 'superseded'
  | 'cancelled'

export type ConstructionPhase = 
  | 'design_development'
  | 'construction_documents'
  | 'shop_drawings'
  | 'fabrication'
  | 'installation'
  | 'as_built'

export interface DrawingVersion {
  id: string
  shop_drawing_id: string
  version_number: number
  revision_letter: string
  file_path: string
  upload_date: string
  uploaded_by: string
  change_description: string
  approval_status: DrawingApprovalStatus
  superseded_at?: string
  file_size: number
  thumbnail_path?: string
}

export interface DrawingMarkup {
  id: string
  shop_drawing_id: string
  version_number: number
  
  // Markup Data
  markup_type: MarkupType
  coordinates: MarkupCoordinates
  properties: MarkupProperties
  
  // Content
  text?: string
  annotation?: string
  measurement?: MeasurementData
  
  // Author
  created_by: string
  created_at: string
  markup_role: 'architect' | 'engineer' | 'contractor' | 'client'
  
  // Status
  status: 'active' | 'resolved' | 'superseded'
  resolved_by?: string
  resolved_at?: string
}

export type MarkupType = 
  | 'text_annotation'
  | 'arrow'
  | 'circle'
  | 'rectangle'
  | 'line'
  | 'dimension'
  | 'revision_cloud'
  | 'highlight'
  | 'stamp'

export interface MarkupCoordinates {
  page_number: number
  x: number
  y: number
  width?: number
  height?: number
  points?: { x: number; y: number }[]
}

export interface MarkupProperties {
  color: string
  thickness: number
  opacity: number
  font_size?: number
  font_family?: string
  line_style?: 'solid' | 'dashed' | 'dotted'
  fill_color?: string
}

export interface MeasurementData {
  start_point: { x: number; y: number }
  end_point: { x: number; y: number }
  distance: number
  unit: string
  scale_factor: number
}

export interface RevisionCloud {
  id: string
  shop_drawing_id: string
  version_number: number
  coordinates: { x: number; y: number }[]
  revision_number: string
  description: string
  created_by: string
  created_at: string
}

export interface DrawingComment {
  id: string
  shop_drawing_id: string
  version_number: number
  
  comment_text: string
  comment_type: 'general' | 'revision_request' | 'clarification' | 'approval_condition'
  priority: 'low' | 'medium' | 'high'
  
  // Positioning
  page_number?: number
  x_coordinate?: number
  y_coordinate?: number
  
  // Status
  status: 'open' | 'in_progress' | 'resolved'
  assigned_to?: string
  due_date?: string
  
  // Relations
  parent_comment_id?: string
  replies: DrawingComment[]
  
  // Author
  author_id: string
  author_type: 'internal' | 'client'
  created_at: string
  updated_at: string
  resolved_at?: string
  resolved_by?: string
}

export interface ClientComment {
  id: string
  shop_drawing_id: string
  comment_text: string
  markup_data?: any
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'addressed' | 'resolved'
  created_at: string
  resolved_at?: string
}
```

---

## **🎨 Shop Drawings Management Interface**

### **Main Shop Drawings Component**
```typescript
// components/shopDrawings/ShopDrawingsManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileImage, 
  Plus, 
  Upload, 
  Filter, 
  Search,
  Eye,
  Download,
  Edit,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Grid,
  List
} from 'lucide-react'
import { ShopDrawing, DrawingDiscipline, DrawingApprovalStatus } from '@/types/shopDrawings'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'

interface ShopDrawingsManagerProps {
  projectId: string
}

export const ShopDrawingsManager: React.FC<ShopDrawingsManagerProps> = ({ 
  projectId 
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDiscipline, setSelectedDiscipline] = useState<DrawingDiscipline | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<DrawingApprovalStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDrawing, setSelectedDrawing] = useState<ShopDrawing | null>(null)
  
  const { profile } = useAuth()
  const { checkPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Check user permissions
  const canCreateDrawings = checkPermission('shop_drawings.create')
  const canEditDrawings = checkPermission('shop_drawings.edit')
  const canApproveDrawings = checkPermission('shop_drawings.approve.internal')

  // Fetch shop drawings
  const { data: drawings, isLoading } = useQuery({
    queryKey: ['shop-drawings', projectId, selectedDiscipline, selectedStatus, searchTerm],
    queryFn: () => fetchShopDrawings(projectId, {
      discipline: selectedDiscipline !== 'all' ? selectedDiscipline : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchTerm || undefined
    }),
  })

  // Fetch drawing statistics
  const { data: drawingStats } = useQuery({
    queryKey: ['drawing-stats', projectId],
    queryFn: () => fetchDrawingStatistics(projectId),
  })

  const uploadDrawingMutation = useMutation({
    mutationFn: (formData: FormData) => uploadShopDrawing(projectId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries(['shop-drawings', projectId])
      toast({
        title: "Drawing Uploaded",
        description: "Shop drawing has been uploaded successfully.",
      })
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload drawing. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleDrawingUpload = async (files: FileList) => {
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('drawings', files[i])
    }
    formData.append('uploaded_by', profile?.id || '')
    
    uploadDrawingMutation.mutate(formData)
  }

  const filteredDrawings = drawings?.filter(drawing => {
    const matchesSearch = !searchTerm || 
      drawing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drawing.drawing_number.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDiscipline = selectedDiscipline === 'all' || drawing.discipline === selectedDiscipline
    const matchesStatus = selectedStatus === 'all' || drawing.approval_status === selectedStatus
    
    return matchesSearch && matchesDiscipline && matchesStatus
  }) || []

  if (isLoading) {
    return <div>Loading shop drawings...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Shop Drawings</h2>
          <p className="text-muted-foreground">
            Manage architectural and technical drawings for the project
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canCreateDrawings && (
            <>
              <input
                type="file"
                multiple
                accept=".pdf,.dwg,.dxf,.jpg,.png"
                onChange={(e) => e.target.files && handleDrawingUpload(e.target.files)}
                className="hidden"
                id="drawing-upload"
              />
              <Button asChild>
                <label htmlFor="drawing-upload" className="cursor-pointer flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload Drawings</span>
                </label>
              </Button>
              
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Drawing
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drawingStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all disciplines
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drawingStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drawingStats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for construction
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drawingStats?.revisions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requiring changes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search drawings by number, title, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedDiscipline} onValueChange={(value: any) => setSelectedDiscipline(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Disciplines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Disciplines</SelectItem>
                  <SelectItem value="architectural">Architectural</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="millwork">Millwork</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="internal_review">Internal Review</SelectItem>
                  <SelectItem value="internal_approved">Internal Approved</SelectItem>
                  <SelectItem value="submitted_to_client">Submitted to Client</SelectItem>
                  <SelectItem value="client_review">Client Review</SelectItem>
                  <SelectItem value="client_approved">Client Approved</SelectItem>
                  <SelectItem value="revision_required">Revision Required</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drawings Display */}
      {viewMode === 'grid' ? (
        <DrawingsGridView 
          drawings={filteredDrawings}
          onSelect={setSelectedDrawing}
          canEdit={canEditDrawings}
          canApprove={canApproveDrawings}
        />
      ) : (
        <DrawingsListView 
          drawings={filteredDrawings}
          onSelect={setSelectedDrawing}
          canEdit={canEditDrawings}
          canApprove={canApproveDrawings}
        />
      )}

      {/* Drawing Detail Modal */}
      {selectedDrawing && (
        <DrawingDetailModal
          drawing={selectedDrawing}
          onClose={() => setSelectedDrawing(null)}
          canEdit={canEditDrawings}
          canApprove={canApproveDrawings}
        />
      )}
    </div>
  )
}
```

### **Drawing Grid View Component**
```typescript
// components/shopDrawings/DrawingsGridView.tsx
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileImage, 
  Eye, 
  Download, 
  Edit, 
  MessageSquare,
  Clock,
  User,
  Calendar
} from 'lucide-react'
import { ShopDrawing } from '@/types/shopDrawings'

interface DrawingsGridViewProps {
  drawings: ShopDrawing[]
  onSelect: (drawing: ShopDrawing) => void
  canEdit: boolean
  canApprove: boolean
}

export const DrawingsGridView: React.FC<DrawingsGridViewProps> = ({
  drawings,
  onSelect,
  canEdit,
  canApprove
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'internal_review': 'bg-blue-100 text-blue-800',
      'internal_approved': 'bg-green-100 text-green-800',
      'submitted_to_client': 'bg-yellow-100 text-yellow-800',
      'client_review': 'bg-orange-100 text-orange-800',
      'client_approved': 'bg-emerald-100 text-emerald-800',
      'client_rejected': 'bg-red-100 text-red-800',
      'revision_required': 'bg-amber-100 text-amber-800',
      'superseded': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || colors['draft']
  }

  const getDisciplineColor = (discipline: string) => {
    const colors = {
      'architectural': 'bg-blue-500',
      'structural': 'bg-gray-500',
      'mechanical': 'bg-red-500',
      'electrical': 'bg-yellow-500',
      'plumbing': 'bg-cyan-500',
      'fire_protection': 'bg-orange-500',
      'millwork': 'bg-green-500',
      'interior': 'bg-purple-500'
    }
    return colors[discipline as keyof typeof colors] || 'bg-gray-500'
  }

  const calculateApprovalProgress = (drawing: ShopDrawing): number => {
    // Calculate progress based on approval workflow stage
    const stageProgress = {
      'draft': 0,
      'internal_review': 25,
      'internal_approved': 50,
      'submitted_to_client': 60,
      'client_review': 75,
      'client_approved': 100,
      'client_rejected': 25,
      'revision_required': 25
    }
    return stageProgress[drawing.approval_status as keyof typeof stageProgress] || 0
  }

  if (drawings.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-12 text-center">
          <FileImage className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Drawings Found</h3>
          <p className="text-muted-foreground">
            No shop drawings match your current filter criteria.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {drawings.map((drawing) => {
        const progress = calculateApprovalProgress(drawing)
        
        return (
          <Card key={drawing.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              {/* Drawing Preview */}
              <div className="relative mb-3">
                {drawing.thumbnail_path ? (
                  <img 
                    src={drawing.thumbnail_path} 
                    alt={drawing.title}
                    className="w-full h-32 object-cover rounded-md border"
                  />
                ) : (
                  <div className="w-full h-32 bg-muted rounded-md border flex items-center justify-center">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                
                {/* Discipline indicator */}
                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${getDisciplineColor(drawing.discipline)}`} />
                
                {/* Version badge */}
                <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
                  {drawing.revision_letter}
                </Badge>
              </div>

              {/* Drawing Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {drawing.drawing_number}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {drawing.title}
                    </CardDescription>
                  </div>
                </div>

                {/* Status and Progress */}
                <div className="space-y-2">
                  <Badge className={`${getStatusColor(drawing.approval_status)} text-xs`}>
                    {drawing.approval_status.replace('_', ' ')}
                  </Badge>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Approval Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(drawing.drawing_date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span className="truncate">{drawing.drawn_by}</span>
                  </div>
                  
                  {drawing.comments.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{drawing.comments.length}</span>
                    </div>
                  )}
                  
                  {drawing.client_deadline && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(drawing.client_deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(drawing)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                <Button size="sm" variant="outline">
                  <Download className="h-3 w-3" />
                </Button>
                
                {canEdit && (
                  <Button size="sm" variant="outline">
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Urgent items indicator */}
              {drawing.client_deadline && new Date(drawing.client_deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center space-x-2 text-red-800 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>Due soon: {new Date(drawing.client_deadline).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

---

## **📐 Drawing Markup System**

### **Interactive Drawing Viewer with Markup**
```typescript
// components/shopDrawings/DrawingViewer.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  MessageSquare,
  Edit,
  Save,
  X,
  Circle,
  Square,
  ArrowRight,
  Type,
  Ruler
} from 'lucide-react'
import { ShopDrawing, DrawingMarkup, MarkupType } from '@/types/shopDrawings'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'

interface DrawingViewerProps {
  drawing: ShopDrawing
  onClose: () => void
  canEdit: boolean
  canMarkup: boolean
}

export const DrawingViewer: React.FC<DrawingViewerProps> = ({
  drawing,
  onClose,
  canEdit,
  canMarkup
}) => {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [markupMode, setMarkupMode] = useState<MarkupType | null>(null)
  const [selectedMarkup, setSelectedMarkup] = useState<DrawingMarkup | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  // Load drawing image
  useEffect(() => {
    loadDrawingImage()
  }, [drawing])

  const loadDrawingImage = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!canvas || !ctx) return

    const image = new Image()
    image.onload = () => {
      canvas.width = image.width
      canvas.height = image.height
      ctx.drawImage(image, 0, 0)
      drawExistingMarkups()
    }
    image.src = drawing.file_path
  }

  const drawExistingMarkups = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    
    if (!ctx) return

    drawing.markups.forEach(markup => {
      drawMarkup(ctx, markup)
    })
  }

  const drawMarkup = (ctx: CanvasRenderingContext2D, markup: DrawingMarkup) => {
    ctx.save()
    
    // Set markup properties
    ctx.strokeStyle = markup.properties.color
    ctx.lineWidth = markup.properties.thickness
    ctx.globalAlpha = markup.properties.opacity
    
    if (markup.properties.fill_color) {
      ctx.fillStyle = markup.properties.fill_color
    }

    switch (markup.markup_type) {
      case 'circle':
        ctx.beginPath()
        ctx.arc(
          markup.coordinates.x, 
          markup.coordinates.y, 
          markup.coordinates.width! / 2, 
          0, 
          2 * Math.PI
        )
        ctx.stroke()
        if (markup.properties.fill_color) ctx.fill()
        break
        
      case 'rectangle':
        ctx.beginPath()
        ctx.rect(
          markup.coordinates.x,
          markup.coordinates.y,
          markup.coordinates.width!,
          markup.coordinates.height!
        )
        ctx.stroke()
        if (markup.properties.fill_color) ctx.fill()
        break
        
      case 'line':
      case 'arrow':
        if (markup.coordinates.points && markup.coordinates.points.length >= 2) {
          ctx.beginPath()
          ctx.moveTo(markup.coordinates.points[0].x, markup.coordinates.points[0].y)
          for (let i = 1; i < markup.coordinates.points.length; i++) {
            ctx.lineTo(markup.coordinates.points[i].x, markup.coordinates.points[i].y)
          }
          ctx.stroke()
          
          // Draw arrow head if it's an arrow
          if (markup.markup_type === 'arrow' && markup.coordinates.points.length >= 2) {
            drawArrowHead(ctx, markup.coordinates.points)
          }
        }
        break
        
      case 'text_annotation':
        if (markup.text) {
          ctx.fillStyle = markup.properties.color
          ctx.font = `${markup.properties.font_size || 12}px ${markup.properties.font_family || 'Arial'}`
          ctx.fillText(markup.text, markup.coordinates.x, markup.coordinates.y)
        }
        break
    }
    
    ctx.restore()
  }

  const drawArrowHead = (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) => {
    const lastPoint = points[points.length - 1]
    const secondLastPoint = points[points.length - 2]
    
    const angle = Math.atan2(lastPoint.y - secondLastPoint.y, lastPoint.x - secondLastPoint.x)
    const headLength = 15
    
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(
      lastPoint.x - headLength * Math.cos(angle - Math.PI / 6),
      lastPoint.y - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(lastPoint.x, lastPoint.y)
    ctx.lineTo(
      lastPoint.x - headLength * Math.cos(angle + Math.PI / 6),
      lastPoint.y - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!markupMode || !canMarkup) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    setIsDrawing(true)
    setCurrentPath([{ x, y }])

    if (markupMode === 'text_annotation') {
      setCommentPosition({ x, y })
      setShowCommentForm(true)
      setMarkupMode(null)
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !markupMode || !canMarkup) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = (e.clientX - rect.left) / zoom
    const y = (e.clientY - rect.top) / zoom

    setCurrentPath(prev => [...prev, { x, y }])
  }

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !currentPath.length || !markupMode) return

    setIsDrawing(false)
    
    // Create markup object
    const markup: Partial<DrawingMarkup> = {
      shop_drawing_id: drawing.id,
      version_number: drawing.version,
      markup_type: markupMode,
      coordinates: {
        page_number: 1,
        x: currentPath[0].x,
        y: currentPath[0].y,
        points: markupMode === 'line' || markupMode === 'arrow' ? currentPath : undefined,
        width: markupMode === 'circle' || markupMode === 'rectangle' 
          ? Math.abs(currentPath[currentPath.length - 1].x - currentPath[0].x) 
          : undefined,
        height: markupMode === 'rectangle' 
          ? Math.abs(currentPath[currentPath.length - 1].y - currentPath[0].y) 
          : undefined
      },
      properties: {
        color: '#ff0000',
        thickness: 2,
        opacity: 1,
        line_style: 'solid'
      },
      created_by: profile?.id || '',
      created_at: new Date().toISOString(),
      markup_role: profile?.role === 'client' ? 'client' : 'architect',
      status: 'active'
    }

    // Save markup
    saveMarkup(markup as DrawingMarkup)
    
    setCurrentPath([])
    setMarkupMode(null)
  }

  const saveMarkup = async (markup: DrawingMarkup) => {
    try {
      const response = await fetch(`/api/shop-drawings/${drawing.id}/markups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(markup)
      })

      if (response.ok) {
        toast({
          title: "Markup Saved",
          description: "Your markup has been added to the drawing.",
        })
        
        // Reload drawing to show new markup
        loadDrawingImage()
      } else {
        throw new Error('Failed to save markup')
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save markup. Please try again.",
        variant: "destructive"
      })
    }
  }

  const saveComment = async () => {
    if (!commentText.trim() || !commentPosition) return

    try {
      const comment = {
        shop_drawing_id: drawing.id,
        version_number: drawing.version,
        comment_text: commentText,
        comment_type: 'general',
        priority: 'medium',
        page_number: 1,
        x_coordinate: commentPosition.x,
        y_coordinate: commentPosition.y,
        author_id: profile?.id,
        author_type: profile?.role === 'client' ? 'client' : 'internal',
        status: 'open'
      }

      const response = await fetch(`/api/shop-drawings/${drawing.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(comment)
      })

      if (response.ok) {
        toast({
          title: "Comment Added",
          description: "Your comment has been added to the drawing.",
        })
        
        setShowCommentForm(false)
        setCommentText('')
        setCommentPosition(null)
      }
    } catch (error) {
      toast({
        title: "Comment Failed",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full h-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{drawing.drawing_number} - {drawing.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">Version {drawing.version}</Badge>
                <Badge variant="outline">Rev {drawing.revision_letter}</Badge>
                <Badge variant="outline" className="capitalize">{drawing.discipline}</Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
              <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(3, z + 0.1))}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              {/* Rotation */}
              <Button size="sm" variant="outline" onClick={() => setRotation(r => (r + 90) % 360)}>
                <RotateCw className="h-4 w-4" />
              </Button>
              
              {/* Markup Tools */}
              {canMarkup && (
                <div className="flex space-x-1 border-l pl-2">
                  <Button
                    size="sm"
                    variant={markupMode === 'text_annotation' ? 'default' : 'outline'}
                    onClick={() => setMarkupMode(markupMode === 'text_annotation' ? null : 'text_annotation')}
                  >
                    <Type className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={markupMode === 'arrow' ? 'default' : 'outline'}
                    onClick={() => setMarkupMode(markupMode === 'arrow' ? null : 'arrow')}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={markupMode === 'circle' ? 'default' : 'outline'}
                    onClick={() => setMarkupMode(markupMode === 'circle' ? null : 'circle')}
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={markupMode === 'rectangle' ? 'default' : 'outline'}
                    onClick={() => setMarkupMode(markupMode === 'rectangle' ? null : 'rectangle')}
                  >
                    <Square className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Drawing Canvas */}
        <CardContent className="flex-1 p-0 overflow-auto" ref={containerRef}>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto cursor-crosshair"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'top left'
              }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
            />
          </div>
        </CardContent>

        {/* Comment Form Modal */}
        {showCommentForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Card className="w-96">
              <CardHeader>
                <CardTitle>Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCommentForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={saveComment}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Comment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Shop Drawings Integration Implementation
OBJECTIVE: Deploy comprehensive shop drawings system with architectural team workflow and interactive markup capabilities
CONTEXT: Specialized drawing management for construction projects with version control, approval workflows, and client collaboration

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Document Approval: @Planing App/Wave-2-Business-Logic/document-approval-workflow.md
- Scope System: @Planing App/Wave-2-Business-Logic/scope-management-system.md
- UI Framework: @Planing App/Wave-1-Foundation/core-ui-framework.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement comprehensive shop drawings management system
2. Build interactive drawing viewer with markup capabilities
3. Create architectural team workflow with role-based permissions
4. Integrate with document approval workflow system
5. Implement version control for drawing revisions
6. Build client approval interface for external feedback
7. Create drawing comparison and change tracking tools

DELIVERABLES:
1. Complete shop drawings management interface with grid/list views
2. Interactive drawing viewer with markup tools (text, arrows, shapes)
3. Architectural team workflow with proper role assignments
4. Integration with document approval system
5. Version control system for drawing management
6. Client interface for drawing review and approval
7. Drawing upload and file management system
```

### **Quality Gates**
- ✅ Shop drawings system supports all architectural disciplines
- ✅ Interactive viewer allows precise markup and annotation
- ✅ Version control maintains complete drawing history
- ✅ Approval workflow integrates seamlessly with document system
- ✅ Client interface provides secure external access
- ✅ File upload handles multiple CAD and image formats
- ✅ Drawing comparison tools identify changes between versions

### **Dependencies for Next Wave**
- Shop drawings system must be fully functional
- Markup tools validated for precision and usability
- Approval workflow tested with real drawing submissions
- Client interface ready for external user testing
- Version control system handles concurrent edits

---

## **🎯 SUCCESS CRITERIA**
1. **Drawing Management**: Complete system for organizing and accessing architectural drawings
2. **Interactive Markup**: Precision markup tools for professional drawing review
3. **Workflow Integration**: Seamless connection with approval and notification systems
4. **Client Collaboration**: External portal for client review and feedback
5. **Version Control**: Comprehensive tracking of drawing changes and revisions

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md