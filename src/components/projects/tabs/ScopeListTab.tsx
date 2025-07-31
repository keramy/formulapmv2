'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DataStateWrapper } from '@/components/ui/loading-states';
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
  Grid,
  List,
  MapPin,
  FileText
} from 'lucide-react';

interface ScopeListTabProps {
  projectId: string;
}

interface ScopeItem {
  id: string;
  item_no: number;
  item_name: string;
  name: string; // Keep for backward compatibility
  description: string;
  specification: string;
  location: string;
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
  update_notes?: string;
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

export function ScopeListTab({ projectId }: ScopeListTabProps) {
  const { getAccessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [editingField, setEditingField] = useState<{itemId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [editingSupplier, setEditingSupplier] = useState<string | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeItem[]>([]);

  // Load suppliers and scope items on component mount
  useEffect(() => {
    loadSuppliers();
    loadScopeItems();
    loadSupplierTotals();
  }, [projectId]);

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
      setLoading(true)
      const response = await fetch(`/api/scope?project_id=${projectId}&include_assignments=true`)
      if (response.ok) {
        const data = await response.json()
        
        // Transform scope API data to component format
        const transformedItems = data.data.items.map((item: any) => ({
          id: item.id,
          item_no: item.item_no || 0,
          item_name: item.item_name || item.title || '',
          name: item.title || item.item_name || item.description, // Backward compatibility
          description: item.description,
          specification: item.specification || '',
          location: item.location || '',
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
          update_notes: item.update_notes || ''
        }))
        
        setScopeItems(transformedItems)
      }
    } catch (error) {
      console.error('Error loading scope items:', error)
    } finally {
      setLoading(false)
    }
  };

  const handleFieldEdit = async (itemId: string, field: string, value: string) => {
    try {
      const response = await fetch(`/api/scope/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          [field]: value
        })
      })

      if (response.ok) {
        // Update local state
        setScopeItems(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, [field]: value }
            : item
        ));
        setEditingField(null);
        setEditValue('');
      } else {
        console.error('Failed to update field')
      }
    } catch (error) {
      console.error('Error updating field:', error)
    }
  };

  const startEdit = (itemId: string, field: string, currentValue: string) => {
    setEditingField({ itemId, field });
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (editingField) {
      handleFieldEdit(editingField.itemId, editingField.field, editValue);
    }
  };

  const handleSupplierChange = async (scopeItemId: string, supplierId: string) => {
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      
      // Make API call to assign supplier
      const response = await fetch(`/api/scope/${scopeItemId}/supplier`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAccessToken()}`
        },
        body: JSON.stringify({
          supplier_id: supplierId || null
        })
      })

      if (response.ok) {
        // Update local state on success
        setScopeItems(prev => prev.map(item => 
          item.id === scopeItemId 
            ? { ...item, supplierId, supplier: supplier?.name || '' }
            : item
        ));
        setEditingSupplier(null);
        
        // Reload supplier totals to reflect changes
        loadSupplierTotals();
      } else {
        console.error('Failed to assign supplier')
        // Could add error notification here
      }
    } catch (error) {
      console.error('Error assigning supplier:', error)
    }
  };

  const getSuppliersBySpecialty = (category: string) => {
    return suppliers.filter(supplier => 
      supplier.specialties.some(specialty => 
        specialty.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  };

  const [supplierTotals, setSupplierTotals] = useState<any[]>([]);

  const loadSupplierTotals = async () => {
    try {
      const response = await fetch(`/api/suppliers/totals?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setSupplierTotals(data.data || [])
      }
    } catch (error) {
      console.error('Error loading supplier totals:', error)
    }
  }

  const getSupplierTotals = () => {
    // Return the state instead of calculating locally
    return supplierTotals.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      totalEstimated: supplier.total_estimated,
      totalActual: supplier.total_actual,
      itemCount: supplier.item_count
    }));
  };

  const filteredItems = scopeItems.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.item_no.toString().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesLocation = filterLocation === 'all' || item.location.toLowerCase().includes(filterLocation.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesStatus && matchesLocation && matchesCategory;
  });

  // Get unique locations and categories for filter dropdowns
  const uniqueLocations = [...new Set(scopeItems.map(item => item.location).filter(Boolean))];
  const uniqueCategories = [...new Set(scopeItems.map(item => item.category).filter(Boolean))];

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
          <CardDescription>Detailed breakdown of all project scope items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by item name, description, specification, location, or item number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-32"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
              
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-32"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-32"
              >
                <option value="all">All Locations</option>
                {uniqueLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="px-3"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="px-3"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scope Items Display */}
          <div className={viewMode === 'cards' ? 'space-y-4' : ''}>
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
            ) : viewMode === 'cards' ? (
              filteredItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-bold bg-blue-50">
                            #{String(item.item_no).padStart(3, '0')}
                          </Badge>
                          {getStatusIcon(item.status)}
                          <h3 className="font-semibold text-lg">{item.item_name}</h3>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={getPriorityBadgeVariant(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 mb-3">
                          <p className="text-gray-600">{item.description}</p>
                          {item.specification && (
                            <div className="text-sm">
                              <span className="font-medium text-gray-700">Specification:</span>
                              <p className="text-gray-600 mt-1">{item.specification}</p>
                            </div>
                          )}
                          {item.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700">Location:</span>
                              <Badge variant="secondary">{item.location}</Badge>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Estimated:</span>
                            <span>${item.estimatedCost.toLocaleString()}</span>
                          </div>
                          
                          {item.actualCost && item.actualCost > 0 && (
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
                                  onClick={() => setEditingSupplier(null)}
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
                                  onClick={() => setEditingSupplier(item.id)}
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
                      
                      <div className="ml-4 text-right space-y-2">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">Category</div>
                          <Badge variant="secondary">{item.category}</Badge>
                        </div>
                        {item.update_notes && (
                          <div className="max-w-48">
                            <div className="text-sm text-gray-500 mb-1">Latest Update</div>
                            <p className="text-xs text-gray-600 bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                              {item.update_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              /* Table View */
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium text-gray-700">#</th>
                      <th className="text-left p-3 font-medium text-gray-700">Item Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Location</th>
                      <th className="text-left p-3 font-medium text-gray-700">Category</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      <th className="text-left p-3 font-medium text-gray-700">Specification</th>
                      <th className="text-left p-3 font-medium text-gray-700">Estimated Cost</th>
                      <th className="text-left p-3 font-medium text-gray-700">Assigned To</th>
                      <th className="text-left p-3 font-medium text-gray-700">Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50 transition-colors group">
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs font-bold bg-blue-50">
                            #{String(item.item_no).padStart(3, '0')}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {editingField?.itemId === item.id && editingField?.field === 'item_name' ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="text-sm"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveEdit();
                                    if (e.key === 'Escape') cancelEdit();
                                  }}
                                  autoFocus
                                />
                                <Button size="sm" onClick={saveEdit}>
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ) : (
                              <div 
                                className="font-medium cursor-pointer hover:bg-gray-100 p-1 rounded"
                                onClick={() => startEdit(item.id, 'item_name', item.item_name)}
                              >
                                {item.item_name}
                                <Edit className="w-3 h-3 inline ml-1 opacity-0 group-hover:opacity-100" />
                              </div>
                            )}
                            <div className="text-sm text-gray-600 truncate max-w-xs">{item.description}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          {editingField?.itemId === item.id && editingField?.field === 'location' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded"
                              onClick={() => startEdit(item.id, 'location', item.location)}
                            >
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{item.location || 'Click to add'}</span>
                              <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{item.category}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <Badge variant={getStatusBadgeVariant(item.status)}>
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          {editingField?.itemId === item.id && editingField?.field === 'specification' ? (
                            <div className="flex items-center gap-1">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEdit();
                                  if (e.key === 'Escape') cancelEdit();
                                }}
                                autoFocus
                              />
                              <Button size="sm" onClick={saveEdit}>
                                <Save className="w-3 h-3" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="flex items-center gap-1 max-w-xs cursor-pointer hover:bg-gray-100 p-1 rounded"
                              onClick={() => startEdit(item.id, 'specification', item.specification)}
                            >
                              <FileText className="w-3 h-3 text-gray-400" />
                              <span className="text-sm truncate">{item.specification || 'Click to add'}</span>
                              <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm font-medium">${item.estimatedCost.toLocaleString()}</div>
                          {item.actualCost && item.actualCost > 0 && (
                            <div className="text-xs text-green-600">${item.actualCost.toLocaleString()} actual</div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{item.assignedTo}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {editingSupplier === item.id ? (
                            <div className="flex items-center gap-2">
                              <Select
                                value={item.supplierId || ''}
                                onValueChange={(value) => handleSupplierChange(item.id, value)}
                              >
                                <SelectTrigger className="w-36">
                                  <SelectValue placeholder="Select supplier" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">No supplier</SelectItem>
                                  {getSuppliersBySpecialty(item.category).map((supplier) => (
                                    <SelectItem key={supplier.id} value={supplier.id}>
                                      {supplier.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSupplier(null)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                <span className="text-sm">{item.supplier || 'Not assigned'}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingSupplier(item.id)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}