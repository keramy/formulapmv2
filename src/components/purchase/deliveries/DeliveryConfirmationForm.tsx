'use client'

import React, { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Truck, 
  Camera, 
  Upload, 
  X, 
  Package, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ImageIcon,
  FileText,
  Calendar,
  Building
} from 'lucide-react'
import { PurchaseOrder, DeliveryConfirmationData, DeliveryStatus } from '@/types/purchase'

const deliverySchema = z.object({
  delivery_date: z.string().min(1, 'Delivery date is required'),
  quantity_received: z.number().min(0, 'Quantity received must be non-negative'),
  quantity_ordered: z.number().min(1, 'Quantity ordered must be positive'),
  condition_notes: z.string().max(1000, 'Condition notes must be less than 1000 characters').optional(),
  status: z.enum(['pending', 'partial', 'completed', 'damaged', 'rejected']),
  photos: z.array(z.string()).optional()
})

type DeliveryFormData = z.infer<typeof deliverySchema>

interface DeliveryConfirmationFormProps {
  purchaseOrder: PurchaseOrder
  onSubmit: (data: DeliveryConfirmationData) => Promise<void>
  onClose: () => void
  loading?: boolean
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    description: 'Delivery is expected but not yet received',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50'
  },
  partial: {
    label: 'Partial',
    description: 'Only part of the order was delivered',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50'
  },
  completed: {
    label: 'Completed',
    description: 'Full order delivered in good condition',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50'
  },
  damaged: {
    label: 'Damaged',
    description: 'Items delivered but damaged',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  rejected: {
    label: 'Rejected',
    description: 'Items delivered but rejected',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgColor: 'bg-gray-50'
  }
}

export const DeliveryConfirmationForm: React.FC<DeliveryConfirmationFormProps> = ({
  purchaseOrder,
  onSubmit,
  onClose,
  loading = false
}) => {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<DeliveryStatus>('completed')

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: {
      delivery_date: new Date().toISOString().split('T')[0],
      quantity_received: 0,
      quantity_ordered: purchaseOrder.purchase_request?.quantity || 0,
      status: 'completed',
      photos: []
    }
  })

  const watchedQuantityReceived = watch('quantity_received')
  const watchedQuantityOrdered = watch('quantity_ordered')

  // Auto-determine status based on quantity received
  React.useEffect(() => {
    if (watchedQuantityReceived === 0) {
      setSelectedStatus('pending')
      setValue('status', 'pending')
    } else if (watchedQuantityReceived < watchedQuantityOrdered) {
      setSelectedStatus('partial')
      setValue('status', 'partial')
    } else {
      setSelectedStatus('completed')
      setValue('status', 'completed')
    }
  }, [watchedQuantityReceived, watchedQuantityOrdered, setValue])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // In a real implementation, this would upload to a cloud service
        // For now, we'll create a mock URL
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve(e.target?.result as string)
          }
          reader.readAsDataURL(file)
        })
      })

      const photoUrls = await Promise.all(uploadPromises)
      setUploadedPhotos(prev => [...prev, ...photoUrls])
      setValue('photos', [...uploadedPhotos, ...photoUrls])
    } catch (error) {
      console.error('Photo upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [uploadedPhotos, setValue])

  const removePhoto = (index: number) => {
    const newPhotos = uploadedPhotos.filter((_, i) => i !== index)
    setUploadedPhotos(newPhotos)
    setValue('photos', newPhotos)
  }

  const handleStatusChange = (status: DeliveryStatus) => {
    setSelectedStatus(status)
    setValue('status', status)
  }

  const onFormSubmit = async (data: DeliveryFormData) => {
    try {
      await onSubmit({
        ...data,
        photos: uploadedPhotos
      })
      onClose()
    } catch (error) {
      console.error('Delivery confirmation failed:', error)
    }
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Truck className="h-5 w-5" />
          <span>Delivery Confirmation</span>
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-6 mt-6">
        {/* Purchase Order Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Purchase Order Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">PO Number</Label>
                <p className="text-sm font-mono">{purchaseOrder.po_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Vendor</Label>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{purchaseOrder.vendor?.company_name || 'Unknown'}</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Total Amount</Label>
                <p className="text-sm font-medium">{formatCurrency(purchaseOrder.total_amount)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Expected Delivery</Label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {purchaseOrder.expected_delivery_date ? 
                      formatDate(purchaseOrder.expected_delivery_date) : 
                      'Not specified'
                    }
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium text-gray-600">Item Description</Label>
              <p className="text-sm mt-1">{purchaseOrder.purchase_request?.item_description || 'N/A'}</p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-600">Ordered Quantity</Label>
              <p className="text-sm">
                {purchaseOrder.purchase_request?.quantity || 0} {purchaseOrder.purchase_request?.unit_of_measure || ''}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Confirmation Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Delivery Confirmation</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_date">Delivery Date *</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    {...register('delivery_date')}
                    className="mt-1"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.delivery_date && (
                    <p className="text-sm text-red-600 mt-1">{errors.delivery_date.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantity_received">Quantity Received *</Label>
                  <Input
                    id="quantity_received"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('quantity_received', { valueAsNumber: true })}
                    className="mt-1"
                  />
                  {errors.quantity_received && (
                    <p className="text-sm text-red-600 mt-1">{errors.quantity_received.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="quantity_ordered">Quantity Ordered (Reference)</Label>
                <Input
                  id="quantity_ordered"
                  type="number"
                  min="1"
                  step="0.01"
                  {...register('quantity_ordered', { valueAsNumber: true })}
                  className="mt-1"
                  readOnly
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Delivery Status</Label>
                <RadioGroup
                  value={selectedStatus}
                  onValueChange={handleStatusChange}
                  className="mt-2"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                      <div key={status} className="flex items-center space-x-2">
                        <RadioGroupItem value={status} id={status} />
                        <Label 
                          htmlFor={status} 
                          className={`flex-1 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedStatus === status 
                              ? `${config.bgColor} border-current ${config.textColor}` 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${config.color}`} />
                            <div>
                              <p className="font-medium">{config.label}</p>
                              <p className="text-xs text-gray-600">{config.description}</p>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="condition_notes">Condition Notes</Label>
                <Textarea
                  id="condition_notes"
                  {...register('condition_notes')}
                  placeholder="Describe the condition of received items, any damage, or other relevant notes..."
                  className="mt-1"
                  rows={3}
                />
                {errors.condition_notes && (
                  <p className="text-sm text-red-600 mt-1">{errors.condition_notes.message}</p>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <Label className="text-sm font-medium">Delivery Photos</Label>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploading ? (
                          <Clock className="w-8 h-8 text-gray-400 animate-spin" />
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400" />
                        )}
                        <p className="mb-2 text-sm text-gray-500">
                          {uploading ? 'Uploading...' : 'Click to upload photos'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG (Max 10 photos)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        disabled={uploading || uploadedPhotos.length >= 10}
                      />
                    </label>
                  </div>

                  {uploadedPhotos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {uploadedPhotos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Delivery photo ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !isValid}
                  className="min-w-32"
                >
                  {loading ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Delivery
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}