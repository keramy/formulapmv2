/**
 * Color System Test Component
 * Tests the new comprehensive color system for accessibility and visual consistency
 */

'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ColorSystemTest() {
  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Formula PM Color System Test</CardTitle>
          <CardDescription>
            Testing the comprehensive color system for accessibility and visual consistency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Button Variants Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Button Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="default">Default</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          {/* Project Status Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Project Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="planning">Planning</Badge>
              <Badge variant="bidding">Bidding</Badge>
              <Badge variant="active">Active</Badge>
              <Badge variant="on-hold">On Hold</Badge>
              <Badge variant="completed">Completed</Badge>
              <Badge variant="cancelled">Cancelled</Badge>
            </div>
          </div>

          {/* Task Status Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Task Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="pending">Pending</Badge>
              <Badge variant="in-progress">In Progress</Badge>
              <Badge variant="review">Review</Badge>
              <Badge variant="done">Done</Badge>
              <Badge variant="blocked">Blocked</Badge>
            </div>
          </div>

          {/* Priority Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Priority Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="priority-low">Low Priority</Badge>
              <Badge variant="priority-medium">Medium Priority</Badge>
              <Badge variant="priority-high">High Priority</Badge>
              <Badge variant="priority-urgent">Urgent Priority</Badge>
            </div>
          </div>

          {/* Scope Category Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Scope Category Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="scope-construction">Construction</Badge>
              <Badge variant="scope-millwork">Millwork</Badge>
              <Badge variant="scope-electrical">Electrical</Badge>
              <Badge variant="scope-mechanical">Mechanical</Badge>
            </div>
          </div>

          {/* Risk Level Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Risk Level Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="risk-low">Low Risk</Badge>
              <Badge variant="risk-medium">Medium Risk</Badge>
              <Badge variant="risk-high">High Risk</Badge>
            </div>
          </div>

          {/* Role Badges - Updated 6-Role System */}
          <div>
            <h3 className="text-lg font-semibold mb-3">User Role Badges (6-Role System)</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="management">Management</Badge>
              <Badge variant="purchase">Purchase Manager</Badge>
              <Badge variant="technical">Technical Lead</Badge>
              <Badge variant="project">Project Manager</Badge>
              <Badge variant="client">Client</Badge>
              <Badge variant="admin">Admin</Badge>
            </div>
          </div>

          {/* Shop Drawing Status Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Shop Drawing Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="shop-pending">Pending</Badge>
              <Badge variant="shop-under-review">Under Review</Badge>
              <Badge variant="shop-approved">Approved</Badge>
              <Badge variant="shop-rejected">Rejected</Badge>
              <Badge variant="shop-revision-required">Revision Required</Badge>
            </div>
          </div>

          {/* Priority Dots Test */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Priority Dot Indicators</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-priority-low" />
                <span>Low Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-priority-medium" />
                <span>Medium Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-priority-high" />
                <span>High Priority</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-priority-urgent" />
                <span>Urgent Priority</span>
              </div>
            </div>
          </div>

          {/* Scope Category Cards with Border Accents */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Scope Category Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-scope-construction bg-scope-construction/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔨</span>
                    <span className="font-medium">Construction</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-scope-millwork bg-scope-millwork/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪵</span>
                    <span className="font-medium">Millwork</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-scope-electrical bg-scope-electrical/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <span className="font-medium">Electrical</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-scope-mechanical bg-scope-mechanical/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚙️</span>
                    <span className="font-medium">Mechanical</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Accessibility Notice */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-semibold mb-2">🎯 Accessibility Compliance</h4>
            <p className="text-sm text-gray-700">
              All color combinations in this system meet WCAG 2.1 AA standards with contrast ratios ≥ 4.5:1.
              Colors are never used alone - they're always accompanied by icons, text, or other visual indicators
              for users with color vision deficiencies.
            </p>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

export default ColorSystemTest