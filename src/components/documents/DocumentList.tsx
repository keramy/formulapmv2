'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  FileText, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Download,
  Calendar,
  User,
  Settings,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Document {
  id: string
  document_name: string
  document_type: string
  document_number?: string
  version: string
  file_path?: string
  file_size?: number
  file_type?: string
  description?: string
  created_at: string
  projects: {
    id: string
    name: string
  }
  created_by_user: {
    id: string
    email: string
  }
  approval_workflow?: {
    id: string
    current_status: string
    priority_level: number
    required_approvers: string[]
    completed_approvers: string[]
    created_at: string
    estimated_completion_date?: string
  }[]
}

interface DocumentListProps {
  projectId?: string
  onWorkflowSelect?: (workflowId: string) => void
}

const DocumentList: React.FC<DocumentListProps> = ({ projectId, onWorkflowSelect }) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [projectId])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, typeFilter, statusFilter])

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams()
      if (projectId) params.append('projectId', projectId)
      
      const response = await fetch(`/api/documents?${params}`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.document_type === typeFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => {
        const workflow = doc.approval_workflow?.[0]
        if (!workflow) return statusFilter === 'no_workflow'
        return workflow.current_status === statusFilter
      })
    }

    setFilteredDocuments(filtered)
  }

  const getStatusColor = (status?: string) => {
    if (!status) return 'bg-gray-500'
    switch (status) {
      case 'pending': return 'bg-yellow-500'
      case 'in_review': return 'bg-blue-500'
      case 'approved': return 'bg-green-500'
      case 'rejected': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status?: string) => {
    if (!status) return <Clock className="w-4 h-4" />
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'in_review': return <AlertTriangle className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'rejected': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getDocumentTypeIcon = (type: string) => {
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documents
            </span>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Document</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground">
                  Document upload functionality will be implemented here.
                </p>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="drawing">Drawings</SelectItem>
                <SelectItem value="specification">Specifications</SelectItem>
                <SelectItem value="report">Reports</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="no_workflow">No Workflow</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => {
                const workflow = document.approval_workflow?.[0]
                return (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {getDocumentTypeIcon(document.document_type)}
                          <span className="font-medium">{document.document_name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>#{document.document_number || 'N/A'}</span>
                          <span>v{document.version}</span>
                        </div>
                        {document.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {document.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {document.document_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{document.projects.name}</span>
                    </TableCell>
                    <TableCell>
                      {workflow ? (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(workflow.current_status)}
                          <Badge 
                            variant="secondary" 
                            className={`text-white ${getStatusColor(workflow.current_status)}`}
                          >
                            {workflow.current_status}
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline">No Workflow</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{formatFileSize(document.file_size)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {document.created_by_user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        {document.file_path && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        {workflow && onWorkflowSelect && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onWorkflowSelect(workflow.id)}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'No documents match your current filters.'
                  : 'No documents have been uploaded yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DocumentList