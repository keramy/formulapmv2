// ============================================================================
// V3 Report Creation Form - Line-by-Line Report Builder
// ============================================================================
// Built with optimization patterns: DataStateWrapper, centralized validation
// Features: Step-by-step line creation, photo uploads, preview, PDF generation
// ============================================================================

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertTriangle, Plus, Trash2, FileText, Upload, Image, Eye, Save, ArrowLeft, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

// ============================================================================
// TYPES
// ============================================================================

interface ReportLine {
  id: string
  line_number: number
  title: string
  description: string
  photos: Array<{
    id: string
    file: File | null
    url: string | null
    caption: string
  }>
}

interface ReportFormData {
  name: string
  type: string
  summary: string
  report_period: string
  lines: ReportLine[]
}

interface ReportCreationFormProps {
  projectId: string
  initialData?: Partial<ReportFormData>
  isEditing?: boolean
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ReportCreationForm: React.FC<ReportCreationFormProps> = ({ 
  projectId, 
  initialData, 
  isEditing = false 
}) => {
  const { profile } = useAuth()
  const router = useRouter()
  
  // State
  const [currentStep, setCurrentStep] = useState(1) // 1: Basic Info, 2: Lines, 3: Review
  const [formData, setFormData] = useState<ReportFormData>({
    name: initialData?.name || '',
    type: initialData?.type || 'custom',
    summary: initialData?.summary || '',
    report_period: initialData?.report_period || '',
    lines: initialData?.lines || []
  })
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBasicInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addNewLine = () => {
    const newLine: ReportLine = {
      id: `line-${Date.now()}`,
      line_number: formData.lines.length + 1,
      title: '',
      description: '',
      photos: []
    }
    
    setFormData(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }))
    
    setCurrentLineIndex(formData.lines.length)
  }

  const updateLine = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === index ? { ...line, [field]: value } : line
      )
    }))
  }

  const deleteLine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines
        .filter((_, i) => i !== index)
        .map((line, i) => ({ ...line, line_number: i + 1 }))
    }))
    
    if (currentLineIndex >= formData.lines.length - 1) {
      setCurrentLineIndex(Math.max(0, formData.lines.length - 2))
    }
  }

  const addPhotoToLine = (lineIndex: number, file: File) => {
    const photoId = `photo-${Date.now()}`
    const url = URL.createObjectURL(file)
    
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === lineIndex 
          ? {
              ...line,
              photos: [...line.photos, {
                id: photoId,
                file,
                url,
                caption: ''
              }]
            }
          : line
      )
    }))
  }

  const removePhotoFromLine = (lineIndex: number, photoId: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === lineIndex 
          ? {
              ...line,
              photos: line.photos.filter(photo => photo.id !== photoId)
            }
          : line
      )
    }))
  }

  const updatePhotoCaption = (lineIndex: number, photoId: string, caption: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map((line, i) => 
        i === lineIndex 
          ? {
              ...line,
              photos: line.photos.map(photo => 
                photo.id === photoId ? { ...photo, caption } : photo
              )
            }
          : line
      )
    }))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // TODO: Implement API submission
      console.log('Submitting report:', formData)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      router.push(`/projects/${projectId}/reports`)
    } catch (error) {
      console.error('Error submitting report:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceedToStep2 = formData.name.trim() && formData.type
  const canProceedToStep3 = formData.lines.length > 0 && formData.lines.every(line => 
    line.title.trim() && line.description.trim()
  )

  // ============================================================================
  // STEP 1: BASIC INFORMATION
  // ============================================================================

  const renderBasicInfoStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Information
        </CardTitle>
        <CardDescription>
          Set up the basic details for your report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Report Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Weekly Progress Report - Week 12"
            value={formData.name}
            onChange={(e) => handleBasicInfoChange('name', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Report Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleBasicInfoChange('type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Report</SelectItem>
              <SelectItem value="weekly">Weekly Report</SelectItem>
              <SelectItem value="monthly">Monthly Report</SelectItem>
              <SelectItem value="safety">Safety Report</SelectItem>
              <SelectItem value="financial">Financial Report</SelectItem>
              <SelectItem value="progress">Progress Report</SelectItem>
              <SelectItem value="quality">Quality Report</SelectItem>
              <SelectItem value="inspection">Inspection Report</SelectItem>
              <SelectItem value="custom">Custom Report</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="report_period">Report Period</Label>
          <Input
            id="report_period"
            placeholder="e.g., March 18-24, 2024"
            value={formData.report_period}
            onChange={(e) => handleBasicInfoChange('report_period', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            placeholder="Brief overview of the report content..."
            value={formData.summary}
            onChange={(e) => handleBasicInfoChange('summary', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )

  // ============================================================================
  // STEP 2: CONTENT LINES
  // ============================================================================

  const renderContentLinesStep = () => (
    <div className="space-y-6">
      {/* Lines Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Report Content ({formData.lines.length} lines)
              </CardTitle>
              <CardDescription>
                Create your report line by line with descriptions and photos
              </CardDescription>
            </div>
            <Button onClick={addNewLine} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Line
            </Button>
          </div>
        </CardHeader>
        
        {formData.lines.length > 0 && (
          <CardContent>
            <div className="flex items-center gap-2 flex-wrap">
              {formData.lines.map((line, index) => (
                <Button
                  key={line.id}
                  variant={currentLineIndex === index ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentLineIndex(index)}
                  className="flex items-center gap-1"
                >
                  {index + 1}
                  {!line.title || !line.description ? (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  ) : (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Current Line Editor */}
      {formData.lines.length > 0 && currentLineIndex < formData.lines.length && (
        <LineEditor
          line={formData.lines[currentLineIndex]}
          lineIndex={currentLineIndex}
          onUpdate={updateLine}
          onDelete={() => deleteLine(currentLineIndex)}
          onAddPhoto={(file) => addPhotoToLine(currentLineIndex, file)}
          onRemovePhoto={(photoId) => removePhotoFromLine(currentLineIndex, photoId)}
          onUpdatePhotoCaption={updatePhotoCaption}
        />
      )}

      {formData.lines.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No content lines yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first content line to start building your report.
            </p>
            <Button onClick={addNewLine} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Line
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // ============================================================================
  // STEP 3: REVIEW
  // ============================================================================

  const renderReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Review Report
        </CardTitle>
        <CardDescription>
          Review your report before saving. You can generate a PDF after saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info Summary */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-lg mb-2">{formData.name}</h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge>{formData.type}</Badge>
            {formData.report_period && <span className="text-sm text-gray-600">{formData.report_period}</span>}
          </div>
          {formData.summary && (
            <p className="text-gray-700">{formData.summary}</p>
          )}
        </div>

        {/* Content Lines Summary */}
        <div className="space-y-4">
          <h4 className="font-semibold">Content Lines ({formData.lines.length})</h4>
          {formData.lines.map((line, index) => (
            <div key={line.id} className="border-l-4 border-blue-500 pl-4">
              <h5 className="font-medium">{index + 1}. {line.title}</h5>
              <p className="text-gray-600 text-sm">{line.description}</p>
              {line.photos.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">{line.photos.length} photo(s) attached</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  const renderNavigation = () => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/reports`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
        )}

        {currentStep < 3 && (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={
              (currentStep === 1 && !canProceedToStep2) ||
              (currentStep === 2 && !canProceedToStep3)
            }
          >
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}

        {currentStep === 3 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Report' : 'Save Report')}
          </Button>
        )}
      </div>
    </div>
  )

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-12 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {isEditing ? 'Edit Report' : 'Create New Report'}
        </h2>
        <p className="text-gray-600">
          {currentStep === 1 && 'Basic Information'}
          {currentStep === 2 && 'Content Lines'}
          {currentStep === 3 && 'Review & Save'}
        </p>
      </div>

      {/* Step Content */}
      {currentStep === 1 && renderBasicInfoStep()}
      {currentStep === 2 && renderContentLinesStep()}
      {currentStep === 3 && renderReviewStep()}

      {/* Navigation */}
      {renderNavigation()}

      {/* Help */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {currentStep === 1 && 'Fill in the basic information to continue to content creation.'}
          {currentStep === 2 && 'Add content lines with descriptions and photos. Each line represents a section of your report.'}
          {currentStep === 3 && 'Review your report carefully. You can generate a PDF after saving.'}
        </AlertDescription>
      </Alert>
    </div>
  )
}

// ============================================================================
// LINE EDITOR COMPONENT
// ============================================================================

interface LineEditorProps {
  line: ReportLine
  lineIndex: number
  onUpdate: (index: number, field: string, value: string) => void
  onDelete: () => void
  onAddPhoto: (file: File) => void
  onRemovePhoto: (photoId: string) => void
  onUpdatePhotoCaption: (lineIndex: number, photoId: string, caption: string) => void
}

const LineEditor: React.FC<LineEditorProps> = ({
  line,
  lineIndex,
  onUpdate,
  onDelete,
  onAddPhoto,
  onRemovePhoto,
  onUpdatePhotoCaption
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files[0]) {
      onAddPhoto(files[0])
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Line {line.line_number}</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title *</Label>
          <Input
            placeholder="e.g., Foundation Work Progress"
            value={line.title}
            onChange={(e) => onUpdate(lineIndex, 'title', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Description *</Label>
          <Textarea
            placeholder="Detailed description of this section..."
            value={line.description}
            onChange={(e) => onUpdate(lineIndex, 'description', e.target.value)}
            rows={4}
          />
        </div>

        {/* Photos Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Photos ({line.photos.length})</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Add Photo
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          {line.photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {line.photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {photo.url && (
                      <img
                        src={photo.url}
                        alt="Report photo"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemovePhoto(photo.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Input
                    placeholder="Photo caption..."
                    value={photo.caption}
                    onChange={(e) => onUpdatePhotoCaption(lineIndex, photo.id, e.target.value)}
                    className="mt-2 text-xs"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default ReportCreationForm