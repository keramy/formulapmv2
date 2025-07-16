import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReportList } from '@/components/reports/ReportList'
import { ReportBuilder } from '@/components/reports/ReportBuilder'
import { ReportViewer } from '@/components/reports/ReportViewer'
import { ReportTemplateSelector } from '@/components/reports/ReportTemplateSelector'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

// Mock hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'test-user', role: 'project_manager' },
    loading: false,
    error: null,
    getAccessToken: () => 'mock-token',
  }),
}))

vi.mock('@/hooks/useReports', () => ({
  useReports: vi.fn(() => ({
    data: [
      {
        id: '1',
        title: 'Monthly Progress Report',
        type: 'progress',
        status: 'published',
        createdAt: '2025-01-10T10:00:00Z',
        projectName: 'Project A',
        createdBy: 'John Doe',
      },
      {
        id: '2',
        title: 'Financial Summary Q4',
        type: 'financial',
        status: 'draft',
        createdAt: '2025-01-12T14:00:00Z',
        projectName: 'Project B',
        createdBy: 'Jane Smith',
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  
  useReportTemplates: vi.fn(() => ({
    data: [
      {
        id: 'progress-monthly',
        name: 'Monthly Progress Report',
        description: 'Standard monthly progress report template',
        category: 'progress',
        fields: ['summary', 'milestones', 'risks', 'nextSteps'],
      },
      {
        id: 'financial-quarterly',
        name: 'Quarterly Financial Report',
        description: 'Financial summary template',
        category: 'financial',
        fields: ['budget', 'expenses', 'forecast', 'variance'],
      },
    ],
    loading: false,
    error: null,
  })),
  
  createReport: vi.fn(),
  updateReport: vi.fn(),
  deleteReport: vi.fn(),
  generatePDF: vi.fn(),
}))

// Mock file upload
global.fetch = vi.fn()

describe('Reports UI Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ReportList', () => {
    it('renders list of reports with status badges', () => {
      render(<ReportList />)
      
      expect(screen.getByText('Reports')).toBeInTheDocument()
      expect(screen.getByText('Monthly Progress Report')).toBeInTheDocument()
      expect(screen.getByText('Financial Summary Q4')).toBeInTheDocument()
      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('filters reports by type', async () => {
      render(<ReportList />)
      
      const typeFilter = screen.getByRole('combobox', { name: /filter by type/i })
      fireEvent.change(typeFilter, { target: { value: 'progress' } })
      
      await waitFor(() => {
        expect(screen.getByText('Monthly Progress Report')).toBeInTheDocument()
        expect(screen.queryByText('Financial Summary Q4')).not.toBeInTheDocument()
      })
    })

    it('sorts reports by date', async () => {
      render(<ReportList />)
      
      const sortButton = screen.getByRole('button', { name: /sort by/i })
      fireEvent.click(sortButton)
      
      const newestFirst = screen.getByText('Newest First')
      fireEvent.click(newestFirst)
      
      await waitFor(() => {
        const reports = screen.getAllByTestId('report-item')
        expect(reports[0]).toHaveTextContent('Financial Summary Q4')
        expect(reports[1]).toHaveTextContent('Monthly Progress Report')
      })
    })

    it('opens report viewer on click', () => {
      const mockPush = vi.fn()
      vi.mocked(useRouter).mockReturnValue({
        push: mockPush,
        replace: vi.fn(),
        prefetch: vi.fn(),
      } as any)
      
      render(<ReportList />)
      
      const reportItem = screen.getByText('Monthly Progress Report')
      fireEvent.click(reportItem)
      
      expect(mockPush).toHaveBeenCalledWith('/reports/1')
    })

    it('shows create new report button', () => {
      render(<ReportList />)
      
      const createButton = screen.getByRole('button', { name: /create report/i })
      expect(createButton).toBeInTheDocument()
    })
  })

  describe('ReportBuilder', () => {
    const mockTemplate = {
      id: 'progress-monthly',
      name: 'Monthly Progress Report',
      fields: ['summary', 'milestones', 'risks', 'nextSteps'],
    }

    it('renders report builder with template fields', () => {
      render(<ReportBuilder template={mockTemplate} projectId="project-1" />)
      
      expect(screen.getByLabelText('Summary')).toBeInTheDocument()
      expect(screen.getByLabelText('Milestones')).toBeInTheDocument()
      expect(screen.getByLabelText('Risks')).toBeInTheDocument()
      expect(screen.getByLabelText('Next Steps')).toBeInTheDocument()
    })

    it('validates required fields before saving', async () => {
      render(<ReportBuilder template={mockTemplate} projectId="project-1" />)
      
      const saveButton = screen.getByRole('button', { name: /save draft/i })
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(screen.getByText(/summary is required/i)).toBeInTheDocument()
      })
    })

    it('saves report as draft', async () => {
      const mockCreateReport = vi.fn().mockResolvedValue({ id: '3' })
      vi.mocked(useReports).mockReturnValue({
        createReport: mockCreateReport,
      } as any)
      
      render(<ReportBuilder template={mockTemplate} projectId="project-1" />)
      
      fireEvent.change(screen.getByLabelText('Summary'), {
        target: { value: 'Test summary content' },
      })
      
      const saveButton = screen.getByRole('button', { name: /save draft/i })
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(mockCreateReport).toHaveBeenCalledWith({
          templateId: 'progress-monthly',
          projectId: 'project-1',
          status: 'draft',
          content: expect.objectContaining({
            summary: 'Test summary content',
          }),
        })
      })
    })

    it('previews report before publishing', async () => {
      render(<ReportBuilder template={mockTemplate} projectId="project-1" />)
      
      fireEvent.change(screen.getByLabelText('Summary'), {
        target: { value: 'Test summary' },
      })
      
      const previewButton = screen.getByRole('button', { name: /preview/i })
      fireEvent.click(previewButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('report-preview')).toBeInTheDocument()
        expect(screen.getByText('Test summary')).toBeInTheDocument()
      })
    })

    it('supports file attachments', async () => {
      render(<ReportBuilder template={mockTemplate} projectId="project-1" />)
      
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const fileInput = screen.getByLabelText(/attach files/i)
      
      fireEvent.change(fileInput, { target: { files: [file] } })
      
      await waitFor(() => {
        expect(screen.getByText('test.pdf')).toBeInTheDocument()
      })
    })
  })

  describe('ReportViewer', () => {
    const mockReport = {
      id: '1',
      title: 'Monthly Progress Report',
      type: 'progress',
      status: 'published',
      content: {
        summary: 'Project is on track',
        milestones: '3 milestones completed',
        risks: 'No major risks',
        nextSteps: 'Continue as planned',
      },
      attachments: [
        { id: '1', name: 'charts.pdf', size: 1024000, url: '/files/charts.pdf' },
      ],
      createdAt: '2025-01-10T10:00:00Z',
      createdBy: 'John Doe',
    }

    it('renders report content with formatting', () => {
      render(<ReportViewer report={mockReport} />)
      
      expect(screen.getByText('Monthly Progress Report')).toBeInTheDocument()
      expect(screen.getByText('Project is on track')).toBeInTheDocument()
      expect(screen.getByText('3 milestones completed')).toBeInTheDocument()
    })

    it('shows report metadata', () => {
      render(<ReportViewer report={mockReport} />)
      
      expect(screen.getByText('Created by John Doe')).toBeInTheDocument()
      expect(screen.getByText(/January 10, 2025/)).toBeInTheDocument()
    })

    it('displays attachments with download links', () => {
      render(<ReportViewer report={mockReport} />)
      
      const attachment = screen.getByText('charts.pdf')
      expect(attachment).toBeInTheDocument()
      expect(attachment.closest('a')).toHaveAttribute('href', '/files/charts.pdf')
    })

    it('generates PDF on demand', async () => {
      const mockGeneratePDF = vi.fn().mockResolvedValue({
        url: '/api/reports/1/pdf',
      })
      vi.mocked(useReports).mockReturnValue({
        generatePDF: mockGeneratePDF,
      } as any)
      
      render(<ReportViewer report={mockReport} />)
      
      const pdfButton = screen.getByRole('button', { name: /download pdf/i })
      fireEvent.click(pdfButton)
      
      await waitFor(() => {
        expect(mockGeneratePDF).toHaveBeenCalledWith('1')
      })
    })

    it('allows editing for draft reports', () => {
      const draftReport = { ...mockReport, status: 'draft' }
      render(<ReportViewer report={draftReport} />)
      
      expect(screen.getByRole('button', { name: /edit report/i })).toBeInTheDocument()
    })
  })

  describe('ReportTemplateSelector', () => {
    it('renders available templates grouped by category', () => {
      render(<ReportTemplateSelector onSelect={vi.fn()} />)
      
      expect(screen.getByText('Select Report Template')).toBeInTheDocument()
      expect(screen.getByText('Progress Reports')).toBeInTheDocument()
      expect(screen.getByText('Financial Reports')).toBeInTheDocument()
    })

    it('shows template descriptions on hover', async () => {
      render(<ReportTemplateSelector onSelect={vi.fn()} />)
      
      const template = screen.getByText('Monthly Progress Report')
      fireEvent.mouseEnter(template)
      
      await waitFor(() => {
        expect(screen.getByText('Standard monthly progress report template')).toBeInTheDocument()
      })
    })

    it('calls onSelect with template data', () => {
      const mockOnSelect = vi.fn()
      render(<ReportTemplateSelector onSelect={mockOnSelect} />)
      
      const template = screen.getByText('Monthly Progress Report')
      fireEvent.click(template)
      
      expect(mockOnSelect).toHaveBeenCalledWith({
        id: 'progress-monthly',
        name: 'Monthly Progress Report',
        description: 'Standard monthly progress report template',
        category: 'progress',
        fields: ['summary', 'milestones', 'risks', 'nextSteps'],
      })
    })

    it('filters templates by search', async () => {
      render(<ReportTemplateSelector onSelect={vi.fn()} />)
      
      const searchInput = screen.getByPlaceholderText(/search templates/i)
      fireEvent.change(searchInput, { target: { value: 'financial' } })
      
      await waitFor(() => {
        expect(screen.queryByText('Monthly Progress Report')).not.toBeInTheDocument()
        expect(screen.getByText('Quarterly Financial Report')).toBeInTheDocument()
      })
    })

    it('shows preview of template fields', async () => {
      render(<ReportTemplateSelector onSelect={vi.fn()} />)
      
      const previewButton = screen.getAllByRole('button', { name: /preview/i })[0]
      fireEvent.click(previewButton)
      
      await waitFor(() => {
        expect(screen.getByText('Template Fields:')).toBeInTheDocument()
        expect(screen.getByText('Summary')).toBeInTheDocument()
        expect(screen.getByText('Milestones')).toBeInTheDocument()
      })
    })
  })
})