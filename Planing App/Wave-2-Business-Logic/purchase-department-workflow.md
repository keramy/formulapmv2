# Purchase Department Workflow - Wave 2 Business Logic
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive purchase department workflow system with supplier management, procurement processes, cost tracking, and approval workflows specifically designed for construction project procurement coordination.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Material Specs System ready - spawn after complete):**
1. **Supplier Database Management**: Comprehensive supplier information and performance tracking
2. **Procurement Workflow System**: End-to-end purchasing process automation
3. **Cost Tracking & Analysis**: Budget monitoring and financial controls
4. **Approval Authority Matrix**: Role-based procurement approvals

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Supplier Performance Analytics**: Vendor evaluation and scoring system
6. **Automated Purchase Order Generation**: Smart ordering and delivery coordination

---

## **🏢 Purchase Department Data Structure**

### **Enhanced Supplier & Procurement Schema**
```typescript
// types/procurement.ts
export interface Supplier {
  id: string
  
  // Basic Information
  company_name: string
  legal_name: string
  tax_id: string
  duns_number?: string
  registration_number: string
  
  // Contact Information
  primary_contact: ContactPerson
  secondary_contact?: ContactPerson
  billing_contact: ContactPerson
  technical_contact?: ContactPerson
  
  // Address Information
  headquarters_address: Address
  billing_address: Address
  shipping_addresses: Address[]
  
  // Business Information
  business_type: BusinessType
  years_in_business: number
  number_of_employees: number
  annual_revenue?: number
  service_areas: string[]
  specializations: string[]
  
  // Certifications & Compliance
  certifications: Certification[]
  licenses: License[]
  insurance_certificates: InsuranceCertificate[]
  compliance_documents: ComplianceDocument[]
  
  // Financial Information
  credit_rating?: string
  payment_terms: PaymentTerms
  preferred_payment_method: string
  bank_information: BankInformation
  
  // Performance Metrics
  performance_score: number
  quality_rating: number
  delivery_rating: number
  communication_rating: number
  cost_competitiveness: number
  
  // Relationship Management
  supplier_status: SupplierStatus
  approval_status: ApprovalStatus
  approved_by?: string
  approved_date?: string
  approved_categories: string[]
  
  // Contract Information
  master_agreement?: string
  contract_expiry_date?: string
  preferred_supplier: boolean
  volume_discounts: VolumeDiscount[]
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  last_contact_date?: string
  next_review_date?: string
}

export interface ContactPerson {
  name: string
  title: string
  email: string
  phone: string
  mobile?: string
  emergency_contact: boolean
}

export interface Address {
  street_address: string
  city: string
  state_province: string
  postal_code: string
  country: string
  address_type: 'headquarters' | 'billing' | 'shipping' | 'warehouse'
}

export type BusinessType = 
  | 'manufacturer'
  | 'distributor'
  | 'contractor'
  | 'supplier'
  | 'service_provider'
  | 'consultant'

export interface Certification {
  certification_name: string
  issuing_body: string
  certificate_number: string
  issue_date: string
  expiry_date: string
  document_path?: string
}

export interface License {
  license_type: string
  license_number: string
  issuing_authority: string
  issue_date: string
  expiry_date: string
  scope: string
  document_path?: string
}

export interface InsuranceCertificate {
  insurance_type: string
  coverage_amount: number
  provider: string
  policy_number: string
  effective_date: string
  expiry_date: string
  certificate_path?: string
}

export interface PaymentTerms {
  net_days: number
  discount_days?: number
  discount_percentage?: number
  late_fee_percentage?: number
  currency: string
  payment_method: string[]
}

export interface BankInformation {
  bank_name: string
  account_number: string
  routing_number: string
  swift_code?: string
  iban?: string
}

export type SupplierStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'probation'
  | 'terminated'

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'conditional'
  | 'rejected'
  | 'expired'

export interface VolumeDiscount {
  minimum_quantity: number
  maximum_quantity?: number
  discount_percentage: number
  discount_amount?: number
  applicable_categories: string[]
}

export interface PurchaseOrder {
  id: string
  po_number: string
  project_id: string
  supplier_id: string
  
  // Order Information
  order_date: string
  required_delivery_date: string
  promised_delivery_date?: string
  actual_delivery_date?: string
  
  // Financial Information
  subtotal: number
  tax_amount: number
  shipping_cost: number
  total_amount: number
  currency: string
  
  // Items
  line_items: PurchaseOrderLineItem[]
  
  // Delivery Information
  delivery_address: Address
  delivery_instructions: string
  shipping_method: string
  tracking_number?: string
  
  // Status & Workflow
  status: POStatus
  approval_status: POApprovalStatus
  approval_workflow: POApproval[]
  
  // Documents
  purchase_requisition_id?: string
  quote_reference?: string
  contract_reference?: string
  delivery_receipt?: string
  invoice_reference?: string
  
  // Quality Control
  inspection_required: boolean
  inspection_completed: boolean
  inspection_date?: string
  inspection_notes?: string
  quality_issues: QualityIssue[]
  
  // Payment
  payment_status: PaymentStatus
  payment_due_date: string
  payment_date?: string
  payment_reference?: string
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  approved_by?: string
  approved_at?: string
}

export interface PurchaseOrderLineItem {
  id: string
  line_number: number
  material_spec_id?: string
  scope_item_id?: string
  
  // Item Information
  description: string
  manufacturer?: string
  model_number?: string
  part_number?: string
  
  // Quantity & Pricing
  quantity_ordered: number
  quantity_received: number
  unit_of_measure: string
  unit_price: number
  line_total: number
  
  // Delivery
  delivery_date_required: string
  delivery_date_promised?: string
  delivery_date_actual?: string
  
  // Status
  status: LineItemStatus
  notes?: string
}

export type POStatus = 
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'sent_to_supplier'
  | 'acknowledged'
  | 'in_production'
  | 'ready_to_ship'
  | 'shipped'
  | 'partially_delivered'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export type POApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requires_revision'

export type LineItemStatus = 
  | 'ordered'
  | 'acknowledged'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'installed'
  | 'cancelled'

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'paid'
  | 'overdue'
  | 'disputed'
  | 'cancelled'

export interface POApproval {
  id: string
  approver_id: string
  approval_level: number
  required: boolean
  status: 'pending' | 'approved' | 'rejected'
  approval_date?: string
  comments?: string
  approval_limit?: number
}

export interface QualityIssue {
  id: string
  issue_type: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  reported_date: string
  reported_by: string
  resolution_status: 'open' | 'in_progress' | 'resolved'
  resolution_date?: string
  resolution_description?: string
}

export interface SupplierQuote {
  id: string
  supplier_id: string
  project_id: string
  quote_number: string
  
  // Quote Information
  quote_date: string
  valid_until: string
  currency: string
  
  // Items
  quote_items: QuoteLineItem[]
  
  // Totals
  subtotal: number
  tax_amount: number
  total_amount: number
  
  // Terms
  payment_terms: PaymentTerms
  delivery_terms: string
  lead_time_days: number
  warranty_terms: string
  
  // Status
  status: QuoteStatus
  selected: boolean
  selection_reason?: string
  
  // Documents
  quote_document_path?: string
  technical_specifications?: string[]
  
  // Evaluation
  evaluation_score?: number
  evaluation_notes?: string
  evaluated_by?: string
  evaluated_date?: string
  
  // Tracking
  requested_by: string
  created_at: string
  updated_at: string
}

export interface QuoteLineItem {
  id: string
  line_number: number
  description: string
  quantity: number
  unit_of_measure: string
  unit_price: number
  line_total: number
  lead_time_days: number
  notes?: string
}

export type QuoteStatus = 
  | 'requested'
  | 'received'
  | 'under_evaluation'
  | 'selected'
  | 'rejected'
  | 'expired'

export interface ProcurementRequest {
  id: string
  project_id: string
  requested_by: string
  
  // Request Information
  request_number: string
  request_date: string
  required_by_date: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  
  // Items
  requested_items: RequestedItem[]
  
  // Justification
  business_justification: string
  budget_code: string
  estimated_total: number
  
  // Approval
  approval_status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_date?: string
  rejection_reason?: string
  
  // Processing
  assigned_to: string
  processing_status: 'pending' | 'sourcing' | 'quoted' | 'ordered' | 'completed'
  
  // Results
  selected_suppliers: string[]
  purchase_orders: string[]
  total_cost?: number
  
  // Tracking
  created_at: string
  updated_at: string
}

export interface RequestedItem {
  id: string
  description: string
  specifications: string
  quantity: number
  unit_of_measure: string
  estimated_unit_price: number
  required_by_date: string
  preferred_suppliers?: string[]
  notes?: string
}
```

---

## **🏢 Purchase Department Management Interface**

### **Main Purchase Management Component**
```typescript
// components/purchase/PurchaseManager.tsx
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
  ShoppingCart, 
  Truck, 
  DollarSign, 
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  BarChart3,
  TrendingUp,
  Package
} from 'lucide-react'
import { PurchaseOrder, Supplier, ProcurementRequest } from '@/types/procurement'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'

interface PurchaseManagerProps {
  projectId: string
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({ 
  projectId 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'purchase-orders' | 'requests' | 'analytics'>('overview')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  const { profile } = useAuth()
  const { checkPermission } = usePermissions()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Check permissions
  const canManageSuppliers = checkPermission('suppliers.create')
  const canApprovePurchases = checkPermission('suppliers.approve')
  const canCreatePO = checkPermission('scope.assign_supplier')

  // Fetch purchase data
  const { data: purchaseOverview, isLoading } = useQuery({
    queryKey: ['purchase-overview', projectId],
    queryFn: () => fetchPurchaseOverview(projectId),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers', projectId],
    queryFn: () => fetchProjectSuppliers(projectId),
  })

  const { data: purchaseOrders } = useQuery({
    queryKey: ['purchase-orders', projectId, selectedStatus],
    queryFn: () => fetchPurchaseOrders(projectId, selectedStatus),
  })

  const { data: procurementRequests } = useQuery({
    queryKey: ['procurement-requests', projectId],
    queryFn: () => fetchProcurementRequests(projectId),
  })

  if (isLoading) {
    return <div>Loading purchase management...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Purchase Management</h2>
          <p className="text-muted-foreground">
            Manage suppliers, purchase orders, and procurement processes
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {canCreatePO && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Purchase Order
            </Button>
          )}
          
          {canManageSuppliers && (
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          )}
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOverview?.totalSuppliers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active suppliers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active POs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOverview?.activePOs || 0}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Delivery</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchaseOverview?.pendingDelivery || 0}</div>
            <p className="text-xs text-muted-foreground">
              Items in transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(purchaseOverview?.totalSpend || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Project to date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(purchaseOverview?.costSavings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Below budget
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <PurchaseOverviewDashboard 
            overview={purchaseOverview}
            projectId={projectId}
          />
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <SupplierManagement 
            suppliers={suppliers || []}
            projectId={projectId}
            canManage={canManageSuppliers}
            canApprove={canApprovePurchases}
          />
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-4">
          <PurchaseOrderManagement 
            purchaseOrders={purchaseOrders || []}
            projectId={projectId}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            canCreate={canCreatePO}
          />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <ProcurementRequestManagement 
            requests={procurementRequests || []}
            projectId={projectId}
            canCreate={canCreatePO}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <PurchaseAnalytics 
            projectId={projectId}
            overview={purchaseOverview}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### **Supplier Management Component**
```typescript
// components/purchase/SupplierManagement.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Building, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Package,
  Truck
} from 'lucide-react'
import { Supplier, ApprovalStatus, SupplierStatus } from '@/types/procurement'
import { useToast } from '@/components/ui/use-toast'

interface SupplierManagementProps {
  suppliers: Supplier[]
  projectId: string
  canManage: boolean
  canApprove: boolean
}

export const SupplierManagement: React.FC<SupplierManagementProps> = ({
  suppliers,
  projectId,
  canManage,
  canApprove
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all')
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()

  const getStatusColor = (status: SupplierStatus) => {
    const colors = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'suspended': 'bg-red-100 text-red-800',
      'probation': 'bg-yellow-100 text-yellow-800',
      'terminated': 'bg-red-100 text-red-800'
    }
    return colors[status] || colors['inactive']
  }

  const getApprovalStatusColor = (status: ApprovalStatus) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'conditional': 'bg-blue-100 text-blue-800',
      'rejected': 'bg-red-100 text-red-800',
      'expired': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || colors['pending']
  }

  const renderPerformanceScore = (score: number) => {
    const getScoreColor = (score: number) => {
      if (score >= 90) return 'text-green-600'
      if (score >= 75) return 'text-yellow-600'
      if (score >= 60) return 'text-orange-600'
      return 'text-red-600'
    }

    return (
      <div className="flex items-center space-x-2">
        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
          {score}/100
        </div>
        <Progress value={score} className="w-16 h-2" />
      </div>
    )
  }

  const handleSupplierApproval = async (
    supplierId: string, 
    decision: 'approved' | 'rejected' | 'conditional',
    comments?: string
  ) => {
    try {
      const response = await fetch(`/api/suppliers/${supplierId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          decision,
          comments,
          approved_by: 'current_user_id', // Replace with actual user ID
          approved_date: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast({
          title: "Supplier Status Updated",
          description: `Supplier has been ${decision}.`,
        })
        
        // Refresh suppliers list
        // This would trigger a query invalidation
      } else {
        throw new Error('Failed to update supplier status')
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update supplier status.",
        variant: "destructive"
      })
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchTerm || 
      supplier.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.specializations.some(spec => 
        spec.toLowerCase().includes(searchTerm.toLowerCase())
      )
    
    const matchesStatus = statusFilter === 'all' || supplier.supplier_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1">
              <Input
                placeholder="Search suppliers by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="probation">Probation</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              
              {canManage && (
                <Button>
                  Add New Supplier
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="grid gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {supplier.company_name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold truncate">
                        {supplier.company_name}
                      </h3>
                      <Badge className={getStatusColor(supplier.supplier_status)}>
                        {supplier.supplier_status}
                      </Badge>
                      <Badge className={getApprovalStatusColor(supplier.approval_status)}>
                        {supplier.approval_status}
                      </Badge>
                      {supplier.preferred_supplier && (
                        <Badge variant="outline" className="bg-gold-50 text-gold-700">
                          Preferred
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                      <div className="flex items-center space-x-2">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span className="capitalize">{supplier.business_type}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span>{supplier.primary_contact.phone}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="truncate">{supplier.primary_contact.email}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{supplier.headquarters_address.city}, {supplier.headquarters_address.state_province}</span>
                      </div>
                    </div>
                    
                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {supplier.specializations.slice(0, 3).map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                      {supplier.specializations.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{supplier.specializations.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    {/* Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground">Overall Score</div>
                        {renderPerformanceScore(supplier.performance_score)}
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{supplier.quality_rating}/5</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Delivery</div>
                        <div className="flex items-center space-x-1">
                          <Truck className="h-3 w-3 text-blue-500" />
                          <span className="text-sm font-medium">{supplier.delivery_rating}/5</span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground">Cost</div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3 text-green-500" />
                          <span className="text-sm font-medium">{supplier.cost_competitiveness}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSupplier(supplier)}
                  >
                    View Details
                  </Button>
                  
                  {canApprove && supplier.approval_status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleSupplierApproval(supplier.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleSupplierApproval(supplier.id, 'rejected')}
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
        ))}
      </div>
      
      {filteredSuppliers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No suppliers found matching your criteria.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          onClose={() => setSelectedSupplier(null)}
          canEdit={canManage}
          canApprove={canApprove}
        />
      )}
    </div>
  )
}
```

---

## **📋 Purchase Order Management**

### **Purchase Order Workflow Component**
```typescript
// components/purchase/PurchaseOrderManagement.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Calendar, 
  DollarSign, 
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Edit
} from 'lucide-react'
import { PurchaseOrder, POStatus, POApprovalStatus } from '@/types/procurement'

interface PurchaseOrderManagementProps {
  purchaseOrders: PurchaseOrder[]
  projectId: string
  selectedStatus: string
  onStatusChange: (status: string) => void
  canCreate: boolean
}

export const PurchaseOrderManagement: React.FC<PurchaseOrderManagementProps> = ({
  purchaseOrders,
  projectId,
  selectedStatus,
  onStatusChange,
  canCreate
}) => {
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)

  const getStatusColor = (status: POStatus) => {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'pending_approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'sent_to_supplier': 'bg-blue-100 text-blue-800',
      'acknowledged': 'bg-blue-100 text-blue-800',
      'in_production': 'bg-orange-100 text-orange-800',
      'ready_to_ship': 'bg-purple-100 text-purple-800',
      'shipped': 'bg-indigo-100 text-indigo-800',
      'partially_delivered': 'bg-yellow-100 text-yellow-800',
      'delivered': 'bg-green-100 text-green-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      'cancelled': 'bg-red-100 text-red-800'
    }
    return colors[status] || colors['draft']
  }

  const getStatusIcon = (status: POStatus) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'shipped':
      case 'ready_to_ship':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <FileText className="h-4 w-4 text-gray-600" />
    }
  }

  const calculateDeliveryProgress = (po: PurchaseOrder): number => {
    const totalItems = po.line_items.length
    const deliveredItems = po.line_items.filter(item => 
      item.status === 'delivered' || item.status === 'installed'
    ).length
    return totalItems > 0 ? (deliveredItems / totalItems) * 100 : 0
  }

  const isOverdue = (po: PurchaseOrder): boolean => {
    if (!po.required_delivery_date) return false
    return new Date(po.required_delivery_date) < new Date() && po.status !== 'completed'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Purchase Orders</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_production">In Production</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            {canCreate && (
              <Button>
                Create Purchase Order
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Purchase Orders List */}
      <div className="space-y-4">
        {purchaseOrders.map((po) => {
          const deliveryProgress = calculateDeliveryProgress(po)
          const overdue = isOverdue(po)
          
          return (
            <Card key={po.id} className={`hover:shadow-md transition-shadow ${overdue ? 'border-red-200' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(po.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          PO #{po.po_number}
                        </h3>
                        <Badge className={getStatusColor(po.status)}>
                          {po.status.replace('_', ' ')}
                        </Badge>
                        {po.approval_status === 'pending' && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                            Awaiting Approval
                          </Badge>
                        )}
                        {overdue && (
                          <Badge variant="destructive">
                            Overdue
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-3 w-3 text-muted-foreground" />
                          <span>${po.total_amount.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {new Date(po.order_date).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Package className="h-3 w-3 text-muted-foreground" />
                          <span>{po.line_items.length} items</span>
                        </div>
                        
                        {po.required_delivery_date && (
                          <div className="flex items-center space-x-2">
                            <Truck className="h-3 w-3 text-muted-foreground" />
                            <span>
                              Due {new Date(po.required_delivery_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Delivery Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Delivery Progress</span>
                          <span>{Math.round(deliveryProgress)}%</span>
                        </div>
                        <Progress value={deliveryProgress} className="h-2" />
                      </div>
                      
                      {/* Line Items Summary */}
                      <div className="mt-4 space-y-2">
                        {po.line_items.slice(0, 2).map((item, index) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="truncate flex-1">{item.description}</span>
                            <span className="text-muted-foreground ml-2">
                              {item.quantity_received}/{item.quantity_ordered} {item.unit_of_measure}
                            </span>
                          </div>
                        ))}
                        {po.line_items.length > 2 && (
                          <div className="text-sm text-muted-foreground">
                            +{po.line_items.length - 2} more items
                          </div>
                        )}
                      </div>
                      
                      {/* Overdue Alert */}
                      {overdue && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                          <div className="flex items-center space-x-2 text-red-800 text-sm">
                            <AlertTriangle className="h-3 w-3" />
                            <span>
                              Overdue by {Math.ceil((new Date().getTime() - new Date(po.required_delivery_date).getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
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
                      onClick={() => setSelectedPO(po)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                    
                    {(po.status === 'draft' || po.status === 'pending_approval') && (
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {purchaseOrders.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="text-muted-foreground">
              No purchase orders found for the selected criteria.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Order Detail Modal */}
      {selectedPO && (
        <PurchaseOrderDetailModal
          purchaseOrder={selectedPO}
          onClose={() => setSelectedPO(null)}
          canEdit={canCreate}
        />
      )}
    </div>
  )
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Purchase Department Workflow Implementation
OBJECTIVE: Deploy comprehensive purchase management system with supplier coordination, procurement processes, and cost tracking
CONTEXT: Complete procurement workflow for construction projects with approval authority, supplier performance tracking, and automated ordering processes

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Material Specs: @Planing App/Wave-2-Business-Logic/material-specs-system.md
- Scope System: @Planing App/Wave-2-Business-Logic/scope-management-system.md
- Document Approval: @Planing App/Wave-2-Business-Logic/document-approval-workflow.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement comprehensive supplier database management system
2. Build procurement workflow with approval authority matrix
3. Create purchase order management with approval workflows
4. Develop cost tracking and budget analysis tools
5. Implement supplier performance tracking and evaluation
6. Build procurement request management system
7. Create automated purchase order generation
8. Implement delivery tracking and quality control

DELIVERABLES:
1. Complete supplier management interface with performance tracking
2. Procurement workflow system with approval routing
3. Purchase order management with status tracking
4. Cost tracking and budget analysis dashboard
5. Supplier performance evaluation system
6. Procurement request workflow
7. Automated ordering and delivery coordination
8. Purchase analytics and reporting system
```

### **Quality Gates**
- ✅ Supplier database supports comprehensive vendor information
- ✅ Procurement workflow respects approval authority matrix
- ✅ Purchase order system tracks complete order lifecycle
- ✅ Cost tracking maintains accurate budget information
- ✅ Supplier performance system provides actionable insights
- ✅ Procurement requests route to appropriate approvers
- ✅ Automated ordering reduces manual processing time
- ✅ Analytics provide procurement optimization insights

### **Dependencies for Next Wave**
- Purchase management system must be fully functional
- Supplier database ready for external vendor access
- Procurement workflows tested with real approval scenarios
- Cost tracking integrated with project budget management
- Performance tracking validated with supplier data

---

## **🎯 SUCCESS CRITERIA**
1. **Supplier Management**: Comprehensive vendor database with performance tracking
2. **Procurement Workflow**: Automated processes with proper approval routing
3. **Cost Control**: Accurate budget tracking and variance analysis
4. **Performance Optimization**: Data-driven supplier evaluation and selection
5. **Process Efficiency**: Reduced manual effort through automation

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md