'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  X
} from 'lucide-react';

interface ScopeListTabProps {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
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
          category: item.category || 'Other'
        }))
        
        setScopeItems(transformedItems)
      }
    } catch (error) {
      console.error('Error loading scope items:', error)
    } finally {
      setLoading(false)
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
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
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'on_hold': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'not_started': return <Clock className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
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
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(item.status)}
                          <h3 className="font-semibold text-lg">{item.name}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
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
                      
                      <div className="ml-4 text-right">
                        <div className="text-sm text-gray-500 mb-1">Category</div>
                        <Badge variant="secondary">{item.category}</Badge>
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