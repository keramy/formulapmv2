'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize, 
  Minimize,
  ArrowLeft,
  FileText,
  Loader2
} from 'lucide-react'
import { useResponsive } from '@/hooks/useResponsive'

interface ShopDrawing {
  id: string
  drawing_number: string
  drawing_title: string
  drawing_category: string
  current_version: string
  current_status: string
  pdf_file_path?: string
  thumbnail_path?: string
  pdf_file_size?: number
  projects: {
    id: string
    name: string
  }
}

interface ShopDrawingViewerProps {
  drawing: ShopDrawing
  onClose?: () => void
  mobileOptimized?: boolean
}

const ShopDrawingViewer: React.FC<ShopDrawingViewerProps> = ({
  drawing,
  onClose,
  mobileOptimized = false
}) => {
  const { isMobile } = useResponsive()
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsLoading(false)
          return 100
        }
        return prev + 10
      })
    }, 200)

    return () => clearInterval(interval)
  }, [drawing.id])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleDownload = () => {
    window.open(`/api/shop-drawings/${drawing.id}/pdf?download=true`, '_blank')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500'
      case 'submitted': return 'bg-blue-500'
      case 'under_review': return 'bg-yellow-500'
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      case 'revision_required': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (!drawing.pdf_file_path) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <FileText className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No PDF Available</h3>
          <p className="text-muted-foreground text-center">
            This drawing doesn't have a PDF file attached yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div 
      ref={containerRef}
      className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-4' : ''}`}
    >
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onClose && isMobile && (
                <Button variant="outline" size="sm" onClick={onClose}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <CardTitle className="text-lg">{drawing.drawing_number}</CardTitle>
                <p className="text-sm text-muted-foreground">{drawing.drawing_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`text-white ${getStatusColor(drawing.current_status)}`}
              >
                {drawing.current_status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">v{drawing.current_version}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleRotate}>
                <RotateCw className="w-4 h-4" />
              </Button>
              {!isMobile && (
                <Button variant="outline" size="sm" onClick={handleFullscreen}>
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {formatFileSize(drawing.pdf_file_size)}
              </span>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Download</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PDF Viewer */}
      <Card className="flex-1">
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <div className="w-64">
                <Progress value={loadProgress} className="w-full" />
              </div>
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          )}
          
          {error && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <FileText className="w-12 h-12 text-red-500" />
              <h3 className="text-lg font-semibold text-red-600">Failed to Load PDF</h3>
              <p className="text-muted-foreground text-center">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <div 
              className="relative overflow-auto"
              style={{ 
                height: isFullscreen ? 'calc(100vh - 200px)' : mobileOptimized ? '60vh' : '70vh',
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <iframe
                ref={iframeRef}
                src={`/api/shop-drawings/${drawing.id}/pdf`}
                className="w-full h-full border-0"
                title={`${drawing.drawing_number} - ${drawing.drawing_title}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError('Failed to load PDF file')
                  setIsLoading(false)
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile-specific quick actions */}
      {(isMobile || mobileOptimized) && (
        <Card>
          <CardContent className="py-3">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
                Reset View
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document metadata */}
      <Card>
        <CardContent className="py-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Category:</span>
              <span className="ml-2 capitalize">{drawing.drawing_category}</span>
            </div>
            <div>
              <span className="font-medium">Project:</span>
              <span className="ml-2">{drawing.projects.name}</span>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <span className="ml-2 capitalize">{drawing.current_status.replace('_', ' ')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ShopDrawingViewer