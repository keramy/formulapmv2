'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Star, 
  ShoppingCart, 
  Edit,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  MessageSquare,
  Calendar,
  DollarSign,
  Package,
  History
} from 'lucide-react'
import { Vendor } from '@/types/purchase'

interface VendorDetailsProps {
  vendor: Vendor
  onEdit?: () => void
  onToggleStatus?: (isActive: boolean) => void
  onRate?: () => void
  onClose: () => void
  canEdit?: boolean
  canToggleStatus?: boolean
  canRate?: boolean
  canViewFinancials?: boolean
}

export const VendorDetails: React.FC<VendorDetailsProps> = ({
  vendor,
  onEdit,
  onToggleStatus,
  onRate,
  onClose,
  canEdit = false,
  canToggleStatus = false,
  canRate = false,
  canViewFinancials = false
}) => {
  const [activeTab, setActiveTab] = useState('details')

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < Math.floor(rating) 
                ? 'text-yellow-400 fill-current' 
                : i < rating 
                ? 'text-yellow-400 fill-current opacity-50' 
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm font-medium ml-2">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const totalOrders = vendor.purchase_orders?.length || 0
  const totalValue = vendor.purchase_orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const avgOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0

  return (
    <div className="max-w-6xl mx-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Vendor Details</span>
            <Badge variant={vendor.is_active ? "default" : "secondary"} className="ml-2">
              {vendor.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {canToggleStatus && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleStatus?.(!vendor.is_active)}
                className={vendor.is_active ? 
                  "text-red-600 border-red-600 hover:bg-red-50" : 
                  "text-green-600 border-green-600 hover:bg-green-50"
                }
              >
                {vendor.is_active ? (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </Button>
            )}
            {canRate && vendor.is_active && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRate}
                className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
              >
                <Star className="h-4 w-4 mr-2" />
                Rate
              </Button>
            )}
          </div>
        </DialogTitle>
      </DialogHeader>

      <div className="mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="ratings">Ratings</TabsTrigger>
          </TabsList>

          {/* Vendor Details */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="h-5 w-5" />
                    <span>Company Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Company Name</Label>
                    <p className="text-lg font-semibold">{vendor.company_name}</p>
                  </div>

                  {vendor.contact_person && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Contact Person</Label>
                      <p className="text-sm">{vendor.contact_person}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Status</Label>
                    <Badge variant={vendor.is_active ? "default" : "secondary"} className="mt-1">
                      {vendor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Added Date</Label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{formatDate(vendor.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vendor.email && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Email</Label>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <a href={`mailto:${vendor.email}`} className="text-sm text-blue-600 hover:underline">
                          {vendor.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {vendor.phone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Phone</Label>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${vendor.phone}`} className="text-sm text-blue-600 hover:underline">
                          {vendor.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {vendor.address && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Address</Label>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <p className="text-sm">{vendor.address}</p>
                      </div>
                    </div>
                  )}

                  {vendor.payment_terms && (
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Payment Terms</Label>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{vendor.payment_terms}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Rating Summary */}
            {vendor.average_rating && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Rating Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {renderStarRating(vendor.average_rating)}
                    <span className="text-sm text-gray-500">
                      Based on {vendor.ratings?.length || 0} rating{(vendor.ratings?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Metrics */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    Purchase orders placed
                  </p>
                </CardContent>
              </Card>

              {canViewFinancials && (
                <>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(totalValue)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total order value
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(avgOrderValue)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Average per order
                      </p>
                    </CardContent>
                  </Card>
                </>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {vendor.average_rating?.toFixed(1) || 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Out of 5 stars
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Performance charts would be displayed here</p>
                  <p className="text-sm text-gray-400">Order volume, delivery time, and rating trends over time</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Purchase Orders */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Purchase Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendor.purchase_orders && vendor.purchase_orders.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PO Number</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          {canViewFinancials && <TableHead>Amount</TableHead>}
                          <TableHead>Delivery Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendor.purchase_orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <span className="font-mono text-sm">{order.po_number}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">{formatDate(order.po_date)}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.status}</Badge>
                            </TableCell>
                            {canViewFinancials && (
                              <TableCell>
                                <span className="text-sm font-medium">
                                  {formatCurrency(order.total_amount)}
                                </span>
                              </TableCell>
                            )}
                            <TableCell>
                              <span className="text-sm">
                                {order.expected_delivery_date ? 
                                  formatDate(order.expected_delivery_date) : 
                                  'Not specified'
                                }
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No purchase orders found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ratings */}
          <TabsContent value="ratings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="h-5 w-5" />
                  <span>Vendor Ratings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vendor.ratings && vendor.ratings.length > 0 ? (
                  <div className="space-y-4">
                    {vendor.ratings.map((rating) => (
                      <div key={rating.id} className="border rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Project</Label>
                            <p className="text-sm">{rating.project?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Rated By</Label>
                            <p className="text-sm">
                              {rating.rater ? 
                                `${rating.rater.first_name} ${rating.rater.last_name}` : 
                                'Unknown'
                              }
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Date</Label>
                            <p className="text-sm">{formatDate(rating.created_at)}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Overall Rating</Label>
                            {renderStarRating(rating.overall_score)}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Quality</Label>
                            {renderStarRating(rating.quality_score)}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Delivery</Label>
                            {renderStarRating(rating.delivery_score)}
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Communication</Label>
                            {renderStarRating(rating.communication_score)}
                          </div>
                        </div>

                        {rating.comments && (
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Comments</Label>
                            <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">{rating.comments}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No ratings available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-end mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Close
        </Button>
      </div>
    </div>
  )
}