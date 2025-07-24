/**
 * Real-time Scope List Tab - OPTIMIZATION PHASE 1.3
 * 
 * Features:
 * - Live scope item updates
 * - Real-time supplier assignments
 * - Collaborative editing indicators
 * - Instant status changes
 * - User presence for editing
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { useRealtime } from '@/contexts/RealtimeContext';
import { useAuth } from '@/hooks/useAuth';
import { 
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Building,
  Edit,
  Save,
  X,
  Zap,
  Eye,
  Edit3,
  Users
} from 'lucide-react';

interface RealtimeScopeListTabProps {
  projectId: string;
}

interface ScopeItem {
  id: string;
  name: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high';
  estimatedCost: number;
  actualCost?: number;
  assignedTo?: string;
  startDate?: string;
  endDate?: string;
  supplier?: string;
  supplierId?: string;
  category: string;
  updated_at: string;
  isBeingEdited?: boolean;
  editedBy?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  specialties: string[];
  total_payments: number;
}

export function RealtimeScopeListTab({ projectId }: RealtimeScopeListTabProps) {
  const { profile } = useAuth();
  const { 
    isConnected, 
    subscribeToProjectScope, 
    updatePresence, 
    getPresence,
    broadcastProjectUpdate 
  } = useRealtime();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);
  const [supplierTotals, setSupplierTotals] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    loadSuppliers();
    loadScopeItems();
    loadSupplierTotals();
  }, [projectId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile) return;

    // Subscribe to scope item changes
    const unsubscribeScope = subscribeToProjectScope(projectId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newItem = transformScopeItem(payload.new);
        setScopeItems(prev => [...prev, newItem]);
        setRecentUpdates(prev => [newItem.id, ...prev.slice(0, 4)]);
      } else if (payload.eventType === 'UPDATE') {
        const updatedItem = transformScopeItem(payload.new);
        setScopeItems(prev => prev.map(item => 
          item.id === updatedItem.id ? updatedItem : item
        ));
        setRecentUpdates(prev => [updatedItem.id, ...prev.slice(0, 4)]);
      } else if (payload.eventType === 'DELETE') {
        setScopeItems(prev => prev.filter(item => item.id !== payload.old.id));
      }
    });

    // Update presence
    updatePresence(projectId, 'viewing');

    // Periodic presence updates
    const presenceInterval = setInterval(() => {
      updatePresence(projectId, 'viewing');
      const presence = getPresence(projectId);
      setOnlineUsers(presence.filter(p => p.userId !== profile.id));
    }, 30000);

    return () => {
      unsubscribeScope();
      clearInterval(presenceInterval);
    };
  }, [profile, projectId, subscribeToProjectScope, updatePresence, getPresence]);

  const transformScopeItem = (item: any): ScopeItem => ({
    id: item.id,
    name: item.title || item.description,
    description: item.description,
    status: item.status,
    priority: item.priority === 1 ? 'low' : item.priority === 2 ? 'medium' : 'high',
    estimatedCost: item.total_price || 0,
    actualCost: item.actual_cost || 0,
    assignedTo: item.assignments?.[0]?.user_name || 'Unassigned',
    startDate: item.timeline_start,
    endDate: item.timeline_end,
    supplier: item.supplier?.name || '',
    supplierId: item.supplier_id,
    category: item.category || 'Other',
    updated_at: item.updated_at
  });

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadScopeItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scope?project_id=${projectId}&include_assignments=true`);
      if (response.ok) {
        const data = await response.json();
        const transformedItems = data.data.items.map(transformScopeItem);
        setScopeItems(transformedItems);
      }
    } catch (error) {
      console.error('Error loading scope items:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSupplierTotals = async () => {
    try {
      const response = await fetch(`/api/suppliers/totals?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSupplierTotals(data.data || []);
      }
    } catch (error) {
      console.error('Error loading supplier totals:', error);
    }
  };

  const handleSupplierChange = async (scopeItemId: string, supplierId: string) => {
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      
      // Optimistically update UI
      setScopeItems(prev => prev.map(item => 
        item.id === scopeItemId 
          ? { ...item, supplierId, supplier: supplier?.name || '', isBeingEdited: false }
          : item
      ));
      
      // Update presence to editing
      updatePresence(projectId, 'editing');
      
      // Make API call
      const response = await fetch(`/api/scope/${scopeItemId}/supplier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          supplier_id: supplierId || null
        })
      });

      if (response.ok) {
        setEditingSupplier(null);
        loadSupplierTotals();
        
        // Broadcast update
        broadcastProjectUpdate(projectId, {
          type: 'scope_supplier_updated',
          scopeItemId,
          supplierId,
          supplierName: supplier?.name
        });
      } else {
        // Revert optimistic update on error
        loadScopeItems();
        console.error('Failed to assign supplier');
      }
    } catch (error) {
      console.error('Error assigning supplier:', error);
      loadScopeItems();
    } finally {
      // Revert to viewing presence
      updatePresence(projectId, 'viewing');
    }
  };

  const handleEditingStart = (scopeItemId: string) => {
    setEditingSupplier(scopeItemId);
    updatePresence(projectId, 'editing');
    
    // Mark item as being edited
    setScopeItems(prev => prev.map(item => 
      item.id === scopeItemId 
        ? { ...item, isBeingEdited: true, editedBy: profile?.first_name }
        : item
    ));
  };

  const handleEditingCancel = (scopeItemId: string) => {
    setEditingSupplier(null);
    updatePresence(projectId, 'viewing');
    
    // Remove editing state
    setScopeItems(prev => prev.map(item => 
      item.id === scopeItemId 
        ? { ...item, isBeingEdited: false, editedBy: undefined }
        : item
    ));
  };

  const getSuppliersBySpecialty = (category: string) => {
    return suppliers.filter(supplier => 
      supplier.specialties.some(specialty => 
        specialty.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  };

  const getSupplierTotals = () => {
    return supplierTotals.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      totalEstimated: supplier.total_estimated,
      totalActual: supplier.total_actual,
      itemCount: supplier.item_count
    }));
  };

  const filteredItems = scopeItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Map scope status to semantic Badge variants
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'completed' as const;
      case 'in_progress': return 'in-progress' as const;
      case 'on_hold': return 'on-hold' as const;
      case 'not_started': return 'pending' as const;
      default: return 'pending' as const;
    }
  };

  // Map priority to semantic Badge variants
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high' as const;
      case 'medium': return 'priority-medium' as const;
      case 'low': return 'priority-low' as const;
      default: return 'priority-medium' as const;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-status-info" />;
      case 'on_hold': return <AlertTriangle className="w-4 h-4 text-status-warning" />;
      case 'not_started': return <Clock className="w-4 h-4 text-muted-foreground" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const totalEstimated = scopeItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = scopeItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  const currentSupplierTotals = getSupplierTotals();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
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
      {/* Real-time Status Header */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-medium">
              {isConnected ? 'Live Updates Active' : 'Offline'}
            </span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          {recentUpdates.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {recentUpdates.length} recent updates
            </Badge>
          )}
        </div>
        
        {/* Online Users */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
            <div className="flex -space-x-2">
              {onlineUsers.slice(0, 3).map((user) => (
                <Avatar key={user.userId} className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs">
                    {user.userName.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Scope Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scopeItems.length}</div>
            <div className="text-sm text-gray-600">Active scope items</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Estimated Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalEstimated.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total estimated cost</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Actual Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalActual.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Actual costs to date</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Assigned Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{currentSupplierTotals.length}</div>
            <div className="text-sm text-gray-600">Active suppliers</div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Totals */}
      {currentSupplierTotals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supplier Breakdown</CardTitle>
            <CardDescription>Payment distribution across assigned suppliers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentSupplierTotals.map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{supplier.name}</div>
                      <div className="text-sm text-gray-600">{supplier.itemCount} scope items</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">${supplier.totalEstimated.toLocaleString()}</div>
                    {supplier.totalActual > 0 && (
                      <div className="text-sm text-gray-600">${supplier.totalActual.toLocaleString()} actual</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Scope Items</CardTitle>
          <CardDescription>Real-time view of all project scope items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search scope items..."
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
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Scope Items List */}
          <div className="space-y-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No scope items found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.' 
                    : 'No scope items have been added to this project yet.'
                  }
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <Card 
                  key={item.id} 
                  className={`hover:shadow-md transition-shadow ${
                    recentUpdates.includes(item.id) ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(item.status)}
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(item.priority)}>
                            {item.priority}
                          </Badge>
                          {item.isBeingEdited && (
                            <Badge variant="secondary" className="text-xs">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Editing by {item.editedBy}
                            </Badge>
                          )}
                          {recentUpdates.includes(item.id) && (
                            <Badge variant="secondary" className="text-xs">
                              <Zap className="w-3 h-3 mr-1" />
                              Live Update
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{item.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Estimated:</span>
                            <span>${item.estimatedCost.toLocaleString()}</span>
                          </div>
                          
                          {item.actualCost && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="font-medium">Actual:</span>
                              <span className="text-green-600">${item.actualCost.toLocaleString()}</span>
                            </div>
                          )}
                          
                          {item.assignedTo && (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Assigned:</span>
                              <span>{item.assignedTo}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Supplier:</span>
                            {editingSupplier === item.id ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value={item.supplierId || ''}
                                  onValueChange={(value) => handleSupplierChange(item.id, value)}
                                >
                                  <SelectTrigger className="w-48">
                                    <SelectValue placeholder="Select supplier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="">No supplier</SelectItem>
                                    {getSuppliersBySpecialty(item.category).map((supplier) => (
                                      <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name}
                                      </SelectItem>
                                    ))}
                                    {suppliers.filter(s => !getSuppliersBySpecialty(item.category).find(gs => gs.id === s.id)).map((supplier) => (
                                      <SelectItem key={supplier.id} value={supplier.id}>
                                        {supplier.name} (Other)
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditingCancel(item.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{item.supplier || 'Not assigned'}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditingStart(item.id)}
                                  disabled={item.isBeingEdited}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {item.startDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Start:</span>
                              <span>{new Date(item.startDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {item.endDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">End:</span>
                              <span>{new Date(item.endDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-500 mb-1">Category</div>
                        <Badge variant="secondary">{item.category}</Badge>
                        <div className="text-xs text-gray-500 mt-2">
                          Updated {formatTimeAgo(item.updated_at)}
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