/**
 * Bulk Scope Actions Component
 * Comprehensive bulk operations for scope items
 */

'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckSquare, 
  Square, 
  Edit, 
  Trash2, 
  Download, 
  Upload,
  Users,
  Building,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { ScopeItem, ScopeStatus, ScopeCategory } from '@/types/scope';
import { useToast } from '@/components/ui/use-toast';

interface BulkScopeActionsProps {
  selectedItems: ScopeItem[];
  onSelectionChange: (items: ScopeItem[]) => void;
  onBulkUpdate: (itemIds: string[], updates: any, updateType: string) => Promise<void>;
  onBulkDelete: (itemIds: string[]) => Promise<void>;
  onBulkExport: (itemIds: string[]) => Promise<void>;
  allItems: ScopeItem[];
  availableSuppliers: Array<{ id: string; name: string }>;
  availableUsers: Array<{ id: string; name: string }>;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresConfirmation: boolean;
  dangerous?: boolean;
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    id: 'update_status',
    name: 'Update Status',
    description: 'Change status for selected items',
    icon: Tag,
    requiresConfirmation: false
  },
  {
    id: 'assign_supplier',
    name: 'Assign Supplier',
    description: 'Assign supplier to selected items',
    icon: Building,
    requiresConfirmation: false
  },
  {
    id: 'assign_user',
    name: 'Assign User',
    description: 'Assign user to selected items',
    icon: Users,
    requiresConfirmation: false
  },
  {
    id: 'update_category',
    name: 'Update Category',
    description: 'Change category for selected items',
    icon: Tag,
    requiresConfirmation: false
  },
  {
    id: 'update_priority',
    name: 'Update Priority',
    description: 'Change priority level',
    icon: AlertTriangle,
    requiresConfirmation: false
  },
  {
    id: 'add_cost_adjustment',
    name: 'Cost Adjustment',
    description: 'Apply cost adjustments',
    icon: DollarSign,
    requiresConfirmation: true
  },
  {
    id: 'export',
    name: 'Export Selected',
    description: 'Export selected items to Excel',
    icon: Download,
    requiresConfirmation: false
  },
  {
    id: 'delete',
    name: 'Delete Items',
    description: 'Permanently delete selected items',
    icon: Trash2,
    requiresConfirmation: true,
    dangerous: true
  }
];

const STATUS_OPTIONS: { value: ScopeStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-orange-500' }
];

const CATEGORY_OPTIONS: { value: ScopeCategory; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'millwork', label: 'Millwork' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export function BulkScopeActions({
  selectedItems,
  onSelectionChange,
  onBulkUpdate,
  onBulkDelete,
  onBulkExport,
  allItems,
  availableSuppliers,
  availableUsers,
  canEdit = false,
  canDelete = false,
  canExport = false
}: BulkScopeActionsProps) {
  const { toast } = useToast();
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationData, setOperationData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Selection management
  const isAllSelected = selectedItems.length === allItems.length && allItems.length > 0;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < allItems.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(allItems);
    } else {
      onSelectionChange([]);
    }
  };

  const handleItemToggle = (item: ScopeItem, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
    }
  };

  // Bulk operations
  const executeBulkOperation = async (operationId: string) => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to perform bulk operations",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const selectedIds = selectedItems.map(item => item.id);

      switch (operationId) {
        case 'update_status':
          if (!operationData.status) {
            throw new Error('Status is required');
          }
          await onBulkUpdate(selectedIds, { status: operationData.status }, 'status');
          break;

        case 'assign_supplier':
          if (!operationData.supplier_id) {
            throw new Error('Supplier is required');
          }
          await onBulkUpdate(selectedIds, { supplier_id: operationData.supplier_id }, 'supplier');
          break;

        case 'assign_user':
          if (!operationData.assigned_to) {
            throw new Error('User is required');
          }
          await onBulkUpdate(selectedIds, { assigned_to: operationData.assigned_to }, 'assignment');
          break;

        case 'update_category':
          if (!operationData.category) {
            throw new Error('Category is required');
          }
          await onBulkUpdate(selectedIds, { category: operationData.category }, 'category');
          break;

        case 'update_priority':
          if (!operationData.priority) {
            throw new Error('Priority is required');
          }
          await onBulkUpdate(selectedIds, { priority: operationData.priority }, 'priority');
          break;

        case 'add_cost_adjustment':
          if (!operationData.cost_adjustment_type || !operationData.cost_adjustment_value) {
            throw new Error('Cost adjustment details are required');
          }
          await onBulkUpdate(selectedIds, {
            cost_adjustment_type: operationData.cost_adjustment_type,
            cost_adjustment_value: operationData.cost_adjustment_value,
            cost_adjustment_reason: operationData.cost_adjustment_reason || ''
          }, 'cost_adjustment');
          break;

        case 'export':
          await onBulkExport(selectedIds);
          break;

        case 'delete':
          await onBulkDelete(selectedIds);
          onSelectionChange([]); // Clear selection after delete
          break;

        default:
          throw new Error('Unknown operation');
      }

      setProcessingProgress(100);
      
      toast({
        title: "Operation completed",
        description: `Successfully processed ${selectedItems.length} items`,
      });

      // Reset operation state
      setSelectedOperation('');
      setOperationData({});

    } catch (error) {
      toast({
        title: "Operation failed",
        description: error instanceof Error ? error.message : "Failed to complete bulk operation",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const renderOperationForm = () => {
    switch (selectedOperation) {
      case 'update_status':
        return (
          <div>
            <Label>New Status</Label>
            <Select value={operationData.status || ''} onValueChange={(value) => setOperationData({ ...operationData, status: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${status.color}`} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'assign_supplier':
        return (
          <div>
            <Label>Supplier</Label>
            <Select value={operationData.supplier_id || ''} onValueChange={(value) => setOperationData({ ...operationData, supplier_id: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No supplier</SelectItem>
                {availableSuppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'assign_user':
        return (
          <div>
            <Label>Assign To</Label>
            <Select value={operationData.assigned_to || ''} onValueChange={(value) => setOperationData({ ...operationData, assigned_to: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {availableUsers.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'update_category':
        return (
          <div>
            <Label>Category</Label>
            <Select value={operationData.category || ''} onValueChange={(value) => setOperationData({ ...operationData, category: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'update_priority':
        return (
          <div>
            <Label>Priority</Label>
            <Select value={operationData.priority || ''} onValueChange={(value) => setOperationData({ ...operationData, priority: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'add_cost_adjustment':
        return (
          <div className="space-y-3">
            <div>
              <Label>Adjustment Type</Label>
              <Select 
                value={operationData.cost_adjustment_type || ''} 
                onValueChange={(value) => setOperationData({ ...operationData, cost_adjustment_type: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select adjustment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>
                {operationData.cost_adjustment_type === 'percentage' ? 'Percentage (%)' : 'Amount ($)'}
              </Label>
              <Input
                type="number"
                value={operationData.cost_adjustment_value || ''}
                onChange={(e) => setOperationData({ ...operationData, cost_adjustment_value: e.target.value })}
                placeholder={operationData.cost_adjustment_type === 'percentage' ? '10' : '1000'}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={operationData.cost_adjustment_reason || ''}
                onChange={(e) => setOperationData({ ...operationData, cost_adjustment_reason: e.target.value })}
                placeholder="Reason for cost adjustment..."
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedItems.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items selected</h3>
          <p className="text-muted-foreground mb-4">
            Select scope items to perform bulk operations
          </p>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-primary"
            />
            <Label className="text-sm">Select all {allItems.length} items</Label>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Bulk Actions
            <Badge variant="secondary">
              {selectedItems.length} selected
            </Badge>
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelectionChange([])}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isAllSelected}
              ref={(el) => {
                if (el && isPartiallySelected) {
                  el.indeterminate = true;
                } else if (el) {
                  el.indeterminate = false;
                }
              }}
              onCheckedChange={handleSelectAll}
            />
            <span>
              {isAllSelected ? 'All items selected' : `${selectedItems.length} of ${allItems.length} selected`}
            </span>
          </div>
          <Button variant="link" size="sm" onClick={() => onSelectionChange([])}>
            Clear selection
          </Button>
        </div>

        <Separator />

        {/* Operation Selection */}
        <div>
          <Label>Select Operation</Label>
          <Select value={selectedOperation} onValueChange={setSelectedOperation}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose bulk operation" />
            </SelectTrigger>
            <SelectContent>
              {BULK_OPERATIONS.map(operation => {
                const Icon = operation.icon;
                // Check permissions
                if (operation.id === 'delete' && !canDelete) return null;
                if (['update_status', 'assign_supplier', 'assign_user', 'update_category', 'update_priority', 'add_cost_adjustment'].includes(operation.id) && !canEdit) return null;
                if (operation.id === 'export' && !canExport) return null;

                return (
                  <SelectItem key={operation.id} value={operation.id}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${operation.dangerous ? 'text-destructive' : ''}`} />
                      <div>
                        <div className={operation.dangerous ? 'text-destructive' : ''}>{operation.name}</div>
                        <div className="text-xs text-muted-foreground">{operation.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Operation Form */}
        {selectedOperation && (
          <div className="space-y-3">
            <Separator />
            {renderOperationForm()}
          </div>
        )}

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing...</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} />
          </div>
        )}

        {/* Action Buttons */}
        {selectedOperation && (
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedOperation('');
                setOperationData({});
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            
            {BULK_OPERATIONS.find(op => op.id === selectedOperation)?.requiresConfirmation ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant={BULK_OPERATIONS.find(op => op.id === selectedOperation)?.dangerous ? "destructive" : "default"}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Execute Operation
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bulk Operation</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will affect {selectedItems.length} items. 
                      {BULK_OPERATIONS.find(op => op.id === selectedOperation)?.dangerous && (
                        <strong className="text-destructive"> This action cannot be undone.</strong>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => executeBulkOperation(selectedOperation)}>
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button 
                onClick={() => executeBulkOperation(selectedOperation)}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Execute Operation
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}