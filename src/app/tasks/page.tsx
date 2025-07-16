// ============================================================================
// Tasks Management - Standalone Page
// ============================================================================
// V3 Feature: Task management with assignment and tracking
// Note: This is the standalone page for task management functionality
// ============================================================================

'use client'

import React from 'react'
import { TaskList } from '@/components/tasks/TaskList'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function TasksPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            Manage and track tasks across all projects
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Task
        </Button>
      </div>

      {/* Tasks Interface */}
      <TaskList 
        tasks={[]} 
        permissions={{
          canCreate: true,
          canEdit: true,
          canDelete: true,
          canAssign: true,
          canChangeStatus: true
        }}
      />
    </div>
  )
}