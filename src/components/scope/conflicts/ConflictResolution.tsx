/**
 * Conflict Resolution System
 * Handles simultaneous edit conflicts with merge resolution UI
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  AlertTriangle, 
  Users, 
  Clock, 
  RefreshCw, 
  Check, 
  X,
  ArrowRight,
  GitMerge,
  Eye,
  User
} from 'lucide-react';
import { ScopeItem } from '@/types/scope';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface ConflictInfo {
  id: string;
  item_id: string;
  current_version: ScopeItem;
  incoming_version: ScopeItem;
  conflicted_fields: string[];
  edited_by: {
    id: string;
    name: string;
    avatar?: string;
  };
  last_modified: string;
  conflict_type: 'concurrent_edit' | 'version_mismatch' | 'field_lock';
}

interface ConflictResolutionProps {
  conflicts: ConflictInfo[];
  onResolveConflict: (conflictId: string, resolution: 'accept_current' | 'accept_incoming' | 'merge', mergedData?: Partial<ScopeItem>) => Promise<void>;
  onRefreshConflicts: () => Promise<void>;
  onDismissConflict: (conflictId: string) => Promise<void>;
}

interface FieldConflict {
  field: string;
  currentValue: any;
  incomingValue: any;
  selectedValue: 'current' | 'incoming' | 'custom';
  customValue?: any;
}

const FIELD_LABELS: Record<string, string> = {
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  estimated_cost: 'Estimated Cost',
  actual_cost: 'Actual Cost',
  assigned_to: 'Assigned To',
  supplier_id: 'Supplier',
  due_date: 'Due Date',
  notes: 'Notes',
  category: 'Category'
};

export function ConflictResolution({
  conflicts,
  onResolveConflict,
  onRefreshConflicts,
  onDismissConflict
}: ConflictResolutionProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [selectedConflict, setSelectedConflict] = useState<ConflictInfo | null>(null);
  const [fieldResolutions, setFieldResolutions] = useState<Record<string, FieldConflict>>({});
  const [isResolving, setIsResolving] = useState(false);

  // Initialize field resolutions when conflict is selected
  useEffect(() => {
    if (selectedConflict) {
      const resolutions: Record<string, FieldConflict> = {};
      
      selectedConflict.conflicted_fields.forEach(field => {
        resolutions[field] = {
          field,
          currentValue: selectedConflict.current_version[field as keyof ScopeItem],
          incomingValue: selectedConflict.incoming_version[field as keyof ScopeItem],
          selectedValue: 'current' // Default to current version
        };
      });
      
      setFieldResolutions(resolutions);
    }
  }, [selectedConflict]);

  const handleFieldResolution = (field: string, resolution: 'current' | 'incoming' | 'custom', customValue?: any) => {
    setFieldResolutions(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        selectedValue: resolution,
        customValue: resolution === 'custom' ? customValue : undefined
      }
    }));
  };

  const executeResolution = async (type: 'accept_current' | 'accept_incoming' | 'merge') => {
    if (!selectedConflict) return;

    setIsResolving(true);
    try {
      let mergedData: Partial<ScopeItem> | undefined;

      if (type === 'merge') {
        mergedData = {};
        Object.values(fieldResolutions).forEach(resolution => {
          if (resolution.selectedValue === 'current') {
            mergedData![resolution.field as keyof ScopeItem] = resolution.currentValue;
          } else if (resolution.selectedValue === 'incoming') {
            mergedData![resolution.field as keyof ScopeItem] = resolution.incomingValue;
          } else if (resolution.selectedValue === 'custom') {
            mergedData![resolution.field as keyof ScopeItem] = resolution.customValue;
          }
        });
      }

      await onResolveConflict(selectedConflict.id, type, mergedData);
      
      toast({
        title: "Conflict resolved",
        description: `Successfully resolved conflict for scope item`,
      });

      setSelectedConflict(null);
      setFieldResolutions({});
    } catch (error) {
      toast({
        title: "Resolution failed",
        description: error instanceof Error ? error.message : "Failed to resolve conflict",
        variant: "destructive"
      });
    } finally {
      setIsResolving(false);
    }
  };

  const formatValue = (value: any, field: string): string => {
    if (value === null || value === undefined) return 'Not set';
    
    switch (field) {
      case 'estimated_cost':
      case 'actual_cost':
        return typeof value === 'number' ? `$${value.toLocaleString()}` : value.toString();
      case 'due_date':
        return value ? new Date(value).toLocaleDateString() : 'Not set';
      case 'status':
        return value.replace('_', ' ').toUpperCase();
      case 'priority':
        return value.charAt(0).toUpperCase() + value.slice(1);
      default:
        return value.toString();
    }
  };

  const getConflictTypeColor = (type: ConflictInfo['conflict_type']) => {
    switch (type) {
      case 'concurrent_edit': return 'bg-orange-500';
      case 'version_mismatch': return 'bg-red-500';
      case 'field_lock': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getConflictTypeLabel = (type: ConflictInfo['conflict_type']) => {
    switch (type) {
      case 'concurrent_edit': return 'Concurrent Edit';
      case 'version_mismatch': return 'Version Mismatch';
      case 'field_lock': return 'Field Lock';
      default: return 'Unknown';
    }
  };

  if (conflicts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Check className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conflicts detected</h3>
          <p className="text-muted-foreground mb-4">
            All scope items are synchronized without conflicts
          </p>
          <Button variant="outline" onClick={onRefreshConflicts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Check for conflicts
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Conflicts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Edit Conflicts Detected
            <Badge variant="destructive">
              {conflicts.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Multiple users have edited the same scope items. Please resolve these conflicts to continue.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {conflicts.map(conflict => (
              <Card key={conflict.id} className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">
                          {conflict.current_version.item_code || `Item ${conflict.current_version.item_no}`}
                        </h4>
                        <Badge variant="outline" className={getConflictTypeColor(conflict.conflict_type)}>
                          {getConflictTypeLabel(conflict.conflict_type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {conflict.current_version.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {conflict.edited_by.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(conflict.last_modified), { addSuffix: true })}
                        </div>
                        <div className="flex items-center gap-1">
                          <GitMerge className="h-3 w-3" />
                          {conflict.conflicted_fields.length} fields
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedConflict(conflict)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Resolve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Resolution Dialog */}
      {selectedConflict && (
        <AlertDialog open={!!selectedConflict} onOpenChange={() => setSelectedConflict(null)}>
          <AlertDialogContent className="max-w-4xl max-h-[90vh]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <GitMerge className="h-5 w-5" />
                Resolve Conflict: {selectedConflict.current_version.item_code || `Item ${selectedConflict.current_version.item_no}`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Choose how to resolve conflicts between your version and {selectedConflict.edited_by.name}'s changes.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-4">
                {Object.values(fieldResolutions).map(resolution => (
                  <Card key={resolution.field}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">
                        {FIELD_LABELS[resolution.field] || resolution.field}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Current Version */}
                        <div 
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            resolution.selectedValue === 'current' 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleFieldResolution(resolution.field, 'current')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Your Version</span>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              resolution.selectedValue === 'current' 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-300'
                            }`}>
                              {resolution.selectedValue === 'current' && (
                                <Check className="w-2 h-2 text-white m-0.5" />
                              )}
                            </div>
                          </div>
                          <div className="text-sm">
                            {formatValue(resolution.currentValue, resolution.field)}
                          </div>
                        </div>

                        {/* Incoming Version */}
                        <div 
                          className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            resolution.selectedValue === 'incoming' 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleFieldResolution(resolution.field, 'incoming')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{selectedConflict.edited_by.name}'s Version</span>
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              resolution.selectedValue === 'incoming' 
                                ? 'border-green-500 bg-green-500' 
                                : 'border-gray-300'
                            }`}>
                              {resolution.selectedValue === 'incoming' && (
                                <Check className="w-2 h-2 text-white m-0.5" />
                              )}
                            </div>
                          </div>
                          <div className="text-sm">
                            {formatValue(resolution.incomingValue, resolution.field)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <AlertDialogFooter className="gap-2">
              <div className="flex flex-1 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => executeResolution('accept_current')}
                  disabled={isResolving}
                  className="flex-1"
                >
                  Keep My Version
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => executeResolution('accept_incoming')}
                  disabled={isResolving}
                  className="flex-1"
                >
                  Accept Their Version
                </Button>
              </div>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => executeResolution('merge')}
                disabled={isResolving}
              >
                {isResolving ? 'Resolving...' : 'Merge Selected'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}