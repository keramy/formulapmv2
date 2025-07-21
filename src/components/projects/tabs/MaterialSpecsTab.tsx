'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search,
  Filter,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Building,
  DollarSign,
  Calendar,
  Truck,
  FileText,
  Plus
} from 'lucide-react';
import { useMaterialSpecs } from '@/hooks/useMaterialSpecs';
import { MaterialSpec, MaterialSpecFilters } from '@/types/material-specs';
import { MaterialApprovalActions } from '@/components/projects/material-approval/MaterialApprovalActions';
import { MaterialSpecForm } from '@/components/projects/material-approval/MaterialSpecForm';
import { ScopeLinkingActions } from '@/components/projects/material-approval/ScopeLinkingActions';
import { DataStateWrapper } from '@/components/ui/loading-states';

interface MaterialSpecsTabProps {
  projectId: string;
}

export function MaterialSpecsTab({ projectId }: MaterialSpecsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedMaterialSpec, setSelectedMaterialSpec] = useState<MaterialSpec | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Create filters object for the hook
  const filters = useMemo<MaterialSpecFilters>(() => {
    const result: MaterialSpecFilters = {};
    
    if (searchTerm) {
      result.search = searchTerm;
    }
    
    if (filterStatus !== 'all') {
      result.status = [filterStatus as any];
    }
    
    if (filterCategory !== 'all') {
      result.category = [filterCategory];
    }
    
    return result;
  }, [searchTerm, filterStatus, filterCategory]);
  
  // Use the custom hook for material specs
  const {
    materialSpecs,
    statistics,
    loading,
    error,
    permissions,
    refetch
  } = useMaterialSpecs(projectId, filters);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(materialSpecs.map(spec => spec.category))];
    return uniqueCategories.sort();
  }, [materialSpecs]);
  


  // Map material status to semantic Badge variants
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'status-success' as const;
      case 'pending_approval': return 'pending' as const;
      case 'rejected': return 'status-danger' as const;
      case 'revision_required': return 'status-warning' as const;
      case 'discontinued': return 'cancelled' as const;
      case 'substitution_required': return 'status-review' as const;
      default: return 'pending' as const;
    }
  };

  // Map material priority to semantic Badge variants
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'priority-urgent' as const;
      case 'high': return 'priority-high' as const;
      case 'medium': return 'priority-medium' as const;
      case 'low': return 'priority-low' as const;
      default: return 'priority-medium' as const;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'pending_approval': return <Clock className="w-4 h-4 text-status-warning" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-status-danger" />;
      case 'revision_required': return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      case 'discontinued': return <Package className="w-4 h-4 text-muted-foreground" />;
      case 'substitution_required': return <Package className="w-4 h-4 text-status-review" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Calculate display values from statistics
  const totalValue = statistics ? statistics.totalEstimatedCost : 0;
  const deliveredCount = statistics ? statistics.byStatus.approved : 0;
  const pendingCount = statistics ? statistics.byStatus.pending_approval : 0;



  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={materialSpecs}
      onRetry={refetch}
      emptyComponent={
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No material specifications yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first material specification to get started.
          </p>
          {permissions.canCreate && (
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Material Spec
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.total || 0}</div>
            <div className="text-sm text-gray-600">Material specifications</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalValue.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Material costs</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
            <div className="text-sm text-gray-600">On site</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Awaiting order</div>
          </CardContent>
        </Card>
      </div>

      {/* Material Specifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Material Specifications</CardTitle>
          <CardDescription>Track material requirements, orders, and deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search materials..."
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
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="revision_required">Revision Required</option>
                <option value="discontinued">Discontinued</option>
                <option value="substitution_required">Substitution Required</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
              {permissions.canCreate && (
                <Button size="sm" onClick={() => {
                  setSelectedMaterialSpec(undefined);
                  setIsFormOpen(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
              )}
            </div>
          </div>

          {/* Material Specs List */}
          <div className="space-y-4">
            {materialSpecs.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No material specifications found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No material specifications have been added to this project yet.'
                  }
                </p>
              </div>
            ) : (
              materialSpecs.map((spec) => (
                <Card key={spec.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(spec.status)}
                          <h3 className="font-semibold text-lg">{spec.name}</h3>
                          <Badge variant={getStatusBadgeVariant(spec.status)}>
                            {spec.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(spec.priority)}>
                            {spec.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{spec.description}</p>
                        
                        {spec.specifications && Object.keys(spec.specifications).length > 0 && (
                          <div className="mb-3 p-3 bg-blue-50 rounded-md">
                            <div className="text-sm font-medium text-blue-900 mb-1">Specifications:</div>
                            <div className="text-sm text-blue-800">
                              {Object.entries(spec.specifications).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium">{key}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Quantity:</span>
                            <span>{spec.quantity_required.toLocaleString()} {spec.unit_of_measure}</span>
                          </div>
                          
                          {spec.estimated_cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Est. Cost:</span>
                              <span>${spec.estimated_cost.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {spec.estimated_cost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-medium">Total:</span>
                              <span className="text-green-600 font-semibold">${(spec.estimated_cost * spec.quantity_required).toLocaleString()}</span>
                            </div>
                          )}
                          
                          {spec.supplier && (
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Supplier:</span>
                              <span>{spec.supplier.name}</span>
                            </div>
                          )}
                          
                          {spec.delivery_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Delivery:</span>
                              <span>{new Date(spec.delivery_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {spec.lead_time_days > 0 && (
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Lead Time:</span>
                              <span>{spec.lead_time_days} days</span>
                            </div>
                          )}
                        </div>
                        
                        {spec.approval_notes && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md">
                            <div className="text-sm font-medium text-green-700 mb-1">Approval Notes:</div>
                            <div className="text-sm text-green-600">{spec.approval_notes}</div>
                          </div>
                        )}
                        
                        {spec.rejection_reason && (
                          <div className="mt-3 p-3 bg-red-50 rounded-md">
                            <div className="text-sm font-medium text-red-700 mb-1">Rejection Reason:</div>
                            <div className="text-sm text-red-600">{spec.rejection_reason}</div>
                          </div>
                        )}
                        
                        {spec.substitution_notes && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-md">
                            <div className="text-sm font-medium text-purple-700 mb-1">Substitution Notes:</div>
                            <div className="text-sm text-purple-600">{spec.substitution_notes}</div>
                          </div>
                        )}
                        
                        {/* Scope Linking Actions */}
                        <ScopeLinkingActions
                          materialSpec={spec}
                          projectId={projectId}
                          onAction={(action) => {
                            // Refresh data after action
                            refetch();
                          }}
                        />
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Badge variant="secondary">{spec.category}</Badge>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedMaterialSpec(spec);
                              setIsFormOpen(true);
                            }}
                            disabled={!permissions.canEdit}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                        <MaterialApprovalActions 
                          materialSpec={spec} 
                          projectId={projectId}
                          onAction={(action) => {
                            // Refresh data after action
                            refetch();
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Material Specification Form */}
      <MaterialSpecForm
        projectId={projectId}
        materialSpec={selectedMaterialSpec}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedMaterialSpec(undefined);
        }}
        onSuccess={(materialSpec) => {
          // Refresh data after successful creation/update
          refetch();
        }}
      />
      </div>
    </DataStateWrapper>
  );
}