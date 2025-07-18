# Scope Management System - Wave 2 Business Logic
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Implement a comprehensive scope management system supporting 4 categories (construction, millwork, electrical, mechanical) with Excel integration, dependency tracking, supplier assignment, and real-time progress monitoring for Formula PM 2.0.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Wait for Wave 1 approval - spawn after database, auth, and project creation ready):**
1. **4-Category Scope System**: Core scope item management with categories
2. **Excel Import/Export Integration**: Bulk scope operations via spreadsheets
3. **Dependency Management**: Scope item relationships and blocking logic
4. **Progress Tracking**: Real-time completion and timeline monitoring
5. **Global Navigation Integration**: Support for filtered scope access via GlobalSidebar

**DEPENDENT TASKS (Wait for foundation approval):**
6. **Supplier Assignment Workflow**: Integration with purchase department
7. **Timeline Optimization**: Critical path analysis and scheduling

---

## **📊 Scope Management Data Structure**

### **Enhanced Scope Item Schema**
```typescript
// types/scope.ts
export interface ScopeItem {
  id: string
  project_id: string
  category: ScopeCategory
  
  // Core Required Fields (Based on Business Requirements)
  item_no: number // Auto-generated sequential number per project
  item_code?: string // Client-provided code (Excel importable, nullable)
  description: string // Detailed item description
  quantity: number // Numeric quantity with unit validation
  unit_price: number // Base unit pricing
  total_price: number // Auto-calculated (Quantity × Unit Price)
  
  // Cost Tracking (Technical Office + Purchasing Access Only)
  initial_cost?: number // Original estimated cost
  actual_cost?: number // Real incurred cost
  cost_variance?: number // Auto-calculated difference (actual_cost - initial_cost)
  
  // Legacy/Additional Fields
  title: string // For backward compatibility
  specifications: string
  drawing_reference?: string
  unit_of_measure: string
  markup_percentage: number
  final_price: number // with markup
  
  // Timeline & Progress
  timeline_start: string
  timeline_end: string
  duration_days: number
  actual_start?: string
  actual_end?: string
  progress_percentage: number
  status: ScopeStatus
  
  // Assignments & Dependencies
  assigned_to: string[] // user IDs
  supplier_id?: string
  dependencies: string[] // other scope item IDs
  blocks: string[] // scope items this item blocks
  
  // Approval & Quality
  requires_client_approval: boolean
  client_approved: boolean
  client_approved_date?: string
  quality_check_required: boolean
  quality_check_passed: boolean
  
  // Technical Details
  priority: number
  risk_level: 'low' | 'medium' | 'high'
  installation_method: string
  special_requirements: string[]
  material_list: MaterialRequirement[]
  
  // Tracking
  created_by: string
  created_at: string
  updated_at: string
  last_updated_by: string
  
  // Excel Import Metadata
  excel_row_number?: number
  import_batch_id?: string
  validation_errors: string[]
}

export type ScopeCategory = 'construction' | 'millwork' | 'electrical' | 'mechanical'

export type ScopeStatus = 
  | 'not_started'
  | 'planning'
  | 'materials_ordered'
  | 'in_progress'
  | 'quality_check'
  | 'client_review'
  | 'completed'
  | 'blocked'
  | 'on_hold'
  | 'cancelled'

export interface MaterialRequirement {
  id: string
  scope_item_id: string
  material_name: string
  specification: string
  quantity: number
  unit: string
  supplier_id?: string
  cost_per_unit?: number
  total_cost?: number
  delivery_date?: string
  status: 'pending' | 'ordered' | 'delivered' | 'installed'
}

export interface ScopeDependency {
  id: string
  scope_item_id: string
  depends_on_id: string
  dependency_type: 'blocks' | 'requires' | 'enables'
  description?: string
  created_at: string
}

export interface ExcelImportBatch {
  id: string
  project_id: string
  filename: string
  imported_by: string
  import_date: string
  total_rows: number
  successful_imports: number
  failed_imports: number
  validation_errors: ExcelValidationError[]
}

export interface ExcelValidationError {
  row_number: number
  column: string
  error_message: string
  error_type: 'required' | 'invalid_format' | 'duplicate' | 'reference_error'
  suggested_fix?: string
}
```

---

## **📈 Scope Management Interface**

### **Main Scope Management Component**
```typescript
// components/scope/ScopeManager.tsx
'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  FileSpreadsheet, 
  Plus, 
  Filter, 
  Download, 
  Upload,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { ScopeItem, ScopeCategory } from '@/types/scope'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'

interface ScopeManagerProps {
  projectId: string
}

export const ScopeManager: React.FC<ScopeManagerProps> = ({ projectId }) => {
  const [selectedCategory, setSelectedCategory] = useState<ScopeCategory | 'all'>('all')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const queryClient = useQueryClient()
  const { canUpdateScope, canViewPricing } = usePermissions()
  const { toast } = useToast()

  // Fetch scope items
  const { data: scopeItems, isLoading } = useQuery({
    queryKey: ['scope-items', projectId, selectedCategory],
    queryFn: () => fetchScopeItems(projectId, selectedCategory),
  })

  // Calculate scope statistics
  const scopeStats = calculateScopeStats(scopeItems || [])

  const handleExcelImport = async (file: File) => {
    try {
      const result = await importScopeFromExcel(projectId, file)
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.successful_imports} items. ${result.failed_imports} failures.`,
      })
      
      queryClient.invalidateQueries(['scope-items', projectId])
      setShowImportDialog(false)
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to import Excel file. Please check format and try again.",
        variant: "destructive"
      })
    }
  }

  const handleExcelExport = async () => {
    try {
      const blob = await exportScopeToExcel(projectId, selectedCategory)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `scope-${projectId}-${selectedCategory}-${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export scope data.",
        variant: "destructive"
      })
    }
  }

  if (isLoading) {
    return <div>Loading scope data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Scope Management</h2>
          <p className="text-muted-foreground">
            Manage project scope items across all categories
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExcelExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export Excel</span>
          </Button>
          
          {canUpdateScope() && (
            <>
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Import Excel</span>
              </Button>
              
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Scope Item</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Scope Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scopeStats.totalItems}</div>
            <Progress value={scopeStats.completionPercentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {scopeStats.completionPercentage.toFixed(1)}% Complete
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scopeStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Active work items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scopeStats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Finished items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scopeStats.blocked + scopeStats.onHold}</div>
            <p className="text-xs text-muted-foreground">
              Blocked or on hold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Categories</TabsTrigger>
          <TabsTrigger value="construction">Construction</TabsTrigger>
          <TabsTrigger value="millwork">Millwork</TabsTrigger>
          <TabsTrigger value="electrical">Electrical</TabsTrigger>
          <TabsTrigger value="mechanical">Mechanical</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ScopeItemsTable 
            items={scopeItems || []}
            canEdit={canUpdateScope()}
            canViewPricing={canViewPricing()}
            onItemUpdate={handleItemUpdate}
          />
        </TabsContent>

        <TabsContent value="construction" className="space-y-4">
          <ScopeItemsTable 
            items={filterByCategory(scopeItems || [], 'construction')}
            canEdit={canUpdateScope()}
            canViewPricing={canViewPricing()}
            onItemUpdate={handleItemUpdate}
          />
        </TabsContent>

        <TabsContent value="millwork" className="space-y-4">
          <ScopeItemsTable 
            items={filterByCategory(scopeItems || [], 'millwork')}
            canEdit={canUpdateScope()}
            canViewPricing={canViewPricing()}
            onItemUpdate={handleItemUpdate}
          />
        </TabsContent>

        <TabsContent value="electrical" className="space-y-4">
          <ScopeItemsTable 
            items={filterByCategory(scopeItems || [], 'electrical')}
            canEdit={canUpdateScope()}
            canViewPricing={canViewPricing()}
            onItemUpdate={handleItemUpdate}
          />
        </TabsContent>

        <TabsContent value="mechanical" className="space-y-4">
          <ScopeItemsTable 
            items={filterByCategory(scopeItems || [], 'mechanical')}
            canEdit={canUpdateScope()}
            canViewPricing={canViewPricing()}
            onItemUpdate={handleItemUpdate}
          />
        </TabsContent>
      </Tabs>

      {/* Import Dialog */}
      {showImportDialog && (
        <ExcelImportDialog
          projectId={projectId}
          onImport={handleExcelImport}
          onClose={() => setShowImportDialog(false)}
        />
      )}
    </div>
  )
}
```

---

## **📋 Scope Items Data Table**

### **Advanced Data Table with Inline Editing**
```typescript
// components/scope/ScopeItemsTable.tsx
'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye,
  Users,
  Link,
  AlertTriangle
} from 'lucide-react'
import { ScopeItem } from '@/types/scope'

interface ScopeItemsTableProps {
  items: ScopeItem[]
  canEdit: boolean
  canViewPricing: boolean
  onItemUpdate: (item: ScopeItem) => void
}

export const ScopeItemsTable: React.FC<ScopeItemsTableProps> = ({
  items,
  canEdit,
  canViewPricing,
  onItemUpdate
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    const colors = {
      'not_started': 'bg-gray-100 text-gray-800',
      'planning': 'bg-blue-100 text-blue-800',
      'materials_ordered': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-green-100 text-green-800',
      'quality_check': 'bg-purple-100 text-purple-800',
      'client_review': 'bg-orange-100 text-orange-800',
      'completed': 'bg-emerald-100 text-emerald-800',
      'blocked': 'bg-red-100 text-red-800',
      'on_hold': 'bg-amber-100 text-amber-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || colors['not_started']
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      'construction': 'bg-blue-500',
      'millwork': 'bg-green-500',
      'electrical': 'bg-yellow-500',
      'mechanical': 'bg-red-500'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-500'
  }

  const columns: ColumnDef<ScopeItem>[] = [
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const category = row.getValue("category") as string
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
            <span className="capitalize">{category}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{item.title}</div>
            {item.drawing_reference && (
              <div className="text-xs text-muted-foreground">
                Ref: {item.drawing_reference}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="text-right">
            <div>{item.quantity.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{item.unit_of_measure}</div>
          </div>
        )
      },
    }
  ]

  // Add pricing columns if user has permission
  if (canViewPricing) {
    columns.push(
      {
        accessorKey: "unit_price",
        header: "Unit Price",
        cell: ({ row }) => {
          const unitPrice = row.getValue("unit_price") as number
          return <div className="text-right">${unitPrice.toLocaleString()}</div>
        },
      },
      {
        accessorKey: "total_price",
        header: "Total",
        cell: ({ row }) => {
          const item = row.original
          const total = item.quantity * item.unit_price * (1 + item.markup_percentage / 100)
          return <div className="text-right font-medium">${total.toLocaleString()}</div>
        },
      }
    )
  }

  columns.push(
    {
      accessorKey: "progress_percentage",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.getValue("progress_percentage") as number
        return (
          <div className="space-y-1">
            <Progress value={progress} className="w-16" />
            <div className="text-xs text-center">{progress}%</div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge className={getStatusColor(status)}>
            {status.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      accessorKey: "assigned_to",
      header: "Assigned",
      cell: ({ row }) => {
        const assignedTo = row.getValue("assigned_to") as string[]
        if (!assignedTo || assignedTo.length === 0) {
          return <span className="text-muted-foreground">Unassigned</span>
        }
        return (
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span className="text-sm">{assignedTo.length}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "dependencies",
      header: "Dependencies",
      cell: ({ row }) => {
        const dependencies = row.getValue("dependencies") as string[]
        const blocked = dependencies && dependencies.length > 0
        return blocked ? (
          <div className="flex items-center space-x-1 text-amber-600">
            <Link className="h-3 w-3" />
            <span className="text-xs">{dependencies.length}</span>
          </div>
        ) : null
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
            {canEdit && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setEditingId(item.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )
      },
    }
  )

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={items}
        searchable={true}
        searchPlaceholder="Search scope items..."
      />
    </div>
  )
}
```

---

## **✏️ Enhanced Editing Interface System**

### **Single Item Editing Component**
```typescript
// components/scope/ScopeItemEditor.tsx
'use client'

import { useState, useEffect } from 'react'
import { ScopeItem } from '@/types/scope'
import { usePermissions } from '@/hooks/usePermissions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Save, X, Copy, Trash } from 'lucide-react'

interface ScopeItemEditorProps {
  item: ScopeItem
  onSave: (item: ScopeItem) => Promise<void>
  onCancel: () => void
  onDuplicate?: (item: ScopeItem) => void
  mode: 'edit' | 'create'
}

export const ScopeItemEditor: React.FC<ScopeItemEditorProps> = ({
  item,
  onSave,
  onCancel,
  onDuplicate,
  mode
}) => {
  const [editedItem, setEditedItem] = useState<ScopeItem>(item)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { 
    canViewCosts, 
    canEditCosts, 
    canViewPricing,
    role 
  } = usePermissions()

  // Auto-calculate total price when quantity or unit_price changes
  useEffect(() => {
    const total = editedItem.quantity * editedItem.unit_price
    setEditedItem(prev => ({ ...prev, total_price: total }))
  }, [editedItem.quantity, editedItem.unit_price])

  // Auto-calculate cost variance when costs change
  useEffect(() => {
    if (editedItem.initial_cost && editedItem.actual_cost) {
      const variance = editedItem.actual_cost - editedItem.initial_cost
      setEditedItem(prev => ({ ...prev, cost_variance: variance }))
    }
  }, [editedItem.initial_cost, editedItem.actual_cost])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(editedItem)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFieldChange = (field: keyof ScopeItem, value: any) => {
    setEditedItem(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const canEditField = (field: string): boolean => {
    switch (field) {
      case 'initial_cost':
      case 'actual_cost':
        return canEditCosts()
      case 'unit_price':
      case 'total_price':
        return canViewPricing()
      default:
        return true
    }
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>{mode === 'create' ? 'Create New' : 'Edit'} Scope Item</span>
            <Badge variant="outline">#{editedItem.item_no}</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {onDuplicate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDuplicate(editedItem)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Core Fields Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Core Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Item No</label>
              <Input
                value={editedItem.item_no}
                disabled={true}
                className="bg-gray-50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Item Code</label>
              <Input
                value={editedItem.item_code || ''}
                onChange={(e) => handleFieldChange('item_code', e.target.value)}
                placeholder="Client-provided code..."
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <Input
                value={editedItem.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Detailed item description..."
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                value={editedItem.quantity}
                onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit of Measure</label>
              <Input
                value={editedItem.unit_of_measure}
                onChange={(e) => handleFieldChange('unit_of_measure', e.target.value)}
                placeholder="m², pcs, kg..."
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Pricing Section */}
        {canViewPricing() && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Pricing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Price</label>
                <Input
                  type="number"
                  value={editedItem.unit_price}
                  onChange={(e) => handleFieldChange('unit_price', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  disabled={!canEditField('unit_price')}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Total Price</label>
                <Input
                  type="number"
                  value={editedItem.total_price}
                  disabled={true}
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Markup %</label>
                <Input
                  type="number"
                  value={editedItem.markup_percentage}
                  onChange={(e) => handleFieldChange('markup_percentage', parseFloat(e.target.value) || 0)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Cost Tracking Section (Technical Office + Purchasing Only) */}
        {canViewCosts() && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Cost Tracking</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Initial Cost</label>
                  <Input
                    type="number"
                    value={editedItem.initial_cost || ''}
                    onChange={(e) => handleFieldChange('initial_cost', parseFloat(e.target.value) || undefined)}
                    min="0"
                    step="0.01"
                    disabled={!canEditField('initial_cost')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actual Cost</label>
                  <Input
                    type="number"
                    value={editedItem.actual_cost || ''}
                    onChange={(e) => handleFieldChange('actual_cost', parseFloat(e.target.value) || undefined)}
                    min="0"
                    step="0.01"
                    disabled={!canEditField('actual_cost')}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Cost Variance</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={editedItem.cost_variance || ''}
                      disabled={true}
                      className="bg-gray-50"
                    />
                    {editedItem.cost_variance && (
                      <Badge 
                        variant={editedItem.cost_variance > 0 ? "destructive" : "default"}
                        className="whitespace-nowrap"
                      >
                        {editedItem.cost_variance > 0 ? '+' : ''}{editedItem.cost_variance.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### **Bulk Editing Interface**
```typescript
// components/scope/BulkEditInterface.tsx
'use client'

import { useState } from 'react'
import { ScopeItem } from '@/types/scope'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { 
  Edit3, 
  Save, 
  X, 
  CheckSquare, 
  Square,
  Copy,
  Trash,
  Filter
} from 'lucide-react'

interface BulkEditInterfaceProps {
  items: ScopeItem[]
  onSave: (items: ScopeItem[]) => Promise<void>
  onCancel: () => void
}

export const BulkEditInterface: React.FC<BulkEditInterfaceProps> = ({
  items,
  onSave,
  onCancel
}) => {
  const [editedItems, setEditedItems] = useState<ScopeItem[]>(items)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEditMode, setBulkEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { canViewCosts, canEditCosts, canViewPricing } = usePermissions()

  const handleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(items.map(item => item.id)))
    }
  }

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleCellEdit = (itemId: string, field: keyof ScopeItem, value: any) => {
    setEditedItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              [field]: value,
              // Auto-calculate dependent fields
              ...(field === 'quantity' || field === 'unit_price' 
                ? { total_price: (field === 'quantity' ? value : item.quantity) * (field === 'unit_price' ? value : item.unit_price) }
                : {}),
              ...(field === 'actual_cost' || field === 'initial_cost'
                ? { cost_variance: (field === 'actual_cost' ? value : item.actual_cost || 0) - (field === 'initial_cost' ? value : item.initial_cost || 0) }
                : {})
            }
          : item
      )
    )
  }

  const handleBulkUpdate = (field: keyof ScopeItem, value: any) => {
    if (selectedIds.size === 0) return

    setEditedItems(prev =>
      prev.map(item =>
        selectedIds.has(item.id)
          ? { ...item, [field]: value }
          : item
      )
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave(editedItems)
    } catch (error) {
      console.error('Bulk save failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const editableColumns = [
    {
      accessorKey: "select",
      header: () => (
        <Checkbox
          checked={selectedIds.size === items.length}
          onCheckedChange={handleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => handleSelectItem(row.original.id)}
        />
      ),
    },
    {
      accessorKey: "item_no",
      header: "Item No",
      cell: ({ row }) => (
        <Badge variant="outline">#{row.original.item_no}</Badge>
      ),
    },
    {
      accessorKey: "item_code",
      header: "Item Code",
      cell: ({ row }) => (
        <Input
          value={row.original.item_code || ''}
          onChange={(e) => handleCellEdit(row.original.id, 'item_code', e.target.value)}
          className="min-w-24"
          placeholder="Code..."
        />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <Input
          value={row.original.description}
          onChange={(e) => handleCellEdit(row.original.id, 'description', e.target.value)}
          className="min-w-48"
        />
      ),
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => (
        <Input
          type="number"
          value={row.original.quantity}
          onChange={(e) => handleCellEdit(row.original.id, 'quantity', parseFloat(e.target.value) || 0)}
          className="min-w-20"
          min="0"
          step="0.01"
        />
      ),
    }
  ]

  // Add pricing columns if user has permission
  if (canViewPricing()) {
    editableColumns.push(
      {
        accessorKey: "unit_price",
        header: "Unit Price",
        cell: ({ row }) => (
          <Input
            type="number"
            value={row.original.unit_price}
            onChange={(e) => handleCellEdit(row.original.id, 'unit_price', parseFloat(e.target.value) || 0)}
            className="min-w-24"
            min="0"
            step="0.01"
          />
        ),
      },
      {
        accessorKey: "total_price",
        header: "Total Price",
        cell: ({ row }) => (
          <div className="text-right font-medium">
            ${row.original.total_price?.toLocaleString()}
          </div>
        ),
      }
    )
  }

  // Add cost tracking columns if user has permission
  if (canViewCosts()) {
    editableColumns.push(
      {
        accessorKey: "initial_cost",
        header: "Initial Cost",
        cell: ({ row }) => (
          <Input
            type="number"
            value={row.original.initial_cost || ''}
            onChange={(e) => handleCellEdit(row.original.id, 'initial_cost', parseFloat(e.target.value) || undefined)}
            className="min-w-24"
            min="0"
            step="0.01"
            disabled={!canEditCosts()}
          />
        ),
      },
      {
        accessorKey: "actual_cost",
        header: "Actual Cost",
        cell: ({ row }) => (
          <Input
            type="number"
            value={row.original.actual_cost || ''}
            onChange={(e) => handleCellEdit(row.original.id, 'actual_cost', parseFloat(e.target.value) || undefined)}
            className="min-w-24"
            min="0"
            step="0.01"
            disabled={!canEditCosts()}
          />
        ),
      }
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5" />
            <span>Bulk Edit Mode</span>
            <Badge variant="secondary">{editedItems.length} items</Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear Selection
            </Button>
            <Badge variant="outline">
              {selectedIds.size} selected
            </Badge>
          </div>
        </div>

        {/* Bulk Action Panel */}
        {selectedIds.size > 0 && (
          <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium">
              Bulk update {selectedIds.size} items:
            </span>
            
            <Select onValueChange={(value) => handleBulkUpdate('status', value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              placeholder="Set markup %..."
              className="w-32"
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value)) handleBulkUpdate('markup_percentage', value)
              }}
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Duplicate selected items
                const newItems = editedItems.filter(item => selectedIds.has(item.id))
                  .map(item => ({
                    ...item,
                    id: crypto.randomUUID(),
                    item_no: Math.max(...editedItems.map(i => i.item_no)) + 1,
                    description: `${item.description} (Copy)`
                  }))
                setEditedItems(prev => [...prev, ...newItems])
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <DataTable
          columns={editableColumns}
          data={editedItems}
          searchable={true}
          searchPlaceholder="Search items..."
        />

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : `Save ${editedItems.length} Items`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### **Copy/Paste System Implementation**
```typescript
// hooks/useCopyPaste.ts
'use client'

import { useCallback, useEffect } from 'react'
import { ScopeItem } from '@/types/scope'
import { useToast } from '@/components/ui/use-toast'

interface CopyPasteHookProps {
  onPaste: (data: any[]) => void
  selectedItems?: ScopeItem[]
}

export const useCopyPaste = ({ onPaste, selectedItems }: CopyPasteHookProps) => {
  const { toast } = useToast()

  const handleCopy = useCallback(async () => {
    if (!selectedItems || selectedItems.length === 0) {
      toast({
        title: "Nothing to copy",
        description: "Please select items first",
        variant: "destructive"
      })
      return
    }

    try {
      // Prepare data for clipboard (CSV format for Excel compatibility)
      const headers = ['Item No', 'Item Code', 'Description', 'Quantity', 'Unit Price', 'Total Price']
      const rows = selectedItems.map(item => [
        item.item_no,
        item.item_code || '',
        item.description,
        item.quantity,
        item.unit_price,
        item.total_price
      ])

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join('\t'))
        .join('\n')

      await navigator.clipboard.writeText(csvContent)
      
      toast({
        title: "Copied to clipboard",
        description: `${selectedItems.length} items copied`,
      })
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }, [selectedItems, toast])

  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText()
      
      // Parse clipboard data (assuming tab-separated values)
      const lines = clipboardText.trim().split('\n')
      const parsedData = lines.map(line => {
        const cells = line.split('\t').map(cell => cell.replace(/^"|"$/g, ''))
        return {
          item_code: cells[1] || '',
          description: cells[2] || '',
          quantity: parseFloat(cells[3]) || 0,
          unit_price: parseFloat(cells[4]) || 0,
        }
      })

      onPaste(parsedData)
      
      toast({
        title: "Pasted successfully",
        description: `${parsedData.length} items pasted`,
      })
    } catch (error) {
      toast({
        title: "Paste failed",
        description: "Failed to paste from clipboard",
        variant: "destructive"
      })
    }
  }, [onPaste, toast])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault()
            handleCopy()
            break
          case 'v':
            e.preventDefault()
            handlePaste()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [handleCopy, handlePaste])

  return { handleCopy, handlePaste }
}
```

---

## **📁 Excel Import/Export System**

### **Excel Import Service**
```typescript
// lib/services/excelImportService.ts
import * as XLSX from 'xlsx'
import { ScopeItem, ExcelImportBatch, ExcelValidationError } from '@/types/scope'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const EXCEL_COLUMNS = {
  A: 'item_code', // Client-provided code
  B: 'description', // Required field
  C: 'category',
  D: 'quantity', // Required field
  E: 'unit_of_measure',
  F: 'unit_price', // Required field
  G: 'initial_cost', // Technical Office access
  H: 'actual_cost', // Technical Office access
  I: 'markup_percentage',
  J: 'specifications',
  K: 'timeline_start',
  L: 'timeline_end',
  M: 'priority',
  N: 'risk_level',
  O: 'special_requirements',
  P: 'drawing_reference'
}

const scopeItemSchema = z.object({
  category: z.enum(['construction', 'millwork', 'electrical', 'mechanical']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  specifications: z.string().optional(),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  markup_percentage: z.number().min(0).max(100, 'Markup must be between 0-100%'),
  timeline_start: z.string().optional(),
  timeline_end: z.string().optional(),
  priority: z.number().min(1).max(10, 'Priority must be 1-10'),
  risk_level: z.enum(['low', 'medium', 'high']),
  special_requirements: z.string().optional(),
  drawing_reference: z.string().optional()
})

export class ExcelImportService {
  async importScopeFromExcel(
    projectId: string, 
    file: File, 
    userId: string
  ): Promise<ExcelImportBatch> {
    try {
      // Read Excel file
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      // Create import batch record
      const batchId = crypto.randomUUID()
      const batch: ExcelImportBatch = {
        id: batchId,
        project_id: projectId,
        filename: file.name,
        imported_by: userId,
        import_date: new Date().toISOString(),
        total_rows: rawData.length - 1, // Exclude header
        successful_imports: 0,
        failed_imports: 0,
        validation_errors: []
      }

      // Validate and process data
      const processedItems: ScopeItem[] = []
      const validationErrors: ExcelValidationError[] = []

      for (let i = 1; i < rawData.length; i++) { // Skip header row
        const row = rawData[i] as any[]
        const rowNumber = i + 1

        try {
          const scopeData = this.mapRowToScopeItem(row, rowNumber)
          const validatedData = scopeItemSchema.parse(scopeData)
          
          const scopeItem: Partial<ScopeItem> = {
            ...validatedData,
            id: crypto.randomUUID(),
            project_id: projectId,
            status: 'not_started',
            progress_percentage: 0,
            assigned_to: [],
            dependencies: [],
            blocks: [],
            requires_client_approval: false,
            client_approved: false,
            quality_check_required: true,
            quality_check_passed: false,
            material_list: [],
            created_by: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_updated_by: userId,
            excel_row_number: rowNumber,
            import_batch_id: batchId,
            validation_errors: []
          }

          processedItems.push(scopeItem as ScopeItem)
          batch.successful_imports++
        } catch (error) {
          batch.failed_imports++
          
          if (error instanceof z.ZodError) {
            error.errors.forEach(err => {
              validationErrors.push({
                row_number: rowNumber,
                column: this.getColumnName(err.path[0] as string),
                error_message: err.message,
                error_type: 'invalid_format',
                suggested_fix: this.getSuggestedFix(err)
              })
            })
          } else {
            validationErrors.push({
              row_number: rowNumber,
              column: 'unknown',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              error_type: 'invalid_format'
            })
          }
        }
      }

      batch.validation_errors = validationErrors

      // Save to database
      if (processedItems.length > 0) {
        const { error: insertError } = await supabase
          .from('scope_items')
          .insert(processedItems)

        if (insertError) {
          throw insertError
        }
      }

      // Save import batch record
      await supabase
        .from('excel_import_batches')
        .insert(batch)

      return batch
    } catch (error) {
      console.error('Excel import error:', error)
      throw error
    }
  }

  private mapRowToScopeItem(row: any[], rowNumber: number): any {
    return {
      category: row[0]?.toString()?.toLowerCase(),
      title: row[1]?.toString(),
      description: row[2]?.toString(),
      specifications: row[3]?.toString() || '',
      unit_of_measure: row[4]?.toString(),
      quantity: parseFloat(row[5]) || 0,
      unit_price: parseFloat(row[6]) || 0,
      markup_percentage: parseFloat(row[7]) || 0,
      timeline_start: this.parseDate(row[8]),
      timeline_end: this.parseDate(row[9]),
      priority: parseInt(row[10]) || 1,
      risk_level: row[11]?.toString()?.toLowerCase() || 'medium',
      special_requirements: row[12]?.toString() || '',
      drawing_reference: row[13]?.toString() || ''
    }
  }

  private parseDate(value: any): string | undefined {
    if (!value) return undefined
    
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]
    }
    
    if (typeof value === 'string') {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    }
    
    return undefined
  }

  private getColumnName(fieldPath: string): string {
    const fieldToColumn = Object.fromEntries(
      Object.entries(EXCEL_COLUMNS).map(([col, field]) => [field, col])
    )
    return fieldToColumn[fieldPath] || 'Unknown'
  }

  private getSuggestedFix(error: z.ZodIssue): string {
    switch (error.code) {
      case 'invalid_type':
        return `Expected ${error.expected}, got ${error.received}`
      case 'too_small':
        return `Minimum value is ${error.minimum}`
      case 'too_big':
        return `Maximum value is ${error.maximum}`
      case 'invalid_enum_value':
        return `Valid options: ${error.options.join(', ')}`
      default:
        return 'Please check the value format'
    }
  }

  async exportScopeToExcel(projectId: string, category?: string): Promise<Blob> {
    // Fetch scope items
    let query = supabase
      .from('scope_items')
      .select('*')
      .eq('project_id', projectId)
      .order('category, title')

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data: scopeItems, error } = await query

    if (error) throw error

    // Create Excel workbook
    const workbook = XLSX.utils.book_new()

    // Prepare data for Excel
    const excelData = [
      // Header row
      [
        'Category',
        'Title',
        'Description', 
        'Specifications',
        'Unit of Measure',
        'Quantity',
        'Unit Price',
        'Markup %',
        'Timeline Start',
        'Timeline End',
        'Priority',
        'Risk Level',
        'Special Requirements',
        'Drawing Reference',
        'Status',
        'Progress %',
        'Total Price'
      ],
      // Data rows
      ...(scopeItems || []).map(item => [
        item.category,
        item.title,
        item.description,
        item.specifications,
        item.unit_of_measure,
        item.quantity,
        item.unit_price,
        item.markup_percentage,
        item.timeline_start,
        item.timeline_end,
        item.priority,
        item.risk_level,
        item.special_requirements,
        item.drawing_reference,
        item.status,
        item.progress_percentage,
        item.quantity * item.unit_price * (1 + item.markup_percentage / 100)
      ])
    ]

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(excelData)

    // Set column widths
    worksheet['!cols'] = [
      { width: 12 }, // Category
      { width: 30 }, // Title
      { width: 40 }, // Description
      { width: 30 }, // Specifications
      { width: 12 }, // Unit
      { width: 10 }, // Quantity
      { width: 12 }, // Unit Price
      { width: 10 }, // Markup
      { width: 12 }, // Start Date
      { width: 12 }, // End Date
      { width: 8 },  // Priority
      { width: 10 }, // Risk
      { width: 30 }, // Requirements
      { width: 15 }, // Drawing Ref
      { width: 15 }, // Status
      { width: 10 }, // Progress
      { width: 15 }  // Total
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Scope Items')

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { 
      type: 'array', 
      bookType: 'xlsx' 
    })

    return new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })
  }
}

export const excelImportService = new ExcelImportService()
```

---

## **🧭 Global Navigation Integration**

### **Scope Page for GlobalSidebar**
```typescript
// app/(dashboard)/scope/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { ScopeManagementInterface } from '@/components/scope/ScopeManagementInterface'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Construction, Hammer, Zap, Wrench, Plus, Filter } from 'lucide-react'
import { AuthGuard } from '@/components/auth/AuthGuard'

interface ScopeOverview {
  total_items: number
  categories: {
    construction: { count: number; completion: number }
    millwork: { count: number; completion: number }
    electrical: { count: number; completion: number }
    mechanical: { count: number; completion: number }
  }
  pending_approvals: number
  overdue_items: number
}

export default function GlobalScopePage() {
  const { profile } = useAuth()
  const { canViewScope, canCreateProject, checkPermission } = usePermissions()
  const [overview, setOverview] = useState<ScopeOverview | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScopeOverview()
  }, [])

  const fetchScopeOverview = async () => {
    try {
      const response = await fetch('/api/scope?type=overview')
      if (response.ok) {
        const data = await response.json()
        setOverview(data.overview)
      }
    } catch (error) {
      console.error('Failed to fetch scope overview:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    {
      id: 'construction',
      name: 'Construction',
      icon: Construction,
      color: 'bg-blue-500',
      description: 'Structural and general construction items'
    },
    {
      id: 'millwork',
      name: 'Millwork',
      icon: Hammer,
      color: 'bg-amber-500',
      description: 'Custom woodwork and cabinetry'
    },
    {
      id: 'electrical',
      name: 'Electrical',
      icon: Zap,
      color: 'bg-yellow-500',
      description: 'Electrical systems and installations'
    },
    {
      id: 'mechanical',
      name: 'Mechanical',
      icon: Wrench,
      color: 'bg-green-500',
      description: 'HVAC and mechanical systems'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <AuthGuard requiredPermission="scope.view">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Scope Management</h1>
            <p className="text-muted-foreground">
              Manage scope items across all projects you have access to
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            {checkPermission('scope.create') && (
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Scope Item
              </Button>
            )}
          </div>
        </div>

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => {
              const categoryData = overview.categories[category.id as keyof typeof overview.categories]
              return (
                <Card key={category.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {category.name}
                    </CardTitle>
                    <category.icon className={`h-4 w-4 text-white rounded p-0.5 ${category.color}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{categoryData?.count || 0}</div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{categoryData?.completion || 0}% complete</span>
                      <Badge variant="secondary" className="text-xs">
                        {categoryData?.count || 0} items
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All Items</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <ScopeManagementInterface 
              category="all" 
              globalView={true}
              userPermissions={{
                canEdit: checkPermission('scope.update'),
                canDelete: checkPermission('scope.delete'),
                canViewPricing: checkPermission('scope.prices.view'),
                canAssignSupplier: checkPermission('scope.assign_supplier')
              }}
            />
          </TabsContent>

          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <category.icon className={`h-5 w-5 text-white rounded p-1 ${category.color}`} />
                <div>
                  <h3 className="font-semibold">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              
              <ScopeManagementInterface 
                category={category.id}
                globalView={true}
                userPermissions={{
                  canEdit: checkPermission('scope.update'),
                  canDelete: checkPermission('scope.delete'),
                  canViewPricing: checkPermission('scope.prices.view'),
                  canAssignSupplier: checkPermission('scope.assign_supplier')
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AuthGuard>
  )
}
```

### **Global Scope API Integration**
```typescript
// Enhanced scope API to support global navigation view
// This integrates with the existing /api/scope/route.ts from Wave-1-Foundation

// Additional endpoint for scope overview
// app/api/scope/overview/route.ts
import { NextRequest } from 'next/server'
import { requirePermission } from '@/lib/middleware/auth'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const GET = requirePermission('scope.view')(async (request: NextRequest, user) => {
  const supabase = createRouteHandlerClient({ cookies })

  // Get scope counts by category
  const categoryCounts = await Promise.all([
    'construction', 'millwork', 'electrical', 'mechanical'
  ].map(async (category) => {
    let query = supabase
      .from('scope_items')
      .select('id, status, progress', { count: 'exact' })
      .eq('category', category)

    // Apply user role filtering
    if (user.role === 'client') {
      const { data: clientProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', user.id)
      
      const clientProjectIds = clientProjects?.map(p => p.id) || []
      query = query.in('project_id', clientProjectIds)
    } else if (user.role === 'project_manager') {
      const { data: managedProjects } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('role', 'project_manager')
      
      const managedProjectIds = managedProjects?.map(p => p.project_id) || []
      query = query.in('project_id', managedProjectIds)
    }

    const { data: items, count } = await query

    // Calculate completion percentage
    const completedItems = items?.filter(item => item.status === 'completed').length || 0
    const completion = count ? Math.round((completedItems / count) * 100) : 0

    return {
      category,
      count: count || 0,
      completion
    }
  }))

  // Build categories object
  const categories = categoryCounts.reduce((acc, cat) => {
    acc[cat.category] = {
      count: cat.count,
      completion: cat.completion
    }
    return acc
  }, {} as Record<string, { count: number; completion: number }>)

  // Get total counts
  const totalItems = categoryCounts.reduce((sum, cat) => sum + cat.count, 0)

  // Get pending approvals if user can approve
  let pendingApprovals = 0
  if (['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager'].includes(user.role)) {
    const { count } = await supabase
      .from('document_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('approver_id', user.id)
    
    pendingApprovals = count || 0
  }

  return new Response(
    JSON.stringify({
      overview: {
        total_items: totalItems,
        categories,
        pending_approvals: pendingApprovals,
        overdue_items: 0, // TODO: Calculate overdue items
        user_role: user.role
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: Scope Management System Implementation
OBJECTIVE: Deploy comprehensive 4-category scope system with Excel integration and dependency tracking
CONTEXT: Core business logic for construction project scope management with real-time progress monitoring

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Database: @Planing App/Wave-1-Foundation/database-schema-design.md
- Project System: @Planing App/Wave-1-Foundation/project-creation-system.md
- UI Framework: @Planing App/Wave-1-Foundation/core-ui-framework.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement 4-category scope management (construction, millwork, electrical, mechanical)
2. Build Excel import/export system with validation and error handling
3. Create dependency tracking system for scope relationships
4. Implement real-time progress monitoring and status updates
5. Build supplier assignment workflow integration
6. Create advanced data table with inline editing capabilities

DELIVERABLES:
1. Complete scope management interface with category tabs
2. Excel import/export service with validation
3. Dependency management system 
4. Progress tracking and status workflow
5. Supplier assignment integration
6. Advanced data table with permissions-based features
```

### **Quality Gates**
- ✅ All 4 scope categories properly implemented and functional
- ✅ Excel import validates data and handles errors gracefully
- ✅ Dependency tracking prevents circular dependencies
- ✅ Progress monitoring updates in real-time
- ✅ Supplier assignment integrates with purchase workflow
- ✅ Data table respects user permissions and roles

### **Dependencies for Next Wave**
- Scope management system must be fully functional
- Excel import/export tested with real project data
- Dependency system validated for complex relationships
- Progress tracking integrated with timeline management
- Foundation ready for document and approval workflows

---

## **🎯 SUCCESS CRITERIA**
1. **Category Management**: All 4 scope categories with appropriate workflows
2. **Excel Integration**: Seamless import/export with validation and error handling
3. **Dependency Tracking**: Complex project relationships managed effectively
4. **Progress Monitoring**: Real-time status updates and completion tracking
5. **Permission Integration**: Role-based access controls throughout the system

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md