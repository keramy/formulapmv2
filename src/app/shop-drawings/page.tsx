// ============================================================================
// Shop Drawings - Standalone Page
// ============================================================================
// V3 Feature: Shop drawing submission and approval workflow
// Note: This is the standalone page for shop drawings functionality
// ============================================================================

'use client'

import React from 'react'
import { ShopDrawingListTable } from '@/components/projects/tabs/ShopDrawingsTab'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function ShopDrawingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shop Drawings</h1>
          <p className="text-gray-600">
            Submit and manage shop drawing approvals across all projects
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Submit Drawing
        </Button>
      </div>

      {/* Shop Drawings Interface */}
      <ShopDrawingListTable />
    </div>
  )
}