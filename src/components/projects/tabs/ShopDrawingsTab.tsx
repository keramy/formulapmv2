'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { FileImage, Plus, Search, Filter, Calendar, User, Eye, Download } from 'lucide-react'
import { useShopDrawings } from '@/hooks/useShopDrawings'
import { useShopDrawingWorkflow } from '@/hooks/useShopDrawingWorkflow'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { ShopDrawingUploadModal } from './shop-drawings/ShopDrawingUploadModal'
import { ShopDrawingDetailModal } from './shop-drawings/ShopDrawingDetailModal'
import { ShopDrawingWorkflowModal } from './shop-drawings/ShopDrawingWorkflowModal'
import { formatDate } from '@/lib/utils'

// Export the standalone component for use in the shop-drawings page
export { ShopDrawingListTable } from './shop-drawings/ShopDrawingListTable'

interface ShopDrawingsTabProps {
  projectId: string
}

export const ShopDrawingsTab: React.FC<ShopDrawingsTabProps> = ({ projectId }) => {
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const { getStatusColor, getStatusLabel, getStatusIcon } = useShopDrawingWorkflow()
  
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    createdBy: '',
    dateFrom: '',
    dateTo: ''
  })
  
  const [activeTab, setActiveTab] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedDrawing, setSelectedDrawing] = useState<string | null>(null)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [workflowDrawingId, setWorkflowDrawingId] = useState<string | null>(null)

  const shopDrawingsFilters = useMemo(() => ({
    projectId,
    ...(filters.status && { status: filters.status }),
    ...(filters.search && { search: filters.search }),
    ...(filters.createdBy && { createdBy: filters.createdBy }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo })
  }), [projectId, filters])

  const { 
    data: shopDrawings, 
    loading, 
    error, 
    refresh 
  } = useShopDrawings(shopDrawingsFilters)

  const filteredDrawings = useMemo(() => {
    if (!shopDrawings) return []
    
    switch (activeTab) {
      case 'pending':
        return shopDrawings.filter(d => 
          d.status === 'pending_internal_review' || 
          d.status === 'ready_for_client_review'
        )
      case 'reviewing':
        return shopDrawings.filter(d => d.status === 'client_reviewing')
      case 'approved':
        return shopDrawings.filter(d => d.status === 'approved')
      case 'rejected':
        return shopDrawings.filter(d => 
          d.status === 'rejected' || 
          d.status === 'revision_requested'
        )
      default:
        return shopDrawings
    }
  }, [shopDrawings, activeTab])

  const statusCounts = useMemo(() => {
    if (!shopDrawings) return {}
    
    return shopDrawings.reduce((acc, drawing) => {
      acc[drawing.status] = (acc[drawing.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [shopDrawings])

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }))
  }

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleDrawingClick = (drawingId: string) => {
    setSelectedDrawing(drawingId)
  }

  const handleWorkflowAction = (drawingId: string) => {
    setWorkflowDrawingId(drawingId)
    setShowWorkflowModal(true)
  }

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    refresh()
  }

  const handleWorkflowComplete = () => {
    setShowWorkflowModal(false)
    setWorkflowDrawingId(null)
    refresh()
  }

  const getStatusBadgeVariant = (status: string) => {
    const color = getStatusColor(status)
    switch (color) {
      case 'green': return 'success'
      case 'red': return 'destructive'
      case 'yellow': return 'warning'
      case 'blue': return 'info'
      default: return 'secondary'
    }
  }

  const canCreateDrawing = hasPermission('shop_drawings.create')
  const canViewDrawing = hasPermission('shop_drawings.view')
  const canManageWorkflow = hasPermission('shop_drawings.manage_workflow')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileImage className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Shop Drawings</h2>
          <Badge variant="secondary">
            {filteredDrawings.length} drawings
          </Badge>
        </div>
        
        {canCreateDrawing && (
          <Button 
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Upload Drawing</span>
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search drawings..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_internal_review">Pending Review</SelectItem>
                <SelectItem value="ready_for_client_review">Ready for Client</SelectItem>
                <SelectItem value="client_reviewing">Client Reviewing</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="revision_requested">Revision Requested</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              placeholder="From date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
            />
            
            <Input
              type="date"
              placeholder="To date"
              value={filters.dateTo}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All ({shopDrawings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({(statusCounts['pending_internal_review'] || 0) + (statusCounts['ready_for_client_review'] || 0)})
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            Reviewing ({statusCounts['client_reviewing'] || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({statusCounts['approved'] || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({(statusCounts['rejected'] || 0) + (statusCounts['revision_requested'] || 0)})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataStateWrapper
            loading={loading}
            error={error}
            data={filteredDrawings}
            onRetry={refresh}
            emptyMessage="No shop drawings found"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrawings.map((drawing) => (
                <Card key={drawing.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">
                          {drawing.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {drawing.description || 'No description'}
                        </p>
                      </div>
                      <Badge variant={getStatusBadgeVariant(drawing.status)}>
                        {getStatusLabel(drawing.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{drawing.created_by_user?.name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(drawing.created_at)}</span>
                      </div>

                      {drawing.file_path && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileImage className="h-4 w-4" />
                          <span>{drawing.file_type?.toUpperCase() || 'FILE'}</span>
                          <span>({Math.round((drawing.file_size || 0) / 1024)} KB)</span>
                        </div>
                      )}

                      <div className="flex space-x-2 mt-4">
                        {canViewDrawing && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDrawingClick(drawing.id)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </Button>
                        )}
                        
                        {canManageWorkflow && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleWorkflowAction(drawing.id)}
                            className="flex items-center space-x-1"
                          >
                            <Filter className="h-4 w-4" />
                            <span>Workflow</span>
                          </Button>
                        )}
                        
                        {drawing.file_path && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(drawing.file_path, '_blank')}
                            className="flex items-center space-x-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DataStateWrapper>
        </TabsContent>
      </Tabs>

      {/* Upload Modal */}
      {showUploadModal && (
        <ShopDrawingUploadModal
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
        />
      )}

      {/* Detail Modal */}
      {selectedDrawing && (
        <ShopDrawingDetailModal
          drawingId={selectedDrawing}
          onClose={() => setSelectedDrawing(null)}
        />
      )}

      {/* Workflow Modal */}
      {showWorkflowModal && workflowDrawingId && (
        <ShopDrawingWorkflowModal
          drawingId={workflowDrawingId}
          onClose={() => setShowWorkflowModal(false)}
          onComplete={handleWorkflowComplete}
        />
      )}
    </div>
  )
}