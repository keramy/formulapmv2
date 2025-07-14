/**
 * Advanced Data Table Component - SOPHISTICATED CAPABILITIES
 * Virtual scrolling, advanced filtering, real-time updates, performance optimization
 */

'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useAdvancedApiQuery } from '@/hooks/useAdvancedApiQuery'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Settings,
  ChevronUp,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react'

// Advanced column definition
export interface AdvancedColumn<T = any> {
  key: string
  title: string
  dataIndex: keyof T
  width?: number
  minWidth?: number
  maxWidth?: number
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  render?: (value: any, record: T, index: number) => React.ReactNode
  filter?: {
    type: 'text' | 'select' | 'date' | 'number' | 'boolean'
    options?: { label: string; value: any }[]
    placeholder?: string
  }
  sorter?: (a: T, b: T) => number
  fixed?: 'left' | 'right'
  ellipsis?: boolean
  align?: 'left' | 'center' | 'right'
}

export interface AdvancedDataTableProps<T = any> {
  // Data source
  endpoint: string
  columns: AdvancedColumn<T>[]
  
  // Advanced features
  virtualScrolling?: boolean
  pageSize?: number
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  exportable?: boolean
  selectable?: boolean
  realtime?: boolean
  
  // Customization
  title?: string
  description?: string
  actions?: React.ReactNode
  rowKey?: keyof T | ((record: T) => string)
  rowClassName?: (record: T, index: number) => string
  
  // Events
  onRowClick?: (record: T, index: number) => void
  onRowSelect?: (selectedRows: T[]) => void
  onExport?: (data: T[]) => void
  
  // Performance
  debounceSearch?: number
  cacheTime?: number
  staleTime?: number
}

// Virtual scrolling hook
function useVirtualScrolling<T>(
  data: T[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const end = Math.min(start + visibleCount + 5, data.length) // Buffer
    
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, data.length])
  
  const visibleData = useMemo(() => 
    data.slice(visibleRange.start, visibleRange.end),
    [data, visibleRange]
  )
  
  return {
    visibleData,
    visibleRange,
    totalHeight: data.length * itemHeight,
    offsetY: visibleRange.start * itemHeight,
    setScrollTop
  }
}

// Advanced filtering hook
function useAdvancedFiltering<T>(
  data: T[],
  columns: AdvancedColumn<T>[],
  searchTerm: string
) {
  return useMemo(() => {
    let filtered = data

    // Global search
    if (searchTerm) {
      const searchableColumns = columns.filter(col => col.searchable !== false)
      filtered = filtered.filter(item =>
        searchableColumns.some(col => {
          const value = item[col.dataIndex]
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    return filtered
  }, [data, columns, searchTerm])
}

// Advanced sorting hook
function useAdvancedSorting<T>(data: T[]) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key!]
      const bVal = b[sortConfig.key!]

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [data, sortConfig])

  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  return { sortedData, sortConfig, handleSort }
}

export function AdvancedDataTable<T = any>({
  endpoint,
  columns,
  virtualScrolling = false,
  pageSize = 50,
  searchable = true,
  filterable = true,
  sortable = true,
  exportable = true,
  selectable = false,
  realtime = false,
  title,
  description,
  actions,
  rowKey = 'id',
  rowClassName,
  onRowClick,
  onRowSelect,
  onExport,
  debounceSearch = 300,
  cacheTime = 10 * 60 * 1000,
  staleTime = 2 * 60 * 1000
}: AdvancedDataTableProps<T>) {
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRows, setSelectedRows] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, any>>({})
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  // Advanced data fetching
  const { 
    data: response, 
    loading, 
    error, 
    refetch, 
    metrics,
    isStale 
  } = useAdvancedApiQuery<{ data: T[]; pagination?: any }>({
    endpoint,
    params: {
      page,
      limit: pageSize,
      search: searchTerm,
      ...filters
    },
    cacheKey: `advanced-table-${endpoint}-${page}-${searchTerm}`,
    debounceMs: debounceSearch,
    cacheTime,
    staleTime,
    realtime,
    realtimeChannel: `table-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`,
    keepPreviousData: true
  })

  const data = response?.data || []

  // Advanced filtering and sorting
  const filteredData = useAdvancedFiltering(data, columns, searchTerm)
  const { sortedData, sortConfig, handleSort } = useAdvancedSorting(filteredData)

  // Virtual scrolling
  const {
    visibleData,
    visibleRange,
    totalHeight,
    offsetY,
    setScrollTop
  } = useVirtualScrolling(sortedData, containerHeight, 50)

  const finalData = virtualScrolling ? visibleData : sortedData

  // Container height measurement
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Row selection
  const handleRowSelect = useCallback((record: T, selected: boolean) => {
    setSelectedRows(prev => {
      const newSelection = selected
        ? [...prev, record]
        : prev.filter(item => {
            const key = typeof rowKey === 'function' ? rowKey(item) : item[rowKey]
            const recordKey = typeof rowKey === 'function' ? rowKey(record) : record[rowKey]
            return key !== recordKey
          })
      
      onRowSelect?.(newSelection)
      return newSelection
    })
  }, [rowKey, onRowSelect])

  // Export functionality
  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(selectedRows.length > 0 ? selectedRows : sortedData)
    } else {
      // Default CSV export
      const csv = [
        columns.map(col => col.title).join(','),
        ...sortedData.map(row =>
          columns.map(col => {
            const value = row[col.dataIndex]
            return typeof value === 'string' ? `"${value}"` : value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'data'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [columns, sortedData, selectedRows, onExport, title])

  // Render table header
  const renderHeader = () => (
    <thead className="bg-muted/50">
      <tr>
        {selectable && (
          <th className="w-12 p-2">
            <input
              type="checkbox"
              checked={selectedRows.length === sortedData.length && sortedData.length > 0}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRows(sortedData)
                  onRowSelect?.(sortedData)
                } else {
                  setSelectedRows([])
                  onRowSelect?.([])
                }
              }}
            />
          </th>
        )}
        {columns.map(column => (
          <th
            key={column.key}
            className={`p-3 text-left font-medium ${
              sortable && column.sortable !== false ? 'cursor-pointer hover:bg-muted' : ''
            }`}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth
            }}
            onClick={() => {
              if (sortable && column.sortable !== false) {
                handleSort(column.dataIndex)
              }
            }}
          >
            <div className="flex items-center space-x-2">
              <span>{column.title}</span>
              {sortable && column.sortable !== false && (
                <div className="flex flex-col">
                  <ChevronUp 
                    className={`h-3 w-3 ${
                      sortConfig.key === column.dataIndex && sortConfig.direction === 'asc'
                        ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <ChevronDown 
                    className={`h-3 w-3 -mt-1 ${
                      sortConfig.key === column.dataIndex && sortConfig.direction === 'desc'
                        ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  )

  // Render table row
  const renderRow = (record: T, index: number) => {
    const key = typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey])
    const isSelected = selectedRows.some(item => {
      const itemKey = typeof rowKey === 'function' ? rowKey(item) : item[rowKey]
      return itemKey === (typeof rowKey === 'function' ? rowKey(record) : record[rowKey])
    })

    return (
      <tr
        key={key}
        className={`border-b hover:bg-muted/50 ${
          rowClassName ? rowClassName(record, index) : ''
        } ${isSelected ? 'bg-primary/10' : ''}`}
        onClick={() => onRowClick?.(record, index)}
      >
        {selectable && (
          <td className="w-12 p-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleRowSelect(record, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
            />
          </td>
        )}
        {columns.map(column => (
          <td
            key={column.key}
            className={`p-3 ${column.align === 'center' ? 'text-center' : 
              column.align === 'right' ? 'text-right' : 'text-left'}`}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth
            }}
          >
            {column.render 
              ? column.render(record[column.dataIndex], record, index)
              : String(record[column.dataIndex] || '')
            }
          </td>
        ))}
      </tr>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          <div className="flex items-center space-x-2">
            {/* Performance metrics */}
            {metrics.fetchCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {Math.round(metrics.averageResponseTime)}ms avg
              </Badge>
            )}
            {isStale && (
              <Badge variant="secondary" className="text-xs">
                Stale
              </Badge>
            )}
            {actions}
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="flex items-center space-x-2 mt-4">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={refetch}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <DataStateWrapper
          loading={loading}
          error={error}
          data={data}
          onRetry={refetch}
        >
          <div 
            ref={containerRef}
            className="relative overflow-auto border rounded-md"
            style={{ height: virtualScrolling ? 400 : 'auto' }}
            onScroll={(e) => {
              if (virtualScrolling) {
                setScrollTop(e.currentTarget.scrollTop)
              }
            }}
          >
            {virtualScrolling && (
              <div style={{ height: totalHeight, position: 'relative' }}>
                <div style={{ transform: `translateY(${offsetY}px)` }}>
                  <table className="w-full">
                    {renderHeader()}
                    <tbody>
                      {finalData.map((record, index) => 
                        renderRow(record, visibleRange.start + index)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {!virtualScrolling && (
              <table className="w-full">
                {renderHeader()}
                <tbody>
                  {finalData.map((record, index) => renderRow(record, index))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination info */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div>
              Showing {finalData.length} of {sortedData.length} items
              {selectedRows.length > 0 && ` (${selectedRows.length} selected)`}
            </div>
            <div className="flex items-center space-x-2">
              <span>Cache hit rate: {Math.round(metrics.cacheHitRate * 100)}%</span>
              <span>•</span>
              <span>Fetches: {metrics.fetchCount}</span>
            </div>
          </div>
        </DataStateWrapper>
      </CardContent>
    </Card>
  )
}
