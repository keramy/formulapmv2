'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useShopDrawings, ShopDrawingFilters } from '@/hooks/useShopDrawings';
import { ShopDrawingUploadModal } from '@/components/shop-drawings/ShopDrawingUploadModal';
import Search from 'lucide-react/dist/esm/icons/search'
import Filter from 'lucide-react/dist/esm/icons/filter'
import FileText from 'lucide-react/dist/esm/icons/file-text'
import Download from 'lucide-react/dist/esm/icons/download'
import Upload from 'lucide-react/dist/esm/icons/upload'
import Eye from 'lucide-react/dist/esm/icons/eye'
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle'
import XCircle from 'lucide-react/dist/esm/icons/x-circle'
import Clock from 'lucide-react/dist/esm/icons/clock'
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle'
import Calendar from 'lucide-react/dist/esm/icons/calendar'
import User from 'lucide-react/dist/esm/icons/user'

interface ShopDrawingsTabProps {
  projectId: string;
}

export function ShopDrawingsTab({ projectId }: ShopDrawingsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDiscipline, setFilterDiscipline] = useState('all');

  // Build filters object for the hook
  const filters: ShopDrawingFilters = {
    search: searchTerm || undefined,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    discipline: filterDiscipline !== 'all' ? filterDiscipline : undefined,
  };

  // Use the real shop drawings hook instead of real data
  const {
    shopDrawings,
    statistics,
    loading,
    error,
    permissions,
    createShopDrawing,
    deleteShopDrawing,
    updateShopDrawingStatus,
    downloadShopDrawing,
    refetch
  } = useShopDrawings(projectId, filters);

  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }


  // Map shop drawing status to semantic Badge variants
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'shop-approved' as const;
      case 'under_review': return 'shop-under-review' as const;
      case 'revision_required': return 'shop-revision-required' as const;
      case 'rejected': return 'shop-rejected' as const;
      case 'pending': return 'shop-pending' as const;
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

  // Map category/discipline to semantic Badge variants
  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'electrical': return 'scope-electrical' as const;
      case 'mechanical': return 'scope-mechanical' as const;
      case 'millwork': return 'scope-millwork' as const;
      case 'architectural': case 'structural': case 'plumbing': case 'landscape': case 'interior_design': 
        return 'scope-construction' as const;
      default: return 'secondary' as const;
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

  // Calculate counts from real data
  const statusCounts = shopDrawings.reduce((acc, drawing) => {
    acc[drawing.status] = (acc[drawing.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const disciplineCounts = shopDrawings.reduce((acc, drawing) => {
    acc[drawing.category] = (acc[drawing.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DataStateWrapper
      loading={loading}
      error={null}
      data={shopDrawings}
      onRetry={refetch}
      emptyComponent={
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No shop drawings yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload your first shop drawing to get started.
            </p>
            {permissions.canCreate && (
              <ShopDrawingUploadModal
                projectId={projectId}
                onUploadComplete={refetch}
                trigger={
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Drawing
                  </Button>
                }
              />
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
            <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shopDrawings.length}</div>
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
            {permissions.canCreate && (
              <ShopDrawingUploadModal
                projectId={projectId}
                onUploadComplete={refetch}
                trigger={
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Drawing
                  </Button>
                }
              />
            )}
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
              <select
                value={filterDiscipline}
                onChange={(e) => setFilterDiscipline(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Disciplines</option>
                <option value="architectural">Architectural</option>
                <option value="structural">Structural</option>
                <option value="mechanical">Mechanical</option>
                <option value="electrical">Electrical</option>
                <option value="plumbing">Plumbing</option>
                <option value="millwork">Millwork</option>
                <option value="landscape">Landscape</option>
                <option value="interior_design">Interior Design</option>
                <option value="other">Other</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Drawings List */}
          <div className="space-y-4">
            {shopDrawings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No shop drawings found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' || filterDiscipline !== 'all'
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No shop drawings have been submitted for this project yet.'
                  }
                </p>
              </div>
            ) : (
              shopDrawings.map((drawing) => (
                <Card key={drawing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          <h3 className="font-semibold text-lg">{drawing.name}</h3>
                          <Badge variant={getStatusBadgeVariant(drawing.status)}>
                            {getStatusIcon(drawing.status)}
                            <span className="ml-1">{drawing.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(drawing.priority)}>
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
                        <Badge variant={getCategoryBadgeVariant(drawing.category)}>{drawing.category}</Badge>
                        <div className="flex gap-1">
                          {permissions.canView && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => console.log('View drawing:', drawing.id)}
                              title="View drawing"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {permissions.canDownload && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => downloadShopDrawing(drawing.id)}
                              title="Download drawing"
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