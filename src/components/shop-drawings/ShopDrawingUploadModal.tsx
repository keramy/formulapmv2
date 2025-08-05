'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/ui/use-toast'
import { 
  Upload, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  X,
  Link2
} from 'lucide-react'

interface ScopeItem {
  id: string
  item_code?: string
  item_no?: number
  description: string
  category: string
}

interface ShopDrawingData {
  drawing_number: string
  title: string
  description: string
  drawing_type: string
  priority: string
  scope_item_id?: string
  due_date?: string
  file_url?: string
  file_name?: string
  file_size?: number
}

interface ShopDrawingUploadModalProps {
  projectId?: string
  onUploadComplete?: () => void
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DRAWING_TYPES = [
  'general',
  'architectural',
  'structural', 
  'mechanical',
  'electrical',
  'plumbing',
  'millwork',
  'landscape',
  'interior',
  'other'
]

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]

export function ShopDrawingUploadModal({ 
  projectId, 
  onUploadComplete, 
  trigger, 
  open, 
  onOpenChange 
}: ShopDrawingUploadModalProps) {
  const { getAccessToken } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([])
  const [formData, setFormData] = useState<ShopDrawingData>({
    drawing_number: '',
    title: '',
    description: '',
    drawing_type: 'general',
    priority: 'medium',
    scope_item_id: '',
    due_date: '',
  })

  // Load scope items for linking
  useEffect(() => {
    if (projectId) {
      loadScopeItems()
    }
  }, [projectId])

  const loadScopeItems = async () => {
    try {
      const token = await getAccessToken()
      if (!token) return

      const response = await fetch(`/api/scope?project_id=${projectId}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.items) {
          setScopeItems(result.data.items)
        }
      }
    } catch (error) {
      console.error('Error loading scope items:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF, image, or document file",
          variant: "destructive",
        })
        return
      }
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive",
        })
        return
      }
      
      setSelectedFile(file)
      
      // Auto-generate drawing number if not provided
      if (!formData.drawing_number) {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const randomId = Math.random().toString(36).substr(2, 4).toUpperCase()
        setFormData(prev => ({
          ...prev,
          drawing_number: `SD-${timestamp}-${randomId}`
        }))
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) {
      const mockEvent = {
        target: { files: [file] }
      } as React.ChangeEvent<HTMLInputElement>
      handleFileSelect(mockEvent)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      toast({
        title: "File Required",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    if (!projectId) {
      toast({
        title: "Project Required",
        description: "Project ID is required to upload drawings",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('No access token')

      // Create form data for file upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('drawing_number', formData.drawing_number)
      uploadFormData.append('title', formData.title)
      uploadFormData.append('description', formData.description)
      uploadFormData.append('drawing_type', formData.drawing_type)
      uploadFormData.append('priority', formData.priority)
      uploadFormData.append('project_id', projectId)
      
      if (formData.scope_item_id) {
        uploadFormData.append('scope_item_id', formData.scope_item_id)
      }
      
      if (formData.due_date) {
        uploadFormData.append('due_date', formData.due_date)
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      const response = await fetch('/api/shop-drawings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadFormData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to upload drawing')
      }

      const result = await response.json()
      
      toast({
        title: "Drawing Uploaded",
        description: "Shop drawing uploaded successfully",
      })
      
      // Reset form
      setFormData({
        drawing_number: '',
        title: '',
        description: '',
        drawing_type: 'general',
        priority: 'medium',
        scope_item_id: '',
        due_date: '',
      })
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      if (onUploadComplete) {
        onUploadComplete()
      }
      
      handleOpenChange(false)

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to upload drawing',
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }

  const currentOpen = open !== undefined ? open : isOpen

  const selectedScopeItem = scopeItems.find(item => item.id === formData.scope_item_id)

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Shop Drawing</DialogTitle>
          <DialogDescription>
            Upload a new shop drawing with revision tracking and scope item linking
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Drawing File</h3>
            
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedFile ? (
                <div className="space-y-3">
                  <FileText className="h-12 w-12 text-green-600 mx-auto" />
                  <div>
                    <p className="font-semibold">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-lg font-semibold">Drop your drawing file here</p>
                    <p className="text-muted-foreground">or click to browse</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 50MB)
            </p>
          </div>

          {/* Drawing Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Drawing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="drawing_number">Drawing Number *</Label>
                <Input
                  id="drawing_number"
                  value={formData.drawing_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, drawing_number: e.target.value }))}
                  placeholder="e.g. SD-001, ARCH-DWG-001"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="drawing_type">Drawing Type *</Label>
                <Select 
                  value={formData.drawing_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, drawing_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select drawing type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DRAWING_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Drawing title or name"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the drawing"
                rows={3}
                required
              />
            </div>
          </div>

          {/* Project Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Project Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map(priority => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Scope Item Linking */}
            {scopeItems.length > 0 && (
              <div>
                <Label htmlFor="scope_item_id">Link to Scope Item</Label>
                <Select 
                  value={formData.scope_item_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, scope_item_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope item (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No scope item</SelectItem>
                    {scopeItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        <div className="flex flex-col">
                          <span>{item.item_code || `Item ${item.item_no}`}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {item.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedScopeItem && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Link2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Linked to:</span>
                      <Badge variant="secondary">{selectedScopeItem.item_code || `Item ${selectedScopeItem.item_no}`}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{selectedScopeItem.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading drawing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Drawing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export a trigger button component for convenience
export function ShopDrawingUploadButton({ 
  projectId, 
  onUploadComplete 
}: { 
  projectId?: string
  onUploadComplete?: () => void 
}) {
  return (
    <ShopDrawingUploadModal
      projectId={projectId}
      onUploadComplete={onUploadComplete}
      trigger={
        <Button>
          <Upload className="h-4 w-4 mr-2" />
          Upload Drawing
        </Button>
      }
    />
  )
}