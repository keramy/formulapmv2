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
import { AlertCircle, Calendar, DollarSign, ShoppingCart, Building, Package } from 'lucide-react'
import { PurchaseOrder, PurchaseOrderCreateData, PurchaseRequest, Vendor } from '@/types/purchase'
import { useVendors } from '@/hooks/usePurchase'

const formSchema = z.object({
  purchase_request_id: z.string().min(1, 'Purchase request is required'),
  vendor_id: z.string().min(1, 'Vendor is required'),
  total_amount: z.number().min(0.01, 'Total amount must be greater than 0'),
  po_date: z.string().min(1, 'PO date is required'),
  expected_delivery_date: z.string().optional(),
  terms_conditions: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface PurchaseOrderFormProps {
  order?: PurchaseOrder
  purchaseRequest?: PurchaseRequest
  onSubmit: (data: PurchaseOrderCreateData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({
  order,
  purchaseRequest,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { vendors, fetchVendors, activeVendors } = useVendors()
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

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
      purchase_request_id: purchaseRequest?.id || order?.purchase_request_id || '',
      vendor_id: order?.vendor_id || '',
      total_amount: order?.total_amount || purchaseRequest?.estimated_cost || 0,
      po_date: order?.po_date ? new Date(order.po_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expected_delivery_date: order?.expected_delivery_date ? new Date(order.expected_delivery_date).toISOString().split('T')[0] : '',
      terms_conditions: order?.terms_conditions || ''
    }
  })

  const watchedVendorId = watch('vendor_id')
  const watchedAmount = watch('total_amount')

  useEffect(() => {
    if (!vendors.length) {
      fetchVendors()
    }
  }, [vendors, fetchVendors])

  useEffect(() => {
    const vendor = vendors.find(v => v.id === watchedVendorId)
    setSelectedVendor(vendor || null)
  }, [watchedVendorId, vendors])

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        purchase_request_id: data.purchase_request_id,
        vendor_id: data.vendor_id,
        total_amount: data.total_amount,
        po_date: data.po_date,
        expected_delivery_date: data.expected_delivery_date || undefined,
        terms_conditions: data.terms_conditions || undefined
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const calculateDeliveryDate = () => {
    const poDate = new Date(watch('po_date'))
    // Default to 14 days from PO date
    const deliveryDate = new Date(poDate)
    deliveryDate.setDate(deliveryDate.getDate() + 14)
    return deliveryDate.toISOString().split('T')[0]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5" />
          <span>{order ? 'Edit Purchase Order' : 'Create Purchase Order'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Purchase Request Info */}
        {purchaseRequest && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Purchase Request #{purchaseRequest.request_number}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Item:</span>
                  <p className="truncate">{purchaseRequest.item_description}</p>
                </div>
                <div>
                  <span className="font-medium">Quantity:</span>
                  <p>{purchaseRequest.quantity} {purchaseRequest.unit_of_measure}</p>
                </div>
                <div>
                  <span className="font-medium">Required Date:</span>
                  <p>{new Date(purchaseRequest.required_date).toLocaleDateString()}</p>
                </div>
                {purchaseRequest.estimated_cost && (
                  <div>
                    <span className="font-medium">Estimated Cost:</span>
                    <p className="text-green-600 font-semibold">
                      {formatCurrency(purchaseRequest.estimated_cost)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Hidden purchase request ID */}
          <input type="hidden" {...register('purchase_request_id')} />

          {/* Vendor Selection */}
          <div className="space-y-2">
            <Label htmlFor="vendor_id">Vendor *</Label>
            <Select 
              value={watch('vendor_id')} 
              onValueChange={(value) => setValue('vendor_id', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                {activeVendors.map((vendor) => (
                  <SelectItem key={vendor.id} value={vendor.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium">{vendor.company_name}</p>
                        {vendor.contact_person && (
                          <p className="text-sm text-gray-500">{vendor.contact_person}</p>
                        )}
                      </div>
                      {vendor.average_rating && (
                        <Badge variant="outline" className="ml-2">
                          ⭐ {vendor.average_rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vendor_id && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.vendor_id.message}
              </p>
            )}

            {/* Selected Vendor Info */}
            {selectedVendor && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <h3 className="font-medium">{selectedVendor.company_name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mt-1">
                        {selectedVendor.email && (
                          <p>Email: {selectedVendor.email}</p>
                        )}
                        {selectedVendor.phone && (
                          <p>Phone: {selectedVendor.phone}</p>
                        )}
                        {selectedVendor.payment_terms && (
                          <p>Payment Terms: {selectedVendor.payment_terms}</p>
                        )}
                        {selectedVendor.average_rating && (
                          <p>Rating: ⭐ {selectedVendor.average_rating.toFixed(1)}/5</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="total_amount">Total Amount *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                {...register('total_amount', { valueAsNumber: true })}
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter total amount"
                className="pl-10"
                disabled={loading}
              />
            </div>
            {errors.total_amount && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.total_amount.message}
              </p>
            )}
            {watchedAmount && (
              <p className="text-sm text-gray-600">
                Amount: {formatCurrency(watchedAmount)}
              </p>
            )}
          </div>

          {/* PO Date and Expected Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="po_date">PO Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  {...register('po_date')}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              {errors.po_date && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.po_date.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  {...register('expected_delivery_date')}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setValue('expected_delivery_date', calculateDeliveryDate())}
                className="text-xs"
              >
                Set to 14 days from PO date
              </Button>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-2">
            <Label htmlFor="terms_conditions">Terms and Conditions</Label>
            <Textarea
              {...register('terms_conditions')}
              placeholder="Enter specific terms, delivery instructions, quality requirements, etc..."
              rows={4}
              disabled={loading}
            />
            {selectedVendor?.payment_terms && (
              <p className="text-sm text-gray-600">
                Vendor default payment terms: {selectedVendor.payment_terms}
              </p>
            )}
          </div>

          {/* Cost Comparison Alert */}
          {purchaseRequest?.estimated_cost && watchedAmount && 
           Math.abs(watchedAmount - purchaseRequest.estimated_cost) / purchaseRequest.estimated_cost > 0.1 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-medium text-orange-900">Cost Variance Detected</h3>
                    <p className="text-sm text-orange-700">
                      PO amount differs significantly from estimated cost: 
                      {formatCurrency(purchaseRequest.estimated_cost)} → {formatCurrency(watchedAmount)}
                      ({watchedAmount > purchaseRequest.estimated_cost ? '+' : ''}
                      {(((watchedAmount - purchaseRequest.estimated_cost) / purchaseRequest.estimated_cost) * 100).toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
                order ? 'Update Order' : 'Create Order'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}