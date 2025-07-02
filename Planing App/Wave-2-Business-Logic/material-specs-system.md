# Material Specifications System - Wave 2 Business Logic
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive material specifications management system with supplier integration, approval workflows, sample tracking, and procurement coordination for Formula PM 2.0 construction projects.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Document Approval and Shop Drawings ready - spawn after both complete):**
1. **Material Specification Management**: Detailed spec creation and organization
2. **Supplier Integration Workflow**: Supplier selection and coordination
3. **Sample & Submittal Tracking**: Physical sample management and approval
4. **Procurement Coordination**: Integration with purchase department workflow

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Material Cost Analytics**: Cost comparison and budget tracking
6. **Automated Procurement Workflows**: Smart ordering and delivery coordination

---

## **📋 Material Specifications Data Structure**

### **Enhanced Material Specification Schema**
```typescript
// types/materialSpecs.ts
export interface MaterialSpecification {
  id: string
  project_id: string
  scope_item_id: string
  
  // Basic Information
  spec_number: string
  name: string
  description: string
  category: MaterialCategory
  subcategory: string
  
  // Technical Specifications
  manufacturer?: string
  model_number?: string
  part_number?: string
  technical_specifications: TechnicalSpec[]
  performance_requirements: PerformanceRequirement[]
  
  // Standards & Compliance
  standards_compliance: string[]
  certifications_required: string[]
  environmental_ratings: EnvironmentalRating[]
  sustainability_requirements: SustainabilityRequirement[]
  
  // Physical Properties
  dimensions: Dimensions
  weight: Weight
  color_finish: ColorFinish
  material_composition: MaterialComposition[]
  
  // Procurement Information
  unit_of_measure: string
  quantity_required: number
  quantity_ordered: number
  quantity_delivered: number
  quantity_installed: number
  
  // Supplier & Pricing
  preferred_suppliers: string[]
  selected_supplier_id?: string
  supplier_quotes: SupplierQuote[]
  estimated_cost: number
  actual_cost?: number
  price_per_unit: number
  total_cost: number
  
  // Timeline
  specification_date: string
  required_by_date: string
  order_date?: string
  expected_delivery_date?: string
  actual_delivery_date?: string
  installation_date?: string
  
  // Approval & Samples
  requires_sample: boolean
  sample_status: SampleStatus
  sample_submitted_date?: string
  sample_approval_date?: string
  sample_rejection_reason?: string
  submittal_required: boolean
  submittal_status: SubmittalStatus
  
  // Client Interaction
  client_approval_required: boolean
  client_approved: boolean
  client_approval_date?: string
  client_comments: string[]
  alternatives_provided: MaterialAlternative[]
  
  // Documentation
  specification_documents: string[]
  installation_guides: string[]
  warranty_documents: string[]
  maintenance_requirements: MaintenanceRequirement[]
  
  // Quality Control
  quality_check_required: boolean
  quality_check_passed: boolean
  quality_inspection_notes: string[]
  defect_reports: DefectReport[]
  
  // Status & Workflow
  status: MaterialSpecStatus
  workflow_stage: MaterialWorkflowStage
  approval_history: MaterialApproval[]
  change_orders: MaterialChangeOrder[]
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  last_updated_by: string
  
  // Relations
  related_drawings: string[]
  related_scope_items: string[]
  substitution_requests: SubstitutionRequest[]
}

export type MaterialCategory = 
  | 'structural'
  | 'architectural'
  | 'mechanical'
  | 'electrical'
  | 'plumbing'
  | 'hvac'
  | 'finishes'
  | 'millwork'
  | 'hardware'
  | 'safety'
  | 'specialty'

export type MaterialSpecStatus = 
  | 'draft'
  | 'under_review'
  | 'approved'
  | 'sample_pending'
  | 'sample_approved'
  | 'sample_rejected'
  | 'procurement_pending'
  | 'ordered'
  | 'delivered'
  | 'installed'
  | 'rejected'
  | 'substitution_required'

export type MaterialWorkflowStage = 
  | 'specification'
  | 'technical_review'
  | 'cost_analysis'
  | 'client_approval'
  | 'supplier_selection'
  | 'sample_review'
  | 'procurement'
  | 'delivery'
  | 'installation'
  | 'quality_control'

export type SampleStatus = 
  | 'not_required'
  | 'requested'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'resubmission_required'

export type SubmittalStatus = 
  | 'not_required'
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revision_required'

export interface TechnicalSpec {
  id: string
  property_name: string
  value: string
  unit?: string
  tolerance?: string
  test_method?: string
  is_critical: boolean
}

export interface PerformanceRequirement {
  id: string
  requirement_type: string
  description: string
  target_value: string
  minimum_acceptable: string
  test_criteria: string
  compliance_standard?: string
}

export interface EnvironmentalRating {
  rating_type: string
  rating_value: string
  certification_body: string
  expiry_date?: string
}

export interface SustainabilityRequirement {
  criteria: string
  requirement: string
  certification?: string
  points_value?: number
}

export interface Dimensions {
  length?: number
  width?: number
  height?: number
  diameter?: number
  thickness?: number
  unit: string
  tolerance?: string
}

export interface Weight {
  value: number
  unit: string
  per_unit?: boolean
}

export interface ColorFinish {
  color: string
  finish_type: string
  gloss_level?: string
  texture?: string
  custom_color?: boolean
  color_matching_system?: string
}

export interface MaterialComposition {
  material: string
  percentage: number
  grade?: string
  source?: string
}

export interface SupplierQuote {
  id: string
  supplier_id: string
  quote_date: string
  unit_price: number
  total_price: number
  lead_time_days: number
  validity_date: string
  terms_conditions: string[]
  delivery_options: DeliveryOption[]
  quote_document_path?: string
  notes: string
}

export interface DeliveryOption {
  method: string
  cost: number
  estimated_days: number
  requirements: string[]
}

export interface MaterialAlternative {
  id: string
  name: string
  description: string
  manufacturer: string
  cost_difference: number
  performance_comparison: string
  approval_status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
}

export interface MaintenanceRequirement {
  frequency: string
  procedure: string
  required_materials: string[]
  estimated_cost: number
  responsible_party: string
}

export interface DefectReport {
  id: string
  reported_date: string
  reported_by: string
  defect_type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolution_status: 'open' | 'in_progress' | 'resolved'
  resolution_date?: string
  resolution_description?: string
  photos: string[]
}

export interface MaterialApproval {
  id: string
  approval_stage: string
  approver_id: string
  approval_date: string
  decision: 'approved' | 'rejected' | 'conditional'
  comments?: string
  conditions?: string[]
}

export interface MaterialChangeOrder {
  id: string
  change_type: 'specification' | 'quantity' | 'supplier' | 'timeline'
  description: string
  cost_impact: number
  schedule_impact_days: number
  requested_by: string
  requested_date: string
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_date?: string
}

export interface SubstitutionRequest {
  id: string
  original_spec_id: string
  proposed_material: MaterialSpecification
  reason: string
  cost_impact: number
  performance_impact: string
  requested_by: string
  requested_date: string
  review_status: 'pending' | 'approved' | 'rejected'
  review_comments?: string
}
```

---

## **📋 Material Specifications Management Interface**

### **Main Material Specs Component**
```typescript
// components/materialSpecs/MaterialSpecsManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Truck,
  ClipboardCheck,
  Eye,
  Edit,
  Download
} from 'lucide-react'
import { MaterialSpecification, MaterialCategory, MaterialSpecStatus } from '@/types/materialSpecs'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'

interface MaterialSpecsManagerProps {
  projectId: string
}

export const MaterialSpecsManager: React.FC<MaterialSpecsManagerProps> = ({ 
  projectId 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory | 'all'>('all')
  const [selectedStatus, setSelectedStatus] = useState<MaterialSpecStatus | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpec, setSelectedSpec] = useState<MaterialSpecification | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const { profile } = useAuth()
  const { checkPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Check permissions
  const canCreateSpecs = checkPermission('documents.create')
  const canEditSpecs = checkPermission('documents.update')
  const canApproveSpecs = checkPermission('documents.approve.internal')

  // Fetch material specifications
  const { data: materialSpecs, isLoading } = useQuery({
    queryKey: ['material-specs', projectId, selectedCategory, selectedStatus, searchTerm],
    queryFn: () => fetchMaterialSpecs(projectId, {
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search: searchTerm || undefined
    }),
  })

  // Fetch material specs statistics
  const { data: specsStats } = useQuery({
    queryKey: ['specs-stats', projectId],
    queryFn: () => fetchSpecsStatistics(projectId),
  })

  const createSpecMutation = useMutation({
    mutationFn: (specData: Partial<MaterialSpecification>) => createMaterialSpec(projectId, specData),
    onSuccess: () => {
      queryClient.invalidateQueries(['material-specs', projectId])
      toast({
        title: "Specification Created",
        description: "Material specification has been created successfully.",
      })
      setShowCreateForm(false)
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create material specification.",
        variant: "destructive"
      })
    }
  })

  const handleStatusUpdate = async (specId: string, newStatus: MaterialSpecStatus) => {
    try {
      await updateSpecStatus(specId, newStatus)
      queryClient.invalidateQueries(['material-specs', projectId])
      toast({
        title: "Status Updated",
        description: "Material specification status has been updated.",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update specification status.",
        variant: "destructive"
      })
    }
  }

  const filteredSpecs = materialSpecs?.filter(spec => {
    const matchesSearch = !searchTerm || 
      spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.spec_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      spec.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || spec.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || spec.status === selectedStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  }) || []

  if (isLoading) {
    return <div>Loading material specifications...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Material Specifications</h2>
          <p className="text-muted-foreground">
            Manage material specifications, samples, and procurement
          </p>
        </div>
        
        {canCreateSpecs && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Specification
          </Button>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Specs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specsStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Specifications created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specsStats?.pending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specsStats?.approved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Ready for procurement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Samples Pending</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specsStats?.samplesPending || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting samples
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{specsStats?.inTransit || 0}</div>
            <p className="text-xs text-muted-foreground">
              Being delivered
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
                  placeholder="Search specifications by name, number, or manufacturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                  <SelectItem value="architectural">Architectural</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="finishes">Finishes</SelectItem>
                  <SelectItem value="millwork">Millwork</SelectItem>
                  <SelectItem value="hardware">Hardware</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="sample_pending">Sample Pending</SelectItem>
                  <SelectItem value="sample_approved">Sample Approved</SelectItem>
                  <SelectItem value="procurement_pending">Procurement Pending</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="installed">Installed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Material Specifications Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Specifications</TabsTrigger>
          <TabsTrigger value="pending">Pending Approval</TabsTrigger>
          <TabsTrigger value="samples">Sample Review</TabsTrigger>
          <TabsTrigger value="procurement">Procurement</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <MaterialSpecsList 
            specs={filteredSpecs}
            onSelect={setSelectedSpec}
            onStatusUpdate={handleStatusUpdate}
            canEdit={canEditSpecs}
            canApprove={canApproveSpecs}
          />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <MaterialSpecsList 
            specs={filteredSpecs.filter(s => s.status === 'under_review')}
            onSelect={setSelectedSpec}
            onStatusUpdate={handleStatusUpdate}
            canEdit={canEditSpecs}
            canApprove={canApproveSpecs}
            showApprovalActions={true}
          />
        </TabsContent>

        <TabsContent value="samples" className="space-y-4">
          <SampleTrackingList 
            specs={filteredSpecs.filter(s => s.requires_sample && 
              ['sample_pending', 'sample_approved', 'sample_rejected'].includes(s.sample_status)
            )}
            onSelect={setSelectedSpec}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="procurement" className="space-y-4">
          <ProcurementTrackingList 
            specs={filteredSpecs.filter(s => 
              ['procurement_pending', 'ordered'].includes(s.status)
            )}
            onSelect={setSelectedSpec}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <DeliveryTrackingList 
            specs={filteredSpecs.filter(s => 
              ['ordered', 'delivered'].includes(s.status)
            )}
            onSelect={setSelectedSpec}
            onStatusUpdate={handleStatusUpdate}
          />
        </TabsContent>
      </Tabs>

      {/* Create Specification Modal */}
      {showCreateForm && (
        <CreateSpecificationModal
          projectId={projectId}
          onClose={() => setShowCreateForm(false)}
          onSubmit={(specData) => createSpecMutation.mutate(specData)}
        />
      )}

      {/* Specification Detail Modal */}
      {selectedSpec && (
        <SpecificationDetailModal
          specification={selectedSpec}
          onClose={() => setSelectedSpec(null)}
          onUpdate={handleStatusUpdate}
          canEdit={canEditSpecs}
          canApprove={canApproveSpecs}
        />
      )}
    </div>
  )
}
```

### **Material Specifications List Component**
```typescript
// components/materialSpecs/MaterialSpecsList.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Package, 
  DollarSign, 
  Calendar, 
  User,
  Eye,
  Edit,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Truck
} from 'lucide-react'
import { MaterialSpecification } from '@/types/materialSpecs'

interface MaterialSpecsListProps {
  specs: MaterialSpecification[]
  onSelect: (spec: MaterialSpecification) => void
  onStatusUpdate: (specId: string, status: any) => void
  canEdit: boolean
  canApprove: boolean
  showApprovalActions?: boolean
}

export const MaterialSpecsList: React.FC<MaterialSpecsListProps> = ({
  specs,
  onSelect,
  onStatusUpdate,
  canEdit,
  canApprove,
  showApprovalActions = false
}) => {
  const getStatusColor = (status: string) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'under_review': 'bg-blue-100 text-blue-800',
      'approved': 'bg-green-100 text-green-800',
      'sample_pending': 'bg-yellow-100 text-yellow-800',
      'sample_approved': 'bg-emerald-100 text-emerald-800',
      'sample_rejected': 'bg-red-100 text-red-800',
      'procurement_pending': 'bg-orange-100 text-orange-800',
      'ordered': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-purple-100 text-purple-800',
      'installed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || colors['draft']
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'structural': 'bg-gray-500',
      'architectural': 'bg-blue-500',
      'mechanical': 'bg-red-500',
      'electrical': 'bg-yellow-500',
      'plumbing': 'bg-cyan-500',
      'hvac': 'bg-green-500',
      'finishes': 'bg-purple-500',
      'millwork': 'bg-amber-500',
      'hardware': 'bg-orange-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'sample_approved':
      case 'installed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
      case 'sample_rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'ordered':
      case 'delivered':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'under_review':
      case 'sample_pending':
      case 'procurement_pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const calculateProcurementProgress = (spec: MaterialSpecification): number => {
    const stages = [
      'draft',
      'under_review', 
      'approved',
      'sample_approved',
      'procurement_pending',
      'ordered',
      'delivered',
      'installed'
    ]
    
    const currentIndex = stages.indexOf(spec.status)
    return currentIndex >= 0 ? ((currentIndex + 1) / stages.length) * 100 : 0
  }

  if (specs.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-muted-foreground">
            No material specifications found.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {specs.map((spec) => {
        const progress = calculateProcurementProgress(spec)
        
        return (
          <Card key={spec.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(spec.status)}
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(spec.category)}`} />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {spec.spec_number} - {spec.name}
                      </h3>
                      <Badge className={getStatusColor(spec.status)}>
                        {spec.status.replace('_', ' ')}
                      </Badge>
                      {spec.requires_sample && (
                        <Badge variant="outline">
                          Sample Required
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {spec.description}
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="capitalize">{spec.category}</span>
                      </div>
                      
                      {spec.manufacturer && (
                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="truncate">{spec.manufacturer}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span>${spec.estimated_cost.toLocaleString()}</span>
                      </div>
                      
                      {spec.required_by_date && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {new Date(spec.required_by_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Procurement Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Procurement Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    
                    {/* Quantity Information */}
                    <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Required</div>
                        <div className="font-medium">
                          {spec.quantity_required} {spec.unit_of_measure}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Ordered</div>
                        <div className="font-medium">
                          {spec.quantity_ordered} {spec.unit_of_measure}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Delivered</div>
                        <div className="font-medium">
                          {spec.quantity_delivered} {spec.unit_of_measure}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Installed</div>
                        <div className="font-medium">
                          {spec.quantity_installed} {spec.unit_of_measure}
                        </div>
                      </div>
                    </div>
                    
                    {/* Urgent items indicator */}
                    {spec.required_by_date && new Date(spec.required_by_date) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center space-x-2 text-red-800 text-xs">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Due soon: {new Date(spec.required_by_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onSelect(spec)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  {canEdit && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  
                  {showApprovalActions && canApprove && spec.status === 'under_review' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => onStatusUpdate(spec.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onStatusUpdate(spec.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

---

## **📦 Sample & Submittal Tracking**

### **Sample Tracking Component**
```typescript
// components/materialSpecs/SampleTrackingList.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  Clock,
  Upload,
  MessageSquare,
  Camera,
  FileText
} from 'lucide-react'
import { MaterialSpecification } from '@/types/materialSpecs'
import { useToast } from '@/components/ui/use-toast'

interface SampleTrackingListProps {
  specs: MaterialSpecification[]
  onSelect: (spec: MaterialSpecification) => void
  onStatusUpdate: (specId: string, status: any) => void
}

export const SampleTrackingList: React.FC<SampleTrackingListProps> = ({
  specs,
  onSelect,
  onStatusUpdate
}) => {
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const { toast } = useToast()

  const getSampleStatusColor = (status: string) => {
    const colors = {
      'not_required': 'bg-gray-100 text-gray-800',
      'requested': 'bg-blue-100 text-blue-800',
      'submitted': 'bg-yellow-100 text-yellow-800',
      'under_review': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'resubmission_required': 'bg-amber-100 text-amber-800'
    }
    return colors[status as keyof typeof colors] || colors['not_required']
  }

  const handleSampleApproval = async (
    specId: string, 
    decision: 'approved' | 'rejected',
    comments?: string
  ) => {
    try {
      const response = await fetch(`/api/material-specs/${specId}/sample-review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          comments,
          review_date: new Date().toISOString()
        })
      })

      if (response.ok) {
        const newStatus = decision === 'approved' ? 'sample_approved' : 'sample_rejected'
        onStatusUpdate(specId, newStatus)
        
        toast({
          title: "Sample Review Complete",
          description: `Sample has been ${decision}.`,
        })
        
        setSelectedSpec(null)
        setReviewComments('')
      }
    } catch (error) {
      toast({
        title: "Review Failed",
        description: "Failed to submit sample review.",
        variant: "destructive"
      })
    }
  }

  const uploadSamplePhoto = async (specId: string, file: File) => {
    const formData = new FormData()
    formData.append('sample_photo', file)
    formData.append('spec_id', specId)

    try {
      const response = await fetch(`/api/material-specs/${specId}/sample-photos`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast({
          title: "Photo Uploaded",
          description: "Sample photo has been uploaded successfully.",
        })
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload sample photo.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-4">
      {specs.map((spec) => (
        <Card key={spec.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {spec.spec_number} - {spec.name}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getSampleStatusColor(spec.sample_status)}>
                    {spec.sample_status.replace('_', ' ')}
                  </Badge>
                  {spec.manufacturer && (
                    <Badge variant="outline">{spec.manufacturer}</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {spec.sample_status === 'submitted' && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedSpec(selectedSpec === spec.id ? null : spec.id)}
                  >
                    Review Sample
                  </Button>
                )}
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && uploadSamplePhoto(spec.id, e.target.files[0])}
                  className="hidden"
                  id={`photo-upload-${spec.id}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <label htmlFor={`photo-upload-${spec.id}`} className="cursor-pointer">
                    <Camera className="h-4 w-4 mr-2" />
                    Add Photo
                  </label>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-muted-foreground">Sample Submitted</div>
                <div className="font-medium">
                  {spec.sample_submitted_date 
                    ? new Date(spec.sample_submitted_date).toLocaleDateString()
                    : 'Not submitted'
                  }
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Required By</div>
                <div className="font-medium">
                  {new Date(spec.required_by_date).toLocaleDateString()}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-muted-foreground">Quantity</div>
                <div className="font-medium">
                  {spec.quantity_required} {spec.unit_of_measure}
                </div>
              </div>
            </div>
            
            {spec.sample_rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                <div className="flex items-center space-x-2 text-red-800 text-sm">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Rejection Reason:</span>
                </div>
                <p className="text-red-700 text-sm mt-1">{spec.sample_rejection_reason}</p>
              </div>
            )}
            
            {/* Sample Review Form */}
            {selectedSpec === spec.id && (
              <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Sample Review</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Review Comments</label>
                    <Textarea
                      placeholder="Enter your review comments..."
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedSpec(null)}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => handleSampleApproval(spec.id, 'rejected', reviewComments)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Sample
                    </Button>
                    
                    <Button
                      onClick={() => handleSampleApproval(spec.id, 'approved', reviewComments)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve Sample
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      
      {specs.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No samples require review at this time.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Material Specifications System Implementation
OBJECTIVE: Deploy comprehensive material specs management with supplier integration, sample tracking, and procurement coordination
CONTEXT: Complete material management system for construction projects with approval workflows, cost tracking, and delivery coordination

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Document Approval: @Planing App/Wave-2-Business-Logic/document-approval-workflow.md
- Shop Drawings: @Planing App/Wave-2-Business-Logic/shop-drawings-integration.md
- Scope System: @Planing App/Wave-2-Business-Logic/scope-management-system.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement comprehensive material specifications management system
2. Build supplier integration workflow with quote comparison
3. Create sample and submittal tracking system
4. Develop procurement coordination with purchase department
5. Implement client approval workflow for material selections
6. Build cost tracking and budget analysis tools
7. Create delivery tracking and installation coordination
8. Implement quality control and defect reporting

DELIVERABLES:
1. Complete material specifications management interface
2. Supplier integration and quote comparison system
3. Sample tracking with photo upload and approval workflow
4. Procurement coordination with automated workflows
5. Client approval interface for material selections
6. Cost tracking and budget analysis tools
7. Delivery tracking and installation coordination system
8. Quality control and defect reporting functionality
```

### **Quality Gates**
- ✅ Material specs system supports all construction categories
- ✅ Supplier integration enables quote comparison and selection
- ✅ Sample tracking manages physical samples and approvals
- ✅ Procurement coordination automates ordering workflows
- ✅ Client approval interface provides material selection collaboration
- ✅ Cost tracking maintains accurate budget information
- ✅ Delivery tracking coordinates installation schedules
- ✅ Quality control identifies and tracks material defects

### **Dependencies for Next Wave**
- Material specs system must be fully functional
- Supplier integration tested with real vendor data
- Sample tracking validated with physical sample workflow
- Procurement coordination ready for purchase department integration
- Client approval system prepared for external access

---

## **🎯 SUCCESS CRITERIA**
1. **Comprehensive Management**: Complete material specification lifecycle management
2. **Supplier Integration**: Seamless vendor coordination and quote comparison
3. **Sample Tracking**: Efficient physical sample approval process
4. **Procurement Coordination**: Automated ordering and delivery tracking
5. **Quality Assurance**: Comprehensive defect tracking and resolution

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md