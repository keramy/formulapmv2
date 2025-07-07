'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestLayoutPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Layout Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sidebar</CardTitle>
            <CardDescription>Fixed left sidebar navigation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dark theme with Dashboard, Projects, and Settings links
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Header</CardTitle>
            <CardDescription>Top header with page title</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Shows current page title and user profile dropdown
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Responsive</CardTitle>
            <CardDescription>Mobile-friendly design</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sidebar collapses on mobile with hamburger menu
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Navigation Test</h2>
        <p className="text-muted-foreground">
          Use the sidebar to navigate between Dashboard, Projects, and Settings pages.
          The layout should remain consistent across all pages.
        </p>
      </div>
    </div>
  )
}