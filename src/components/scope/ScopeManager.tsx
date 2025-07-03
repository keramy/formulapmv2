/**
 * Formula PM 2.0 Scope Management Component
 * Wave 2B Business Logic Implementation
 * 
 * Refactored scope management interface using coordinator pattern
 * Follows optimized-coordinator-v1.md for better separation of concerns
 */

'use client'

import { useState } from 'react'
import { useScopeCoordinator } from './ScopeCoordinator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  FileSpreadsheet, 
  Plus, 
  Filter, 
  Download, 
  Upload,
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  SortAsc,
  SortDesc,
  RefreshCw,
  Construction,
  Hammer,
  Zap,
  Wrench
} from 'lucide-react'
import { ScopeCategory, ScopeFilters, ScopeStatus } from '@/types/scope'
import { ScopeItemsTable } from './ScopeItemsTable'
import { ScopeItemEditor } from './ScopeItemEditor'
import { ExcelImportDialog } from './ExcelImportDialog'
import { ScopeStatisticsCards } from './ScopeStatisticsCards'

interface ScopeManagerProps {
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

const SCOPE_CATEGORIES = {
  construction: {
    label: 'Construction',
    description: 'Structural and general construction items',
    color: 'bg-blue-500',
    icon: Construction
  },
  millwork: {
    label: 'Millwork',
    description: 'Custom woodwork and cabinetry',
    color: 'bg-amber-500',
    icon: Hammer
  },
  electrical: {
    label: 'Electrical',
    description: 'Electrical systems and installations',
    color: 'bg-yellow-500',
    icon: Zap
  },
  mechanical: {
    label: 'Mechanical',
    description: 'HVAC and mechanical systems',
    color: 'bg-green-500',
    icon: Wrench
  }
}

export const ScopeManager: React.FC<ScopeManagerProps> = ({ 
  projectId, 
  globalView = false,
  initialCategory = 'all',
  userPermissions
}) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Use the coordinator pattern for scope operations
  const coordinator = useScopeCoordinator({ 
    projectId, 
    globalView, 
    initialCategory, 
    userPermissions 
  })

  if (!coordinator.canViewScope) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            You don't have permission to view scope items.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {globalView ? 'Global Scope Management' : 'Project Scope Management'}
          </h2>
          <p className="text-muted-foreground">
            {globalView 
              ? 'Manage scope items across all accessible projects' 
              : 'Manage project scope items across all categories'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => coordinator.coordinateDataFetch()}
            disabled={coordinator.loading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${coordinator.loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          {coordinator.canExport && (
            <Button
              variant="outline"
              onClick={coordinator.coordinateExcelExport}
              disabled={coordinator.exporting}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>{coordinator.exporting ? 'Exporting...' : 'Export Excel'}</span>
            </Button>
          )}
          
          {coordinator.canImport && coordinator.canCreate && (
            <Button
              variant="outline"
              onClick={() => coordinator.updateState({ showImportDialog: true })}
              disabled={coordinator.importing}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>{coordinator.importing ? 'Importing...' : 'Import Excel'}</span>
            </Button>
          )}
          
          {coordinator.canCreate && (
            <Button 
              onClick={() => coordinator.updateState({ showCreateDialog: true })}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Scope Item</span>
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <ScopeStatisticsCards 
          statistics={statistics}
          progressMetrics={progressMetrics}
          canViewFinancials={effectivePermissions.canViewPricing}
        />
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter.join(',')}
                onValueChange={(value) => setStatusFilter(value ? value.split(',') as ScopeStatus[] : [])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortField} onValueChange={setSortField}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="item_no">Item Number</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="progress_percentage">Progress</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction</label>
              <Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">
                    <div className="flex items-center space-x-2">
                      <SortAsc className="h-4 w-4" />
                      <span>Ascending</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="desc">
                    <div className="flex items-center space-x-2">
                      <SortDesc className="h-4 w-4" />
                      <span>Descending</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ScopeCategory | 'all')}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Categories ({scopeItems.length})</TabsTrigger>
          {Object.entries(SCOPE_CATEGORIES).map(([key, category]) => {
            const Icon = category.icon
            const count = categoryStats[key as ScopeCategory]?.total || 0
            return (
              <TabsTrigger key={key} value={key} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span>{category.label} ({count})</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ScopeItemsTable 
            items={filteredItems}
            loading={loading}
            permissions={effectivePermissions}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onBulkUpdate={handleBulkUpdate}
            showBulkActions={canBulkEdit}
          />
        </TabsContent>

        {Object.entries(SCOPE_CATEGORIES).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className={`p-2 rounded ${category.color} text-white`}>
                <category.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">{category.label}</h3>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </div>
            
            <ScopeItemsTable 
              items={filterByCategory(key as ScopeCategory)}
              loading={loading}
              permissions={effectivePermissions}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onBulkUpdate={handleBulkUpdate}
              showBulkActions={canBulkEdit}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialogs */}
      {showImportDialog && (
        <ExcelImportDialog
          projectId={projectId}
          onImport={handleExcelImport}
          onClose={() => setShowImportDialog(false)}
          importing={importing}
        />
      )}

      {showCreateDialog && (
        <ScopeItemEditor
          mode="create"
          projectId={projectId}
          onSave={handleCreateItem}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
    </div>
  )
}