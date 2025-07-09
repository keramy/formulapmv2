/**
 * Formula PM 2.0 Scope Item Editor Component
 * Wave 2B Business Logic Implementation
 * 
 * Simplified scope item editor using modular form sections for better maintainability
 * Follows optimized-coordinator-v1.md patterns for component separation
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ScopeItem, ScopeItemFormData } from '@/types/scope'
import { usePermissions } from '@/hooks/usePermissions'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form } from '@/components/ui/form'
import { useToast } from '@/components/ui/use-toast'
import { Save, X, Copy } from 'lucide-react'
import { 
  CoreInformationSection, 
  PricingSection, 
  TimelineSection, 
  CostTrackingSection 
} from './form/ScopeFormSections'

const scopeItemSchema = z.object({
  category: z.enum(['construction', 'millwork', 'electrical', 'mechanical']),
  item_code: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  title: z.string().optional(),
  specifications: z.string().optional(),
  quantity: z.number().min(0, 'Quantity must be positive'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  markup_percentage: z.number().min(0).max(100, 'Markup must be between 0-100%').optional(),
  initial_cost: z.number().min(0, 'Initial cost must be positive').optional(),
  actual_cost: z.number().min(0, 'Actual cost must be positive').optional(),
  timeline_start: z.string().optional(),
  timeline_end: z.string().optional(),
  duration_days: z.number().min(0, 'Duration must be positive').optional(),
  priority: z.number().min(1).max(10, 'Priority must be between 1-10'),
  risk_level: z.enum(['low', 'medium', 'high']),
  installation_method: z.string().optional(),
  special_requirements: z.array(z.string()).optional(),
  requires_client_approval: z.boolean().optional(),
  quality_check_required: z.boolean().optional(),
  assigned_to: z.array(z.string()).optional(),
  supplier_id: z.string().optional(),
  dependencies: z.array(z.string()).optional()
})

interface ScopeItemEditorProps {
  item?: ScopeItem
  projectId: string
  mode: 'create' | 'edit' | 'view'
  onSave: (data: ScopeItemFormData) => Promise<void>
  onCancel: () => void
  onDuplicate?: (item: ScopeItem) => void
}

export const ScopeItemEditor: React.FC<ScopeItemEditorProps> = ({
  item,
  projectId,
  mode,
  onSave,
  onCancel,
  onDuplicate
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  const { 
    canEditScope,
    checkPermission 
  } = usePermissions()
  
  const { toast } = useToast()

  // Permission checks
  const canViewCosts = checkPermission('projects.read.all')
  const canEditCosts = checkPermission('projects.update')
  const canViewPricing = checkPermission('projects.read.all')
  const canEditPricing = checkPermission('projects.update')
  const canAssign = checkPermission('projects.update')
  const canManageDependencies = checkPermission('projects.update')

  // Form setup
  const form = useForm<ScopeItemFormData>({
    resolver: zodResolver(scopeItemSchema),
    defaultValues: {
      category: item?.category || 'construction',
      item_code: item?.item_code || '',
      description: item?.description || '',
      title: item?.title || '',
      specifications: item?.specifications || '',
      quantity: item?.quantity || 1,
      unit_of_measure: item?.unit_of_measure || 'pcs',
      unit_price: item?.unit_price || 0,
      markup_percentage: item?.markup_percentage || 0,
      initial_cost: item?.initial_cost || undefined,
      actual_cost: item?.actual_cost || undefined,
      timeline_start: item?.timeline_start || '',
      timeline_end: item?.timeline_end || '',
      duration_days: item?.duration_days || undefined,
      priority: item?.priority || 1,
      risk_level: item?.risk_level || 'medium',
      installation_method: item?.installation_method || '',
      special_requirements: item?.special_requirements || [],
      requires_client_approval: item?.requires_client_approval || false,
      quality_check_required: item?.quality_check_required !== false,
      assigned_to: item?.assigned_to || [],
      supplier_id: item?.supplier_id || '',
      dependencies: item?.dependencies || []
    }
  })

  const { watch, setValue, getValues } = form

  // Watch quantity and unit price for total calculation
  const quantity = watch('quantity')
  const unitPrice = watch('unit_price')
  const markupPercentage = watch('markup_percentage')

  // Calculate totals
  const totalPrice = quantity * unitPrice
  const finalPrice = totalPrice * (1 + (markupPercentage || 0) / 100)

  // Auto-populate title from description if empty
  useEffect(() => {
    const description = watch('description')
    const currentTitle = watch('title')
    
    if (description && !currentTitle && mode === 'create') {
      setValue('title', description.substring(0, 100))
    }
  }, [watch('description'), mode, setValue])

  // Calculate duration from dates
  useEffect(() => {
    const startDate = watch('timeline_start')
    const endDate = watch('timeline_end')
    
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 0) {
        setValue('duration_days', diffDays)
      }
    }
  }, [watch('timeline_start'), watch('timeline_end'), setValue])

  const handleSubmit = async (data: ScopeItemFormData) => {
    setIsLoading(true)
    try {
      await onSave(data)
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save scope item",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isReadOnly = mode === 'view' || !canEditScope()

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>
                {mode === 'create' ? 'Create New' : mode === 'edit' ? 'Edit' : 'View'} Scope Item
              </span>
              {item && (
                <Badge variant="outline">#{item.item_no}</Badge>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {onDuplicate && item && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDuplicate(item)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new scope item for this project'
              : mode === 'edit'
              ? 'Edit the scope item details'
              : 'View scope item details'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Core Information Section */}
            <CoreInformationSection 
              form={form} 
              isReadOnly={isReadOnly}
            />

            {/* Pricing Section */}
            <PricingSection 
              form={form} 
              isReadOnly={isReadOnly}
              canViewPricing={canViewPricing}
              canEditPricing={canEditPricing}
            />

            {/* Cost Tracking Section */}
            <CostTrackingSection 
              form={form} 
              isReadOnly={isReadOnly}
              canViewCosts={canViewCosts}
              canEditCosts={canEditCosts}
            />

            {/* Timeline Section */}
            <TimelineSection 
              form={form} 
              isReadOnly={isReadOnly}
            />

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              
              {!isReadOnly && (
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : mode === 'create' ? 'Create Item' : 'Save Changes'}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}