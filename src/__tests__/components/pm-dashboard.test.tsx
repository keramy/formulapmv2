import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CriticalAlerts } from '@/app/dashboard/components/pm/CriticalAlerts'
import { MyProjectsOverview } from '@/app/dashboard/components/pm/MyProjectsOverview'
import { MyTasksAndActions } from '@/app/dashboard/components/pm/MyTasksAndActions'
import { RecentProjectActivity } from '@/app/dashboard/components/pm/RecentProjectActivity'
import * as mockHooks from '@/hooks/useDashboardData'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'test-user', role: 'project_manager' },
    loading: false,
    error: null,
  }),
}))

// Mock dashboard data hooks
vi.mock('@/hooks/useDashboardData', () => ({
  useCriticalAlerts: vi.fn(() => ({
    data: [
      {
        id: '1',
        type: 'budget_overrun',
        severity: 'high',
        title: 'Budget exceeded on Project A',
        projectName: 'Project A',
        timestamp: new Date().toISOString(),
        actionRequired: true,
      },
      {
        id: '2',
        type: 'milestone_delay',
        severity: 'medium',
        title: 'Milestone delayed',
        projectName: 'Project B',
        timestamp: new Date().toISOString(),
        actionRequired: false,
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  
  useMyProjects: vi.fn(() => ({
    data: [
      {
        id: '1',
        name: 'Project A',
        status: 'in_progress',
        progress: 65,
        dueDate: '2025-02-15',
        clientName: 'Client A',
        teamSize: 5,
        budget: { used: 75000, total: 100000 },
      },
      {
        id: '2',
        name: 'Project B',
        status: 'planning',
        progress: 20,
        dueDate: '2025-03-01',
        clientName: 'Client B',
        teamSize: 3,
        budget: { used: 15000, total: 80000 },
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  
  useMyTasks: vi.fn(() => ({
    data: [
      {
        id: '1',
        title: 'Review shop drawings',
        projectName: 'Project A',
        priority: 'high',
        dueDate: '2025-01-16',
        status: 'pending',
        type: 'review',
      },
      {
        id: '2',
        title: 'Update project timeline',
        projectName: 'Project B',
        priority: 'medium',
        dueDate: '2025-01-18',
        status: 'in_progress',
        type: 'update',
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  
  useProjectActivity: vi.fn(() => ({
    data: [
      {
        id: '1',
        type: 'shop_drawing_submitted',
        projectName: 'Project A',
        userName: 'John Doe',
        timestamp: new Date().toISOString(),
        description: 'Submitted MEP shop drawings for review',
      },
      {
        id: '2',
        type: 'milestone_completed',
        projectName: 'Project B',
        userName: 'Jane Smith',
        timestamp: new Date().toISOString(),
        description: 'Completed Phase 1 milestone',
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}))

describe('PM Dashboard Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('CriticalAlerts', () => {
    it('renders critical alerts with filtering options', () => {
      render(<CriticalAlerts userId="test-user" />)
      
      expect(screen.getByText('Critical Alerts')).toBeInTheDocument()
      expect(screen.getByText('Budget exceeded on Project A')).toBeInTheDocument()
      expect(screen.getByText('Milestone delayed')).toBeInTheDocument()
    })

    it('filters alerts by severity', async () => {
      render(<CriticalAlerts userId="test-user" />)
      
      const highSeverityButton = screen.getByRole('button', { name: /high/i })
      fireEvent.click(highSeverityButton)
      
      await waitFor(() => {
        expect(screen.getByText('Budget exceeded on Project A')).toBeInTheDocument()
        expect(screen.queryByText('Milestone delayed')).not.toBeInTheDocument()
      })
    })

    it('shows only action required alerts when toggled', async () => {
      render(<CriticalAlerts userId="test-user" />)
      
      const actionRequiredCheckbox = screen.getByRole('checkbox', { name: /action required only/i })
      fireEvent.click(actionRequiredCheckbox)
      
      await waitFor(() => {
        expect(screen.getByText('Budget exceeded on Project A')).toBeInTheDocument()
        expect(screen.queryByText('Milestone delayed')).not.toBeInTheDocument()
      })
    })

    it('handles loading state', () => {
      vi.mocked(mockHooks.useCriticalAlerts).mockReturnValueOnce({
        data: null,
        loading: true,
        error: null,
        refetch: vi.fn(),
      })
      
      render(<CriticalAlerts userId="test-user" />)
      expect(screen.getByTestId('staggered-loader')).toBeInTheDocument()
    })

    it('handles error state', () => {
      vi.mocked(mockHooks.useCriticalAlerts).mockReturnValueOnce({
        data: null,
        loading: false,
        error: 'Failed to load alerts',
        refetch: vi.fn(),
      })
      
      render(<CriticalAlerts userId="test-user" />)
      expect(screen.getByText(/failed to load alerts/i)).toBeInTheDocument()
    })
  })

  describe('MyProjectsOverview', () => {
    it('renders project cards with progress indicators', () => {
      render(<MyProjectsOverview userId="test-user" />)
      
      expect(screen.getByText('My Projects')).toBeInTheDocument()
      expect(screen.getByText('Project A')).toBeInTheDocument()
      expect(screen.getByText('Project B')).toBeInTheDocument()
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('20%')).toBeInTheDocument()
    })

    it('displays budget usage correctly', () => {
      render(<MyProjectsOverview userId="test-user" />)
      
      expect(screen.getByText(/\$75,000 \/ \$100,000/)).toBeInTheDocument()
      expect(screen.getByText(/\$15,000 \/ \$80,000/)).toBeInTheDocument()
    })

    it('navigates to project details on click', () => {
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
      } as any)
      
      render(<MyProjectsOverview userId="test-user" />)
      
      const projectCard = screen.getByText('Project A').closest('div[role="button"]')
      fireEvent.click(projectCard!)
      
      expect(mockPush).toHaveBeenCalledWith('/projects/1')
    })

    it('shows empty state when no projects', () => {
      vi.mocked(mockHooks.useMyProjects).mockReturnValueOnce({
        data: [],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      
      render(<MyProjectsOverview userId="test-user" />)
      expect(screen.getByText(/no active projects/i)).toBeInTheDocument()
    })
  })

  describe('MyTasksAndActions', () => {
    it('renders tasks with priority indicators', () => {
      render(<MyTasksAndActions userId="test-user" />)
      
      expect(screen.getByText('My Tasks & Actions')).toBeInTheDocument()
      expect(screen.getByText('Review shop drawings')).toBeInTheDocument()
      expect(screen.getByText('Update project timeline')).toBeInTheDocument()
    })

    it('filters tasks by status', async () => {
      render(<MyTasksAndActions userId="test-user" />)
      
      const pendingTab = screen.getByRole('tab', { name: /pending/i })
      fireEvent.click(pendingTab)
      
      await waitFor(() => {
        expect(screen.getByText('Review shop drawings')).toBeInTheDocument()
        expect(screen.queryByText('Update project timeline')).not.toBeInTheDocument()
      })
    })

    it('marks task as complete', async () => {
      const mockUpdateTask = vi.fn()
      render(<MyTasksAndActions userId="test-user" />)
      
      const completeButton = screen.getAllByRole('button', { name: /complete/i })[0]
      fireEvent.click(completeButton)
      
      await waitFor(() => {
        expect(mockUpdateTask).toHaveBeenCalledWith('1', { status: 'completed' })
      })
    })

    it('shows overdue tasks with warning', () => {
      vi.mocked(mockHooks.useMyTasks).mockReturnValueOnce({
        data: [
          {
            id: '1',
            title: 'Overdue task',
            projectName: 'Project A',
            priority: 'high',
            dueDate: '2025-01-10', // Past date
            status: 'pending',
            type: 'review',
          },
        ],
        loading: false,
        error: null,
        refetch: vi.fn(),
      })
      
      render(<MyTasksAndActions userId="test-user" />)
      expect(screen.getByText(/overdue/i)).toBeInTheDocument()
    })
  })

  describe('RecentProjectActivity', () => {
    it('renders activity feed with timestamps', () => {
      render(<RecentProjectActivity userId="test-user" />)
      
      expect(screen.getByText('Recent Project Activity')).toBeInTheDocument()
      expect(screen.getByText(/submitted MEP shop drawings/i)).toBeInTheDocument()
      expect(screen.getByText(/completed Phase 1 milestone/i)).toBeInTheDocument()
    })

    it('filters activity by project', async () => {
      render(<RecentProjectActivity userId="test-user" />)
      
      const projectFilter = screen.getByRole('combobox', { name: /filter by project/i })
      fireEvent.change(projectFilter, { target: { value: 'Project A' } })
      
      await waitFor(() => {
        expect(screen.getByText(/submitted MEP shop drawings/i)).toBeInTheDocument()
        expect(screen.queryByText(/completed Phase 1 milestone/i)).not.toBeInTheDocument()
      })
    })

    it('shows activity type icons', () => {
      render(<RecentProjectActivity userId="test-user" />)
      
      expect(screen.getByTestId('shop-drawing-icon')).toBeInTheDocument()
      expect(screen.getByTestId('milestone-icon')).toBeInTheDocument()
    })

    it('loads more activities on scroll', async () => {
      const mockFetchMore = vi.fn()
      vi.mocked(mockHooks.useProjectActivity).mockReturnValueOnce({
        data: Array(20).fill(null).map((_, i) => ({
          id: String(i),
          type: 'update',
          projectName: 'Project',
          userName: 'User',
          timestamp: new Date().toISOString(),
          description: `Activity ${i}`,
        })),
        loading: false,
        error: null,
        refetch: vi.fn(),
        fetchMore: mockFetchMore,
      })
      
      render(<RecentProjectActivity userId="test-user" />)
      
      const container = screen.getByTestId('activity-container')
      fireEvent.scroll(container, { target: { scrollTop: 1000 } })
      
      await waitFor(() => {
        expect(mockFetchMore).toHaveBeenCalled()
      })
    })
  })
})