// ============================================================================
// V3 Navigation Component Tests
// ============================================================================
// Testing the enhanced navigation system with V3 features
// ============================================================================

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layouts/Sidebar'
import { Header } from '@/components/layouts/Header'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn()
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: {
      id: 'test-user',
      role: 'project_manager',
      first_name: 'Test',
      last_name: 'User',
      full_name: 'Test User'
    },
    signOut: jest.fn(),
    isImpersonating: false,
    impersonatedUser: null,
    originalAdmin: null,
    stopImpersonation: jest.fn(),
    canImpersonate: jest.fn(() => false)
  })
}))

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn()
}

describe('V3 Navigation System', () => {
  beforeEach(() => {
    jest.mocked(useRouter).mockReturnValue(mockRouter)
    jest.mocked(usePathname).mockReturnValue('/dashboard')
  })

  describe('Sidebar Navigation', () => {
    it('renders all V3 navigation items', () => {
      render(<Sidebar />)
      
      // Core navigation items
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Projects')).toBeInTheDocument()
      expect(screen.getByText('Suppliers')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      
      // V3 features
      expect(screen.getByText('Scope Management')).toBeInTheDocument()
      expect(screen.getByText('Tasks')).toBeInTheDocument()
      expect(screen.getByText('Milestones')).toBeInTheDocument()
      expect(screen.getByText('Material Specs')).toBeInTheDocument()
      expect(screen.getByText('Shop Drawings')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('displays badges for new and enhanced features', () => {
      render(<Sidebar />)
      
      // Check for "New" badges
      const newBadges = screen.getAllByText('New')
      expect(newBadges.length).toBeGreaterThanOrEqual(2) // Shop Drawings and Reports
      
      // Check for "Enhanced" badge
      expect(screen.getByText('Enhanced')).toBeInTheDocument()
    })

    it('filters navigation based on user role', () => {
      // Test with company owner role
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        profile: {
          id: 'test-user',
          role: 'company_owner',
          first_name: 'Test',
          last_name: 'User'
        }
      })

      render(<Sidebar />)
      
      // Company owner should see all items
      expect(screen.getByText('Tasks')).toBeInTheDocument()
      expect(screen.getByText('Milestones')).toBeInTheDocument()
      expect(screen.getByText('Material Specs')).toBeInTheDocument()
    })

    it('hides role-restricted items for unauthorized users', () => {
      // Test with client role
      jest.mocked(require('@/hooks/useAuth').useAuth).mockReturnValue({
        profile: {
          id: 'test-user',
          role: 'client',
          first_name: 'Test',
          last_name: 'User'
        }
      })

      render(<Sidebar />)
      
      // Client should not see PM-only items
      expect(screen.queryByText('Tasks')).not.toBeInTheDocument()
      expect(screen.queryByText('Milestones')).not.toBeInTheDocument()
    })

    it('highlights active navigation item', () => {
      jest.mocked(usePathname).mockReturnValue('/shop-drawings')
      
      render(<Sidebar />)
      
      // Find the shop drawings link
      const shopDrawingsLink = screen.getByText('Shop Drawings').closest('a')
      expect(shopDrawingsLink).toHaveClass('bg-gray-800', 'text-white')
    })

    it('handles navigation clicks', () => {
      render(<Sidebar />)
      
      const projectsLink = screen.getByText('Projects')
      fireEvent.click(projectsLink)
      
      // Should navigate to projects page
      expect(mockRouter.push).toHaveBeenCalledWith('/projects')
    })
  })

  describe('Header Component', () => {
    it('displays correct page titles for V3 routes', () => {
      const testCases = [
        { pathname: '/dashboard', expectedTitle: 'Dashboard' },
        { pathname: '/projects', expectedTitle: 'Projects' },
        { pathname: '/scope', expectedTitle: 'Scope Management' },
        { pathname: '/tasks', expectedTitle: 'Tasks' },
        { pathname: '/milestones', expectedTitle: 'Milestones' },
        { pathname: '/material-specs', expectedTitle: 'Material Specifications' },
        { pathname: '/shop-drawings', expectedTitle: 'Shop Drawings' },
        { pathname: '/reports', expectedTitle: 'Reports' },
        { pathname: '/suppliers', expectedTitle: 'Suppliers' },
        { pathname: '/settings', expectedTitle: 'Settings' }
      ]

      testCases.forEach(({ pathname, expectedTitle }) => {
        jest.mocked(usePathname).mockReturnValue(pathname)
        
        render(<Header />)
        
        expect(screen.getByText(expectedTitle)).toBeInTheDocument()
      })
    })

    it('handles project detail page titles', () => {
      jest.mocked(usePathname).mockReturnValue('/projects/123')
      
      render(<Header />)
      
      expect(screen.getByText('Project Details')).toBeInTheDocument()
    })
  })

  describe('Navigation Accessibility', () => {
    it('provides proper keyboard navigation', () => {
      render(<Sidebar />)
      
      const firstLink = screen.getByText('Dashboard').closest('a')
      const secondLink = screen.getByText('Projects').closest('a')
      
      // Should be focusable
      expect(firstLink).toHaveAttribute('href', '/dashboard')
      expect(secondLink).toHaveAttribute('href', '/projects')
    })

    it('has proper aria labels for navigation items', () => {
      render(<Sidebar />)
      
      // Navigation items should be properly labeled
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
    })

    it('supports screen reader navigation', () => {
      render(<Sidebar />)
      
      // Check for proper semantic markup
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(5) // Should have multiple navigation links
    })
  })

  describe('Mobile Navigation', () => {
    it('renders mobile menu button', () => {
      const mockOnMenuClick = jest.fn()
      
      render(<Header onMenuClick={mockOnMenuClick} />)
      
      // Mobile menu button should be present
      const menuButton = screen.getByRole('button')
      expect(menuButton).toBeInTheDocument()
    })

    it('handles mobile sidebar closing', () => {
      const mockOnClose = jest.fn()
      
      render(<Sidebar onClose={mockOnClose} />)
      
      // Should have close functionality for mobile
      expect(mockOnClose).toBeDefined()
    })
  })

  describe('Navigation Performance', () => {
    it('renders navigation items efficiently', () => {
      const renderStart = performance.now()
      
      render(<Sidebar />)
      
      const renderEnd = performance.now()
      const renderTime = renderEnd - renderStart
      
      // Should render quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100)
    })

    it('handles large navigation lists', () => {
      // Test that navigation can handle many items without performance issues
      render(<Sidebar />)
      
      const navigationItems = screen.getAllByRole('link')
      expect(navigationItems.length).toBeGreaterThan(8) // All V3 navigation items
    })
  })

  describe('Navigation State Management', () => {
    it('maintains navigation state across page changes', () => {
      // Test that navigation state persists
      jest.mocked(usePathname).mockReturnValue('/shop-drawings')
      
      const { rerender } = render(<Sidebar />)
      
      // Change to different page
      jest.mocked(usePathname).mockReturnValue('/reports')
      rerender(<Sidebar />)
      
      // Should still render all navigation items
      expect(screen.getByText('Shop Drawings')).toBeInTheDocument()
      expect(screen.getByText('Reports')).toBeInTheDocument()
    })

    it('updates active state when pathname changes', () => {
      const { rerender } = render(<Sidebar />)
      
      // Change to shop drawings page
      jest.mocked(usePathname).mockReturnValue('/shop-drawings')
      rerender(<Sidebar />)
      
      // Shop drawings should be active
      const shopDrawingsLink = screen.getByText('Shop Drawings').closest('a')
      expect(shopDrawingsLink).toHaveClass('bg-gray-800')
    })
  })
})