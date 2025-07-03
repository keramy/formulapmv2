'use client'

import { ShopDrawingsCoordinator } from '@/components/shop-drawings'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Smartphone, Users, Camera } from 'lucide-react'

export default function ShopDrawingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shop Drawings</h1>
          <p className="text-muted-foreground">
            Mobile-optimized shop drawing management with approval workflows and progress tracking
          </p>
        </div>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile PDF Access</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Touch</div>
            <p className="text-xs text-muted-foreground">
              Optimized for mobile viewing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Workflow</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sequential</div>
            <p className="text-xs text-muted-foreground">
              Architect → PM → Client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress Photos</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Visual</div>
            <p className="text-xs text-muted-foreground">
              Document construction progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Real-time Updates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Live</div>
            <p className="text-xs text-muted-foreground">
              Instant status synchronization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Shop Drawings Coordinator */}
      <ShopDrawingsCoordinator />
    </div>
  )
}