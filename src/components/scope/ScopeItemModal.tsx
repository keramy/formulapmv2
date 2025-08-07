'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/hooks/useAuth'
import { Plus, AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authenticatedFetch, getUserFriendlyErrorMessage } from '@/lib/fetch-utils'

interface Supplier {
  id: string
  name: string
  contact_person: string
  specializations: string[]
}

interface ScopeItemData {
  item_code: string
  description: string
  long_description?: string
  category: string
  unit: string
  quantity: number
  initial_cost: number
  selling_price: number
  actual_cost: number
  supplier_id: string
  notes?: string
}

interface ScopeItemModalProps {
  onSubmit: (data: ScopeItemData) => Promise<void>
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CATEGORIES = [
  'Construction',
  'Millwork', 
  'Electrical',
  'Mechanical',
  'Plumbing',
  'HVAC',
  'Structural',
  'Architectural',
  'Landscape',
  'Interior Design',
  'Other'
]

const UNITS = [
  'PCS', 'SQM', 'LM', 'CBM', 'KG', 'TON', 'HR', 'DAY', 'LOT', 'SET'
]

export function ScopeItemModal({ onSubmit, trigger, open, onOpenChange }: ScopeItemModalProps) {
  const { getAccessToken, isAuthenticated, loading: authLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)
  const [formData, setFormData] = useState<ScopeItemData>({
    item_code: '',
    description: '',
    long_description: '',
    category: '',
    unit: '',
    quantity: 1,
    initial_cost: 0,
    selling_price: 0,
    actual_cost: 0,
    supplier_id: '',
    notes: ''
  })

  // Load suppliers when authentication is ready
  useEffect(() => {
    if (isAuthenticated && !authLoading && !loadingSuppliers && suppliers.length === 0) {
      loadSuppliers()
    }
  }, [isAuthenticated, authLoading])

  const loadSuppliers = async () => {
    // Prevent duplicate calls
    if (loadingSuppliers) return

    try {
      setLoadingSuppliers(true)
      
      // Wait for authentication to be ready
      if (authLoading || !isAuthenticated) {
        setLoadingSuppliers(false)
        return
      }
      
      const response = await authenticatedFetch('/api/suppliers', getAccessToken, {
        retries: 1,
        timeout: 5000
      })

      if (!response.ok) {
        throw new Error('Failed to load suppliers')
      }

      const result = await response.json()
      if (result.success && result.data) {
        setSuppliers(Array.isArray(result.data) ? result.data : [])
      }
    } catch (error) {
      // Handle gracefully - suppliers are not critical
      setSuppliers([])
    } finally {
      setLoadingSuppliers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit(formData)
      
      // Reset form
      setFormData({
        item_code: '',
        description: '',
        long_description: '',
        category: '',
        unit: '',
        quantity: 1,
        initial_cost: 0,
        selling_price: 0,
        actual_cost: 0,
        supplier_id: '',
        notes: ''
      })
      
      // Close modal
      const shouldClose = onOpenChange ? !open : !isOpen
      if (onOpenChange) {
        onOpenChange(false)
      } else {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Error creating scope item:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen)
    } else {
      setIsOpen(newOpen)
    }
  }

  const currentOpen = open !== undefined ? open : isOpen

  return (
    <Dialog open={currentOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Scope Item</DialogTitle>
          <DialogDescription>
            Add a new scope item to the project with pricing and supplier information
          </DialogDescription>
        </DialogHeader>

        {/* Show info if no suppliers */}
        {!loadingSuppliers && suppliers.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No suppliers available for assignment. You can still create scope items and assign suppliers later.
              <Button 
                variant="link" 
                className="p-0 h-auto underline ml-2"
                onClick={() => window.open('/suppliers', '_blank')}
              >
                Create Supplier
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="item_code">Item Code *</Label>
                <Input
                  id="item_code"
                  value={formData.item_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_code: e.target.value }))}
                  placeholder="e.g. EL-001, MW-025"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the work item"
                required
              />
            </div>

            <div>
              <Label htmlFor="long_description">Detailed Description</Label>
              <Textarea
                id="long_description"
                value={formData.long_description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, long_description: e.target.value }))}
                placeholder="Detailed specifications and requirements"
                rows={3}
              />
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Quantity & Unit</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="unit">Unit *</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Pricing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="initial_cost">Initial Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="initial_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initial_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, initial_cost: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Supplier's quoted price</p>
              </div>
              
              <div>
                <Label htmlFor="selling_price">Selling Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, selling_price: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Price charged to client</p>
              </div>
              
              <div>
                <Label htmlFor="actual_cost">Actual Cost *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    id="actual_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.actual_cost}
                    onChange={(e) => setFormData(prev => ({ ...prev, actual_cost: parseFloat(e.target.value) || 0 }))}
                    className="pl-8"
                    placeholder="0.00"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Technical office estimate</p>
              </div>
            </div>
          </div>

          {/* Supplier Assignment */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Supplier Assignment</h3>
            
            <div>
              <Label htmlFor="supplier_id">Assigned Supplier (Optional)</Label>
              {loadingSuppliers ? (
                <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
              ) : (
                <Select 
                  value={formData.supplier_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">
                      <span className="text-gray-500">No supplier</span>
                    </SelectItem>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex flex-col">
                          <span>{supplier.name}</span>
                          <span className="text-xs text-gray-500">
                            {supplier.contact_person} • {supplier.specializations.join(', ')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium border-b pb-2">Additional Information</h3>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes or special requirements"
                rows={3}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Scope Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Export a trigger button component for convenience
export function ScopeItemCreateButton({ onSubmit }: { onSubmit: (data: ScopeItemData) => Promise<void> }) {
  return (
    <ScopeItemModal
      onSubmit={onSubmit}
      trigger={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Item
        </Button>
      }
    />
  )
}