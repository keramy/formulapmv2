'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AlertCircle, Building, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react'
import { Vendor, VendorCreateData, VendorUpdateData } from '@/types/purchase'

const formSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  contact_person: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  payment_terms: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface VendorFormProps {
  vendor?: Vendor
  onSubmit: (data: VendorCreateData | VendorUpdateData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

const COMMON_PAYMENT_TERMS = [
  'Net 30',
  'Net 15',
  'Net 10',
  '2/10 Net 30',
  'COD',
  'Prepayment',
  'Net 60',
  'Due on Receipt'
]

export const VendorForm: React.FC<VendorFormProps> = ({
  vendor,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: vendor?.company_name || '',
      contact_person: vendor?.contact_person || '',
      email: vendor?.email || '',
      phone: vendor?.phone || '',
      address: vendor?.address || '',
      payment_terms: vendor?.payment_terms || ''
    }
  })

  const handleFormSubmit = async (data: FormData) => {
    try {
      const submitData = {
        company_name: data.company_name,
        contact_person: data.contact_person || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        payment_terms: data.payment_terms || undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Company Name */}
      <div className="space-y-2">
        <Label htmlFor="company_name">Company Name *</Label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            {...register('company_name')}
            placeholder="Enter company name"
            className="pl-10"
            disabled={loading}
          />
        </div>
        {errors.company_name && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.company_name.message}
          </p>
        )}
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <Label htmlFor="contact_person">Contact Person</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            {...register('contact_person')}
            placeholder="Primary contact name"
            className="pl-10"
            disabled={loading}
          />
        </div>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              {...register('email')}
              type="email"
              placeholder="contact@company.com"
              className="pl-10"
              disabled={loading}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-600 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              {...register('phone')}
              type="tel"
              placeholder="+1 (555) 123-4567"
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
          <Textarea
            {...register('address')}
            placeholder="Full business address including city, state, and zip code"
            rows={3}
            className="pl-10"
            disabled={loading}
          />
        </div>
      </div>

      {/* Payment Terms */}
      <div className="space-y-2">
        <Label htmlFor="payment_terms">Payment Terms</Label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            {...register('payment_terms')}
            placeholder="e.g., Net 30, 2/10 Net 30"
            className="pl-10"
            disabled={loading}
          />
        </div>
        
        {/* Common Payment Terms Suggestions */}
        <div className="flex flex-wrap gap-1 mt-2">
          {COMMON_PAYMENT_TERMS.map((term) => (
            <Button
              key={term}
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setValue('payment_terms', term)}
              disabled={loading}
            >
              {term}
            </Button>
          ))}
        </div>
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
            vendor ? 'Update Vendor' : 'Add Vendor'
          )}
        </Button>
      </div>
    </form>
  )
}