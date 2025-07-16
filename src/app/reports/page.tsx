// ============================================================================
// Reports - Standalone Page
// ============================================================================
// V3 Feature: Report creation and management system
// Note: This is the standalone page for reports functionality
// ============================================================================

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Plus, FileText, Search, Filter, Eye, Download, Edit3, Share2, Trash2 } from 'lucide-react'

// Mock data hook for standalone reports page
function useAllReports() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Mock data combining reports from all projects
  const mockReports = [
    {
      id: '1',
      name: 'Weekly Progress Report - Week 12',
      type: 'weekly',
      status: 'published',
      generated_by: 'user1',
      generated_at: '2024-01-15T10:00:00Z',
      published_at: '2024-01-15T14:30:00Z',
      pdf_url: 'https://example.com/reports/report1.pdf',
      summary: 'Significant progress on structural work, minor delays in electrical',
      report_period: 'March 18-24, 2024',
      project: { id: 'proj1', name: 'Downtown Office Complex' },
      generated_by_profile: { id: 'user1', full_name: 'John Smith', email: 'john@company.com' }
    },
    {
      id: '2',
      name: 'Safety Inspection Report',
      type: 'safety',
      status: 'pending_review',
      generated_by: 'user2',
      generated_at: '2024-01-14T09:00:00Z',
      published_at: null,
      pdf_url: null,
      summary: 'Monthly safety inspection with 3 minor issues identified',
      report_period: 'March 2024',
      project: { id: 'proj2', name: 'Residential Complex Phase 2' },
      generated_by_profile: { id: 'user2', full_name: 'Sarah Johnson', email: 'sarah@company.com' }
    },
    {
      id: '3',
      name: 'Monthly Financial Summary',
      type: 'financial',
      status: 'draft',
      generated_by: 'user3',
      generated_at: '2024-01-13T16:00:00Z',
      published_at: null,
      pdf_url: null,
      summary: 'Budget analysis and cost tracking for Q1',
      report_period: 'Q1 2024',
      project: { id: 'proj3', name: 'Industrial Warehouse Renovation' },
      generated_by_profile: { id: 'user3', full_name: 'Mike Davis', email: 'mike@company.com' }
    }
  ]

  const refetch = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 500)
  }

  return { 
    data: mockReports,
    loading, 
    error, 
    refetch 
  }
}

// Status Badge Component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'pending_review': return 'bg-yellow-100 text-yellow-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Badge className={getStatusColor(status)} variant="secondary">
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  )
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [projectFilter, setProjectFilter] = useState<string>('')

  const { data: reports, loading, error, refetch } = useAllReports()

  // Filter reports
  const filteredReports = reports?.filter(report => {
    const matchesSearch = !searchTerm || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.project.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = !statusFilter || report.status === statusFilter
    const matchesType = !typeFilter || report.type === typeFilter
    const matchesProject = !projectFilter || report.project.id === projectFilter

    return matchesSearch && matchesStatus && matchesType && matchesProject
  }) || []

  // Get unique projects for filter
  const projects = Array.from(new Set(reports?.map(r => r.project.id) || []))
    .map(id => reports?.find(r => r.project.id === id)?.project)
    .filter(Boolean) as Array<{ id: string; name: string }>

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">
            Create and manage project reports across all your projects
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Report
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="safety">Safety</SelectItem>
            <SelectItem value="financial">Financial</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={projectFilter} onValueChange={setProjectFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reports List */}
      <DataStateWrapper
        loading={loading}
        error={error}
        data={filteredReports}
        onRetry={refetch}
        emptyMessage="No reports found"
        emptyDescription="Create your first report to get started"
        loadingComponent={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-48"></div>
              </div>
            ))}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <Card key={report.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
                      {report.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {report.project.name} • {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                      {report.report_period && ` • ${report.report_period}`}
                    </CardDescription>
                  </div>
                  <StatusBadge status={report.status} />
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {report.summary && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {report.summary}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>By {report.generated_by_profile.full_name}</span>
                  <span>{new Date(report.generated_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>

                  {report.status !== 'published' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  )}

                  {report.pdf_url ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(report.pdf_url!, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                      PDF
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      Generate PDF
                    </Button>
                  )}

                  {report.status === 'pending_review' && report.pdf_url && (
                    <Button 
                      variant="default" 
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Share2 className="h-4 w-4" />
                      Publish
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataStateWrapper>
    </div>
  )
}