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
  Package,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Building,
  DollarSign,
  Calendar,
  Truck,
  FileText
} from 'lucide-react';

interface MaterialSpecsTabProps {
  projectId: string;
}

interface MaterialSpec {
  id: string;
  name: string;
  description: string;
  specification: string;
  status: 'pending' | 'ordered' | 'in_transit' | 'delivered' | 'installed' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  category: string;
  supplier: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  orderDate?: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  notes?: string;
  scopeItemId?: string;
}

export function MaterialSpecsTab({ projectId }: MaterialSpecsTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration - in real app, this would come from API
  const mockMaterialSpecs: MaterialSpec[] = [
    {
      id: '1',
      name: 'Structural Steel Beams',
      description: 'W24x76 steel beams for main structural frame',
      specification: 'ASTM A992 Grade 50, Mill finish, 40ft length',
      status: 'delivered',
      priority: 'high',
      category: 'Structural Steel',
      supplier: 'Steel Works Inc.',
      quantity: 24,
      unit: 'pieces',
      unitPrice: 1250.00,
      totalPrice: 30000.00,
      orderDate: '2024-01-15',
      expectedDelivery: '2024-02-15',
      actualDelivery: '2024-02-14',
      notes: 'Delivered one day early, all pieces inspected and approved',
      scopeItemId: '3'
    },
    {
      id: '2',
      name: 'Concrete Mix - 4000 PSI',
      description: 'High-strength concrete for foundation and structural elements',
      specification: '4000 PSI compressive strength, 6" slump, air entrained',
      status: 'ordered',
      priority: 'high',
      category: 'Concrete',
      supplier: 'City Concrete Supply',
      quantity: 150,
      unit: 'cubic yards',
      unitPrice: 120.00,
      totalPrice: 18000.00,
      orderDate: '2024-02-01',
      expectedDelivery: '2024-02-20',
      notes: 'Scheduled for continuous pour over 2 days',
      scopeItemId: '2'
    },
    {
      id: '3',
      name: 'Electrical Conduit',
      description: 'EMT conduit for electrical rough-in',
      specification: '3/4" EMT steel conduit, 10ft lengths, galvanized',
      status: 'pending',
      priority: 'medium',
      category: 'Electrical',
      supplier: 'Electric Solutions LLC',
      quantity: 200,
      unit: 'pieces',
      unitPrice: 15.50,
      totalPrice: 3100.00,
      scopeItemId: '4'
    },
    {
      id: '4',
      name: 'HVAC Ductwork',
      description: 'Galvanized steel ductwork for air distribution',
      specification: '16 gauge galvanized steel, TDC connections, insulated',
      status: 'in_transit',
      priority: 'medium',
      category: 'HVAC',
      supplier: 'Climate Control Co.',
      quantity: 500,
      unit: 'linear feet',
      unitPrice: 25.00,
      totalPrice: 12500.00,
      orderDate: '2024-01-25',
      expectedDelivery: '2024-02-25',
      notes: 'Custom fabrication required, extended lead time',
      scopeItemId: '6'
    },
    {
      id: '5',
      name: 'Plumbing Fixtures',
      description: 'Commercial grade plumbing fixtures',
      specification: 'Kohler commercial series, ADA compliant, water efficient',
      status: 'rejected',
      priority: 'low',
      category: 'Plumbing',
      supplier: 'Pro Plumbing Services',
      quantity: 25,
      unit: 'sets',
      unitPrice: 450.00,
      totalPrice: 11250.00,
      notes: 'Rejected due to specification mismatch, reorder required',
      scopeItemId: '5'
    },
    {
      id: '6',
      name: 'Reinforcement Steel',
      description: 'Rebar for concrete reinforcement',
      specification: '#5 Grade 60 rebar, 20ft lengths, epoxy coated',
      status: 'installed',
      priority: 'high',
      category: 'Concrete',
      supplier: 'Steel & Rebar Co.',
      quantity: 500,
      unit: 'pieces',
      unitPrice: 45.00,
      totalPrice: 22500.00,
      orderDate: '2024-01-10',
      expectedDelivery: '2024-01-25',
      actualDelivery: '2024-01-24',
      notes: 'Installation completed ahead of schedule',
      scopeItemId: '1'
    }
  ];

  const filteredSpecs = mockMaterialSpecs.filter(spec => {
    const matchesSearch = spec.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spec.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         spec.specification.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || spec.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || spec.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'installed': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-blue-100 text-blue-800';
      case 'in_transit': return 'bg-yellow-100 text-yellow-800';
      case 'ordered': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
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
      case 'installed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'delivered': return <Package className="w-4 h-4 text-blue-500" />;
      case 'in_transit': return <Truck className="w-4 h-4 text-yellow-500" />;
      case 'ordered': return <Clock className="w-4 h-4 text-purple-500" />;
      case 'pending': return <Clock className="w-4 h-4 text-gray-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const statusCounts = mockMaterialSpecs.reduce((acc, spec) => {
    acc[spec.status] = (acc[spec.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = mockMaterialSpecs.reduce((sum, spec) => sum + spec.totalPrice, 0);
  const categories = [...new Set(mockMaterialSpecs.map(spec => spec.category))];

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
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMaterialSpecs.length}</div>
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
            <div className="text-2xl font-bold text-green-600">{(statusCounts.delivered || 0) + (statusCounts.installed || 0)}</div>
            <div className="text-sm text-gray-600">On site</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending || 0}</div>
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
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="installed">Installed</option>
                <option value="rejected">Rejected</option>
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
            </div>
          </div>

          {/* Material Specs List */}
          <div className="space-y-4">
            {filteredSpecs.length === 0 ? (
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
              filteredSpecs.map((spec) => (
                <Card key={spec.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(spec.status)}
                          <h3 className="font-semibold text-lg">{spec.name}</h3>
                          <Badge className={getStatusColor(spec.status)}>
                            {spec.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(spec.priority)}>
                            {spec.priority}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{spec.description}</p>
                        
                        <div className="mb-3 p-3 bg-blue-50 rounded-md">
                          <div className="text-sm font-medium text-blue-900 mb-1">Specification:</div>
                          <div className="text-sm text-blue-800">{spec.specification}</div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Quantity:</span>
                            <span>{spec.quantity.toLocaleString()} {spec.unit}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Unit Price:</span>
                            <span>${spec.unitPrice.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="font-medium">Total:</span>
                            <span className="text-green-600 font-semibold">${spec.totalPrice.toLocaleString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">Supplier:</span>
                            <span>{spec.supplier}</span>
                          </div>
                          
                          {spec.orderDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Ordered:</span>
                              <span>{new Date(spec.orderDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {spec.expectedDelivery && (
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-gray-400" />
                              <span className="font-medium">Expected:</span>
                              <span>{new Date(spec.expectedDelivery).toLocaleDateString()}</span>
                            </div>
                          )}
                          
                          {spec.actualDelivery && (
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-blue-500" />
                              <span className="font-medium">Delivered:</span>
                              <span className="text-blue-600">{new Date(spec.actualDelivery).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                        
                        {spec.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                            <div className="text-sm text-gray-600">{spec.notes}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 flex flex-col gap-2">
                        <Badge variant="secondary">{spec.category}</Badge>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4" />
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