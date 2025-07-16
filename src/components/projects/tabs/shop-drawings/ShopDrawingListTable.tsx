'use client'

import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  FileImage, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Eye, 
  Download,
  Building 
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ShopDrawing {
  id: string
  title: string
  description?: string
  status: string
  created_at: string
  created_by_user?: {
    name: string
  }
  project?: {
    id: string
    name: string
  }
  file_path?: string
  file_type?: string
  file_size?: number
}

export const ShopDrawingListTable: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    project: ''
  })
  
  // Mock data - replace with actual API call
  const [shopDrawings] = useState<ShopDrawing[]>([])
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  const filteredDrawings = useMemo(() => {
    return (shopDrawings || []).filter(drawing => {
      const matchesSearch = !filters.search || 
        drawing.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        drawing.description?.toLowerCase().includes(filters.search.toLowerCase())
      
      const matchesStatus = !filters.status || drawing.status === filters.status
      const matchesProject = !filters.project || drawing.project?.id === filters.project
      
      return matchesSearch && matchesStatus && matchesProject
    })
  }, [shopDrawings, filters])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'pending_internal_review': return 'bg-yellow-100 text-yellow-800'
      case 'ready_for_client_review': return 'bg-blue-100 text-blue-800'
      case 'client_reviewing': return 'bg-purple-100 text-purple-800'
      case 'revision_requested': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved'
      case 'rejected': return 'Rejected'
      case 'pending_internal_review': return 'Pending Review'
      case 'ready_for_client_review': return 'Ready for Client'
      case 'client_reviewing': return 'Client Reviewing'
      case 'revision_requested': return 'Revision Requested'
      default: return 'Draft'
    }
  }

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }))
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search drawings..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <select 
              value={filters.status} 
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="pending_internal_review">Pending Review</option>
              <option value="ready_for_client_review">Ready for Client</option>
              <option value="client_reviewing">Client Reviewing</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="revision_requested">Revision Requested</option>
            </select>

            <select 
              value={filters.project} 
              onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All projects</option>
              {/* Add project options when actual data is available */}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Shop Drawings List */}
      <DataStateWrapper
        loading={loading}
        error={error}
        data={filteredDrawings}
        onRetry={() => window.location.reload()}
        emptyMessage="No shop drawings found. Submit your first drawing to get started."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <Badge className={getStatusColor(drawing.status)}>
                    {getStatusLabel(drawing.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {drawing.project && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{drawing.project.name}</span>
                    </div>
                  )}
                  
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
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {/* Handle view */}}
                      className="flex items-center space-x-1"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Button>
                    
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
    </div>
  )
}