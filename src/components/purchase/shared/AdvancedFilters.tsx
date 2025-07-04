'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Search, 
  Calendar, 
  DollarSign,
  Package,
  Building,
  User,
  Clock,
  RefreshCw
} from 'lucide-react'
import { RequestStatus, POStatus, UrgencyLevel, DeliveryStatus } from '@/types/purchase'

interface FilterOption {
  value: string
  label: string
  count?: number
}

interface DateRange {
  start?: string
  end?: string
}

interface PriceRange {
  min?: number
  max?: number
}

interface AdvancedFiltersProps {
  // Filter type
  filterType: 'requests' | 'orders' | 'vendors' | 'deliveries'
  
  // Search
  searchTerm: string
  onSearchChange: (term: string) => void
  
  // Status filters
  statusOptions?: FilterOption[]
  selectedStatuses: string[]
  onStatusChange: (statuses: string[]) => void
  
  // Urgency filters (for requests)
  urgencyOptions?: FilterOption[]
  selectedUrgencies: string[]
  onUrgencyChange: (urgencies: string[]) => void
  
  // Date range
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  
  // Price/Amount range
  priceRange: PriceRange
  onPriceRangeChange: (range: PriceRange) => void
  
  // Project filter
  projectOptions?: FilterOption[]
  selectedProjects: string[]
  onProjectChange: (projects: string[]) => void
  
  // Vendor filter (for orders/deliveries)
  vendorOptions?: FilterOption[]
  selectedVendors: string[]
  onVendorChange: (vendors: string[]) => void
  
  // User filter (requester/creator)
  userOptions?: FilterOption[]
  selectedUsers: string[]
  onUserChange: (users: string[]) => void
  
  // Active filters count
  activeFiltersCount: number
  
  // Actions
  onClearAllFilters: () => void
  onApplyFilters?: () => void
  
  // Loading state
  loading?: boolean
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filterType,
  searchTerm,
  onSearchChange,
  statusOptions = [],
  selectedStatuses,
  onStatusChange,
  urgencyOptions = [],
  selectedUrgencies,
  onUrgencyChange,
  dateRange,
  onDateRangeChange,
  priceRange,
  onPriceRangeChange,
  projectOptions = [],
  selectedProjects,
  onProjectChange,
  vendorOptions = [],
  selectedVendors,
  onVendorChange,
  userOptions = [],
  selectedUsers,
  onUserChange,
  activeFiltersCount,
  onClearAllFilters,
  onApplyFilters,
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status))
    } else {
      onStatusChange([...selectedStatuses, status])
    }
  }

  const handleUrgencyToggle = (urgency: string) => {
    if (selectedUrgencies.includes(urgency)) {
      onUrgencyChange(selectedUrgencies.filter(u => u !== urgency))
    } else {
      onUrgencyChange([...selectedUrgencies, urgency])
    }
  }

  const handleProjectToggle = (project: string) => {
    if (selectedProjects.includes(project)) {
      onProjectChange(selectedProjects.filter(p => p !== project))
    } else {
      onProjectChange([...selectedProjects, project])
    }
  }

  const handleVendorToggle = (vendor: string) => {
    if (selectedVendors.includes(vendor)) {
      onVendorChange(selectedVendors.filter(v => v !== vendor))
    } else {
      onVendorChange([...selectedVendors, vendor])
    }
  }

  const handleUserToggle = (user: string) => {
    if (selectedUsers.includes(user)) {
      onUserChange(selectedUsers.filter(u => u !== user))
    } else {
      onUserChange([...selectedUsers, user])
    }
  }

  const getFilterTitle = () => {
    switch (filterType) {
      case 'requests':
        return 'Purchase Request Filters'
      case 'orders':
        return 'Purchase Order Filters'
      case 'vendors':
        return 'Vendor Filters'
      case 'deliveries':
        return 'Delivery Filters'
      default:
        return 'Filters'
    }
  }

  const getDateLabel = () => {
    switch (filterType) {
      case 'requests':
        return 'Required Date Range'
      case 'orders':
        return 'PO Date Range'
      case 'deliveries':
        return 'Delivery Date Range'
      default:
        return 'Date Range'
    }
  }

  const getPriceLabel = () => {
    switch (filterType) {
      case 'requests':
        return 'Estimated Cost Range'
      case 'orders':
        return 'Order Amount Range'
      default:
        return 'Amount Range'
    }
  }

  const getUserLabel = () => {
    switch (filterType) {
      case 'requests':
        return 'Requester'
      case 'orders':
        return 'Created By'
      case 'deliveries':
        return 'Confirmed By'
      default:
        return 'User'
    }
  }

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>{getFilterTitle()}</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </CardTitle>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onClearAllFilters()
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Search */}
            <div>
              <Label className="text-sm font-medium">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={`Search ${filterType}...`}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Status Filter */}
              {statusOptions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Status</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {statusOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={selectedStatuses.includes(option.value)}
                          onCheckedChange={() => handleStatusToggle(option.value)}
                        />
                        <Label
                          htmlFor={`status-${option.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency Filter (for requests) */}
              {filterType === 'requests' && urgencyOptions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Urgency Level</Label>
                  <div className="space-y-2">
                    {urgencyOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`urgency-${option.value}`}
                          checked={selectedUrgencies.includes(option.value)}
                          onCheckedChange={() => handleUrgencyToggle(option.value)}
                        />
                        <Label
                          htmlFor={`urgency-${option.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Filter */}
              {projectOptions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <Package className="h-4 w-4 inline mr-1" />
                    Project
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {projectOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`project-${option.value}`}
                          checked={selectedProjects.includes(option.value)}
                          onCheckedChange={() => handleProjectToggle(option.value)}
                        />
                        <Label
                          htmlFor={`project-${option.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Filter */}
              {['orders', 'deliveries'].includes(filterType) && vendorOptions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <Building className="h-4 w-4 inline mr-1" />
                    Vendor
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {vendorOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`vendor-${option.value}`}
                          checked={selectedVendors.includes(option.value)}
                          onCheckedChange={() => handleVendorToggle(option.value)}
                        />
                        <Label
                          htmlFor={`vendor-${option.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Filter */}
              {userOptions.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    <User className="h-4 w-4 inline mr-1" />
                    {getUserLabel()}
                  </Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {userOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`user-${option.value}`}
                          checked={selectedUsers.includes(option.value)}
                          onCheckedChange={() => handleUserToggle(option.value)}
                        />
                        <Label
                          htmlFor={`user-${option.value}`}
                          className="text-sm cursor-pointer flex-1"
                        >
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Date Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <Calendar className="h-4 w-4 inline mr-1" />
                {getDateLabel()}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date-start" className="text-xs text-gray-600">Start Date</Label>
                  <Input
                    id="date-start"
                    type="date"
                    value={dateRange.start || ''}
                    onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value || undefined })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date-end" className="text-xs text-gray-600">End Date</Label>
                  <Input
                    id="date-end"
                    type="date"
                    value={dateRange.end || ''}
                    onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value || undefined })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Price/Amount Range */}
            {['requests', 'orders'].includes(filterType) && (
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  {getPriceLabel()}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price-min" className="text-xs text-gray-600">Minimum</Label>
                    <Input
                      id="price-min"
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceRange.min || ''}
                      onChange={(e) => onPriceRangeChange({ 
                        ...priceRange, 
                        min: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      placeholder="0.00"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price-max" className="text-xs text-gray-600">Maximum</Label>
                    <Input
                      id="price-max"
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceRange.max || ''}
                      onChange={(e) => onPriceRangeChange({ 
                        ...priceRange, 
                        max: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      placeholder="999999.99"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {onApplyFilters && (
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={onClearAllFilters}
                  disabled={loading || activeFiltersCount === 0}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={onApplyFilters}
                  disabled={loading}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}