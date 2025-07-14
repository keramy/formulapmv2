/**
 * Formula PM 2.0 Scope Items Data Table
 * Wave 2B Business Logic Implementation
 * 
 * Refactored modular data table using extracted components for better maintainability
 * Follows optimized-coordinator-v1.md patterns for component separation
 */

'use client'

import { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Construction } from 'lucide-react'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { ScopeItem, ScopeStatus } from '@/types/scope'
import { useScopeTableColumns } from './table/ScopeTableColumns'
import { ScopeBulkActions } from './table/ScopeBulkActions'

interface ScopeItemsTableProps {
  items: ScopeItem[]
  loading?: boolean
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canViewPricing: boolean
    canAssignSupplier: boolean
  }
  onUpdate: (itemId: string, updates: any) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
  onBulkUpdate?: (itemIds: string[], updates: any, updateType: string) => Promise<void>
  showBulkActions?: boolean
  onEdit?: (itemId: string) => void
}

export const ScopeItemsTable: React.FC<ScopeItemsTableProps> = ({
  items,
  loading = false,
  permissions,
  onUpdate,
  onDelete,
  onBulkUpdate,
  showBulkActions = false,
  onEdit
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Handle item selection
  const handleSelectItem = (itemId: string, selected: boolean) => {
    const newSelected = new Set(selectedItems)
    if (selected) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedItems(newSelected)
  }

  // Handle select all
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedItems(new Set(items.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  // Bulk status update
  const handleBulkStatusUpdate = async (status: ScopeStatus) => {
    if (selectedItems.size === 0 || !onBulkUpdate) return

    try {
      await onBulkUpdate(Array.from(selectedItems), { status }, 'status')
      setSelectedItems(new Set())
    } catch (error) {
      console.error('Failed to bulk update status:', error)
    }
  }

  // Get columns using the extracted hook
  const columns = useScopeTableColumns({
    permissions,
    showBulkActions,
    selectedItems,
    onSelectItem: handleSelectItem,
    onSelectAll: handleSelectAll,
    onUpdate,
    onDelete,
    onEdit,
    itemsLength: items.length
  })

  return (
    <DataStateWrapper
      loading={loading}
      error={null}
      data={items}
      emptyComponent={
        <div className="text-center py-12">
          <Construction className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No scope items</h3>
          <p className="mt-2 text-muted-foreground">
            No scope items have been added to this project yet.
          </p>
        </div>
      }
    >
      <div className="space-y-4">
      {/* Bulk Actions Bar */}
      <ScopeBulkActions
        selectedItems={selectedItems}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        onClearSelection={() => setSelectedItems(new Set())}
        loading={loading}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        searchable={false} // Search is handled in parent component
      />
      </div>
    </DataStateWrapper>
  )
}