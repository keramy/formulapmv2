'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Star, StarOff, Building, MessageSquare } from 'lucide-react'
import { Vendor, VendorRatingCreateData } from '@/types/purchase'
import { useProjects } from '@/hooks/useProjects'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const formSchema = z.object({
  vendor_id: z.string(),
  project_id: z.string().min(1, 'Project is required'),
  quality_score: z.number().min(1, 'Quality rating is required').max(5),
  delivery_score: z.number().min(1, 'Delivery rating is required').max(5),
  communication_score: z.number().min(1, 'Communication rating is required').max(5),
  overall_score: z.number().min(1, 'Overall rating is required').max(5),
  comments: z.string().optional()
})

type FormData = z.infer<typeof formSchema>

interface VendorRatingProps {
  vendor: Vendor
  onSubmit: (data: VendorRatingCreateData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface RatingInputProps {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}

const RatingInput: React.FC<RatingInputProps> = ({
  label,
  description,
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div className="space-y-2">
      <div>
        <Label className="font-medium">{label}</Label>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            disabled={disabled}
            className="p-1 rounded hover:bg-gray-100 disabled:cursor-not-allowed"
          >
            {star <= value ? (
              <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-6 w-6 text-gray-300 hover:text-gray-400" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm font-medium">
          {value > 0 ? `${value}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )
}

export const VendorRating: React.FC<VendorRatingProps> = ({
  vendor,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const { projects, fetchProjects } = useProjects()
  const [qualityScore, setQualityScore] = useState(0)
  const [deliveryScore, setDeliveryScore] = useState(0)
  const [communicationScore, setCommunicationScore] = useState(0)
  const [overallScore, setOverallScore] = useState(0)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vendor_id: vendor.id,
      project_id: '',
      quality_score: 0,
      delivery_score: 0,
      communication_score: 0,
      overall_score: 0,
      comments: ''
    }
  })

  React.useEffect(() => {
    if (!projects.length) {
      fetchProjects()
    }
  }, [projects, fetchProjects])

  // Auto-calculate overall score based on individual scores
  React.useEffect(() => {
    if (qualityScore && deliveryScore && communicationScore) {
      const calculated = Math.round((qualityScore + deliveryScore + communicationScore) / 3)
      setOverallScore(calculated)
      setValue('overall_score', calculated)
    }
  }, [qualityScore, deliveryScore, communicationScore, setValue])

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        vendor_id: data.vendor_id,
        project_id: data.project_id,
        quality_score: data.quality_score,
        delivery_score: data.delivery_score,
        communication_score: data.communication_score,
        overall_score: data.overall_score,
        comments: data.comments
      })
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const updateScore = (field: 'quality' | 'delivery' | 'communication' | 'overall', score: number) => {
    switch (field) {
      case 'quality':
        setQualityScore(score)
        setValue('quality_score', score)
        break
      case 'delivery':
        setDeliveryScore(score)
        setValue('delivery_score', score)
        break
      case 'communication':
        setCommunicationScore(score)
        setValue('communication_score', score)
        break
      case 'overall':
        setOverallScore(score)
        setValue('overall_score', score)
        break
    }
  }

  return (
    <div className="space-y-6">
      {/* Vendor Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Building className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-medium text-blue-900">{vendor.company_name}</h3>
              {vendor.contact_person && (
                <p className="text-sm text-blue-700">Contact: {vendor.contact_person}</p>
              )}
              {vendor.average_rating && (
                <p className="text-sm text-blue-700">
                  Current Rating: ⭐ {vendor.average_rating.toFixed(1)}/5
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Project Selection */}
        <div className="space-y-2">
          <Label htmlFor="project_id">Project *</Label>
          <Select 
            value={watch('project_id')} 
            onValueChange={(value) => setValue('project_id', value)}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select the project this rating is for" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
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

        {/* Rating Categories */}
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Rate Vendor Performance</h3>
          
          <RatingInput
            label="Quality of Work"
            description="How well did the vendor meet quality expectations?"
            value={qualityScore}
            onChange={(score) => updateScore('quality', score)}
            disabled={loading}
          />

          <RatingInput
            label="Delivery Performance"
            description="Did the vendor deliver on time and as promised?"
            value={deliveryScore}
            onChange={(score) => updateScore('delivery', score)}
            disabled={loading}
          />

          <RatingInput
            label="Communication"
            description="How responsive and clear was the vendor's communication?"
            value={communicationScore}
            onChange={(score) => updateScore('communication', score)}
            disabled={loading}
          />

          <RatingInput
            label="Overall Rating"
            description="Your overall satisfaction with this vendor"
            value={overallScore}
            onChange={(score) => updateScore('overall', score)}
            disabled={loading}
          />
        </div>

        {/* Comments */}
        <div className="space-y-2">
          <Label htmlFor="comments">Comments</Label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
            <Textarea
              {...register('comments')}
              placeholder="Share specific feedback about your experience with this vendor..."
              rows={4}
              className="pl-10"
              disabled={loading}
            />
          </div>
        </div>

        {/* Rating Summary */}
        {(qualityScore > 0 || deliveryScore > 0 || communicationScore > 0) && (
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-3">Rating Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Quality: {qualityScore > 0 ? `${qualityScore}/5` : 'Not rated'}</div>
                <div>Delivery: {deliveryScore > 0 ? `${deliveryScore}/5` : 'Not rated'}</div>
                <div>Communication: {communicationScore > 0 ? `${communicationScore}/5` : 'Not rated'}</div>
                <div className="font-medium">Overall: {overallScore > 0 ? `${overallScore}/5` : 'Not rated'}</div>
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
            disabled={!isValid || loading || !qualityScore || !deliveryScore || !communicationScore}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Submitting...</span>
              </div>
            ) : (
              'Submit Rating'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}