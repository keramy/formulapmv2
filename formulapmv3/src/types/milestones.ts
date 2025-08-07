/**
 * Formula PM 2.0 Milestone Types
 * V3 Phase 1 Implementation
 * 
 * Type definitions for milestone tracking system
 */

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'

export interface Milestone {
  id: string
  project_id: string
  name: string
  description?: string
  target_date: string
  actual_date?: string
  status: MilestoneStatus
  created_by?: string
  created_at: string
  updated_at: string
  
  // Relations
  creator?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string
  }
  project?: {
    id: string
    name: string
    status: string
  }
}

export interface MilestoneFormData {
  name: string
  description?: string
  target_date: string
  status: MilestoneStatus
  project_id?: string  // Optional in form, will be added during submission
}

export interface MilestoneFilters {
  status?: MilestoneStatus[]
  search?: string
  target_date_start?: string
  target_date_end?: string
  overdue_only?: boolean
  upcoming_only?: boolean
  completed_only?: boolean
  created_by?: string
}

export interface MilestoneSortOptions {
  field: 'name' | 'target_date' | 'status' | 'created_at'
  direction: 'asc' | 'desc'
}

// Permission types for milestones
export interface MilestonePermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canChangeStatus: boolean
  canViewAll: boolean
}

// Milestone statistics for project dashboard
export interface MilestoneStatistics {
  total: number
  byStatus: Record<MilestoneStatus, number>
  overdue: number
  upcoming: number
  completed: number
  completionRate: number
}

// Calendar view types
export interface MilestoneCalendarEvent {
  id: string
  title: string
  date: Date
  status: MilestoneStatus
  milestone: Milestone
}

// Progress tracking types
export interface MilestoneProgress {
  total: number
  completed: number
  overdue: number
  upcoming: number
  inProgress: number
  cancelled: number
  percentage: number
}