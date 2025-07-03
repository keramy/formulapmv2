'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Smartphone, Camera, Users, Upload, Grid, List } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useResponsive } from '@/hooks/useResponsive'
import { toast } from '@/components/ui/use-toast'

import { ShopDrawingsList } from './ShopDrawingsList'
import { ShopDrawingViewer } from './ShopDrawingViewer'
import { MobileDrawingCard } from './mobile/MobileDrawingCard'
import { ApprovalWorkflow } from './approvals/ApprovalWorkflow'
import { ProgressPhotoUpload } from './progress/ProgressPhotoUpload'
import { DrawingFilters } from './filters/DrawingFilters'

interface ShopDrawingsCoordinatorProps {
  projectId?: string
  initialTab?: 'drawings' | 'approvals' | 'progress'
  mobileOptimized?: boolean
}

interface ShopDrawing {
  id: string
  drawing_number: string
  drawing_title: string
  drawing_category: string
  current_version: string
  current_status: string
  pdf_file_path?: string
  thumbnail_path?: string
  assigned_to?: string
  target_approval_date?: string
  created_at: string
  projects: {
    id: string
    name: string
  }
  created_by_user: {
    user_id: string
    email: string
    full_name?: string
  }
  assigned_user?: {
    user_id: string
    email: string
    full_name?: string
  }
  current_approvals: Array<{
    id: string
    approver_role: string
    approval_status: string
    approval_date?: string
  }>
  progress_photos: Array<{
    id: string
    thumbnail_path?: string
    description?: string
    is_issue_photo: boolean
    taken_at: string
  }>
}

interface DrawingStats {
  statusBreakdown: Record<string, number>
  categoryBreakdown: Record<string, number>
  totalDrawings: number
}

const ShopDrawingsCoordinator: React.FC<ShopDrawingsCoordinatorProps> = ({
  projectId,
  initialTab = 'drawings',
  mobileOptimized = false
}) => {
  const { user } = useAuth()
  const { isMobile } = useResponsive()
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedDrawing, setSelectedDrawing] = useState<ShopDrawing | null>(null)
  const [drawings, setDrawings] = useState<ShopDrawing[]>([])
  const [drawingStats, setDrawingStats] = useState<DrawingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'list' : 'grid')
  
  // Filters state
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    assignedTo: 'all'
  })

  const fetchDrawings = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (projectId) params.append('projectId', projectId)
      if (filters.category !== 'all') params.append('category', filters.category)
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo)
      
      const response = await fetch(`/api/shop-drawings?${params}`)
      if (!response.ok) throw new Error('Failed to fetch shop drawings')
      
      const data = await response.json()
      setDrawings(data.drawings || [])
      setDrawingStats(data.statistics || null)
    } catch (error) {
      console.error('Error fetching drawings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load shop drawings',
        variant: 'destructive'
      })
    }
  }, [projectId, filters])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchDrawings()
      setIsLoading(false)
    }
    loadData()
  }, [fetchDrawings])

  // Real-time subscription for drawing updates
  useEffect(() => {
    if (!user) return

    const { supabase } = require('@/lib/supabase')
    
    const channel = supabase
      .channel('shop-drawings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shop_drawings',
          filter: projectId ? `project_id=eq.${projectId}` : undefined
        },
        (payload: any) => {
          console.log('Shop drawing updated:', payload)
          
          if (payload.eventType === 'UPDATE') {
            setDrawings(prev => 
              prev.map(drawing => 
                drawing.id === payload.new.id 
                  ? { ...drawing, ...payload.new }
                  : drawing
              )
            )
          } else if (payload.eventType === 'INSERT') {
            fetchDrawings() // Refresh to get full data
          } else if (payload.eventType === 'DELETE') {
            setDrawings(prev => prev.filter(d => d.id !== payload.old.id))
            if (selectedDrawing?.id === payload.old.id) {
              setSelectedDrawing(null)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, projectId, fetchDrawings, selectedDrawing])

  const handleDrawingSelect = useCallback((drawing: ShopDrawing) => {
    setSelectedDrawing(drawing)
    if (isMobile) {
      setActiveTab('viewer')
    }
  }, [isMobile])

  const handleApprovalAction = useCallback(async (drawingId: string, action: string, data: any) => {
    try {
      const response = await fetch(`/api/shop-drawings/${drawingId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process approval')
      }

      toast({
        title: 'Success',
        description: `Drawing ${action} successfully`,
        variant: 'default'
      })

      // Refresh drawings data
      await fetchDrawings()
    } catch (error) {
      console.error('Error processing approval:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to process approval',
        variant: 'destructive'
      })
    }
  }, [fetchDrawings])

  const handlePhotoUpload = useCallback(async (drawingId: string, photoData: any) => {
    try {
      const response = await fetch(`/api/shop-drawings/${drawingId}/progress-photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload photo')
      }

      toast({
        title: 'Success',
        description: 'Progress photo uploaded successfully',
        variant: 'default'
      })

      // Refresh drawings data
      await fetchDrawings()
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive'
      })
    }
  }, [fetchDrawings])

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {drawingStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drawingStats.totalDrawings}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(drawingStats.statusBreakdown.submitted || 0) + (drawingStats.statusBreakdown.under_review || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mobile Access</CardTitle>
              <Smartphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {isMobile ? 'Active' : 'Available'}
              </div>
              <p className="text-xs text-muted-foreground">
                Optimized viewing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress Photos</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {drawings.reduce((sum, d) => sum + (d.progress_photos?.length || 0), 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Documentation
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="drawings" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Drawings</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Approvals</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'drawings' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
              </Button>
              <Button size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="drawings" className="space-y-4">
          <DrawingFilters
            filters={filters}
            onFiltersChange={setFilters}
            statistics={drawingStats}
          />

          {isMobile || mobileOptimized ? (
            <div className="space-y-4">
              {drawings.map((drawing) => (
                <MobileDrawingCard
                  key={drawing.id}
                  drawing={drawing}
                  onSelect={handleDrawingSelect}
                  onApprove={(data) => handleApprovalAction(drawing.id, 'approved', data)}
                  onReject={(data) => handleApprovalAction(drawing.id, 'rejected', data)}
                />
              ))}
            </div>
          ) : (
            <ShopDrawingsList
              drawings={drawings}
              viewMode={viewMode}
              onDrawingSelect={handleDrawingSelect}
              selectedDrawing={selectedDrawing}
            />
          )}
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <ApprovalWorkflow
            drawings={drawings.filter(d => ['submitted', 'under_review'].includes(d.current_status))}
            onApprovalAction={handleApprovalAction}
            currentUser={user}
          />
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressPhotoUpload
            drawings={drawings}
            onPhotoUpload={handlePhotoUpload}
            selectedDrawing={selectedDrawing}
          />
        </TabsContent>

        {/* Mobile Viewer Tab */}
        {isMobile && selectedDrawing && (
          <TabsContent value="viewer" className="space-y-4">
            <ShopDrawingViewer
              drawing={selectedDrawing}
              onClose={() => {
                setSelectedDrawing(null)
                setActiveTab('drawings')
              }}
              mobileOptimized={true}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default ShopDrawingsCoordinator