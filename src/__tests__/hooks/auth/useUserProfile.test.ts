import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserProfile } from '@/hooks/auth/useUserProfile'
import { supabase } from '@/lib/supabase'
import { UserProfile } from '@/types/auth'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          maybeSingle: jest.fn()
        }))
      }))
    }))
  }
}))

const mockProfile: UserProfile = {
  id: 'user-123',
  role: 'project_manager',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  company: 'Test Company',
  department: 'Engineering',
  permissions: {
    'projects.read': true,
    'projects.write': true
  },
  is_active: true,
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z'
}

describe('useUserProfile Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Profile Fetching', () => {
    it('should fetch user profile successfully', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => useUserProfile('user-123'))
      
      expect(result.current.loading).toBe(true)
      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBeNull()
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.profile).toEqual(mockProfile)
        expect(result.current.error).toBeNull()
      })
    })
    
    it('should handle profile not found', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found', code: 'PGRST116' }
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => useUserProfile('user-123'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.profile).toBeNull()
        expect(result.current.error).toBe('Profile not found')
      })
    })
    
    it('should handle database errors', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed', code: 'PGRST301' }
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => useUserProfile('user-123'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.profile).toBeNull()
        expect(result.current.error).toBe('Database connection failed')
      })
    })
    
    it('should handle network errors', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockRejectedValue(new Error('Network error'))
          }))
        }))
      })
      
      const { result } = renderHook(() => useUserProfile('user-123'))
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.profile).toBeNull()
        expect(result.current.error).toBe('Network error')
      })
    })
  })

  describe('User ID Changes', () => {
    it('should refetch profile when user ID changes', async () => {
      const mockSelect = jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null
          })
        }))
      }))
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect
      })
      
      const { result, rerender } = renderHook(
        ({ userId }) => useUserProfile(userId),
        { initialProps: { userId: 'user-123' } }
      )
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Change user ID
      rerender({ userId: 'user-456' })
      
      expect(result.current.loading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Should have called select twice (once for each user ID)
      expect(mockSelect).toHaveBeenCalledTimes(2)
    })
    
    it('should clear profile when user ID becomes null', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result, rerender } = renderHook(
        ({ userId }) => useUserProfile(userId),
        { initialProps: { userId: 'user-123' } }
      )
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Change user ID to null
      rerender({ userId: null })
      
      expect(result.current.loading).toBe(false)
      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBeNull()
    })
    
    it('should clear profile when user ID becomes undefined', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result, rerender } = renderHook(
        ({ userId }) => useUserProfile(userId),
        { initialProps: { userId: 'user-123' } }
      )
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Change user ID to undefined
      rerender({ userId: undefined })
      
      expect(result.current.loading).toBe(false)
      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBeNull()
    })
  })

  describe('Caching Behavior', () => {
    it('should enable caching when specified', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result, rerender } = renderHook(
        ({ useCache }) => useUserProfile('user-123', useCache),
        { initialProps: { useCache: true } }
      )
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Re-render with same parameters should use cache
      rerender({ useCache: true })
      
      // Should still have the profile immediately
      expect(result.current.profile).toEqual(mockProfile)
      expect(result.current.loading).toBe(false)
    })
    
    it('should bypass cache when disabled', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: mockSingle
          }))
        }))
      })
      
      const { result, rerender } = renderHook(
        ({ useCache }) => useUserProfile('user-123', useCache),
        { initialProps: { useCache: false } }
      )
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      // Re-render should fetch again
      rerender({ useCache: false })
      
      expect(result.current.loading).toBe(true)
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      // Should have been called twice
      expect(mockSingle).toHaveBeenCalledTimes(2)
    })
  })

  describe('Loading States', () => {
    it('should show loading state during initial fetch', () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockImplementation(() => new Promise(() => {}))
          }))
        }))
      })
      
      const { result } = renderHook(() => useUserProfile('user-123'))
      
      expect(result.current.loading).toBe(true)
      expect(result.current.profile).toBeNull()
      expect(result.current.error).toBeNull()
    })
    
    it('should show loading state during refetch', async () => {
      let resolveFirst: (value: any) => void
      let resolveSecond: (value: any) => void
      
      const firstPromise = new Promise(resolve => {
        resolveFirst = resolve
      })
      
      const secondPromise = new Promise(resolve => {
        resolveSecond = resolve
      })
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn()
              .mockReturnValueOnce(firstPromise)
              .mockReturnValueOnce(secondPromise)
          }))
        }))
      })
      
      const { result, rerender } = renderHook(
        ({ userId }) => useUserProfile(userId),
        { initialProps: { userId: 'user-123' } }
      )
      
      expect(result.current.loading).toBe(true)
      
      // Resolve first fetch
      await act(async () => {
        resolveFirst({ data: mockProfile, error: null })
        await firstPromise
      })
      
      expect(result.current.loading).toBe(false)
      expect(result.current.profile).toEqual(mockProfile)
      
      // Trigger refetch by changing user ID
      rerender({ userId: 'user-456' })
      
      expect(result.current.loading).toBe(true)
      
      // Resolve second fetch
      await act(async () => {
        resolveSecond({ data: { ...mockProfile, id: 'user-456' }, error: null })
        await secondPromise
      })
      
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Error Recovery', () => {
    it('should retry on transient errors', async () => {
      const mockSingle = jest.fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce({ data: mockProfile, error: null })
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: mockSingle
          }))
        }))
      })
      
      const { result, rerender } = renderHook(() => useUserProfile('user-123'))
      
      // Wait for first attempt to fail
      await waitFor(() => {
        expect(result.current.error).toBe('Network timeout')
        expect(result.current.loading).toBe(false)
      })
      
      // Trigger retry
      rerender()
      
      // Should eventually succeed
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
        expect(result.current.error).toBeNull()
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      let renderCount = 0
      
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null
            })
          }))
        }))
      })
      
      const { result } = renderHook(() => {
        renderCount++
        return useUserProfile('user-123')
      })
      
      await waitFor(() => {
        expect(result.current.profile).toEqual(mockProfile)
      })
      
      const renderCountAfterLoad = renderCount
      
      // Multiple accesses to the same property should not cause re-renders
      const profile1 = result.current.profile
      const profile2 = result.current.profile
      const loading1 = result.current.loading
      const loading2 = result.current.loading
      
      expect(profile1).toBe(profile2)
      expect(loading1).toBe(loading2)
      expect(renderCount).toBe(renderCountAfterLoad)
    })
  })
})
