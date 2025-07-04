/**
 * Subcontractor Report Manager Component
 * Handles report submission and list display
 */

'use client'

import { useState, useRef } from 'react'
import { useSubcontractorPortal } from '@/hooks/useSubcontractorPortal'
import { validateSubcontractorReport, validateSubcontractorPhoto, formatReportDate } from '@/lib/validation/subcontractor'
import { SubcontractorReport } from '@/types/subcontractor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Plus, 
  Upload, 
  X, 
  Calendar, 
  Building,
  Image,
  AlertCircle,
  CheckCircle,
  Clock,
  Eye
} from 'lucide-react'

interface SubcontractorReportManagerProps {
  reports: SubcontractorReport[]
  assignedProjects: Array<{
    id: string
    name: string
    status: string
    description?: string
  }>
  onRefresh: () => Promise<void>
}

export function SubcontractorReportManager({
  reports,
  assignedProjects,
  onRefresh
}: SubcontractorReportManagerProps) {
  const { submitReport, reportError, clearError } = useSubcontractorPortal()
  
  const [activeTab, setActiveTab] = useState('list')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    project_id: '',
    report_date: formatReportDate(new Date()),
    description: '',
    photos: [] as File[]
  })
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
    
    // Clear report error
    if (reportError) {
      clearError()
    }
  }

  const handlePhotoUpload = (files: FileList) => {
    const newPhotos: File[] = []
    const errors: string[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const validation = validateSubcontractorPhoto(file)
      
      if (validation.success) {
        newPhotos.push(file)
      } else {
        errors.push(`${file.name}: ${validation.errors?.[0]}`)
      }
    }
    
    if (errors.length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        photos: errors.join(', ')
      }))
    } else {
      setValidationErrors(prev => {
        const { photos: _, ...rest } = prev
        return rest
      })
    }
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos].slice(0, 10) // Max 10 photos
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateSubcontractorReport({
      project_id: formData.project_id,
      report_date: formData.report_date,
      description: formData.description
    })
    
    if (!validation.success) {
      setValidationErrors(validation.errors || {})
      return
    }
    
    try {
      setIsSubmitting(true)
      await submitReport(formData)
      
      // Reset form on success
      setFormData({
        project_id: '',
        report_date: formatReportDate(new Date()),
        description: '',
        photos: []
      })
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Switch to list tab
      setActiveTab('list')
      
    } catch (error) {
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Submitted</Badge>
      case 'reviewed':
        return <Badge variant="default"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Site Reports</span>
          </CardTitle>
          <CardDescription>
            Submit daily reports and view your report history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">Report List</TabsTrigger>
              <TabsTrigger value="submit">Submit Report</TabsTrigger>
            </TabsList>

            {/* Reports List Tab */}
            <TabsContent value="list" className="space-y-4">
              {reports.length > 0 ? (
                <div className="space-y-4">
                  {reports.map((report) => (
                    <Card key={report.id}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              Report - {new Date(report.report_date).toLocaleDateString()}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Project: {assignedProjects.find(p => p.id === report.project_id)?.name || 'Unknown'}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(report.status)}
                            <Badge variant="outline">
                              {report.photos.length} photos
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                        
                        {report.photos.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {report.photos.map((photo, index) => (
                              <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={photo}
                                  alt={`Report photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-3 text-xs text-gray-500">
                          Submitted: {new Date(report.created_at).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports submitted yet</p>
                    <Button
                      onClick={() => setActiveTab('submit')}
                      className="mt-4"
                    >
                      Submit Your First Report
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Submit Report Tab */}
            <TabsContent value="submit" className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Alert */}
                {reportError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {reportError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Project Selection */}
                <div className="space-y-2">
                  <Label htmlFor="project_id">Project</Label>
                  <select
                    id="project_id"
                    value={formData.project_id}
                    onChange={(e) => handleInputChange('project_id', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.project_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select a project</option>
                    {assignedProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.project_id && (
                    <p className="text-sm text-red-600">{validationErrors.project_id}</p>
                  )}
                </div>

                {/* Report Date */}
                <div className="space-y-2">
                  <Label htmlFor="report_date">Report Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="report_date"
                      type="date"
                      value={formData.report_date}
                      onChange={(e) => handleInputChange('report_date', e.target.value)}
                      className={`pl-10 ${validationErrors.report_date ? 'border-red-500' : ''}`}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  {validationErrors.report_date && (
                    <p className="text-sm text-red-600">{validationErrors.report_date}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Report Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the work performed, progress made, issues encountered, etc."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className={validationErrors.description ? 'border-red-500' : ''}
                    disabled={isSubmitting}
                    required
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-red-600">{validationErrors.description}</p>
                  )}
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label htmlFor="photos">Photos (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop photos
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WebP up to 5MB each (max 10 photos)
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSubmitting}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Photos
                      </Button>
                    </div>
                  </div>
                  {validationErrors.photos && (
                    <p className="text-sm text-red-600">{validationErrors.photos}</p>
                  )}
                </div>

                {/* Photo Preview */}
                {formData.photos.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Photos</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab('list')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Submit Report</span>
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}