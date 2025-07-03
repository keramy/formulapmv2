/**
 * Formula PM 2.0 Scope Table Columns
 * Wave 2B Business Logic Implementation
 * 
 * Modular column definitions for scope items table
 * Extracted from large ScopeItemsTable component for better maintainability
 */

'use client'

import { useMemo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye,
  Users,
  Link,
  Calendar,
  DollarSign,
  Clock,
  Construction,
  Hammer,
  Zap,
  Wrench
} from 'lucide-react'
import { ScopeItem, ScopeStatus, ScopeCategory } from '@/types/scope'
import { format } from 'date-fns'

interface ScopeTableColumnsProps {
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canViewPricing: boolean
    canAssignSupplier: boolean
  }
  showBulkActions?: boolean
  selectedItems?: Set<string>
  onSelectItem?: (itemId: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  onUpdate?: (itemId: string, updates: any) => Promise<void>
  onDelete?: (itemId: string) => Promise<void>
  onEdit?: (itemId: string) => void
  itemsLength?: number
}

const CATEGORY_ICONS = {
  construction: Construction,
  millwork: Hammer,
  electrical: Zap,
  mechanical: Wrench
}

const CATEGORY_COLORS = {
  construction: 'bg-blue-500',
  millwork: 'bg-amber-500',
  electrical: 'bg-yellow-500',
  mechanical: 'bg-green-500'
}

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-800',
  planning: 'bg-blue-100 text-blue-800',
  materials_ordered: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-green-100 text-green-800',
  quality_check: 'bg-purple-100 text-purple-800',
  client_review: 'bg-orange-100 text-orange-800',
  completed: 'bg-emerald-100 text-emerald-800',
  blocked: 'bg-red-100 text-red-800',
  on_hold: 'bg-amber-100 text-amber-800',
  cancelled: 'bg-gray-100 text-gray-800'
}

export const useScopeTableColumns = ({
  permissions,
  showBulkActions = false,
  selectedItems = new Set(),
  onSelectItem,
  onSelectAll,
  onUpdate,
  onDelete,
  onEdit,
  itemsLength = 0
}: ScopeTableColumnsProps) => {
  
  const handleQuickStatusUpdate = async (itemId: string, status: ScopeStatus) => {
    if (onUpdate) {
      try {
        await onUpdate(itemId, { status })
      } catch (error) {
        console.error('Failed to update status:', error)
      }
    }
  }

  const columns: ColumnDef<ScopeItem>[] = useMemo(() => {
    const cols: ColumnDef<ScopeItem>[] = []

    // Selection column (if bulk actions enabled)
    if (showBulkActions && onSelectItem && onSelectAll) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={selectedItems.size === itemsLength && itemsLength > 0}
            onCheckedChange={(checked) => onSelectAll(checked as boolean)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedItems.has(row.original.id)}
            onCheckedChange={(checked) => onSelectItem(row.original.id, checked as boolean)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }

    // Item number and category
    cols.push({
      accessorKey: "item_no",
      header: "Item",
      cell: ({ row }) => {
        const item = row.original
        const CategoryIcon = CATEGORY_ICONS[item.category]
        return (
          <div className="flex items-center space-x-3">
            <div className={`p-1.5 rounded ${CATEGORY_COLORS[item.category]} text-white`}>
              <CategoryIcon className="h-3 w-3" />
            </div>
            <div>
              <div className="font-medium">#{item.item_no}</div>
              {item.item_code && (
                <div className="text-xs text-muted-foreground">{item.item_code}</div>
              )}
            </div>
          </div>
        )
      },
    })

    // Title and description
    cols.push({
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="space-y-1 max-w-xs">
            <div className="font-medium">{item.title}</div>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </div>
            {item.drawing_reference && (
              <div className="text-xs text-blue-600">
                Ref: {item.drawing_reference}
              </div>
            )}
          </div>
        )
      },
    })

    // Quantity and unit
    cols.push({
      accessorKey: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const item = row.original
        return (
          <div className="text-right">
            <div className="font-medium">{item.quantity.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{item.unit_of_measure}</div>
          </div>
        )
      },
    })

    // Pricing columns (if user has permission)
    if (permissions.canViewPricing) {
      cols.push({
        accessorKey: "unit_price",
        header: "Unit Price",
        cell: ({ row }) => {
          const unitPrice = row.getValue("unit_price") as number
          return (
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>{unitPrice.toLocaleString()}</span>
              </div>
            </div>
          )
        },
      })

      cols.push({
        accessorKey: "total_price",
        header: "Total",
        cell: ({ row }) => {
          const item = row.original
          const total = item.total_price || (item.quantity * item.unit_price)
          return (
            <div className="text-right font-medium">
              <div className="flex items-center justify-end space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>{total.toLocaleString()}</span>
              </div>
            </div>
          )
        },
      })
    }

    // Status column
    cols.push({
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as ScopeStatus
        const item = row.original
        
        if (permissions.canEdit && onUpdate) {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-auto p-0">
                  <Badge className={STATUS_COLORS[status]}>
                    {status.replace('_', ' ')}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickStatusUpdate(item.id, 'not_started')}>
                  Not Started
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickStatusUpdate(item.id, 'planning')}>
                  Planning
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickStatusUpdate(item.id, 'in_progress')}>
                  In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickStatusUpdate(item.id, 'completed')}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleQuickStatusUpdate(item.id, 'blocked')}>
                  Blocked
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleQuickStatusUpdate(item.id, 'on_hold')}>
                  On Hold
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        }

        return (
          <Badge className={STATUS_COLORS[status]}>
            {status.replace('_', ' ')}
          </Badge>
        )
      },
    })

    // Progress column
    cols.push({
      accessorKey: "progress_percentage",
      header: "Progress",
      cell: ({ row }) => {
        const progress = row.getValue("progress_percentage") as number
        return (
          <div className="space-y-2">
            <Progress value={progress} className="w-20" />
            <div className="text-xs text-center">{progress}%</div>
          </div>
        )
      },
    })

    // Timeline column
    cols.push({
      accessorKey: "timeline",
      header: "Timeline",
      cell: ({ row }) => {
        const item = row.original
        const today = new Date()
        let timelineStatus = 'on-track'
        let daysInfo = ''

        if (item.timeline_end) {
          const endDate = new Date(item.timeline_end)
          const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          
          if (item.status === 'completed') {
            timelineStatus = 'completed'
            daysInfo = 'Completed'
          } else if (daysUntilEnd < 0) {
            timelineStatus = 'overdue'
            daysInfo = `${Math.abs(daysUntilEnd)} days overdue`
          } else if (daysUntilEnd <= 3) {
            timelineStatus = 'due-soon'
            daysInfo = `${daysUntilEnd} days left`
          } else {
            daysInfo = `${daysUntilEnd} days left`
          }
        }

        const getTimelineColor = () => {
          switch (timelineStatus) {
            case 'completed': return 'text-green-600'
            case 'overdue': return 'text-red-600'
            case 'due-soon': return 'text-amber-600'
            default: return 'text-muted-foreground'
          }
        }

        return (
          <div className="space-y-1">
            {item.timeline_start && (
              <div className="text-xs text-muted-foreground">
                {format(new Date(item.timeline_start), 'MMM dd')} - 
                {item.timeline_end && format(new Date(item.timeline_end), 'MMM dd')}
              </div>
            )}
            {daysInfo && (
              <div className={`text-xs font-medium ${getTimelineColor()}`}>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{daysInfo}</span>
                </div>
              </div>
            )}
          </div>
        )
      },
    })

    // Assignments column
    cols.push({
      accessorKey: "assigned_to",
      header: "Assigned",
      cell: ({ row }) => {
        const assignedTo = row.getValue("assigned_to") as string[]
        if (!assignedTo || assignedTo.length === 0) {
          return <span className="text-muted-foreground text-sm">Unassigned</span>
        }
        return (
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span className="text-sm">{assignedTo.length}</span>
            {assignedTo.length > 1 && (
              <span className="text-xs text-muted-foreground">users</span>
            )}
          </div>
        )
      },
    })

    // Dependencies column
    cols.push({
      accessorKey: "dependencies",
      header: "Deps",
      cell: ({ row }) => {
        const dependencies = row.getValue("dependencies") as string[]
        const blocked = dependencies && dependencies.length > 0
        
        if (!blocked) return null
        
        return (
          <div className="flex items-center space-x-1 text-amber-600">
            <Link className="h-3 w-3" />
            <span className="text-xs">{dependencies.length}</span>
          </div>
        )
      },
    })

    // Priority column
    cols.push({
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as number
        const getPriorityColor = () => {
          if (priority >= 8) return 'bg-red-100 text-red-800'
          if (priority >= 5) return 'bg-yellow-100 text-yellow-800'
          return 'bg-green-100 text-green-800'
        }
        
        return (
          <Badge className={getPriorityColor()}>
            {priority}
          </Badge>
        )
      },
    })

    // Actions column
    cols.push({
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onEdit?.(item.id)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              
              {permissions.canEdit && (
                <DropdownMenuItem onClick={() => onEdit?.(item.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Item
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {permissions.canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete?.(item.id)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Item
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    })

    return cols
  }, [permissions, showBulkActions, selectedItems, onSelectItem, onSelectAll, onUpdate, onDelete, onEdit, itemsLength])

  return columns
}