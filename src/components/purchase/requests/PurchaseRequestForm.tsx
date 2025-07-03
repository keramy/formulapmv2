'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Calendar, DollarSign, Package, AlertTriangle } from 'lucide-react'
import { PurchaseRequest, PurchaseRequestCreateData, UrgencyLevel } from '@/types/purchase'
import { useProjects } from '@/hooks/useProjects'

const formSchema = z.object({
  project_id: z.string().min(1, 'Project is required'),
  item_description: z.string().min(1, 'Item description is required').max(500, 'Description too long'),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  unit_of_measure: z.string().min(1, 'Unit of measure is required'),
  estimated_cost: z.number().optional(),
  required_date: z.string().min(1, 'Required date is required'),
  urgency_level: z.enum(['low', 'normal', 'high', 'emergency'] as const),
  justification: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface PurchaseRequestFormProps {
  request?: PurchaseRequest
  projectId?: string
  onSubmit: (data: PurchaseRequestCreateData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const URGENCY_CONFIG = {
  low: {
    label: 'Low',
    description: 'Standard procurement timeline',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  normal: {
    label: 'Normal',
    description: 'Regular business need',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  high: {
    label: 'High',
    description: 'Expedited processing needed',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50'
  },
  emergency: {
    label: 'Emergency',
    description: 'Critical for project continuity',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50'
  }
}

const COMMON_UNITS = [
  'pieces', 'kg', 'tons', 'meters', 'feet', 'square meters', 'square feet',
  'cubic meters', 'cubic feet', 'liters', 'gallons', 'hours', 'days',
  'boxes', 'packages', 'rolls', 'sheets', 'bags', 'sets'
]

export const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({
  request,
  projectId,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { projects, fetchProjects } = useProjects()
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>('normal')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      project_id: projectId || request?.project_id || '',
      item_description: request?.item_description || '',
      quantity: request?.quantity || 1,
      unit_of_measure: request?.unit_of_measure || '',
      estimated_cost: request?.estimated_cost || undefined,
      required_date: request?.required_date ? new Date(request.required_date).toISOString().split('T')[0] : '',
      urgency_level: request?.urgency_level || 'normal',
      justification: request?.justification || ''
    }
  })

  const watchedUrgency = watch('urgency_level')
  const watchedCost = watch('estimated_cost')

  useEffect(() => {
    if (!projects.length) {
      fetchProjects()
    }
  }, [projects, fetchProjects])

  useEffect(() => {
    setSelectedUrgency(watchedUrgency)
  }, [watchedUrgency])

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        project_id: data.project_id,
        item_description: data.item_description,
        quantity: data.quantity,
        unit_of_measure: data.unit_of_measure,
        estimated_cost: data.estimated_cost,
        required_date: data.required_date,
        urgency_level: data.urgency_level,
        justification: data.justification
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const urgencyConfig = URGENCY_CONFIG[selectedUrgency]

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>{request ? 'Edit Purchase Request' : 'Create Purchase Request'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project_id">Project *</Label>
            <Select 
              value={watch('project_id')} 
              onValueChange={(value) => setValue('project_id', value)}
              disabled={!!projectId || loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex items-center space-x-2">
                      <span>{project.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {project.status}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.project_id && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.project_id.message}
              </p>
            )}
          </div>

          {/* Item Description */}
          <div className="space-y-2">
            <Label htmlFor="item_description">Item Description *</Label>
            <Textarea
              {...register('item_description')}
              placeholder="Detailed description of the item(s) needed..."
              rows={3}
              disabled={loading}
            />
            {errors.item_description && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.item_description.message}
              </p>
            )}
          </div>

          {/* Quantity and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                {...register('quantity', { valueAsNumber: true })}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Enter quantity"
                disabled={loading}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_of_measure">Unit of Measure *</Label>
              <Select 
                value={watch('unit_of_measure')} 
                onValueChange={(value) => setValue('unit_of_measure', value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit_of_measure && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.unit_of_measure.message}
                </p>
              )}
            </div>
          </div>

          {/* Estimated Cost */}
          <div className="space-y-2">
            <Label htmlFor="estimated_cost">Estimated Cost</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('estimated_cost', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter estimated cost"
                className="pl-10"
                disabled={loading}
              />
            </div>
            {watchedCost && watchedCost > 10000 && (
              <div className="flex items-center space-x-2 text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>High value purchase - additional approvals may be required</span>
              </div>
            )}
          </div>

          {/* Required Date */}
          <div className="space-y-2">
            <Label htmlFor="required_date">Required Date *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('required_date')}
                type="date"
                min={new Date().toISOString().split('T')[0]}
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.required_date && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.required_date.message}
              </p>
            )}
          </div>

          {/* Urgency Level */}
          <div className="space-y-2">
            <Label htmlFor="urgency_level">Urgency Level *</Label>
            <Select 
              value={watch('urgency_level')} 
              onValueChange={(value) => setValue('urgency_level', value as UrgencyLevel)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select urgency level" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(URGENCY_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${config.color}`} />
                      <span>{config.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Urgency Description */}
            <div className={`p-3 rounded-lg ${urgencyConfig.bgColor} border-l-4 border-l-current ${urgencyConfig.textColor}`}>
              <p className="text-sm font-medium">{urgencyConfig.label} Priority</p>
              <p className="text-xs">{urgencyConfig.description}</p>
              {selectedUrgency === 'emergency' && (
                <p className="text-xs mt-1 font-medium">
                  Emergency requests bypass normal approval workflow and go directly to Purchase Department
                </p>
              )}
            </div>
          </div>

          {/* Justification */}
          <div className="space-y-2">
            <Label htmlFor="justification">
              Justification 
              {(selectedUrgency === 'high' || selectedUrgency === 'emergency') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </Label>
            <Textarea
              {...register('justification')}
              placeholder="Explain why this purchase is needed and any special requirements..."
              rows={3}
              disabled={loading}
            />
            {(selectedUrgency === 'high' || selectedUrgency === 'emergency') && !watch('justification') && (
              <p className="text-sm text-orange-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Justification required for {selectedUrgency} priority requests
              </p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isValid || loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                request ? 'Update Request' : 'Create Request'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}