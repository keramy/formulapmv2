'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Plus,
  Building, 
  Phone,
  Mail,
  MapPin,
  Star,
  StarOff,
  Calendar,
  CreditCard,
  ArrowUpDown
} from 'lucide-react'
import { Vendor } from '@/types/purchase'
import { VendorForm } from './VendorForm'
import { VendorRating } from './VendorRating'

interface VendorDatabaseProps {
  vendors: Vendor[]
  loading?: boolean
  onView: (vendor: Vendor) => void
  onEdit: (vendor: Vendor) => void
  onCreate: (vendorData: any) => Promise<void>
  onUpdate: (vendorId: string, updates: any) => Promise<void>
  onRate: (vendorId: string, ratingData: any) => Promise<void>
  onSearch: (searchTerm: string) => void
  canCreate?: boolean
  canEdit?: boolean
  canRate?: boolean
}

export const VendorDatabase: React.FC<VendorDatabaseProps> = ({
  vendors,
  loading = false,
  onView,
  onEdit,
  onCreate,
  onUpdate,
  onRate,
  onSearch,
  canCreate = false,
  canEdit = false,
  canRate = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [sortField, setSortField] = useState<keyof Vendor>('company_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showRatingDialog, setShowRatingDialog] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch(value)
  }

  // Handle sorting
  const handleSort = (field: keyof Vendor) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Filtered and sorted vendors
  const processedVendors = useMemo(() => {
    let filtered = [...vendors]

    // Apply active filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(vendor => 
        activeFilter === 'active' ? vendor.is_active : !vendor.is_active
      )
    }

    // Apply rating filter
    if (ratingFilter !== null) {
      filtered = filtered.filter(vendor => 
        vendor.average_rating && vendor.average_rating >= ratingFilter
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [vendors, activeFilter, ratingFilter, sortField, sortDirection])

  const renderStarRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star}>
            {star <= rating ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4 text-gray-300" />
            )}
          </div>
        ))}
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const handleCreateVendor = async (vendorData: any) => {
    await onCreate(vendorData)
    setShowCreateDialog(false)
  }

  const handleRateVendor = async (ratingData: any) => {
    if (selectedVendor) {
      await onRate(selectedVendor.id, ratingData)
      setShowRatingDialog(false)
      setSelectedVendor(null)
    }
  }

  const openRatingDialog = (vendor: Vendor) => {
    setSelectedVendor(vendor)
    setShowRatingDialog(true)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Vendor Database</span>
            <Badge variant="outline" className="ml-2">
              {vendors.length}
            </Badge>
          </CardTitle>
          {canCreate && (
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Vendor</DialogTitle>
                </DialogHeader>
                <VendorForm
                  onSubmit={handleCreateVendor}
                  onCancel={() => setShowCreateDialog(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="space-y-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search vendors by name, contact, or email..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Status:</span>
            </div>
            {[
              { key: 'all', label: 'All Vendors' },
              { key: 'active', label: 'Active' },
              { key: 'inactive', label: 'Inactive' }
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key as any)}
                className="h-7"
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Min Rating:</span>
            </div>
            {[null, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant={ratingFilter === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setRatingFilter(rating)}
                className="h-7"
              >
                {rating ? `${rating}+ Stars` : 'Any Rating'}
              </Button>
            ))}
          </div>
        </div>

        {/* Vendors Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('company_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Company</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedVendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="font-medium">{vendor.company_name}</p>
                        <p className="text-sm text-gray-500">
                          Added {new Date(vendor.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.contact_person ? (
                      <span className="text-sm">{vendor.contact_person}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {vendor.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{vendor.email}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                      {vendor.address && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          <span className="truncate max-w-[150px]">{vendor.address}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {vendor.payment_terms ? (
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{vendor.payment_terms}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {renderStarRating(vendor.average_rating)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={vendor.is_active ? "default" : "secondary"}>
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(vendor)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(vendor)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canRate && vendor.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRatingDialog(vendor)}
                          className="h-8 w-8 p-0"
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {processedVendors.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-500">
              {searchTerm || activeFilter !== 'all' || ratingFilter
                ? 'No vendors match your current filters.'
                : 'Add your first vendor to get started with purchase orders.'
              }
            </p>
          </div>
        )}

        {/* Rating Dialog */}
        <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rate Vendor</DialogTitle>
            </DialogHeader>
            {selectedVendor && (
              <VendorRating
                vendor={selectedVendor}
                onSubmit={handleRateVendor}
                onCancel={() => {
                  setShowRatingDialog(false)
                  setSelectedVendor(null)
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}