'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { 
  FileText, 
  Download, 
  Edit3, 
  Share2, 
  Calendar, 
  User,
  Image as ImageIcon,
  File,
  ExternalLink
} from 'lucide-react'
import { useReport } from '@/hooks/useReports'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { formatDate } from '@/lib/utils'

interface ReportViewModalProps {
  reportId: string
  onClose: () => void
}

export const ReportViewModal: React.FC<ReportViewModalProps> = ({
  reportId,
  onClose
}) => {
  const { profile } = useAuth()
  const { hasPermission } = usePermissions()
  const { data: report, loading, error } = useReport(reportId)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const { generatePDF } = useReports()

  const handleDownloadPDF = async () => {
    if (!report) return
    
    try {
      setGeneratingPDF(true)
      await generatePDF(report.id)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setGeneratingPDF(false)
    }
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

  const canEdit = hasPermission('reports.edit') && report?.status === 'draft'
  const canDownload = hasPermission('reports.download') && report?.status === 'published'
  const canShare = hasPermission('reports.share') && report?.status === 'published'

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Report Details</span>
          </DialogTitle>
        </DialogHeader>

        <DataStateWrapper
          loading={loading}
          error={error}
          data={report}
          onRetry={() => {}}
          emptyMessage="Report not found"
        >
          {report && (
            <div className="space-y-6">
              {/* Report Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{report.title}</CardTitle>
                      <p className="text-gray-600 mt-2">
                        {report.description || 'No description provided'}
                      </p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Badge variant={getStatusBadgeVariant(report.status)}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <Badge variant={getTypeBadgeVariant(report.type)}>
                        {getTypeLabel(report.type)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Created By</span>
                      </div>
                      <p className="font-medium mt-1">
                        {report.created_by_user?.name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Created Date</span>
                      </div>
                      <p className="font-medium mt-1">
                        {formatDate(report.created_at)}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Last Updated</span>
                      </div>
                      <p className="font-medium mt-1">
                        {formatDate(report.updated_at)}
                      </p>
                    </div>
                    {report.published_at && (
                      <div>
                        <div className="flex items-center space-x-1 text-gray-600">
                          <FileText className="h-4 w-4" />
                          <span>Published</span>
                        </div>
                        <p className="font-medium mt-1">
                          {formatDate(report.published_at)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Report Content */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Content</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.content && Object.keys(report.content).length > 0 ? (
                    <div className="space-y-4">
                      {Object.entries(report.content).map(([key, value]) => (
                        <div key={key} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-sm text-gray-800 mb-2">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          </h4>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">No content available</p>
                  )}
                </CardContent>
              </Card>

              {/* Report Lines */}
              {report.lines && report.lines.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Report Sections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {report.lines.map((line, index) => (
                        <div key={line.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-lg">
                              {index + 1}. {line.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(line.created_at)}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                            {line.content}
                          </div>

                          {line.photos && line.photos.length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-2">Attachments:</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {line.photos.map((photo) => (
                                  <div key={photo.id} className="border rounded-lg p-2">
                                    <div className="flex items-center space-x-2">
                                      <ImageIcon className="h-4 w-4 text-gray-500" />
                                      <span className="text-xs text-gray-600 truncate">
                                        {photo.caption || 'Photo'}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {Math.round(photo.file_size / 1024)} KB
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(photo.file_path, '_blank')}
                                      className="w-full mt-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Report Shares */}
              {report.shares && report.shares.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shared With</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {report.shares.map((share) => (
                        <div key={share.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{share.user?.name || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {share.access_level}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(share.shared_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DataStateWrapper>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          
          {canEdit && (
            <Button variant="outline" className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>Edit Report</span>
            </Button>
          )}
          
          {canDownload && (
            <Button 
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
              className="flex items-center space-x-2"
            >
              {generatingPDF ? (
                <>
                  <div className="h-4 w-4 animate-spin border-2 border-blue-600 border-t-transparent rounded-full" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          )}
          
          {canShare && (
            <Button className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Share Report</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}