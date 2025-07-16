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
import { FileText, Plus, Search, Filter, Calendar, User, Eye, Download, Share2 } from 'lucide-react'
import { useReports } from '@/hooks/useReports'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { ReportCreationModal } from '@/components/reports/ReportCreationModal'
import { ReportViewModal } from '@/components/reports/ReportViewModal'
import { ReportShareModal } from '@/components/reports/ReportShareModal'
import { formatDate } from '@/lib/utils'

interface ReportsTabProps {
  projectId: string
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ projectId }) => {
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: '',
    createdBy: '',
    dateFrom: '',
    dateTo: ''
  })
  
  const [activeTab, setActiveTab] = useState('all')
  const [showCreationModal, setShowCreationModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareReportId, setShareReportId] = useState<string | null>(null)

  const reportsFilters = useMemo(() => ({
    projectId,
    ...(filters.type && { type: filters.type }),
    ...(filters.status && { status: filters.status }),
    ...(filters.search && { search: filters.search }),
    ...(filters.createdBy && { createdBy: filters.createdBy }),
    ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters.dateTo && { dateTo: filters.dateTo })
  }), [projectId, filters])

  const { 
    data: reports, 
    loading, 
    error, 
    refresh,
    generatePDF
  } = useReports(reportsFilters)

  const filteredReports = useMemo(() => {
    if (!reports) return []
    
    switch (activeTab) {
      case 'draft':
        return reports.filter(r => r.status === 'draft')
      case 'published':
        return reports.filter(r => r.status === 'published')
      case 'archived':
        return reports.filter(r => r.status === 'archived')
      default:
        return reports
    }
  }, [reports, activeTab])

  const statusCounts = useMemo(() => {
    if (!reports) return {}
    
    return reports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [reports])

  const typeCounts = useMemo(() => {
    if (!reports) return {}
    
    return reports.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [reports])

  const handleTypeFilter = (type: string) => {
    setFilters(prev => ({ ...prev, type }))
  }

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, status }))
  }

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId)
  }

  const handleShareClick = (reportId: string) => {
    setShareReportId(reportId)
    setShowShareModal(true)
  }

  const handleDownloadPDF = async (reportId: string) => {
    try {
      await generatePDF(reportId)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    }
  }

  const handleCreationSuccess = () => {
    setShowCreationModal(false)
    refresh()
  }

  const handleShareComplete = () => {
    setShowShareModal(false)
    setShareReportId(null)
    refresh()
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published': return 'success'
      case 'archived': return 'secondary'
      case 'draft': return 'warning'
      default: return 'secondary'
    }
  }

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'progress': return 'info'
      case 'financial': return 'success'
      case 'compliance': return 'warning'
      case 'quality': return 'secondary'
      default: return 'secondary'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'progress': return 'Progress'
      case 'financial': return 'Financial'
      case 'compliance': return 'Compliance'
      case 'quality': return 'Quality'
      case 'custom': return 'Custom'
      default: return type
    }
  }

  const canCreateReport = hasPermission('reports.create')
  const canViewReport = hasPermission('reports.view')
  const canShareReport = hasPermission('reports.share')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-green-600" />
          <h2 className="text-xl font-semibold">Reports</h2>
          <Badge variant="secondary">
            {filteredReports.length} reports
          </Badge>
        </div>
        
        {canCreateReport && (
          <Button 
            onClick={() => setShowCreationModal(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Report</span>
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.type} onValueChange={handleTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All types</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={handleStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            All ({reports?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="draft">
            Draft ({statusCounts['draft'] || 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({statusCounts['published'] || 0})
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived ({statusCounts['archived'] || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <DataStateWrapper
            loading={loading}
            error={error}
            data={filteredReports}
            onRetry={refresh}
            emptyMessage="No reports found"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-2">
                          {report.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.description || 'No description'}
                        </p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Badge variant={getStatusBadgeVariant(report.status)}>
                          {report.status}
                        </Badge>
                        <Badge variant={getTypeBadgeVariant(report.type)}>
                          {getTypeLabel(report.type)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{report.created_by_user?.name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>

                      {report.published_at && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>Published {formatDate(report.published_at)}</span>
                        </div>
                      )}

                      {report.lines && (
                        <div className="text-sm text-gray-600">
                          {report.lines.length} sections
                        </div>
                      )}

                      <div className="flex space-x-2 mt-4">
                        {canViewReport && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleReportClick(report.id)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </Button>
                        )}
                        
                        {report.status === 'published' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDownloadPDF(report.id)}
                            className="flex items-center space-x-1"
                          >
                            <Download className="h-4 w-4" />
                            <span>PDF</span>
                          </Button>
                        )}
                        
                        {canShareReport && report.status === 'published' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleShareClick(report.id)}
                            className="flex items-center space-x-1"
                          >
                            <Share2 className="h-4 w-4" />
                            <span>Share</span>
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

      {/* Type Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Report Types Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {typeCounts['progress'] || 0}
              </div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {typeCounts['financial'] || 0}
              </div>
              <div className="text-sm text-gray-600">Financial</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {typeCounts['compliance'] || 0}
              </div>
              <div className="text-sm text-gray-600">Compliance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {typeCounts['quality'] || 0}
              </div>
              <div className="text-sm text-gray-600">Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {typeCounts['custom'] || 0}
              </div>
              <div className="text-sm text-gray-600">Custom</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creation Modal */}
      {showCreationModal && (
        <ReportCreationModal
          projectId={projectId}
          onClose={() => setShowCreationModal(false)}
          onSuccess={handleCreationSuccess}
        />
      )}

      {/* View Modal */}
      {selectedReport && (
        <ReportViewModal
          reportId={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && shareReportId && (
        <ReportShareModal
          reportId={shareReportId}
          onClose={() => setShowShareModal(false)}
          onComplete={handleShareComplete}
        />
      )}
    </div>
  )
}