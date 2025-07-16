// ============================================================================
// V3 Shop Drawing Upload Modal Component
// ============================================================================
// Built with optimization patterns: FormBuilder pattern, Zod validation
// Following V3 schema and workflow requirements
// ============================================================================

'use client'

import React, { useState } from 'react'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission } from '@/lib/permissions'
import { FormBuilder } from '@/components/forms/FormBuilder'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

interface ShopDrawingUploadModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onUploadSuccess: () => void
}

interface UploadFormData {
  title: string
  discipline: string
  file: File | null
}

// Zod schema for validation
const shopDrawingUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  discipline: z.string()
    .min(1, 'Discipline is required'),
  file: z.instanceof(File, { message: 'File is required' })
    .refine((file) => {
      const allowedTypes = ['.pdf', '.dwg', '.dxf', '.jpg', '.jpeg', '.png']
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      return allowedTypes.includes(fileExtension)
    }, 'Please upload a valid file type (PDF, DWG, DXF, JPG, PNG)')
    .refine((file) => {
      const maxSize = 50 * 1024 * 1024 // 50MB
      return file.size <= maxSize
    }, 'File size must be less than 50MB')
})

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ShopDrawingUploadModal: React.FC<ShopDrawingUploadModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onUploadSuccess
}) => {
  const { profile } = useAuth()
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    discipline: '',
    file: null
  })
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Permission check
  const canCreate = profile && hasPermission(profile.role, 'shop_drawings.create')

  if (!canCreate) {
    return null
  }

  const resetForm = () => {
    setFormData({
      title: '',
      discipline: '',
      file: null
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleFileChange = (file: File | null) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['.pdf', '.dwg', '.dxf', '.jpg', '.jpeg', '.png']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!allowedTypes.includes(fileExtension)) {
      setError('Please upload a valid file type (PDF, DWG, DXF, JPG, PNG)')
      return
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 50MB')
      return
    }

    setFormData(prev => ({ ...prev, file }))
    setError(null)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }



  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Shop Drawing</DialogTitle>
        </DialogHeader>

        <FormBuilder
          schema={shopDrawingUploadSchema}
          onSubmit={async (data) => {
            setIsUploading(true)
            setError(null)

            try {
              // TODO: Implement actual file upload and API call
              // 1. Upload file to storage (Supabase Storage)
              // 2. Create shop drawing record via API

              // Simulate API call
              await new Promise(resolve => setTimeout(resolve, 2000))

              // Simulate success
              onUploadSuccess()
              handleClose()

            } catch (err) {
              console.error('Upload error:', err)
              setError('Failed to upload shop drawing. Please try again.')
            } finally {
              setIsUploading(false)
            }
          }}
          defaultValues={{
            title: '',
            discipline: '',
            file: null
          }}
          fields={[
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              placeholder: 'e.g., Foundation Details - North Section',
              required: true,
              disabled: isUploading
            },
            {
              name: 'discipline',
              label: 'Discipline',
              type: 'select',
              required: true,
              disabled: isUploading,
              options: [
                { value: 'Architectural', label: 'Architectural' },
                { value: 'Structural', label: 'Structural' },
                { value: 'Mechanical', label: 'Mechanical' },
                { value: 'Electrical', label: 'Electrical' },
                { value: 'Plumbing', label: 'Plumbing' },
                { value: 'Fire Protection', label: 'Fire Protection' },
                { value: 'Civil', label: 'Civil' },
                { value: 'Landscape', label: 'Landscape' }
              ]
            }
          ]}
          submitButton={{
            text: isUploading ? 'Uploading...' : 'Upload Drawing',
            icon: Upload,
            disabled: isUploading,
            loading: isUploading
          }}
          cancelButton={{
            text: 'Cancel',
            onClick: handleClose,
            disabled: isUploading
          }}
          customContent={
            <div className="space-y-2">
              <Label>File *</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {formData.file ? (
                  <div className="space-y-3">
                    <FileText className="h-12 w-12 text-blue-500 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900">{formData.file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(formData.file.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-gray-600">
                        Drag and drop your file here, or{' '}
                        <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                          browse
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.dwg,.dxf,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                            disabled={isUploading}
                          />
                        </label>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Supports: PDF, DWG, DXF, JPG, PNG (max 50MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          }
        />
      </DialogContent>
    </Dialog>
  )
}

export default ShopDrawingUploadModal