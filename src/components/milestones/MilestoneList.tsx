/**
 * Formula PM 2.0 Milestone List Component
 * V3 Phase 1 Implementation
 * 
 * Display milestones with filtering, sorting, and progress tracking
 */

'use client'

import { useState, useMemo } from 'react'
import { format, isPast, isToday, isThisWeek } from 'date-fns'
import { Milestone, MilestoneStatus, MilestoneFilters, MilestoneSortOptions, MilestonePermissions } from '@/types/milestones'
import { MilestoneCard } from './MilestoneCard'
import { MilestoneProgressBar } from './MilestoneProgressBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Plus, 
  Calendar, 
  CheckSquare, 
  X,
  LayoutGrid,
  List,
  Target,
  AlertTriangle,
  Clock,
  CheckCircle,
  Circle,
  PlayCircle,
  XCircle
} from 'lucide-react'

interface MilestoneListProps {
  milestones: Milestone[]
  loading?: boolean
  permissions: MilestonePermissions
  onCreateMilestone?: () => void
  onEditMilestone?: (milestone: Milestone) => void
  onDeleteMilestone?: (milestone: Milestone) => void
  onStatusChange?: (milestoneId: string, status: MilestoneStatus) => void
  onBulkUpdate?: (milestoneIds: string[], updates: any) => void
  initialFilters?: MilestoneFilters
  viewMode?: 'grid' | 'list'
  showBulkActions?: boolean
  showProgress?: boolean
}

// Type guard for MilestoneStatus
const isValidMilestoneStatus = (status: string): status is MilestoneStatus => {
  return ['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled'].includes(status)
}

export const MilestoneList: React.FC<MilestoneListProps> = ({
  milestones,
  loading = false,
  permissions,
  onCreateMilestone,
  onEditMilestone,
  onDeleteMilestone,
  onStatusChange,
  onBulkUpdate,
  initialFilters = {},
  viewMode: initialViewMode = 'grid',
  showBulkActions = false,
  showProgress = true
}) => {
  const [filters, setFilters] = useState<MilestoneFilters>(initialFilters)
  const [sortOptions, setSortOptions] = useState<MilestoneSortOptions>({
    field: 'target_date',
    direction: 'asc'
  })
  const [selectedMilestones, setSelectedMilestones] = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode)
  const [searchQuery, setSearchQuery] = useState(filters.search || '')

  // Filter and sort milestones
  const filteredAndSortedMilestones = useMemo(() => {
    // Add safety check for milestones array
    if (!milestones || !Array.isArray(milestones)) {
      return []
    }
    
    let filtered = milestones.filter(milestone => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const nameMatch = milestone.name.toLowerCase().includes(searchLower)
        const descriptionMatch = milestone.description?.toLowerCase().includes(searchLower) || false
        if (!nameMatch && !descriptionMatch) return false
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(milestone.status)) return false
      }

      // Date filters
      if (filters.target_date_start && milestone.target_date) {
        if (new Date(milestone.target_date) < new Date(filters.target_date_start)) return false
      }
      if (filters.target_date_end && milestone.target_date) {
        if (new Date(milestone.target_date) > new Date(filters.target_date_end)) return false
      }

      return true
    })

    // Sort milestones
    filtered.sort((a, b) => {
      const direction = sortOptions.direction === 'asc' ? 1 : -1
      
      switch (sortOptions.field) {
        case 'name':
          return direction * a.name.localeCompare(b.name)
        case 'status':
          return direction * a.status.localeCompare(b.status)
        case 'target_date':
          if (!a.target_date && !b.target_date) return 0
          if (!a.target_date) return direction
          if (!b.target_date) return -direction
          return direction * (new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
        case 'created_at':
        default:
          return direction * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
    })

    return filtered
  }, [milestones, filters, sortOptions])

  // Milestone statistics
  const statistics = useMemo(() => {
    // Add safety check for milestones array
    if (!milestones || !Array.isArray(milestones)) {
      return { overdue: 0, dueToday: 0, dueThisWeek: 0, completed: 0, upcoming: 0, inProgress: 0 }
    }
    
    const overdue = milestones.filter(m => m.target_date && isPast(new Date(m.target_date)) && m.status !== 'completed' && m.status !== 'cancelled').length
    const dueToday = milestones.filter(m => m.target_date && isToday(new Date(m.target_date))).length
    const dueThisWeek = milestones.filter(m => m.target_date && isThisWeek(new Date(m.target_date))).length
    const completed = milestones.filter(m => m.status === 'completed').length
    const upcoming = milestones.filter(m => m.status === 'upcoming').length
    const inProgress = milestones.filter(m => m.status === 'in_progress').length
    
    return { overdue, dueToday, dueThisWeek, completed, upcoming, inProgress }
  }, [milestones])

  const handleFilterChange = (key: keyof MilestoneFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilters({})
    setSearchQuery('')
  }

  const handleSelectMilestone = (milestoneId: string, selected: boolean) => {
    const newSelected = new Set(selectedMilestones)
    if (selected) {
      newSelected.add(milestoneId)
    } else {
      newSelected.delete(milestoneId)
    }
    setSelectedMilestones(newSelected)
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedMilestones(new Set(filteredAndSortedMilestones.map(m => m.id)))
    } else {
      setSelectedMilestones(new Set())
    }
  }

  const handleBulkStatusUpdate = (status: MilestoneStatus) => {
    if (selectedMilestones.size > 0 && onBulkUpdate) {
      onBulkUpdate(Array.from(selectedMilestones), { status })
      setSelectedMilestones(new Set())
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchQuery }))
  }

  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-blue-600" />
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  return (
    <DataStateWrapper
      loading={loading}
      error={null}
      data={milestones}
      emptyComponent={
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No milestones yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first milestone to track project progress.
          </p>
          {permissions.canCreate && onCreateMilestone && (
            <Button onClick={onCreateMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Create Milestone
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
      {/* Progress Bar */}
      {showProgress && milestones.length > 0 && (
        <MilestoneProgressBar
          milestones={milestones}
          variant="detailed"
          className="bg-card"
        />
      )}

      {/* Header with statistics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Milestones
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">{milestones.length} total</Badge>
            {statistics.overdue > 0 && (
              <Badge variant="destructive">{statistics.overdue} overdue</Badge>
            )}
            {statistics.dueToday > 0 && (
              <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                {statistics.dueToday} due today
              </Badge>
            )}
            {statistics.inProgress > 0 && (
              <Badge variant="outline" className="border-blue-500 text-blue-600">
                {statistics.inProgress} in progress
              </Badge>
            )}
            <Badge variant="outline">{statistics.completed} completed</Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border p-1">
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {permissions.canCreate && onCreateMilestone && (
            <Button onClick={onCreateMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Create Milestone
            </Button>
          )}
        </div>
      </div>

      {/* Search and filters */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </form>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-muted')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Select
            value={`${sortOptions.field}-${sortOptions.direction}`}
            onValueChange={(value) => {
              const [field, direction] = value.split('-') as [MilestoneSortOptions['field'], 'asc' | 'desc']
              setSortOptions({ field, direction })
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="target_date-asc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due date (earliest)
                </div>
              </SelectItem>
              <SelectItem value="target_date-desc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Due date (latest)
                </div>
              </SelectItem>
              <SelectItem value="created_at-desc">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4" />
                  Newest first
                </div>
              </SelectItem>
              <SelectItem value="created_at-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Oldest first
                </div>
              </SelectItem>
              <SelectItem value="name-asc">
                <div className="flex items-center gap-2">
                  <SortAsc className="h-4 w-4" />
                  Name A-Z
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status?.[0] || ''}
                  onValueChange={(value) => {
                    if (value && isValidMilestoneStatus(value)) {
                      handleFilterChange('status', [value])
                    } else {
                      handleFilterChange('status', [])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="upcoming">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('upcoming')}
                        Upcoming
                      </div>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('in_progress')}
                        In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value="completed">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('completed')}
                        Completed
                      </div>
                    </SelectItem>
                    <SelectItem value="overdue">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('overdue')}
                        Overdue
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <div className="flex items-center gap-2">
                        {getStatusIcon('cancelled')}
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Target date start filter */}
              <div className="space-y-2">
                <Label>Target Date From</Label>
                <Input
                  type="date"
                  value={filters.target_date_start || ''}
                  onChange={(e) => handleFilterChange('target_date_start', e.target.value)}
                />
              </div>

              {/* Target date end filter */}
              <div className="space-y-2">
                <Label>Target Date To</Label>
                <Input
                  type="date"
                  value={filters.target_date_end || ''}
                  onChange={(e) => handleFilterChange('target_date_end', e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredAndSortedMilestones.length} of {milestones.length} milestones
              </div>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {showBulkActions && selectedMilestones.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <CheckSquare className="h-4 w-4" />
          <span className="text-sm font-medium">
            {selectedMilestones.size} milestone{selectedMilestones.size === 1 ? '' : 's'} selected
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('completed')}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleBulkStatusUpdate('in_progress')}
          >
            <PlayCircle className="h-4 w-4 mr-2" />
            Mark In Progress
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedMilestones(new Set())}
          >
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
      )}

      {/* Milestone list */}
      <div className={cn(
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'space-y-2'
      )}>
        {filteredAndSortedMilestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            onEdit={onEditMilestone ? () => onEditMilestone(milestone) : undefined}
            onDelete={onDeleteMilestone ? () => onDeleteMilestone(milestone) : undefined}
            onStatusChange={onStatusChange}
            onSelect={showBulkActions ? (selected) => handleSelectMilestone(milestone.id, selected) : undefined}
            selected={selectedMilestones.has(milestone.id)}
            permissions={permissions}
            compact={viewMode === 'list'}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredAndSortedMilestones.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">
            {milestones.length === 0 ? 'No milestones yet' : 'No milestones match your filters'}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {milestones.length === 0 
              ? 'Get started by creating your first milestone for this project.'
              : 'Try adjusting your filters to see more milestones.'
            }
          </p>
          {permissions.canCreate && onCreateMilestone && milestones.length === 0 && (
            <Button onClick={onCreateMilestone} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Create First Milestone
            </Button>
          )}
        </div>
      )}
      </div>
    </DataStateWrapper>
  )
}