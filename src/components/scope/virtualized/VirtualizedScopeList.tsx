/**
 * Virtualized Scope List Component
 * High-performance list for handling large datasets
 */

'use client';

import { useMemo, useCallback, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Edit, 
  Eye, 
  Trash2, 
  User, 
  Building, 
  DollarSign,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { ScopeItem } from '@/types/scope';
import { formatDistanceToNow } from 'date-fns';

interface VirtualizedScopeListProps {
  items: ScopeItem[];
  selectedItems: ScopeItem[];
  onSelectionChange: (items: ScopeItem[]) => void;
  onItemClick?: (item: ScopeItem) => void;
  onEditItem?: (item: ScopeItem) => void;
  onDeleteItem?: (item: ScopeItem) => void;
  height?: number;
  itemHeight?: number;
  showSelection?: boolean;
  showActions?: boolean;
  className?: string;
}

interface ItemData {
  items: ScopeItem[];
  selectedItems: ScopeItem[];
  onSelectionChange: (items: ScopeItem[]) => void;
  onItemClick?: (item: ScopeItem) => void;
  onEditItem?: (item: ScopeItem) => void;
  onDeleteItem?: (item: ScopeItem) => void;
  showSelection: boolean;
  showActions: boolean;
}

const STATUS_COLORS = {
  not_started: 'bg-gray-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  on_hold: 'bg-yellow-500',
  cancelled: 'bg-red-500',
  blocked: 'bg-orange-500'
};

const PRIORITY_COLORS = {
  low: 'text-gray-600',
  medium: 'text-blue-600',
  high: 'text-red-600'
};

const CATEGORY_ICONS = {
  construction: '🏗️',
  millwork: '🪵',
  electrical: '⚡',
  mechanical: '⚙️'
};

// Memoized row component for performance
const ScopeItemRow = ({ index, style, data }: { 
  index: number; 
  style: React.CSSProperties; 
  data: ItemData; 
}) => {
  const {
    items,
    selectedItems,
    onSelectionChange,
    onItemClick,
    onEditItem,
    onDeleteItem,
    showSelection,
    showActions
  } = data;

  const item = items[index];
  const isSelected = selectedItems.some(selected => selected.id === item.id);

  const handleSelectionToggle = (checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selected => selected.id !== item.id));
    }
  };

  const handleItemClick = () => {
    onItemClick?.(item);
  };

  return (
    <div style={style} className="px-4">
      <Card 
        className={`mb-2 cursor-pointer transition-all hover:shadow-sm ${
          isSelected ? 'border-blue-500 bg-blue-50' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Selection Checkbox */}
            {showSelection && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleSelectionToggle}
                onClick={(e) => e.stopPropagation()}
              />
            )}

            {/* Category Icon */}
            <div className="text-lg" title={item.category}>
              {CATEGORY_ICONS[item.category] || '📋'}
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0" onClick={handleItemClick}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">
                    {item.item_code || `Item ${item.item_no}`}
                  </h3>
                  <Badge 
                    variant="outline" 
                    className={`${STATUS_COLORS[item.status]} text-white text-xs`}
                  >
                    {item.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                  {item.priority && (
                    <span className={`text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                      {item.priority.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Cost */}
                {item.estimated_cost && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    ${item.estimated_cost.toLocaleString()}
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {item.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  {/* Assignment */}
                  {item.assigned_to && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">
                        {Array.isArray(item.assigned_to) 
                          ? item.assigned_to.join(', ') 
                          : item.assigned_to
                        }
                      </span>
                    </div>
                  )}

                  {/* Supplier */}
                  {item.supplier_name && (
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      <span className="truncate max-w-[100px]">{item.supplier_name}</span>
                    </div>
                  )}

                  {/* Due Date */}
                  {item.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(item.due_date), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                {item.progress_percentage !== undefined && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${item.progress_percentage}%` }}
                      />
                    </div>
                    <span className="text-xs">{item.progress_percentage}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onItemClick?.(item);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditItem?.(item);
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem?.(item);
                  }}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export function VirtualizedScopeList({
  items,
  selectedItems,
  onSelectionChange,
  onItemClick,
  onEditItem,
  onDeleteItem,
  height = 600,
  itemHeight = 120,
  showSelection = true,
  showActions = true,
  className = ''
}: VirtualizedScopeListProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Memoize item data to prevent unnecessary re-renders
  const itemData: ItemData = useMemo(() => ({
    items,
    selectedItems,
    onSelectionChange,
    onItemClick,
    onEditItem,
    onDeleteItem,
    showSelection,
    showActions
  }), [
    items,
    selectedItems,
    onSelectionChange,
    onItemClick,
    onEditItem,
    onDeleteItem,
    showSelection,
    showActions
  ]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      // Implement keyboard navigation if needed
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      // Implement item selection/activation
    }
  }, []);

  if (items.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No scope items found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or create a new scope item.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Header with item count */}
      <div className="px-4 py-2 bg-muted/30 border-b">
        <div className="flex items-center justify-between text-sm">
          <span>{items.length} items</span>
          {selectedItems.length > 0 && (
            <span className="text-blue-600 font-medium">
              {selectedItems.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Virtualized List */}
      <List
        height={height}
        itemCount={items.length}
        itemSize={itemHeight}
        itemData={itemData}
        onKeyDown={handleKeyDown}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 #f1f5f9'
        }}
      >
        {ScopeItemRow}
      </List>
    </div>
  );
}

// Hook for managing virtualized list state
export function useVirtualizedScopeList(
  items: ScopeItem[],
  initialSelection: ScopeItem[] = []
) {
  const [selectedItems, setSelectedItems] = useState<ScopeItem[]>(initialSelection);

  const selectAll = useCallback(() => {
    setSelectedItems(items);
  }, [items]);

  const selectNone = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleSelection = useCallback((item: ScopeItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < items.length;

  return {
    selectedItems,
    setSelectedItems,
    selectAll,
    selectNone,
    toggleSelection,
    isAllSelected,
    isPartiallySelected
  };
}