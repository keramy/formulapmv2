'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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

interface ProjectReport {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'safety' | 'financial' | 'progress' | 'quality' | 'custom';
  status: 'draft' | 'completed' | 'reviewed' | 'approved';
  generatedBy: string;
  generatedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  fileSize: string;
  fileType: string;
  reportPeriod?: string;
  priority: 'low' | 'medium' | 'high';
  summary?: string;
}

export function ReportsTab({ projectId }: ReportsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - in real app, this would come from API
  const mockReports: ProjectReport[] = [
    {
      id: '1',
      name: 'Weekly Progress Report - Week 6',
      description: 'Comprehensive weekly progress report covering all project activities',
      type: 'weekly',
      status: 'approved',
      generatedBy: 'John Smith',
      generatedDate: '2024-02-05',
      reviewedBy: 'Mike Johnson',
      reviewedDate: '2024-02-06',
      fileSize: '2.1 MB',
      fileType: 'PDF',
      reportPeriod: 'Jan 29 - Feb 4, 2024',
      priority: 'high',
      summary: 'Project on track, foundation work completed ahead of schedule'
    },
    {
      id: '2',
      name: 'Safety Inspection Report',
      description: 'Monthly safety inspection and compliance report',
      type: 'safety',
      status: 'completed',
      generatedBy: 'Sarah Wilson',
      generatedDate: '2024-02-01',
      fileSize: '1.5 MB',
      fileType: 'PDF',
      reportPeriod: 'January 2024',
      priority: 'high',
      summary: 'No major safety issues identified, minor recommendations provided'
    },
    {
      id: '3',
      name: 'Financial Status Report - Q1',
      description: 'Quarterly financial analysis and budget tracking',
      type: 'financial',
      status: 'reviewed',
      generatedBy: 'David Brown',
      generatedDate: '2024-01-31',
      reviewedBy: 'Lisa Garcia',
      reviewedDate: '2024-02-02',
      fileSize: '3.2 MB',
      fileType: 'Excel',
      reportPeriod: 'Q1 2024',
      priority: 'medium',
      summary: 'Budget utilization at 65%, within acceptable variance'
    },
    {
      id: '4',
      name: 'Daily Report - Construction Activities',
      description: 'Daily report of construction activities and resource utilization',
      type: 'daily',
      status: 'completed',
      generatedBy: 'Robert Davis',
      generatedDate: '2024-02-07',
      fileSize: '0.8 MB',
      fileType: 'PDF',
      reportPeriod: 'February 7, 2024',
      priority: 'low',
      summary: 'Concrete pour completed, steel delivery on schedule'
    },
    {
      id: '5',
      name: 'Quality Control Inspection',
      description: 'Quality control inspection report for foundation work',
      type: 'quality',
      status: 'draft',
      generatedBy: 'Lisa Garcia',
      generatedDate: '2024-02-08',
      fileSize: '1.2 MB',
      fileType: 'PDF',
      reportPeriod: 'February 2024',
      priority: 'medium',
      summary: 'Quality inspection in progress, preliminary results positive'
    },
    {
      id: '6',
      name: 'Project Progress Dashboard',
      description: 'Comprehensive project progress and milestone tracking',
      type: 'progress',
      status: 'completed',
      generatedBy: 'Mike Johnson',
      generatedDate: '2024-02-03',
      fileSize: '2.8 MB',
      fileType: 'PDF',
      reportPeriod: 'January 2024',
      priority: 'high',
      summary: 'Overall progress at 45%, critical path items on schedule'
    }
  ];

  const filteredReports = mockReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.generatedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'bg-blue-100 text-blue-800';
      case 'weekly': return 'bg-green-100 text-green-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'safety': return 'bg-red-100 text-red-800';
      case 'financial': return 'bg-yellow-100 text-yellow-800';
      case 'progress': return 'bg-indigo-100 text-indigo-800';
      case 'quality': return 'bg-orange-100 text-orange-800';
      case 'custom': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-purple-100 text-purple-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const typeCounts = mockReports.reduce((acc, report) => {
    acc[report.type] = (acc[report.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = mockReports.reduce((acc, report) => {
    acc[report.status] = (acc[report.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockReports.length}</div>
            <div className="text-sm text-gray-600">Generated reports</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</div>
            <div className="text-sm text-gray-600">Final reports</div>
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
            <CardTitle className="text-sm font-medium">Draft Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.draft || 0}</div>
            <div className="text-sm text-gray-600">In progress</div>
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
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
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
                <option value="monthly">Monthly</option>
                <option value="safety">Safety</option>
                <option value="financial">Financial</option>
                <option value="progress">Progress</option>
                <option value="quality">Quality</option>
                <option value="custom">Custom</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Reports List */}
          <div className="space-y-4">
            {filteredReports.length === 0 ? (
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
              filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {getTypeIcon(report.type)}
                            <h3 className="font-semibold text-lg">{report.name}</h3>
                          </div>
                          <Badge className={getTypeColor(report.type)}>
                            {report.type}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(report.priority)}>
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
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
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
  );
}