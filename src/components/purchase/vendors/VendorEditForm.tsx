'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Save, 
  X 
} from 'lucide-react'
import { Vendor, VendorCreateData, VendorUpdateData } from '@/types/purchase'

const vendorSchema = z.object({
  company_name: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters'),
  contact_person: z.string()
    .max(100, 'Contact person name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .max(20, 'Phone number must be less than 20 characters')
    .refine(
      (phone) => !phone || /^[\+]?[1-9][\d\s\-\(\)\.]{7,20}$/.test(phone),
      'Invalid phone number format'
    )
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  payment_terms: z.string()
    .max(50, 'Payment terms must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().optional()
})

type VendorFormData = z.infer<typeof vendorSchema>

interface VendorEditFormProps {
  vendor?: Vendor
  onSubmit: (data: VendorCreateData | VendorUpdateData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const COMMON_PAYMENT_TERMS = [
  'Net 30',
  'Net 15',
  'Net 60',
  'COD',
  '2/10 Net 30',
  'Due on Receipt',
  'Monthly',
  'Quarterly'
]

export const VendorEditForm: React.FC<VendorEditFormProps> = ({
  vendor,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEditing = !!vendor

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid, isDirty },
    reset
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      company_name: vendor?.company_name || '',
      contact_person: vendor?.contact_person || '',
      email: vendor?.email || '',
      phone: vendor?.phone || '',
      address: vendor?.address || '',
      payment_terms: vendor?.payment_terms || '',
      is_active: vendor?.is_active ?? true
    }
  })

  const watchedIsActive = watch('is_active')

  const onFormSubmit = async (data: VendorFormData) => {
    try {
      // Clean up empty strings to undefined for optional fields
      const cleanedData = {
        ...data,
        contact_person: data.contact_person || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        payment_terms: data.payment_terms || undefined
      }

      await onSubmit(cleanedData)
    } catch (error) {
      console.error('Vendor form submission failed:', error)
    }
  }

  const handlePaymentTermSelect = (term: string) => {
    setValue('payment_terms', term, { shouldDirty: true })
  }

  return (
    <div className="max-w-2xl mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>{isEditing ? 'Edit Vendor' : 'Add New Vendor'}</span>
        </DialogTitle>
      </DialogHeader>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vendor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
              {/* Company Name */}
              <div>
                <Label htmlFor="company_name" className="text-sm font-medium">
                  Company Name *
                </Label>
                <Input
                  id="company_name"
                  {...register('company_name')}
                  placeholder="Enter company name"
                  className="mt-1"
                  disabled={loading}
                />
                {errors.company_name && (
                  <p className="text-sm text-red-600 mt-1">{errors.company_name.message}</p>
                )}
              </div>

              {/* Contact Person */}
              <div>
                <Label htmlFor="contact_person" className="text-sm font-medium">
                  Contact Person
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contact_person"
                    {...register('contact_person')}
                    placeholder="Enter contact person name"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.contact_person && (
                  <p className="text-sm text-red-600 mt-1">{errors.contact_person.message}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Enter email address"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="Enter phone number"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
                )}
              </div>

              {/* Address */}
              <div>
                <Label htmlFor="address" className="text-sm font-medium">
                  Address
                </Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Textarea
                    id="address"
                    {...register('address')}
                    placeholder="Enter complete address"
                    className="pl-10 min-h-[80px]"
                    disabled={loading}
                  />
                </div>
                {errors.address && (
                  <p className="text-sm text-red-600 mt-1">{errors.address.message}</p>
                )}
              </div>

              {/* Payment Terms */}
              <div>
                <Label htmlFor="payment_terms" className="text-sm font-medium">
                  Payment Terms
                </Label>
                <div className="relative mt-1">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="payment_terms"
                    {...register('payment_terms')}
                    placeholder="Enter payment terms"
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
                {errors.payment_terms && (
                  <p className="text-sm text-red-600 mt-1">{errors.payment_terms.message}</p>
                )}

                {/* Common Payment Terms */}
                <div className="mt-2">
                  <Label className="text-xs text-gray-500">Common terms:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {COMMON_PAYMENT_TERMS.map((term) => (
                      <Button
                        key={term}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handlePaymentTermSelect(term)}
                        className="h-6 px-2 text-xs"
                        disabled={loading}
                      >
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Status */}
              {isEditing && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="is_active" className="text-sm font-medium">
                      Vendor Status
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      {watchedIsActive ? 
                        'Vendor is active and can receive new orders' : 
                        'Vendor is inactive and will not receive new orders'
                      }
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={watchedIsActive}
                    onCheckedChange={(checked) => setValue('is_active', checked, { shouldDirty: true })}
                    disabled={loading}
                  />
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                
                <Button
                  type="submit"
                  disabled={loading || !isValid || (!isDirty && isEditing)}
                  className="flex items-center space-x-2 min-w-32"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{isEditing ? 'Update Vendor' : 'Create Vendor'}</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Form Status */}
              {isEditing && !isDirty && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">No changes made</p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}