/**
 * Formula PM 2.0 Milestones Tab Component
 * V3 Phase 1 Implementation
 * 
 * Milestone management tab for project workspace
 */

'use client'

import { useState } from 'react'
import { useMilestones } from '@/hooks/useMilestones'
import { MilestoneList } from '@/components/milestones/MilestoneList'
import { MilestoneForm } from '@/components/milestones/MilestoneForm'
import { MilestoneCalendar } from '@/components/milestones/MilestoneCalendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Target, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react'
import { Milestone, MilestoneFormData, MilestoneFilters } from '@/types/milestones'

interface MilestonesTabProps {
  projectId: string
}

export function MilestonesTab({ projectId }: MilestonesTabProps) {
  const [filters, setFilters] = useState<MilestoneFilters>({})
  const [activeView, setActiveView] = useState<'list' | 'calendar'>('list')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null)

  const {
    milestones,
    statistics,
    loading,
    error,
    permissions,
    createMilestone,
    updateMilestone,
    deleteMilestone,
    updateMilestoneStatus,
    bulkUpdateMilestones,
    refetch
  } = useMilestones(projectId, filters)

  const handleCreateMilestone = async (data: MilestoneFormData) => {
    try {
      const newMilestone = await createMilestone(data)
      if (newMilestone) {
        setCreateDialogOpen(false)
        // Show success message could be added here
      }
    } catch (error) {
      console.error('Error creating milestone:', error)
      // Error is already handled in the hook and will be displayed in the UI
    }
  }

  const handleEditMilestone = async (milestone: Milestone) => {
    setEditingMilestone(milestone)
  }

  const handleUpdateMilestone = async (data: MilestoneFormData) => {
    if (!editingMilestone) return
    
    try {
      const updatedMilestone = await updateMilestone(editingMilestone.id, data)
      if (updatedMilestone) {
        setEditingMilestone(null)
        // Show success message could be added here
      }
    } catch (error) {
      console.error('Error updating milestone:', error)
      // Error is already handled in the hook and will be displayed in the UI
    }
  }

  const handleDeleteMilestone = async (milestone: Milestone) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        const success = await deleteMilestone(milestone.id)
        if (success) {
          // Show success message could be added here
        }
      } catch (error) {
        console.error('Error deleting milestone:', error)
        // Error is already handled in the hook and will be displayed in the UI
      }
    }
  }

  const handleStatusChange = async (milestoneId: string, status: Milestone['status']) => {
    try {
      await updateMilestoneStatus(milestoneId, status)
    } catch (error) {
      console.error('Error updating milestone status:', error)
      // Error is already handled in the hook and will be displayed in the UI
    }
  }

  const handleBulkUpdate = async (milestoneIds: string[], updates: any) => {
    try {
      await bulkUpdateMilestones(milestoneIds, updates)
    } catch (error) {
      console.error('Error bulk updating milestones:', error)
      // Error is already handled in the hook and will be displayed in the UI
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6" />
            Project Milestones
          </h2>
          <p className="text-gray-600">Track project progress and key deliverables</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveView(activeView === 'list' ? 'calendar' : 'list')}
          >
            {activeView === 'list' ? (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                List View
              </>
            )}
          </Button>
          
          {permissions.canCreate && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Milestone
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Milestone</DialogTitle>
                </DialogHeader>
                <MilestoneForm
                  projectId={projectId}
                  mode="create"
                  onSave={handleCreateMilestone}
                  onCancel={() => setCreateDialogOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4" />
                Total Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total}</div>
              <div className="text-sm text-gray-600">Project milestones</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.completed}</div>
              <div className="text-sm text-gray-600">
                {statistics.completionRate}% completion rate
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.byStatus.in_progress}</div>
              <div className="text-sm text-gray-600">Currently active</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Overdue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
              <div className="text-sm text-gray-600">Require attention</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'list' | 'calendar')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">
            <Target className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          <MilestoneList
            milestones={milestones}
            loading={loading}
            permissions={permissions}
            onCreateMilestone={permissions.canCreate ? () => setCreateDialogOpen(true) : undefined}
            onEditMilestone={permissions.canEdit ? handleEditMilestone : undefined}
            onDeleteMilestone={permissions.canDelete ? handleDeleteMilestone : undefined}
            onStatusChange={permissions.canChangeStatus ? handleStatusChange : undefined}
            onBulkUpdate={permissions.canEdit ? handleBulkUpdate : undefined}
            initialFilters={filters}
            showBulkActions={permissions.canEdit}
            showProgress={true}
          />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <MilestoneCalendar
            milestones={milestones}
            onMilestoneSelect={setSelectedMilestone}
            onDateSelect={(date) => {
              // Handle date selection for creating milestone
              if (permissions.canCreate) {
                setCreateDialogOpen(true)
              }
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Edit Milestone Dialog */}
      {editingMilestone && (
        <Dialog open={!!editingMilestone} onOpenChange={(open) => !open && setEditingMilestone(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Milestone</DialogTitle>
            </DialogHeader>
            <MilestoneForm
              milestone={editingMilestone}
              projectId={projectId}
              mode="edit"
              onSave={handleUpdateMilestone}
              onCancel={() => setEditingMilestone(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Milestone Details Dialog */}
      {selectedMilestone && (
        <Dialog open={!!selectedMilestone} onOpenChange={(open) => !open && setSelectedMilestone(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {selectedMilestone.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{selectedMilestone.status}</Badge>
                <div className="text-sm text-gray-600">
                  Target: {new Date(selectedMilestone.target_date).toLocaleDateString()}
                </div>
              </div>
              
              {selectedMilestone.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedMilestone.description}</p>
                </div>
              )}
              
              <div className="flex items-center gap-4 pt-4 border-t">
                {permissions.canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingMilestone(selectedMilestone)
                      setSelectedMilestone(null)
                    }}
                  >
                    Edit Milestone
                  </Button>
                )}
                
                {permissions.canChangeStatus && selectedMilestone.status !== 'completed' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedMilestone.id, 'completed')
                      setSelectedMilestone(null)
                    }}
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}