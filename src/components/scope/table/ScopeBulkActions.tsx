/**
 * Formula PM 2.0 Scope Bulk Actions Component
 * Wave 2B Business Logic Implementation
 * 
 * Extracted bulk actions functionality for better modularization
 */

'use client'

import { Button } from '@/components/ui/button'
import { ScopeStatus } from '@/types/scope'

interface ScopeBulkActionsProps {
  selectedItems: Set<string>
  onBulkStatusUpdate: (status: ScopeStatus) => Promise<void>
  onClearSelection: () => void
  loading?: boolean
}

export const ScopeBulkActions: React.FC<ScopeBulkActionsProps> = ({
  selectedItems,
  onBulkStatusUpdate,
  onClearSelection,
  loading = false
}) => {
  if (selectedItems.size === 0) return null

  return (
    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium">
          {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
        </span>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Quick actions:</span>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkStatusUpdate('in_progress')}
            disabled={loading}
          >
            Mark In Progress
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkStatusUpdate('completed')}
            disabled={loading}
          >
            Mark Completed
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBulkStatusUpdate('blocked')}
            disabled={loading}
          >
            Mark Blocked
          </Button>
        </div>
      </div>
      
      <Button
        size="sm"
        variant="ghost"
        onClick={onClearSelection}
        disabled={loading}
      >
        Clear Selection
      </Button>
    </div>
  )
}