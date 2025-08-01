/**
 * Scope Item Card Component - PERFORMANCE OPTIMIZATION
 * 
 * Extracted from RealtimeScopeListTab for better code splitting
 * and maintainability
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import User from 'lucide-react/dist/esm/icons/user';
import Building from 'lucide-react/dist/esm/icons/building';
import Edit from 'lucide-react/dist/esm/icons/edit';
import X from 'lucide-react/dist/esm/icons/x';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';

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
  specialties: string[];
}

interface ScopeItemCardProps {
  item: ScopeItem;
  suppliers: Supplier[];
  editingSupplier: string | null;
  recentUpdates: string[];
  onSupplierChange: (itemId: string, supplierId: string) => void;
  onEditingStart: (itemId: string) => void;
  onEditingCancel: (itemId: string) => void;
}

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

export const ScopeItemCard = memo<ScopeItemCardProps>(({ 
  item, 
  suppliers, 
  editingSupplier,
  recentUpdates,
  onSupplierChange,
  onEditingStart,
  onEditingCancel
}) => {
  const getSuppliersBySpecialty = (category: string) => {
    return suppliers.filter(supplier => 
      supplier.specialties.some(specialty => 
        specialty.toLowerCase().includes(category.toLowerCase()) ||
        category.toLowerCase().includes(specialty.toLowerCase())
      )
    );
  };

  return (
    <Card 
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
                      onValueChange={(value) => onSupplierChange(item.id, value)}
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
                      onClick={() => onEditingCancel(item.id)}
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
                      onClick={() => onEditingStart(item.id)}
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
  );
});