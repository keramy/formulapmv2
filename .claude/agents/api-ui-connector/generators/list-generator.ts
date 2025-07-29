import * as fs from 'fs/promises'
import * as path from 'path'
import { ApiAnalysis } from '../analyzers/api-analyzer'

export async function generateListComponent(
  projectRoot: string,
  resourceName: string,
  analysis: ApiAnalysis
): Promise<string> {
  const capitalizedResource = capitalize(resourceName)
  const pluralResource = pluralize(resourceName)
  const componentPath = path.join(projectRoot, 'src/components', pluralResource, `${capitalizedResource}sList.tsx`)
  
  // Ensure directory exists
  await fs.mkdir(path.dirname(componentPath), { recursive: true })
  
  const componentContent = generateListContent(resourceName, capitalizedResource, pluralResource)
  await fs.writeFile(componentPath, componentContent, 'utf-8')
  
  return componentPath
}

function generateListContent(
  resourceName: string,
  capitalizedResource: string,
  pluralResource: string
): string {
  return `'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Plus, MoreHorizontal, Pencil, Trash, Search, Filter } from 'lucide-react'
import { use${capitalizedResource}Api } from '@/hooks/api/use${capitalizedResource}Api'
import { ${capitalizedResource}Form } from './${capitalizedResource}Form'
import type { ${capitalizedResource}, ${capitalizedResource}Status, ${capitalizedResource}Priority } from '@/types/api/${pluralResource}'

interface ${capitalizedResource}sListProps {
  projectId?: string
}

export function ${capitalizedResource}sList({ projectId }: ${capitalizedResource}sListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<${capitalizedResource} | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<${capitalizedResource}Status | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<${capitalizedResource}Priority | 'all'>('all')

  const {
    ${pluralResource},
    loading,
    error,
    create${capitalizedResource},
    update${capitalizedResource},
    delete${capitalizedResource},
    isCreating,
    isUpdating,
    isDeleting,
    refetch
  } = use${capitalizedResource}Api({
    filters: {
      ...(projectId && { project_id: projectId }),
      ...(searchTerm && { search: searchTerm }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter })
    }
  })

  const handleCreate = async (data: any) => {
    try {
      await create${capitalizedResource}(data)
      setShowCreateForm(false)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleUpdate = async (data: any) => {
    if (!editingItem) return
    try {
      await update${capitalizedResource}(editingItem.id, data)
      setEditingItem(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this ${resourceName}?')) {
      await delete${capitalizedResource}(id)
    }
  }

  const getStatusColor = (status: ${capitalizedResource}Status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-purple-100 text-purple-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: ${capitalizedResource}Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>${capitalizedResource}s</CardTitle>
          <Button 
            onClick={() => setShowCreateForm(true)}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add ${capitalizedResource}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search ${pluralResource}..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pending')}>
                Pending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('in_progress')}>
                In Progress
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('done')}>
                Done
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('urgent')}>
                Urgent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('high')}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('medium')}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPriorityFilter('low')}>
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* List */}
        <DataStateWrapper 
          loading={loading} 
          error={error} 
          data={${pluralResource}} 
          onRetry={refetch}
          emptyMessage="No ${pluralResource} found"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {${pluralResource}.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.title}
                    {item.description && (
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(item.priority)}>
                      {item.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.assigned_to_user?.full_name || '-'}
                  </TableCell>
                  <TableCell>
                    {item.due_date 
                      ? new Date(item.due_date).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={isUpdating || isDeleting}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => setEditingItem(item)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600"
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataStateWrapper>

        {/* Create/Edit Form Dialog */}
        {(showCreateForm || editingItem) && (
          <${capitalizedResource}Form
            ${resourceName}={editingItem}
            projectId={projectId}
            onSubmit={editingItem ? handleUpdate : handleCreate}
            onCancel={() => {
              setShowCreateForm(false)
              setEditingItem(null)
            }}
            isSubmitting={isCreating || isUpdating}
          />
        )}
      </CardContent>
    </Card>
  )
}
`
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function pluralize(str: string): string {
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies'
  } else if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch')) {
    return str + 'es'
  }
  return str + 's'
}