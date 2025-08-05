/**
 * Formula PM 2.0 Scope Coordinator Component
 * Wave 2B Business Logic Implementation
 * 
 * Coordinator pattern implementation following optimized-coordinator-v1.md
 * Orchestrates scope management operations with maximum efficiency and parallel processing
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useScope, useScopeExcel, useScopeProgress } from '@/hooks/useScope'
import { usePermissions } from '@/hooks/usePermissions'
import { useToast } from '@/components/ui/use-toast'
import { ScopeCategory, ScopeFilters, ScopeStatus, ScopeItem } from '@/types/scope'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScopeItemModal } from './ScopeItemModal'
import { ExcelImportDialog } from './ExcelImportDialog'
import { 
  Plus, 
  Upload, 
  Bell, 
  CheckSquare, 
  RefreshCw
} from 'lucide-react'

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
 * Enhanced ScopeCoordinator with integrated advanced features
 * Provides comprehensive scope management with filtering, bulk actions, and notifications
 */
export function ScopeCoordinatorEnhanced(props: ScopeCoordinatorProps) {
  const coordinator = useScopeCoordinator(props)
  const [selectedItems, setSelectedItems] = useState<ScopeItem[]>([])
  const [conflicts, setConflicts] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showExcelImport, setShowExcelImport] = useState(false)

  // Import required components
  const AdvancedScopeFilters = dynamic(() => import('./filters/AdvancedScopeFilters').then(mod => ({ default: mod.AdvancedScopeFilters })), {
    loading: () => <div className="h-12 bg-muted animate-pulse rounded" />
  })

  const BulkScopeActions = dynamic(() => import('./bulk/BulkScopeActions').then(mod => ({ default: mod.BulkScopeActions })), {
    loading: () => <div className="h-32 bg-muted animate-pulse rounded" />
  })

  const ConflictResolution = dynamic(() => import('./conflicts/ConflictResolution').then(mod => ({ default: mod.ConflictResolution })), {
    loading: () => <div className="h-24 bg-muted animate-pulse rounded" />
  })

  const ScopeNotifications = dynamic(() => import('./notifications/ScopeNotifications').then(mod => ({ default: mod.ScopeNotifications })), {
    loading: () => <div className="h-48 bg-muted animate-pulse rounded" />
  })

  // Mock data for development - replace with real API calls
  const availableSuppliers = [
    { id: '1', name: 'ABC Construction' },
    { id: '2', name: 'XYZ Electrical' },
    { id: '3', name: 'Quality Millwork' }
  ]

  const availableUsers = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Sarah Johnson' },
    { id: '3', name: 'Mike Davis' }
  ]

  const availableProjects = [
    { id: props.projectId || '1', name: 'Current Project' }
  ]

  const handleBulkUpdate = async (itemIds: string[], updates: any, updateType: string) => {
    return coordinator.coordinateBulkUpdate(itemIds, updates, updateType)
  }

  const handleBulkDelete = async (itemIds: string[]) => {
    for (const itemId of itemIds) {
      await coordinator.coordinateItemDeletion(itemId)
    }
  }

  const handleBulkExport = async (itemIds: string[]) => {
    return coordinator.coordinateExcelExport()
  }

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
              <ScopeItemModal onSubmit={coordinator.coordinateItemCreation}>
                <Button>
                  Create First Item
                </Button>
              </ScopeItemModal>
            )}
          </CardContent>
        </Card>
      }
    >
      <div className="space-y-6">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Scope Management</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </Button>
            {coordinator.canCreate && (
              <ScopeItemModal onSubmit={coordinator.coordinateItemCreation}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Item
                </Button>
              </ScopeItemModal>
            )}
            {coordinator.canImport && (
              <Button variant="outline" onClick={() => setShowExcelImport(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Import Excel
              </Button>
            )}
          </div>
        </div>

        {/* Notifications Panel */}
        {showNotifications && (
          <ScopeNotifications 
            projectId={props.projectId}
            maxNotifications={20}
            showSettings={true}
          />
        )}

        {/* Conflict Resolution */}
        {conflicts.length > 0 && (
          <ConflictResolution
            conflicts={conflicts}
            onResolveConflict={async () => {}}
            onRefreshConflicts={async () => {}}
            onDismissConflict={async () => {}}
          />
        )}

        {/* Advanced Filters */}
        <AdvancedScopeFilters
          filters={coordinator.currentFilters}
          onFiltersChange={(filters) => {
            coordinator.updateState({ searchTerm: filters.search_term || '' })
            coordinator.coordinateDataFetch()
          }}
          onReset={() => {
            coordinator.resetFilters()
            coordinator.coordinateDataFetch()
          }}
          availableSuppliers={availableSuppliers}
          availableUsers={availableUsers}
          availableProjects={availableProjects}
          showProjectFilter={props.globalView}
        />

        {/* Statistics Cards */}
        {coordinator.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{coordinator.totalCount}</div>
                <div className="text-sm text-muted-foreground">Total Items</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {coordinator.statistics.total_estimated_cost ? 
                    `$${coordinator.statistics.total_estimated_cost.toLocaleString()}` : '$0'
                  }
                </div>
                <div className="text-sm text-muted-foreground">Estimated Cost</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {coordinator.statistics.completion_percentage || 0}%
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {selectedItems.length}
                </div>
                <div className="text-sm text-muted-foreground">Selected</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <BulkScopeActions
            selectedItems={selectedItems}
            onSelectionChange={setSelectedItems}
            onBulkUpdate={handleBulkUpdate}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
            allItems={coordinator.scopeItems}
            availableSuppliers={availableSuppliers}
            availableUsers={availableUsers}
            canEdit={coordinator.effectivePermissions.canEdit}
            canDelete={coordinator.effectivePermissions.canDelete}
            canExport={coordinator.canExport}
          />
        )}

        {/* Scope Items Table/List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Scope Items ({coordinator.totalCount})</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Bulk Actions
                </Button>
                <Button variant="outline" size="sm" onClick={coordinator.coordinateDataFetch}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coordinator.scopeItems.map((item) => {
                const isSelected = selectedItems.some(selected => selected.id === item.id)
                
                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedItems(prev => prev.filter(selected => selected.id !== item.id))
                      } else {
                        setSelectedItems(prev => [...prev, item])
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // Handled by card click
                            className="rounded"
                          />
                          <div>
                            <h3 className="font-semibold">
                              {item.item_code || `Item ${item.item_no}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.status}</Badge>
                          <Badge variant="secondary">{item.category}</Badge>
                          {item.estimated_cost && (
                            <span className="text-sm text-muted-foreground">
                              ${item.estimated_cost.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Excel Import Dialog */}
        {showExcelImport && (
          <ExcelImportDialog
            projectId={props.projectId || ''}
            onImport={coordinator.coordinateExcelImport}
            onClose={() => setShowExcelImport(false)}
            importing={coordinator.importing}
          />
        )}
      </div>
    </DataStateWrapper>
  )
}