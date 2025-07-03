/**
 * Client Document Library Component
 * Document browsing and management for external clients
 * Mobile-first responsive design with filtering and search
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Download, 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  XCircle,
  Clock,
  Search,
  Filter,
  Grid,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Building,
  Tag
} from 'lucide-react'
import { 
  ClientDocumentAccess, 
  ClientDocumentFilters, 
  ClientDocumentAccessType 
} from '@/types/client-portal'
import { useClientDocuments } from '@/hooks/useClientPortal'
import { format, formatDistanceToNow } from 'date-fns'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ClientDocumentLibraryProps {
  projectId?: string
  onDocumentSelect?: (documentId: string) => void
  onDocumentDownload?: (documentId: string) => void
  onDocumentApprove?: (documentId: string) => void
  onDocumentComment?: (documentId: string) => void
  mobileOptimized?: boolean
}

export const ClientDocumentLibrary: React.FC<ClientDocumentLibraryProps> = ({
  projectId,
  onDocumentSelect,
  onDocumentDownload,
  onDocumentApprove,
  onDocumentComment,
  mobileOptimized = true
}) => {
  const {
    documents,
    loading,
    error,
    totalCount,
    fetchDocuments,
    downloadDocument,
    approveDocument,
    addComment
  } = useClientDocuments(projectId)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState<ClientDocumentFilters>({
    page: 1,
    limit: 20,
    sort_field: 'created_at',
    sort_direction: 'desc'
  })
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])

  // Document type configurations
  const documentTypeConfig: Record<string, {
    icon: React.ReactNode
    color: string
    bgColor: string
  }> = {
    'drawing': {
      icon: <Building className="w-4 h-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    'specification': {
      icon: <FileText className="w-4 h-4" />,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    'contract': {
      icon: <FileText className="w-4 h-4" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    'report': {
      icon: <FileText className="w-4 h-4" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    'photo': {
      icon: <Eye className="w-4 h-4" />,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    'other': {
      icon: <FileText className="w-4 h-4" />,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  }

  // Get document status info
  const getDocumentStatusInfo = (document: any) => {
    if (document.requires_approval) {
      switch (document.status) {
        case 'pending':
          return { 
            icon: <Clock className="w-4 h-4" />, 
            color: 'text-yellow-600', 
            bgColor: 'bg-yellow-100',
            label: 'Pending Approval'
          }
        case 'approved':
          return { 
            icon: <CheckCircle className="w-4 h-4" />, 
            color: 'text-green-600', 
            bgColor: 'bg-green-100',
            label: 'Approved'
          }
        case 'rejected':
          return { 
            icon: <XCircle className="w-4 h-4" />, 
            color: 'text-red-600', 
            bgColor: 'bg-red-100',
            label: 'Rejected'
          }
        default:
          return { 
            icon: <FileText className="w-4 h-4" />, 
            color: 'text-gray-600', 
            bgColor: 'bg-gray-100',
            label: 'Draft'
          }
      }
    }
    return { 
      icon: <FileText className="w-4 h-4" />, 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-100',
      label: 'Available'
    }
  }

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value)
    setFilters(prev => ({ ...prev, search: value, page: 1 }))
  }, [])

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: Partial<ClientDocumentFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  // Handle sorting
  const handleSort = useCallback((field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_field: field as any,
      sort_direction: prev.sort_field === field && prev.sort_direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  // Handle document download
  const handleDownload = useCallback(async (documentId: string, documentName: string) => {
    try {
      await downloadDocument(documentId)
      onDocumentDownload?.(documentId)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }, [downloadDocument, onDocumentDownload])

  // Handle bulk selection
  const handleSelectDocument = useCallback((documentId: string, selected: boolean) => {
    setSelectedDocuments(prev => 
      selected 
        ? [...prev, documentId]
        : prev.filter(id => id !== documentId)
    )
  }, [])

  const handleSelectAll = useCallback((selected: boolean) => {
    setSelectedDocuments(selected ? documents.map(d => d.document_id) : [])
  }, [documents])

  // Fetch documents when filters change
  useEffect(() => {
    fetchDocuments(filters)
  }, [filters, fetchDocuments])

  // Get unique document types and statuses for filtering
  const availableTypes = [...new Set(documents.map(d => d.document?.document_type).filter(Boolean))]
  const availableStatuses = [...new Set(documents.map(d => d.document?.status).filter(Boolean))]

  if (loading && documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {totalCount} documents available
                {projectId && ' for this project'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              {/* Filters Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                    {(filters.document_type?.length || filters.status?.length || filters.requires_approval !== undefined) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Active
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Document Types */}
                  <div className="px-2 py-1 text-sm font-medium text-gray-700">Document Type</div>
                  {availableTypes.map(type => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={filters.document_type?.includes(type) || false}
                      onCheckedChange={(checked) => {
                        const types = filters.document_type || []
                        handleFilterChange({
                          document_type: checked 
                            ? [...types, type]
                            : types.filter(t => t !== type)
                        })
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {documentTypeConfig[type]?.icon}
                        {type}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Status Filter */}
                  <div className="px-2 py-1 text-sm font-medium text-gray-700">Status</div>
                  {availableStatuses.map(status => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.status?.includes(status) || false}
                      onCheckedChange={(checked) => {
                        const statuses = filters.status || []
                        handleFilterChange({
                          status: checked 
                            ? [...statuses, status]
                            : statuses.filter(s => s !== status)
                        })
                      }}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  {/* Approval Filter */}
                  <DropdownMenuCheckboxItem
                    checked={filters.requires_approval === true}
                    onCheckedChange={(checked) => {
                      handleFilterChange({ requires_approval: checked ? true : undefined })
                    }}
                  >
                    Requires Approval
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => handleFilterChange({
                      document_type: undefined,
                      status: undefined,
                      requires_approval: undefined
                    })}
                    className="text-red-600"
                  >
                    Clear Filters
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {filters.sort_direction === 'asc' ? (
                      <SortAsc className="w-4 h-4 mr-2" />
                    ) : (
                      <SortDesc className="w-4 h-4 mr-2" />
                    )}
                    Sort
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSort('created_at')}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Date Created
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('name')}>
                    <FileText className="w-4 h-4 mr-2" />
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('type')}>
                    <Tag className="w-4 h-4 mr-2" />
                    Type
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSort('status')}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedDocuments.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedDocuments.length} document{selectedDocuments.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedDocuments([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List/Grid */}
      {viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <div className="space-y-0">
              {documents.map((docAccess, index) => {
                const document = docAccess.document
                const typeConfig = documentTypeConfig[document?.document_type || 'other']
                const statusInfo = getDocumentStatusInfo(document)
                const isSelected = selectedDocuments.includes(docAccess.document_id)

                return (
                  <div
                    key={docAccess.id}
                    className={`flex items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSelectDocument(docAccess.document_id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />

                    {/* Document Icon */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${typeConfig.bgColor}`}>
                      <div className={typeConfig.color}>
                        {typeConfig.icon}
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {document?.document_name || 'Untitled Document'}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {document?.document_number && (
                              <span className="font-mono">{document.document_number} • </span>
                            )}
                            Version {document?.version || '1.0'}
                            {document?.document_type && (
                              <span> • {document.document_type}</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Uploaded {formatDistanceToNow(new Date(docAccess.granted_at), { addSuffix: true })}
                            {docAccess.view_count > 0 && (
                              <span> • Viewed {docAccess.view_count} time{docAccess.view_count > 1 ? 's' : ''}</span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Status Badge */}
                          <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0`}>
                            {statusInfo.icon}
                            <span className="ml-1">{statusInfo.label}</span>
                          </Badge>

                          {/* Access Type Badge */}
                          {docAccess.watermarked && (
                            <Badge variant="outline" className="text-xs">
                              Watermarked
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDocumentSelect?.(docAccess.document_id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>

                      {docAccess.can_download && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(docAccess.document_id, document?.document_name || 'document')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}

                      {docAccess.can_comment && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDocumentComment?.(docAccess.document_id)}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      )}

                      {docAccess.can_approve && document?.requires_approval && document?.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDocumentApprove?.(docAccess.document_id)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((docAccess) => {
            const document = docAccess.document
            const typeConfig = documentTypeConfig[document?.document_type || 'other']
            const statusInfo = getDocumentStatusInfo(document)
            const isSelected = selectedDocuments.includes(docAccess.document_id)

            return (
              <Card
                key={docAccess.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => onDocumentSelect?.(docAccess.document_id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeConfig.bgColor}`}>
                      <div className={typeConfig.color}>
                        {typeConfig.icon}
                      </div>
                    </div>
                    
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation()
                        handleSelectDocument(docAccess.document_id, e.target.checked)
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">
                      {document?.document_name || 'Untitled Document'}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Version {document?.version || '1.0'}
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={`${statusInfo.bgColor} ${statusInfo.color} border-0 text-xs`}>
                      {statusInfo.label}
                    </Badge>
                    {docAccess.watermarked && (
                      <Badge variant="outline" className="text-xs">
                        Watermarked
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {docAccess.can_download && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDownload(docAccess.document_id, document?.document_name || 'document')
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}

                    {docAccess.can_comment && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDocumentComment?.(docAccess.document_id)
                        }}
                      >
                        <MessageSquare className="w-3 h-3" />
                      </Button>
                    )}

                    {docAccess.can_approve && document?.requires_approval && document?.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDocumentApprove?.(docAccess.document_id)
                        }}
                      >
                        <CheckCircle className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(docAccess.granted_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* No Documents */}
      {documents.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents Found</h3>
            <p className="text-gray-600 max-w-md">
              {searchTerm || filters.document_type?.length || filters.status?.length
                ? 'No documents match your current search and filter criteria.'
                : 'No documents are currently available for this project.'
              }
            </p>
            {(searchTerm || filters.document_type?.length || filters.status?.length) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchTerm('')
                  setFilters({ page: 1, limit: 20, sort_field: 'created_at', sort_direction: 'desc' })
                }}
              >
                Clear Search and Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalCount > (filters.limit || 20) && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <p className="text-sm text-gray-600">
              Showing {((filters.page || 1) - 1) * (filters.limit || 20) + 1} to{' '}
              {Math.min((filters.page || 1) * (filters.limit || 20), totalCount)} of {totalCount} documents
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page || 1) <= 1}
                onClick={() => handleFilterChange({ page: (filters.page || 1) - 1 })}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(filters.page || 1) * (filters.limit || 20) >= totalCount}
                onClick={() => handleFilterChange({ page: (filters.page || 1) + 1 })}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}