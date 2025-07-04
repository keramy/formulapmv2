/**
 * Subcontractor Portal Card Component
 * Dashboard card for admin access to subcontractor portal management
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, Users, FileText, ExternalLink, Plus, Settings } from 'lucide-react'

interface SubcontractorStats {
  total_subcontractors: number
  active_subcontractors: number
  recent_reports: number
  total_reports: number
}

export function SubcontractorPortalCard() {
  const [stats, setStats] = useState<SubcontractorStats>({
    total_subcontractors: 0,
    active_subcontractors: 0,
    recent_reports: 0,
    total_reports: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // In a real implementation, you would fetch subcontractor stats from API
    // For now, we'll use mock data
    const fetchStats = async () => {
      try {
        // Mock data - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500))
        setStats({
          total_subcontractors: 5,
          active_subcontractors: 4,
          recent_reports: 12,
          total_reports: 45
        })
      } catch (error) {
        console.error('Failed to fetch subcontractor stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const handleViewPortal = () => {
    window.open('/subcontractor/login', '_blank')
  }

  const handleManageSubcontractors = () => {
    // In a real implementation, this would navigate to subcontractor management
    // For now, we'll show an alert
    alert('Subcontractor management feature would be implemented here')
  }

  const handleAddSubcontractor = () => {
    // In a real implementation, this would open a form to add new subcontractor
    alert('Add subcontractor feature would be implemented here')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building className="h-5 w-5" />
          <span>Subcontractor Portal</span>
        </CardTitle>
        <CardDescription>
          Manage external subcontractor access and reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Subcontractor Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Subcontractors</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{stats.active_subcontractors} active</Badge>
                <span className="text-sm font-medium">{stats.total_subcontractors}</span>
              </div>
            </div>

            {/* Reports Count */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Reports</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">{stats.recent_reports} this week</Badge>
                <span className="text-sm font-medium">{stats.total_reports}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <Button
            onClick={handleViewPortal}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Portal
          </Button>
          
          <Button
            onClick={handleManageSubcontractors}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Access
          </Button>
          
          <Button
            onClick={handleAddSubcontractor}
            variant="outline"
            size="sm"
            className="w-full justify-start"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Subcontractor
          </Button>
        </div>

        {/* Quick Info */}
        <div className="pt-2 border-t text-xs text-gray-500">
          <p>Subcontractors can submit site reports and access assigned documents</p>
        </div>
      </CardContent>
    </Card>
  )
}