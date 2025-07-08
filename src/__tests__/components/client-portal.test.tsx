import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClientLoginForm } from '@/components/client-portal/auth/ClientLoginForm'
import { ClientDashboard } from '@/components/client-portal/dashboard/ClientDashboard'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  usePathname: jest.fn(() => '/client-portal'),
}))

// Mock client portal hook
jest.mock('@/hooks/useClientPortal', () => ({
  useClientPortal: jest.fn(() => ({
    user: null,
    profile: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
  })),
}))

// Mock fetch
global.fetch = jest.fn()

describe('Client Portal Components', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset fetch mock
    const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
    mockFetch.mockClear()
  })

  describe('ClientLoginForm', () => {
    it('should render login form fields', () => {
      render(<ClientLoginForm />)
      
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should handle form submission', async () => {
      const mockLogin = jest.fn()
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: mockLogin,
        logout: jest.fn(),
      })

      const user = userEvent.setup()
      render(<ClientLoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'client@example.com')
      await user.type(passwordInput, 'password123')
      await user.click(submitButton)
      
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'client@example.com',
        password: 'password123'
      })
    })

    it('should show validation errors', async () => {
      const user = userEvent.setup()
      render(<ClientLoginForm />)
      
      const submitButton = screen.getByRole('button', { name: /sign in/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument()
        expect(screen.getByText(/password is required/i)).toBeInTheDocument()
      })
    })

    it('should show loading state during login', () => {
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        user: null,
        profile: null,
        loading: true,
        login: jest.fn(),
        logout: jest.fn(),
      })

      render(<ClientLoginForm />)
      
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    })

    it('should handle login errors', async () => {
      const mockLogin = jest.fn().mockRejectedValue(new Error('Invalid credentials'))
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: mockLogin,
        logout: jest.fn(),
      })

      const user = userEvent.setup()
      render(<ClientLoginForm />)
      
      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)
      const submitButton = screen.getByRole('button', { name: /sign in/i })

      await user.type(emailInput, 'client@example.com')
      await user.type(passwordInput, 'wrongpassword')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('ClientDashboard', () => {
    const mockClientData = {
      user: { id: 'client-123', email: 'client@example.com' },
      profile: { 
        id: 'profile-123', 
        company_name: 'Test Company',
        contact_name: 'John Doe' 
      }
    }

    beforeEach(() => {
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        ...mockClientData,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      })
    })

    it('should render client dashboard with user info', () => {
      render(<ClientDashboard />)
      
      expect(screen.getByText('Test Company')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('client@example.com')).toBeInTheDocument()
    })

    it('should fetch and display project data', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          projects: [
            {
              id: 'project-1',
              name: 'Office Renovation',
              status: 'in_progress',
              progress: 65
            },
            {
              id: 'project-2',
              name: 'Warehouse Expansion',
              status: 'planning',
              progress: 20
            }
          ]
        })
      } as Response)

      render(<ClientDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Office Renovation')).toBeInTheDocument()
        expect(screen.getByText('Warehouse Expansion')).toBeInTheDocument()
        expect(screen.getByText('65%')).toBeInTheDocument()
        expect(screen.getByText('20%')).toBeInTheDocument()
      })
    })

    it('should handle project click navigation', async () => {
      const mockRouter = require('next/navigation').useRouter()
      const mockPush = jest.fn()
      mockRouter.mockReturnValue({ push: mockPush })

      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          projects: [
            {
              id: 'project-1',
              name: 'Office Renovation',
              status: 'in_progress',
              progress: 65
            }
          ]
        })
      } as Response)

      const user = userEvent.setup()
      render(<ClientDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Office Renovation')).toBeInTheDocument()
      })

      const projectCard = screen.getByText('Office Renovation')
      await user.click(projectCard)
      
      expect(mockPush).toHaveBeenCalledWith('/client-portal/projects/project-1')
    })

    it('should show recent activities', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          projects: [],
          recent_activities: [
            {
              id: 'activity-1',
              type: 'project_update',
              message: 'Project milestone completed',
              created_at: '2025-07-08T10:00:00Z'
            },
            {
              id: 'activity-2',
              type: 'document_uploaded',
              message: 'New document uploaded',
              created_at: '2025-07-08T09:30:00Z'
            }
          ]
        })
      } as Response)

      render(<ClientDashboard />)
      
      await waitFor(() => {
        expect(screen.getByText('Project milestone completed')).toBeInTheDocument()
        expect(screen.getByText('New document uploaded')).toBeInTheDocument()
      })
    })

    it('should handle logout', async () => {
      const mockLogout = jest.fn()
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        ...mockClientData,
        loading: false,
        login: jest.fn(),
        logout: mockLogout,
      })

      const user = userEvent.setup()
      render(<ClientDashboard />)
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      await user.click(logoutButton)
      
      expect(mockLogout).toHaveBeenCalled()
    })

    it('should redirect to login when not authenticated', () => {
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        user: null,
        profile: null,
        loading: false,
        login: jest.fn(),
        logout: jest.fn(),
      })

      const mockRouter = require('next/navigation').useRouter()
      const mockPush = jest.fn()
      mockRouter.mockReturnValue({ push: mockPush })

      render(<ClientDashboard />)
      
      expect(mockPush).toHaveBeenCalledWith('/client-portal/login')
    })
  })

  describe('Client Portal Integration', () => {
    it('should handle session expiration', async () => {
      const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          error: 'Session expired'
        })
      } as Response)

      const mockLogout = jest.fn()
      const mockClientPortal = require('@/hooks/useClientPortal').useClientPortal
      mockClientPortal.mockReturnValue({
        user: { id: 'client-123', email: 'client@example.com' },
        profile: { id: 'profile-123', company_name: 'Test Company' },
        loading: false,
        login: jest.fn(),
        logout: mockLogout,
      })

      render(<ClientDashboard />)
      
      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled()
      })
    })
  })
})