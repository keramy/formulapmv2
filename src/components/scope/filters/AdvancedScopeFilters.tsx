/**
 * Advanced Scope Filters Component
 * Comprehensive filtering system for scope items with multiple filter types
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerRange } from '@/components/ui/date-range-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Filter, 
  X, 
  Search, 
  Calendar, 
  DollarSign, 
  User, 
  Building, 
  Tag,
  Save,
  RotateCcw,
  ChevronDown
} from 'lucide-react';
import { ScopeFilters, ScopeStatus, ScopeCategory } from '@/types/scope';
import { useAuth } from '@/hooks/useAuth';

interface AdvancedScopeFiltersProps {
  filters: ScopeFilters;
  onFiltersChange: (filters: ScopeFilters) => void;
  onReset: () => void;
  availableSuppliers?: Array<{ id: string; name: string }>;
  availableUsers?: Array<{ id: string; name: string }>;
  availableProjects?: Array<{ id: string; name: string }>;
  showProjectFilter?: boolean;
  savedFilters?: Array<{ id: string; name: string; filters: ScopeFilters }>;
  onSaveFilter?: (name: string, filters: ScopeFilters) => void;
  onLoadFilter?: (filters: ScopeFilters) => void;
}

interface FilterSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  expanded: boolean;
}

const STATUS_OPTIONS: { value: ScopeStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-yellow-500' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-500' },
  { value: 'blocked', label: 'Blocked', color: 'bg-orange-500' }
];

const CATEGORY_OPTIONS: { value: ScopeCategory; label: string }[] = [
  { value: 'construction', label: 'Construction' },
  { value: 'millwork', label: 'Millwork' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }
];

export function AdvancedScopeFilters({
  filters,
  onFiltersChange,
  onReset,
  availableSuppliers = [],
  availableUsers = [],
  availableProjects = [],
  showProjectFilter = false,
  savedFilters = [],
  onSaveFilter,
  onLoadFilter
}: AdvancedScopeFiltersProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    search: true,
    status: true,
    category: false,
    assignments: false,
    dates: false,
    costs: false,
    advanced: false
  });

  const sections: FilterSection[] = [
    { id: 'search', title: 'Search & Text', icon: Search, expanded: expandedSections.search },
    { id: 'status', title: 'Status & Priority', icon: Tag, expanded: expandedSections.status },
    { id: 'category', title: 'Categories', icon: Building, expanded: expandedSections.category },
    { id: 'assignments', title: 'Assignments', icon: User, expanded: expandedSections.assignments },
    { id: 'dates', title: 'Date Ranges', icon: Calendar, expanded: expandedSections.dates },
    { id: 'costs', title: 'Cost Ranges', icon: DollarSign, expanded: expandedSections.costs },
    { id: 'advanced', title: 'Advanced', icon: Filter, expanded: expandedSections.advanced }
  ];

  // Calculate active filter count
  const activeFilterCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const updateFilter = useCallback((key: keyof ScopeFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  }, [filters, onFiltersChange]);

  const handleStatusChange = (status: ScopeStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    if (checked) {
      updateFilter('status', [...currentStatuses, status]);
    } else {
      updateFilter('status', currentStatuses.filter(s => s !== status));
    }
  };

  const handleCategoryChange = (categories: ScopeCategory[]) => {
    updateFilter('category', categories.length > 0 ? categories : undefined);
  };

  const handleSaveFilter = () => {
    if (saveFilterName.trim() && onSaveFilter) {
      onSaveFilter(saveFilterName.trim(), filters);
      setSaveFilterName('');
      setShowSaveDialog(false);
    }
  };

  const renderActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; value: string }> = [];

    if (filters.search_term) {
      activeFilters.push({ key: 'search_term', label: 'Search', value: filters.search_term });
    }

    if (filters.status?.length) {
      activeFilters.push({ 
        key: 'status', 
        label: 'Status', 
        value: filters.status.map(s => STATUS_OPTIONS.find(opt => opt.value === s)?.label).join(', ')
      });
    }

    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      activeFilters.push({ 
        key: 'category', 
        label: 'Category', 
        value: categories.map(c => CATEGORY_OPTIONS.find(opt => opt.value === c)?.label).join(', ')
      });
    }

    return activeFilters;
  };

  return (
    <div className="space-y-4">
      {/* Filter Button & Active Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                Advanced Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2 px-1.5 py-0.5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-[600px] p-0" 
              align="start"
              side="bottom"
            >
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Advanced Filters</h4>
                  <div className="flex items-center gap-2">
                    {savedFilters.length > 0 && (
                      <Select onValueChange={(value) => {
                        const saved = savedFilters.find(f => f.id === value);
                        if (saved && onLoadFilter) {
                          onLoadFilter(saved.filters);
                        }
                      }}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue placeholder="Load preset" />
                        </SelectTrigger>
                        <SelectContent>
                          {savedFilters.map(saved => (
                            <SelectItem key={saved.id} value={saved.id}>
                              {saved.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={onReset}
                      className="h-8 px-2"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsOpen(false)}
                      className="h-8 px-2"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-6">
                  {sections.map(section => {
                    const Icon = section.icon;
                    return (
                      <Card key={section.id} className="border-0 shadow-none">
                        <CardHeader 
                          className="pb-3 px-0 cursor-pointer"
                          onClick={() => toggleSection(section.id)}
                        >
                          <CardTitle className="text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {section.title}
                            </div>
                            <ChevronDown 
                              className={`h-3 w-3 transition-transform ${
                                expandedSections[section.id] ? 'rotate-180' : ''
                              }`} 
                            />
                          </CardTitle>
                        </CardHeader>
                        
                        {expandedSections[section.id] && (
                          <CardContent className="px-0 pt-0">
                            {section.id === 'search' && (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Search in items</Label>
                                  <Input
                                    placeholder="Search scope items..."
                                    value={filters.search_term || ''}
                                    onChange={(e) => updateFilter('search_term', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            )}

                            {section.id === 'status' && (
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-xs mb-3 block">Status</Label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {STATUS_OPTIONS.map(status => (
                                      <div key={status.value} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`status-${status.value}`}
                                          checked={filters.status?.includes(status.value) || false}
                                          onCheckedChange={(checked) => 
                                            handleStatusChange(status.value, checked as boolean)
                                          }
                                        />
                                        <Label 
                                          htmlFor={`status-${status.value}`}
                                          className="text-xs flex items-center gap-2"
                                        >
                                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                          {status.label}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs">Priority</Label>
                                  <Select 
                                    value={filters.priority || ''} 
                                    onValueChange={(value) => updateFilter('priority', value || undefined)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="All priorities" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">All priorities</SelectItem>
                                      {PRIORITY_OPTIONS.map(priority => (
                                        <SelectItem key={priority.value} value={priority.value}>
                                          {priority.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            {section.id === 'category' && (
                              <div>
                                <Label className="text-xs mb-3 block">Categories</Label>
                                <div className="grid grid-cols-2 gap-2">
                                  {CATEGORY_OPTIONS.map(category => (
                                    <div key={category.value} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`category-${category.value}`}
                                        checked={
                                          Array.isArray(filters.category) 
                                            ? filters.category.includes(category.value)
                                            : filters.category === category.value
                                        }
                                        onCheckedChange={(checked) => {
                                          const current = Array.isArray(filters.category) 
                                            ? filters.category 
                                            : filters.category ? [filters.category] : [];
                                          
                                          if (checked) {
                                            handleCategoryChange([...current, category.value]);
                                          } else {
                                            handleCategoryChange(current.filter(c => c !== category.value));
                                          }
                                        }}
                                      />
                                      <Label htmlFor={`category-${category.value}`} className="text-xs">
                                        {category.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {section.id === 'assignments' && (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Assigned To</Label>
                                  <Select 
                                    value={filters.assigned_to || ''} 
                                    onValueChange={(value) => updateFilter('assigned_to', value || undefined)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="All assignees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">All assignees</SelectItem>
                                      <SelectItem value="unassigned">Unassigned</SelectItem>
                                      <SelectItem value="me">Assigned to me</SelectItem>
                                      {availableUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                          {user.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-xs">Supplier</Label>
                                  <Select 
                                    value={filters.supplier_id || ''} 
                                    onValueChange={(value) => updateFilter('supplier_id', value || undefined)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue placeholder="All suppliers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">All suppliers</SelectItem>
                                      <SelectItem value="unassigned">No supplier</SelectItem>
                                      {availableSuppliers.map(supplier => (
                                        <SelectItem key={supplier.id} value={supplier.id}>
                                          {supplier.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {showProjectFilter && (
                                  <div>
                                    <Label className="text-xs">Project</Label>
                                    <Select 
                                      value={filters.project_id || ''} 
                                      onValueChange={(value) => updateFilter('project_id', value || undefined)}
                                    >
                                      <SelectTrigger className="mt-1">
                                        <SelectValue placeholder="All projects" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="">All projects</SelectItem>
                                        {availableProjects.map(project => (
                                          <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            )}

                            {section.id === 'dates' && (
                              <div className="space-y-3">
                                <div>
                                  <Label className="text-xs">Created Date Range</Label>
                                  <DatePickerRange
                                    from={filters.created_after ? new Date(filters.created_after) : undefined}
                                    to={filters.created_before ? new Date(filters.created_before) : undefined}
                                    onSelect={(range) => {
                                      updateFilter('created_after', range?.from?.toISOString());
                                      updateFilter('created_before', range?.to?.toISOString());
                                    }}
                                    className="mt-1"
                                  />
                                </div>

                                <div>
                                  <Label className="text-xs">Due Date Range</Label>
                                  <DatePickerRange
                                    from={filters.due_after ? new Date(filters.due_after) : undefined}
                                    to={filters.due_before ? new Date(filters.due_before) : undefined}
                                    onSelect={(range) => {
                                      updateFilter('due_after', range?.from?.toISOString());
                                      updateFilter('due_before', range?.to?.toISOString());
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </div>
                            )}

                            {section.id === 'costs' && (
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-xs mb-2 block">
                                    Estimated Cost Range: ${filters.min_cost || 0} - ${filters.max_cost || 100000}
                                  </Label>
                                  <Slider
                                    value={[filters.min_cost || 0, filters.max_cost || 100000]}
                                    onValueChange={([min, max]) => {
                                      updateFilter('min_cost', min);
                                      updateFilter('max_cost', max);
                                    }}
                                    max={100000}
                                    step={100}
                                    className="mt-2"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Min Cost</Label>
                                    <Input
                                      type="number"
                                      value={filters.min_cost || ''}
                                      onChange={(e) => updateFilter('min_cost', Number(e.target.value) || undefined)}
                                      placeholder="0"
                                      className="mt-1"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Max Cost</Label>
                                    <Input
                                      type="number"
                                      value={filters.max_cost || ''}
                                      onChange={(e) => updateFilter('max_cost', Number(e.target.value) || undefined)}
                                      placeholder="100000"
                                      className="mt-1"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            {section.id === 'advanced' && (
                              <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="overdue"
                                    checked={filters.overdue || false}
                                    onCheckedChange={(checked) => updateFilter('overdue', checked)}
                                  />
                                  <Label htmlFor="overdue" className="text-xs">Overdue items only</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="has_attachments"
                                    checked={filters.has_attachments || false}
                                    onCheckedChange={(checked) => updateFilter('has_attachments', checked)}
                                  />
                                  <Label htmlFor="has_attachments" className="text-xs">Has attachments</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="requires_approval"
                                    checked={filters.requires_approval || false}
                                    onCheckedChange={(checked) => updateFilter('requires_approval', checked)}
                                  />
                                  <Label htmlFor="requires_approval" className="text-xs">Requires approval</Label>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </div>
                  <div className="flex items-center gap-2">
                    {onSaveFilter && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowSaveDialog(true)}
                        className="h-8"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => setIsOpen(false)}
                      className="h-8"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Active Filter Badges */}
          {renderActiveFilters().map(filter => (
            <Badge key={filter.key} variant="secondary" className="flex items-center gap-1">
              <span className="font-medium">{filter.label}:</span>
              <span className="truncate max-w-[100px]">{filter.value}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => updateFilter(filter.key as keyof ScopeFilters, undefined)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Clear All
          </Button>
        )}
      </div>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>Save Filter Preset</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>Filter Name</Label>
                  <Input
                    value={saveFilterName}
                    onChange={(e) => setSaveFilterName(e.target.value)}
                    placeholder="My Custom Filter"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveFilter} disabled={!saveFilterName.trim()}>
                    Save Filter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}