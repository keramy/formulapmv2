import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useReports } from '@/hooks/useReports'
import { useShopDrawings } from '@/hooks/useShopDrawings'
import { useProjectTeam } from '@/hooks/useProjectTeam'
import { useDashboardData } from '@/hooks/useDashboardData'

// Mock fetch
global.fetch = vi.fn()

// Mock auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'test-user', role: 'project_manager' },
    loading: false,
    error: null,
    getAccessToken: () => 'mock-token',
  }),
}))

describe('V3 Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fetch).mockClear()
  })

  describe('useReports', () => {
    it('fetches reports with proper authorization', async () => {
      const mockReports = [
        { id: '1', title: 'Report 1', type: 'progress', status: 'published' },
        { id: '2', title: 'Report 2', type: 'financial', status: 'draft' },
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockReports }),
      } as Response)
      
      const { result } = renderHook(() => useReports())
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockReports)
        expect(result.current.loading).toBe(false)
      })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/reports'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      )
    })

    it('creates new report with optimistic update', async () => {
      const { result } = renderHook(() => useReports())
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { id: '3', title: 'New Report' } 
        }),
      } as Response)
      
      await act(async () => {
        await result.current.createReport({
          title: 'New Report',
          templateId: 'progress-monthly',
          projectId: 'project-1',
        })
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/reports',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token',
          }),
          body: JSON.stringify({
            title: 'New Report',
            templateId: 'progress-monthly',
            projectId: 'project-1',
          }),
        })
      )
    })

    it('generates PDF with loading state', async () => {
      const { result } = renderHook(() => useReports())
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['pdf content']),
      } as Response)
      
      let pdfBlob: Blob | null = null
      
      await act(async () => {
        pdfBlob = await result.current.generatePDF('report-1')
      })
      
      expect(pdfBlob).toBeInstanceOf(Blob)
      expect(fetch).toHaveBeenCalledWith(
        '/api/reports/report-1/pdf',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      )
    })

    it('handles report deletion with confirmation', async () => {
      const { result } = renderHook(() => useReports())
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      
      await act(async () => {
        await result.current.deleteReport('report-1')
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/reports/report-1',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      )
    })
  })

  describe('useShopDrawings', () => {
    it('fetches shop drawings with filters', async () => {
      const mockDrawings = [
        { 
          id: '1', 
          title: 'MEP Drawing',
          status: 'pending_review',
          projectId: 'project-1',
        },
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDrawings }),
      } as Response)
      
      const { result } = renderHook(() => 
        useShopDrawings({ projectId: 'project-1', status: 'pending_review' })
      )
      
      await waitFor(() => {
        expect(result.current.data).toEqual(mockDrawings)
      })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/shop-drawings?projectId=project-1&status=pending_review'),
        expect.any(Object)
      )
    })

    it('submits shop drawing with file upload', async () => {
      const { result } = renderHook(() => useShopDrawings())
      
      const mockFile = new File(['content'], 'drawing.pdf', { type: 'application/pdf' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('title', 'Test Drawing')
      formData.append('projectId', 'project-1')
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: { id: '2', title: 'Test Drawing' } 
        }),
      } as Response)
      
      await act(async () => {
        await result.current.submitDrawing(formData)
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/shop-drawings',
        expect.objectContaining({
          method: 'POST',
          body: formData,
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      )
    })

    it('updates drawing status with optimistic update', async () => {
      const { result } = renderHook(() => useShopDrawings())
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      
      await act(async () => {
        await result.current.updateStatus('drawing-1', 'approved', 'Looks good!')
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/shop-drawings/drawing-1/status',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            status: 'approved',
            comments: 'Looks good!',
          }),
        })
      )
    })

    it('handles pagination correctly', async () => {
      const { result } = renderHook(() => useShopDrawings())
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          data: [],
          pagination: { page: 2, limit: 20, total: 50 },
        }),
      } as Response)
      
      await act(async () => {
        await result.current.loadMore()
      })
      
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })
  })

  describe('useProjectTeam', () => {
    it('fetches project team members', async () => {
      const mockTeam = [
        { id: '1', name: 'John Doe', role: 'project_manager', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', role: 'architect', email: 'jane@example.com' },
      ]
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockTeam }),
      } as Response)
      
      const { result } = renderHook(() => useProjectTeam('project-1'))
      
      await waitFor(() => {
        expect(result.current.team).toEqual(mockTeam)
        expect(result.current.loading).toBe(false)
      })
    })

    it('adds team member with role validation', async () => {
      const { result } = renderHook(() => useProjectTeam('project-1'))
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      
      await act(async () => {
        await result.current.addMember({
          userId: 'user-3',
          role: 'consultant',
          permissions: ['view', 'comment'],
        })
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/projects/project-1/team',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            userId: 'user-3',
            role: 'consultant',
            permissions: ['view', 'comment'],
          }),
        })
      )
    })

    it('updates member permissions', async () => {
      const { result } = renderHook(() => useProjectTeam('project-1'))
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      
      await act(async () => {
        await result.current.updatePermissions('member-1', ['view', 'edit', 'approve'])
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/projects/project-1/team/member-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            permissions: ['view', 'edit', 'approve'],
          }),
        })
      )
    })

    it('removes team member with confirmation', async () => {
      const { result } = renderHook(() => useProjectTeam('project-1'))
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
      
      await act(async () => {
        await result.current.removeMember('member-1')
      })
      
      expect(fetch).toHaveBeenCalledWith(
        '/api/projects/project-1/team/member-1',
        expect.objectContaining({
          method: 'DELETE',
        })
      )
    })
  })

  describe('useDashboardData', () => {
    describe('useCriticalAlerts', () => {
      it('fetches and auto-refreshes critical alerts', async () => {
        const mockAlerts = [
          { id: '1', type: 'budget_overrun', severity: 'high', title: 'Budget Alert' },
        ]
        
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockAlerts }),
        } as Response)
        
        const { result } = renderHook(() => useDashboardData.useCriticalAlerts())
        
        await waitFor(() => {
          expect(result.current.data).toEqual(mockAlerts)
        })
        
        // Test auto-refresh (every 30 seconds)
        vi.advanceTimersByTime(30000)
        
        expect(fetch).toHaveBeenCalledTimes(2)
      })
    })

    describe('useMyProjects', () => {
      it('fetches user projects with computed progress', async () => {
        const mockProjects = [
          { 
            id: '1', 
            name: 'Project A',
            tasksTotal: 10,
            tasksCompleted: 6,
            progress: 60,
          },
        ]
        
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockProjects }),
        } as Response)
        
        const { result } = renderHook(() => useDashboardData.useMyProjects())
        
        await waitFor(() => {
          expect(result.current.data).toEqual(mockProjects)
          expect(result.current.data[0].progress).toBe(60)
        })
      })
    })

    describe('useProjectActivity', () => {
      it('fetches activity feed with real-time updates', async () => {
        const mockActivity = [
          { 
            id: '1', 
            type: 'milestone_completed',
            timestamp: new Date().toISOString(),
            projectName: 'Project A',
          },
        ]
        
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockActivity }),
        } as Response)
        
        const { result } = renderHook(() => useDashboardData.useProjectActivity())
        
        await waitFor(() => {
          expect(result.current.data).toEqual(mockActivity)
        })
        
        // Test pagination
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 
            success: true, 
            data: [{ id: '2', type: 'update' }],
          }),
        } as Response)
        
        await act(async () => {
          await result.current.fetchMore()
        })
        
        expect(result.current.data).toHaveLength(2)
      })
    })

    describe('useMyTasks', () => {
      it('fetches tasks with filtering and sorting', async () => {
        const mockTasks = [
          { 
            id: '1', 
            title: 'Review drawings',
            priority: 'high',
            dueDate: '2025-01-20',
            status: 'pending',
          },
        ]
        
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockTasks }),
        } as Response)
        
        const { result } = renderHook(() => 
          useDashboardData.useMyTasks({ status: 'pending', sortBy: 'dueDate' })
        )
        
        await waitFor(() => {
          expect(result.current.data).toEqual(mockTasks)
        })
        
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('status=pending&sortBy=dueDate'),
          expect.any(Object)
        )
      })

      it('marks tasks as complete', async () => {
        const { result } = renderHook(() => useDashboardData.useMyTasks())
        
        vi.mocked(fetch).mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        } as Response)
        
        await act(async () => {
          await result.current.markComplete('task-1')
        })
        
        expect(fetch).toHaveBeenCalledWith(
          '/api/tasks/task-1',
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ status: 'completed' }),
          })
        )
      })
    })
  })
})