// ============================================================================
// Material Specifications - Standalone Page
// ============================================================================
// V3 Feature: Material specification management and approval workflow
// Note: This is the standalone page for material specs functionality
// ============================================================================

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataStateWrapper } from '@/components/ui/loading-states'
import { Plus, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useMaterialSpecs } from '@/hooks/useMaterialSpecs'

export default function MaterialSpecsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const { data: materialSpecs, loading, error, refetch } = useMaterialSpecs()

  // Filter by status
  const filteredSpecs = materialSpecs?.filter(spec => {
    if (selectedStatus === 'all') return true
    return spec.status === selectedStatus
  }) || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Specifications</h1>
          <p className="text-gray-600">
            Manage material specifications and approval workflows
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Submit Spec
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedStatus(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Material Specifications List */}
      <DataStateWrapper
        loading={loading}
        error={error}
        data={filteredSpecs}
        onRetry={refetch}
        emptyMessage="No material specifications found"
        emptyDescription="Submit your first material specification to get started"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredSpecs.map((spec) => (
            <Card key={spec.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">{spec.material_name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(spec.status)}
                    <Badge className={getStatusColor(spec.status)} variant="secondary">
                      {spec.status?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <CardDescription>{spec.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Project:</span>
                      <div className="text-gray-900">{spec.project?.name}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Submitted:</span>
                      <div className="text-gray-900">
                        {new Date(spec.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {spec.specifications && (
                    <div>
                      <span className="font-medium text-gray-600 text-sm">Specifications:</span>
                      <div className="text-sm text-gray-900 mt-1 line-clamp-3">
                        {spec.specifications}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div className="text-xs text-gray-500">
                      Submitted by {spec.submitted_by}
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataStateWrapper>
    </div>
  )
}