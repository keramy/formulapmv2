'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { 
  Search,
  Filter,
  FileText,
  Download,
  Upload,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';

interface ShopDrawingsTabProps {
  projectId: string;
}

interface ShopDrawing {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'revision_required';
  priority: 'low' | 'medium' | 'high';
  submittedBy: string;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  version: number;
  category: string;
  notes?: string;
  fileSize: string;
  fileType: string;
}

export function ShopDrawingsTab({ projectId }: ShopDrawingsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');


  // Mock data for demonstration - in real app, this would come from API
  const mockShopDrawings: ShopDrawing[] = [
    {
      id: '1',
      name: 'Structural Steel Frame - Section A',
      description: 'Detailed shop drawings for structural steel frame section A including connections and specifications',
      status: 'approved',
      priority: 'high',
      submittedBy: 'Steel Works Inc.',
      submittedDate: '2024-01-15',
      reviewedBy: 'John Smith',
      reviewedDate: '2024-01-20',
      version: 2,
      category: 'Structural',
      notes: 'Approved with minor notes. Proceed with fabrication.',
      fileSize: '2.4 MB',
      fileType: 'PDF'
    },
    {
      id: '2',
      name: 'HVAC Ductwork Layout - Floor 1',
      description: 'Shop drawings for HVAC ductwork layout and connections for first floor',
      status: 'under_review',
      priority: 'medium',
      submittedBy: 'Climate Control Co.',
      submittedDate: '2024-02-01',
      version: 1,
      category: 'HVAC',
      fileSize: '1.8 MB',
      fileType: 'PDF'
    },
    {
      id: '3',
      name: 'Electrical Panel Schedule',
      description: 'Detailed electrical panel schedule and circuit layouts',
      status: 'revision_required',
      priority: 'high',
      submittedBy: 'Electric Solutions LLC',
      submittedDate: '2024-01-28',
      reviewedBy: 'Mike Johnson',
      reviewedDate: '2024-02-02',
      version: 1,
      category: 'Electrical',
      notes: 'Revision required - panel sizing needs adjustment for load calculations',
      fileSize: '3.1 MB',
      fileType: 'PDF'
    },
    {
      id: '4',
      name: 'Precast Concrete Panels',
      description: 'Shop drawings for precast concrete panels including reinforcement details',
      status: 'pending',
      priority: 'medium',
      submittedBy: 'Precast Solutions',
      submittedDate: '2024-02-05',
      version: 1,
      category: 'Concrete',
      fileSize: '4.2 MB',
      fileType: 'PDF'
    },
    {
      id: '5',
      name: 'Curtain Wall System',
      description: 'Detailed shop drawings for curtain wall system installation',
      status: 'rejected',
      priority: 'high',
      submittedBy: 'Glass & Glazing Co.',
      submittedDate: '2024-01-25',
      reviewedBy: 'Sarah Wilson',
      reviewedDate: '2024-01-30',
      version: 1,
      category: 'Exterior',
      notes: 'Rejected - thermal performance calculations do not meet specifications',
      fileSize: '5.6 MB',
      fileType: 'PDF'
    }
  ];

  const filteredDrawings = mockShopDrawings.filter(drawing => {
    const matchesSearch = drawing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drawing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         drawing.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || drawing.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'revision_required': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'under_review': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'revision_required': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const statusCounts = mockShopDrawings.reduce((acc, drawing) => {
    acc[drawing.status] = (acc[drawing.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DataStateWrapper
      loading={false}
      error={null}
      data={filteredDrawings}
      emptyComponent={
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No shop drawings yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first shop drawing to get started.
            </p>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Drawing
            </Button>
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockShopDrawings.length}</div>
            <div className="text-sm text-gray-600">Submitted drawings</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</div>
            <div className="text-sm text-gray-600">Ready for fabrication</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.under_review || 0}</div>
            <div className="text-sm text-gray-600">Awaiting approval</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Need Revision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{(statusCounts.revision_required || 0) + (statusCounts.rejected || 0)}</div>
            <div className="text-sm text-gray-600">Require updates</div>
          </CardContent>
        </Card>
      </div>

      {/* Shop Drawings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shop Drawings</CardTitle>
              <CardDescription>Manage shop drawing submissions and approvals</CardDescription>
            </div>
            <Button>
              <Upload className="w-4 h-4 mr-2" />
              Upload Drawing
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search shop drawings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="revision_required">Revision Required</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Drawings List */}
          <div className="space-y-4">
            {filteredDrawings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shop drawings found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No shop drawings have been submitted for this project yet.'
                  }
                </p>
              </div>
            ) : (
              filteredDrawings.map((drawing) => (
                <Card key={drawing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <h3 className="font-semibold text-lg">{drawing.name}</h3>
                          <Badge className={getStatusColor(drawing.status)}>
                            {getStatusIcon(drawing.status)}
                            <span className="ml-1">{drawing.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(drawing.priority)}>
                            {drawing.priority}
                          </Badge>
                          <Badge variant="secondary">v{drawing.version}</Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{drawing.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Submitted by:</span>
                            <span>{drawing.submittedBy}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Submitted:</span>
                            <span>{new Date(drawing.submittedDate).toLocaleDateString()}</span>
                          </div>
                          
                          {drawing.reviewedBy && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Reviewed by:</span>
                              <span>{drawing.reviewedBy}</span>
                            </div>
                          )}
                          
                          {drawing.reviewedDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Reviewed:</span>
                              <span>{new Date(drawing.reviewedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">File:</span>
                            <span>{drawing.fileType} • {drawing.fileSize}</span>
                          </div>
                        </div>
                        
                        {drawing.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm font-medium text-gray-700 mb-1">Review Notes:</div>
                            <div className="text-sm text-gray-600">{drawing.notes}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Badge variant="secondary">{drawing.category}</Badge>
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
    </DataStateWrapper>
  );
}