'use client'

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Camera, 
  Upload, 
  X, 
  AlertTriangle, 
  ImageIcon,
  FileImage,
  MapPin,
  Tag
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from '@/components/ui/use-toast'

interface ShopDrawing {
  id: string
  drawing_number: string
  drawing_title: string
  drawing_category: string
  current_status: string
}

interface ProgressPhoto {
  id: string
  photo_file_path: string
  thumbnail_path?: string
  description?: string
  location_notes?: string
  is_issue_photo: boolean
  issue_description?: string
  issue_severity?: string
  taken_at: string
  photo_sequence: number
  tags: string[]
}

interface ProgressPhotoUploadProps {
  drawings: ShopDrawing[]
  selectedDrawing?: ShopDrawing | null
  onPhotoUpload: (drawingId: string, photoData: any) => Promise<void>
}

const ProgressPhotoUpload: React.FC<ProgressPhotoUploadProps> = ({
  drawings,
  selectedDrawing,
  onPhotoUpload
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedDrawingId, setSelectedDrawingId] = useState(selectedDrawing?.id || '')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  
  // Form state
  const [description, setDescription] = useState('')
  const [locationNotes, setLocationNotes] = useState('')
  const [isIssuePhoto, setIsIssuePhoto] = useState(false)
  const [issueDescription, setIssueDescription] = useState('')
  const [issueSeverity, setIssueSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium')
  const [tags, setTags] = useState<string[]>([])
  const [currentTag, setCurrentTag] = useState('')
  const [gpsCoordinates, setGpsCoordinates] = useState<{latitude: number, longitude: number} | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Filter image files only
    const imageFiles = acceptedFiles.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length !== acceptedFiles.length) {
      toast({
        title: 'Warning',
        description: 'Only image files are accepted',
        variant: 'destructive'
      })
    }
    
    setUploadedFiles(prev => [...prev, ...imageFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024 // 10MB max file size
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags(prev => [...prev, currentTag.trim()])
      setCurrentTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove))
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
          toast({
            title: 'Location captured',
            description: 'GPS coordinates have been added to the photo'
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          toast({
            title: 'Location unavailable',
            description: 'Could not get current location',
            variant: 'destructive'
          })
        }
      )
    } else {
      toast({
        title: 'Location not supported',
        description: 'Geolocation is not supported by this browser',
        variant: 'destructive'
      })
    }
  }

  const handleUpload = async () => {
    if (!selectedDrawingId || uploadedFiles.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select a drawing and upload at least one photo',
        variant: 'destructive'
      })
      return
    }

    if (isIssuePhoto && !issueDescription.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Issue description is required for issue photos',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)

    try {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i]
        
        // In a real implementation, you would upload the file to cloud storage first
        // For now, we'll simulate the upload
        const photoData = {
          photoFilePath: `/uploads/progress/${selectedDrawingId}/${Date.now()}_${file.name}`,
          photoFileSize: file.size,
          thumbnailPath: `/uploads/progress/thumbnails/${selectedDrawingId}/${Date.now()}_thumb_${file.name}`,
          description: description.trim() || undefined,
          locationNotes: locationNotes.trim() || undefined,
          isIssuePhoto,
          issueDescription: isIssuePhoto ? issueDescription.trim() : undefined,
          issueSeverity: isIssuePhoto ? issueSeverity : undefined,
          photoSequence: i + 1,
          tags: tags.length > 0 ? tags : undefined,
          gpsCoordinates,
          cameraInfo: {
            make: 'Mobile Camera',
            model: 'Web Upload',
            settings: {
              fileSize: file.size,
              fileName: file.name,
              fileType: file.type
            }
          }
        }

        await onPhotoUpload(selectedDrawingId, photoData)
      }

      toast({
        title: 'Success',
        description: `${uploadedFiles.length} photo(s) uploaded successfully`,
        variant: 'default'
      })

      // Reset form
      setUploadedFiles([])
      setDescription('')
      setLocationNotes('')
      setIsIssuePhoto(false)
      setIssueDescription('')
      setIssueSeverity('medium')
      setTags([])
      setGpsCoordinates(null)
      setIsDialogOpen(false)

    } catch (error) {
      console.error('Error uploading photos:', error)
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload progress photos',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Progress Photos</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Camera className="w-4 h-4 mr-2" />
              Upload Photos
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Upload Progress Photos</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Drawing Selection */}
              <div className="space-y-2">
                <Label htmlFor="drawing-select">Select Drawing</Label>
                <Select value={selectedDrawingId} onValueChange={setSelectedDrawingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a drawing" />
                  </SelectTrigger>
                  <SelectContent>
                    {drawings.map(drawing => (
                      <SelectItem key={drawing.id} value={drawing.id}>
                        {drawing.drawing_number} - {drawing.drawing_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Photo Upload</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  {isDragActive ? (
                    <p>Drop the photos here...</p>
                  ) : (
                    <div>
                      <p>Drag & drop photos here, or click to select</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Supports JPG, PNG, GIF, WebP (max 10MB each)
                      </p>
                    </div>
                  )}
                </div>

                {/* Uploaded Files */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files ({uploadedFiles.length})</Label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div className="flex items-center gap-2">
                            <FileImage className="w-4 h-4" />
                            <span className="text-sm truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({formatFileSize(file.size)})
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this photo shows..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location Notes</Label>
                  <Textarea
                    id="location"
                    placeholder="Specific location or area details..."
                    value={locationNotes}
                    onChange={(e) => setLocationNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Issue Photo Toggle */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="issue-photo"
                    checked={isIssuePhoto}
                    onCheckedChange={setIsIssuePhoto}
                  />
                  <Label htmlFor="issue-photo" className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    This photo documents an issue
                  </Label>
                </div>

                {isIssuePhoto && (
                  <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
                    <div className="space-y-2">
                      <Label htmlFor="issue-description">Issue Description *</Label>
                      <Textarea
                        id="issue-description"
                        placeholder="Describe the issue in detail..."
                        value={issueDescription}
                        onChange={(e) => setIssueDescription(e.target.value)}
                        rows={3}
                        className={issueDescription.trim() ? '' : 'border-red-300'}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="issue-severity">Issue Severity</Label>
                      <Select value={issueSeverity} onValueChange={(value: any) => setIssueSeverity(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  />
                  <Button variant="outline" onClick={addTag} disabled={!currentTag.trim()}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* GPS Location */}
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Capture GPS Location
                  </Button>
                  {gpsCoordinates && (
                    <Badge variant="outline">
                      {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={!selectedDrawingId || uploadedFiles.length === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload {uploadedFiles.length} Photo(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="py-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Upload progress photos to document construction status</p>
            <p>• Mark photos as issues to report problems that need attention</p>
            <p>• Add location notes and tags to help organize photos</p>
            <p>• Use GPS location capture for accurate positioning</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProgressPhotoUpload