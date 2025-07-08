import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardStats } from '@/app/dashboard/components/DashboardStats'
import { QuickActions } from '@/app/dashboard/components/QuickActions'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/dashboard'),
}))

// Mock auth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    profile: { id: 'profile-123', role: 'project_manager' },
    loading: false,
  })),
}))

// Mock permissions hook
jest.mock('@/hooks/usePermissions', () => ({
  usePermissions: jest.fn(() => ({
    hasPermission: jest.fn(() => true),
    loading: false,
  })),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Dashboard Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset fetch mock
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
  })

  describe('DashboardStats', () => {
    it('should render loading state', () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<DashboardStats />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render stats cards with data', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            total_projects: 12,
            active_projects: 8,
            total_scope_items: 145,
            total_budget: 850000,
            completed_projects: 4,
            pending_approvals: 6
          }
        })
      } as Response)

      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('12')).toBeInTheDocument() // Total projects
        expect(screen.getByText('8')).toBeInTheDocument() // Active projects
        expect(screen.getByText('145')).toBeInTheDocument() // Total scope items
        expect(screen.getByText('$850,000')).toBeInTheDocument() // Total budget
      })
    })

    it('should handle API errors gracefully', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({
          success: false,
          error: 'Failed to fetch stats'
        })
      } as Response)

      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('Error loading stats')).toBeInTheDocument()
      })
    })

    it('should format currency values correctly', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            total_projects: 5,
            active_projects: 3,
            total_scope_items: 50,
            total_budget: 1234567.89,
            completed_projects: 2,
            pending_approvals: 1
          }
        })
      } as Response)

      render(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('$1,234,568')).toBeInTheDocument() // Rounded currency
      })
    })
  })

  describe('QuickActions', () => {
    it('should render available actions', () => {
      render(<QuickActions />)
      
      expect(screen.getByText('Create Project')).toBeInTheDocument()
      expect(screen.getByText('Add Scope Item')).toBeInTheDocument()
      expect(screen.getByText('Manage Suppliers')).toBeInTheDocument()
      expect(screen.getByText('View Reports')).toBeInTheDocument()
    })

    it('should handle action clicks with navigation', async () => {
      const mockRouter = require('next/navigation').useRouter()
      const mockPush = jest.fn()
      mockRouter.mockReturnValue({ push: mockPush })

      const user = userEvent.setup()
      render(<QuickActions />)
      
      const createProjectButton = screen.getByText('Create Project')
      await user.click(createProjectButton)
      
      expect(mockPush).toHaveBeenCalledWith('/projects/create')
    })

    it('should respect user permissions', () => {
      const mockPermissions = require('@/hooks/usePermissions').usePermissions
      mockPermissions.mockReturnValue({
        hasPermission: jest.fn((permission) => permission !== 'projects.create'),
        loading: false,
      })

      render(<QuickActions />)
      
      // Should not show Create Project button without permission
      expect(screen.queryByText('Create Project')).not.toBeInTheDocument()
      
      // Should still show other actions
      expect(screen.getByText('View Reports')).toBeInTheDocument()
    })

    it('should show loading state when permissions are loading', () => {
      const mockPermissions = require('@/hooks/usePermissions').usePermissions
      mockPermissions.mockReturnValue({
        hasPermission: jest.fn(() => true),
        loading: true,
      })

      render(<QuickActions />)
      
      expect(screen.getByText('Loading actions...')).toBeInTheDocument()
    })
  })

  describe('Dashboard Integration', () => {
    it('should handle auth state changes', async () => {
      const mockAuth = require('@/hooks/useAuth').useAuth
      
      // Initially no user
      mockAuth.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
      })

      const { rerender } = render(<DashboardStats />)
      
      expect(screen.getByText('Authentication required')).toBeInTheDocument()
      
      // User logs in
      mockAuth.mockReturnValue({
        user: { id: 'user-123', email: 'test@example.com' },
        profile: { id: 'profile-123', role: 'project_manager' },
        loading: false,
      })

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            total_projects: 5,
            active_projects: 3,
            total_scope_items: 25,
            total_budget: 100000,
            completed_projects: 2,
            pending_approvals: 1
          }
        })
      } as Response)

      rerender(<DashboardStats />)
      
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument() // Total projects
      })
    })
  })
})