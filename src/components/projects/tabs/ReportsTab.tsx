'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useReports, ProjectReport, ReportFilters } from '@/hooks/useReports';
import { 
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  Clock,
  BarChart3,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign
} from 'lucide-react';

interface ReportsTabProps {
  projectId: string;
}

export function ReportsTab({ projectId }: ReportsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Build filters object for the hook
  const filters: ReportFilters = {
    search: searchTerm || undefined,
    type: filterType !== 'all' ? filterType : undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
  };

  // Use the real reports hook instead of real data
  const {
    reports,
    statistics,
    loading,
    error,
    permissions,
    createReport,
    deleteReport,
    downloadReport,
    refetch
  } = useReports(projectId, filters);

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Map report types to semantic Badge variants
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'daily': return 'status-info' as const;
      case 'weekly': return 'status-success' as const;
      case 'monthly': return 'status-review' as const;
      case 'safety': return 'status-danger' as const;
      case 'financial': return 'status-warning' as const;
      case 'progress': return 'status-info' as const;
      case 'quality': return 'status-blocked' as const;
      case 'custom': return 'secondary' as const;
      default: return 'secondary' as const;
    }
  };

  // Map report status to semantic Badge variants
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'status-success' as const;
      case 'reviewed': return 'status-review' as const;
      case 'completed': return 'completed' as const;
      case 'draft': return 'pending' as const;
      default: return 'secondary' as const;
    }
  };

  // Map priority to semantic Badge variants
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high' as const;
      case 'medium': return 'priority-medium' as const;
      case 'low': return 'priority-low' as const;
      case 'urgent': return 'priority-urgent' as const;
      default: return 'secondary' as const;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily': return <Calendar className="w-4 h-4" />;
      case 'weekly': return <BarChart3 className="w-4 h-4" />;
      case 'monthly': return <TrendingUp className="w-4 h-4" />;
      case 'safety': return <AlertTriangle className="w-4 h-4" />;
      case 'financial': return <DollarSign className="w-4 h-4" />;
      case 'progress': return <TrendingUp className="w-4 h-4" />;
      case 'quality': return <FileCheck className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Calculate counts from real data
  const typeCounts = reports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = reports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);



  return (
    <DataStateWrapper
      loading={loading}
      error={null}
      data={reports}
      onRetry={refetch}
      emptyComponent={
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reports available</h3>
            <p className="text-muted-foreground mb-4">
              Reports will appear here once they are generated for this project.
            </p>
            {permissions.canCreate && (
              <Button onClick={() => console.log('Open report creation form')}>
                <FileText className="h-4 w-4 mr-2" />
                Create First Report
              </Button>
            )}
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <div className="text-sm text-gray-600">Generated reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.completed || 0}</div>
            <div className="text-sm text-gray-600">Submitted reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Safety Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{typeCounts.safety || 0}</div>
            <div className="text-sm text-gray-600">Safety inspections</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics?.recentReports || 0}</div>
            <div className="text-sm text-gray-600">Last 7 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Reports</CardTitle>
              <CardDescription>View and manage all project reports and documentation</CardDescription>
            </div>
            {permissions.canCreate && (
              <Button onClick={() => console.log('Open report creation form')}>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="safety">Safety</option>
                <option value="quality">Quality</option>
                <option value="incident">Incident</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No reports have been generated for this project yet.'
                  }
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(report.type)}
                            <h3 className="font-semibold text-lg">{report.name}</h3>
                          </div>
                          <Badge variant="default">
                            {report.type}
                          </Badge>
                          <Badge variant="default">
                            {report.status}
                          </Badge>
                          <Badge variant="default">
                            {report.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{report.description}</p>
                        
                        {report.summary && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-md">
                            <div className="text-sm font-medium text-blue-900 mb-1">Summary:</div>
                            <div className="text-sm text-blue-800">{report.summary}</div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Generated by:</span>
                            <span>{report.generatedBy}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Generated:</span>
                            <span>{new Date(report.generatedDate).toLocaleDateString()}</span>
                          </div>
                          
                          {report.reportPeriod && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Period:</span>
                              <span>{report.reportPeriod}</span>
                            </div>
                          )}
                          
                          {report.reviewedBy && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-400" />
                              <span className="font-medium">Reviewed by:</span>
                              <span>{report.reviewedBy}</span>
                            </div>
                          )}
                          
                          {report.reviewedDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              <span className="font-medium">Reviewed:</span>
                              <span>{new Date(report.reviewedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">File:</span>
                            <span>{report.fileType} • {report.fileSize}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <div className="flex gap-1">
                          {permissions.canView && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => console.log('View report:', report.id)}
                              title="View report"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {permissions.canDownload && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadReport(report.id)}
                              title="Download report"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </DataStateWrapper>
  );
}