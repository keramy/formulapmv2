/**
 * Formula PM 2.0 Scope Coordinator Component
 * Wave 2B Business Logic Implementation
 * 
 * Coordinator pattern implementation following optimized-coordinator-v1.md
 * Orchestrates scope management operations with maximum efficiency and parallel processing
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useScope, useScopeExcel, useScopeProgress } from '@/hooks/useScope'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'
import { ScopeCategory, ScopeFilters, ScopeStatus, ScopeItem } from '@/types/scope'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ScopeCoordinatorProps {
  projectId: string
  globalView?: boolean
  initialCategory?: ScopeCategory | 'all'
  userPermissions?: {
    canEdit: boolean
    canDelete: boolean
    canViewPricing: boolean
    canAssignSupplier: boolean
  }
}

interface ScopeCoordinatorState {
  selectedCategory: ScopeCategory | 'all'
  searchTerm: string
  statusFilter: ScopeStatus[]
  sortField: string
  sortDirection: 'asc' | 'desc'
  showImportDialog: boolean
  showCreateDialog: boolean
  operationInProgress: boolean
}

/**
 * Coordinator hook following optimized-coordinator-v1.md patterns
 * Manages complex scope operations through delegation and parallel processing
 */
export const useScopeCoordinator = ({ 
  projectId, 
  globalView = false,
  initialCategory = 'all',
  userPermissions
}: ScopeCoordinatorProps) => {
  // === DEPENDENCY ANALYSIS (Core Dependencies First) ===
  const { 
    canViewScope,
    canCreateScope,
    canEditScope,
    canViewPricing,
    checkPermission 
  } = usePermissions()
  
  const { toast } = useToast()

  // === STATE MANAGEMENT (Foundation) ===
  const [state, setState] = useState<ScopeCoordinatorState>({
    selectedCategory: initialCategory,
    searchTerm: '',
    statusFilter: [],
    sortField: 'item_no',
    sortDirection: 'asc',
    showImportDialog: false,
    showCreateDialog: false,
    operationInProgress: false
  })

  // === PARALLEL PROCESSING (Wave 1 - Foundation Tasks) ===
  const {
    scopeItems,
    statistics,
    loading,
    error,
    totalCount,
    categoryStats,
    fetchScopeItems,
    createScopeItem,
    updateScopeItem,
    deleteScopeItem,
    bulkUpdateScopeItems,
    filterByCategory,
    canCreate,
    canBulkEdit
  } = useScope(globalView ? undefined : projectId)

  const {
    importing,
    exporting,
    importFromExcel,
    exportToExcel,
    canImport,
    canExport
  } = useScopeExcel(projectId)

  const progressMetrics = useScopeProgress(globalView ? undefined : projectId)

  // === EFFECTIVE PERMISSIONS (Quality Gate) ===
  const effectivePermissions = userPermissions || {
    canEdit: canEditScope(),
    canDelete: canEditScope(),
    canViewPricing: canViewPricing(),
    canAssignSupplier: canEditScope()
  }

  // === FILTER COORDINATION (Wave 2 - Features) ===
  const currentFilters: ScopeFilters = {
    category: state.selectedCategory,
    status: state.statusFilter.length > 0 ? state.statusFilter : undefined,
    search_term: state.searchTerm || undefined
  }

  // === COORDINATION WORKFLOW PROTOCOL ===
  
  /**
   * WAVE 1: Foundation Operations (Execute Immediately)
   * Core data fetching with filters and sorting
   */
  const coordinateDataFetch = useCallback(() => {
    if (!canViewScope()) return

    fetchScopeItems({
      filters: currentFilters,
      sort: {
        field: state.sortField as keyof ScopeItem,
        direction: state.sortDirection
      },
      include_dependencies: true,
      include_assignments: true
    })
  }, [state.selectedCategory, state.searchTerm, state.statusFilter, state.sortField, state.sortDirection, fetchScopeItems, canViewScope])

  /**
   * WAVE 2: Feature Operations (Execute After Wave 1 Approval)
   * Excel operations, CRUD operations
   */
  const coordinateExcelImport = async (file: File) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      const result = await importFromExcel(file)
      
      toast({
        title: "Import Successful",
        description: `Imported ${result.successful_imports} items. ${result.failed_imports} failures.`,
      })
      
      // Refresh scope items (dependency on Wave 1)
      await coordinateDataFetch()
      setState(prev => ({ ...prev, showImportDialog: false }))
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import Excel file",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  const coordinateExcelExport = async () => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await exportToExcel(currentFilters)
      toast({
        title: "Export Successful",
        description: "Scope items exported to Excel file",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export scope data",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  /**
   * WAVE 3: Integration Operations (Execute After Wave 2 Approval)
   * CRUD operations that affect the data integrity
   */
  const coordinateItemCreation = async (itemData: any) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await createScopeItem({
        ...itemData,
        project_id: projectId
      })
      
      toast({
        title: "Item Created",
        description: "Scope item created successfully",
      })
      
      setState(prev => ({ ...prev, showCreateDialog: false }))
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create scope item",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  const coordinateItemUpdate = async (itemId: string, updates: any) => {
    try {
      await updateScopeItem(itemId, updates)
      
      toast({
        title: "Item Updated",
        description: "Scope item updated successfully",
      })
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update scope item",
        variant: "destructive"
      })
    }
  }

  const coordinateItemDeletion = async (itemId: string) => {
    try {
      await deleteScopeItem(itemId)
      
      toast({
        title: "Item Deleted",
        description: "Scope item deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "Failed to delete scope item",
        variant: "destructive"
      })
    }
  }

  const coordinateBulkUpdate = async (itemIds: string[], updates: any, updateType: string) => {
    setState(prev => ({ ...prev, operationInProgress: true }))
    
    try {
      await bulkUpdateScopeItems({
        item_ids: itemIds,
        updates,
        update_type: updateType as any
      })
      
      toast({
        title: "Bulk Update Successful",
        description: `Updated ${itemIds.length} items`,
      })
    } catch (error) {
      toast({
        title: "Bulk Update Failed",
        description: error instanceof Error ? error.message : "Failed to perform bulk update",
        variant: "destructive"
      })
    } finally {
      setState(prev => ({ ...prev, operationInProgress: false }))
    }
  }

  // === QUALITY CONTROL (Execute Wave 1 on mount and filter changes) ===
  useEffect(() => {
    coordinateDataFetch()
  }, [coordinateDataFetch])

  // === STATE UPDATE COORDINATORS ===
  const updateState = (updates: Partial<ScopeCoordinatorState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }

  const resetFilters = () => {
    setState(prev => ({
      ...prev,
      selectedCategory: 'all',
      searchTerm: '',
      statusFilter: [],
      sortField: 'item_no',
      sortDirection: 'asc'
    }))
  }

  // === COORDINATOR INTERFACE ===
  return {
    // State
    state,
    updateState,
    resetFilters,
    
    // Data
    scopeItems,
    statistics,
    loading: loading || state.operationInProgress,
    error,
    totalCount,
    categoryStats,
    progressMetrics,
    effectivePermissions,
    currentFilters,
    filteredItems: filterByCategory(state.selectedCategory),
    
    // Operations (Coordinated)
    coordinateDataFetch,
    coordinateExcelImport,
    coordinateExcelExport,
    coordinateItemCreation,
    coordinateItemUpdate,
    coordinateItemDeletion,
    coordinateBulkUpdate,
    
    // Capabilities
    canCreate,
    canBulkEdit,
    canImport,
    canExport,
    canViewScope: canViewScope(),
    
    // Excel state
    importing,
    exporting
  }
}

export type ScopeCoordinatorReturn = ReturnType<typeof useScopeCoordinator>

/**
 * Enhanced ScopeCoordinator with DataStateWrapper integration
 * This provides consistent loading states and error handling for scope operations
 */
export function ScopeCoordinatorEnhanced(props: ScopeCoordinatorProps) {
  const coordinator = useScopeCoordinator(props)

  return (
    <DataStateWrapper
      loading={coordinator.loading}
      error={coordinator.error}
      data={coordinator.scopeItems}
      onRetry={coordinator.coordinateDataFetch}
      emptyComponent={
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No scope items yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first scope item or importing from Excel.
            </p>
            {coordinator.canCreate && (
              <Button onClick={coordinator.coordinateItemCreation}>
                Create First Item
              </Button>
            )}
          </CardContent>
        </Card>
      }
    >
      {/* Render scope coordinator content here */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Scope Management</h2>
          <div className="flex gap-2">
            {coordinator.canCreate && (
              <Button onClick={coordinator.coordinateItemCreation}>
                Create Item
              </Button>
            )}
            {coordinator.canImport && (
              <Button variant="outline" onClick={() => {/* File upload logic needed */}}>
                Import Excel
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards */}
        {coordinator.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{coordinator.totalCount}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            {/* Add more statistics cards as needed */}
          </div>
        )}

        {/* Scope Items Display */}
        <div className="space-y-4">
          {coordinator.scopeItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <h3 className="font-semibold">{item.item_code || `Item ${item.item_no}`}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DataStateWrapper>
  )
}