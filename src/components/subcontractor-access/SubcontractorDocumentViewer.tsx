/**
 * Subcontractor Document Viewer Component
 * Displays and manages access to assigned project documents
 */

'use client'

import { useState } from 'react'
import { useSubcontractorPortal } from '@/hooks/useSubcontractorPortal'
import { SubcontractorDocumentResponse } from '@/types/subcontractor'
import { formatFileSize } from '@/lib/validation/subcontractor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  FileText, 
  Filter, 
  Building,
  Calendar,
  Search,
  ExternalLink,
  File
} from 'lucide-react'

interface SubcontractorDocumentViewerProps {
  documents: SubcontractorDocumentResponse[]
  onRefresh: () => Promise<void>
}

export function SubcontractorDocumentViewer({
  documents,
  onRefresh
}: SubcontractorDocumentViewerProps) {
  const { downloadDocument } = useSubcontractorPortal()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Get unique projects and categories for filtering
  const projects = [...new Set(documents.map(d => d.scope_item.project.name))]
  const categories = [...new Set(documents.map(d => d.scope_item.category))]

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.scope_item.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProject = !selectedProject || 
      doc.scope_item.project.name === selectedProject
    
    const matchesCategory = !selectedCategory || 
      doc.scope_item.category === selectedCategory

    return matchesSearch && matchesProject && matchesCategory
  })

  const handleDownload = async (documentId: string) => {
    try {
      setIsLoading(true)
      await downloadDocument(documentId)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <File className="h-5 w-5 text-red-500" />
    }
    return <FileText className="h-5 w-5 text-blue-500" />
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedProject('')
    setSelectedCategory('')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Project Documents</span>
          </CardTitle>
          <CardDescription>
            Access and download documents assigned to your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Project Filter */}
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="flex-1 min-w-[200px]">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedProject || selectedCategory) && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="flex items-center space-x-2"
                >
                  <Filter className="h-4 w-4" />
                  <span>Clear</span>
                </Button>
              )}
            </div>

            {/* Results Summary */}
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                Showing {filteredDocuments.length} of {documents.length} documents
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length > 0 ? (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Document Info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getFileIcon(document.file_type)}
                      <h3 className="font-medium text-gray-900">{document.name}</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {/* Project Info */}
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Building className="h-4 w-4" />
                        <span>{document.scope_item.project.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {document.scope_item.project.status}
                        </Badge>
                      </div>
                      
                      {/* Scope Item */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Scope:</span> {document.scope_item.name}
                      </div>
                      
                      {/* Category */}
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{document.scope_item.category}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(document.file_size)}
                        </span>
                      </div>
                      
                      {/* Access Info */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Granted: {new Date(document.access_info.granted_at).toLocaleDateString()}</span>
                        </div>
                        {document.access_info.last_accessed && (
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>Last accessed: {new Date(document.access_info.last_accessed).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => handleDownload(document.id)}
                      disabled={!document.access_info.can_download || isLoading}
                      className="flex items-center space-x-2"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    
                    {document.file_url && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(document.file_url, '_blank')}
                        className="flex items-center space-x-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>View</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {documents.length === 0 ? (
              <div>
                <p className="text-gray-500 mb-2">No documents available</p>
                <p className="text-sm text-gray-400">
                  Contact your project manager to get access to project documents
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 mb-2">No documents match your search</p>
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}