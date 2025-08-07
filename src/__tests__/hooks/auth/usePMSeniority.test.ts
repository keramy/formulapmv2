import { renderHook } from '@testing-library/react'
import { usePMSeniority, canApproveShopDrawings, filterPMsBySeniority, sortPMsBySeniority } from '@/hooks/auth/usePMSeniority'
import { UserProfile, SeniorityLevel } from '@/types/auth'

const createMockProfile = (
  role: string, 
  seniorityLevel?: SeniorityLevel,
  seniorityInPermissions?: SeniorityLevel
): UserProfile => ({
  id: '1',
  role: role as any,
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  permissions: seniorityInPermissions ? { seniority: seniorityInPermissions } : {},
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  seniority_level: seniorityLevel
})

describe('usePMSeniority', () => {
  it('should return default values for null profile', () => {
    const { result } = renderHook(() => usePMSeniority(null))

    expect(result.current.seniority).toBeUndefined()
    expect(result.current.isPM).toBe(false)
    expect(result.current.hasSeniority).toBe(false)
    expect(result.current.isRegularPM).toBe(false)
    expect(result.current.isSeniorPM).toBe(false)
    expect(result.current.isExecutivePM).toBe(false)
    expect(result.current.seniorityLevel).toBe(0)
    expect(result.current.displayName).toBe('')
    expect(result.current.canApproveShopDrawings).toBe(false)
  })

  it('should return default values for non-PM profile', () => {
    const managementProfile = createMockProfile('management')
    const { result } = renderHook(() => usePMSeniority(managementProfile))

    expect(result.current.seniority).toBeUndefined()
    expect(result.current.isPM).toBe(false)
    expect(result.current.hasSeniority).toBe(false)
  })

  it('should correctly analyze regular PM', () => {
    const regularPM = createMockProfile('project_manager', 'regular')
    const { result } = renderHook(() => usePMSeniority(regularPM))

    expect(result.current.seniority).toBe('regular')
    expect(result.current.isPM).toBe(true)
    expect(result.current.hasSeniority).toBe(true)
    expect(result.current.isRegularPM).toBe(true)
    expect(result.current.isSeniorPM).toBe(false)
    expect(result.current.isExecutivePM).toBe(false)
    expect(result.current.seniorityLevel).toBe(1)
    expect(result.current.displayName).toBe('Project Manager')
    expect(result.current.canApproveShopDrawings).toBe(false)
  })

  it('should correctly analyze senior PM', () => {
    const seniorPM = createMockProfile('project_manager', 'senior')
    const { result } = renderHook(() => usePMSeniority(seniorPM))

    expect(result.current.seniority).toBe('senior')
    expect(result.current.isPM).toBe(true)
    expect(result.current.hasSeniority).toBe(true)
    expect(result.current.isRegularPM).toBe(false)
    expect(result.current.isSeniorPM).toBe(true)
    expect(result.current.isExecutivePM).toBe(false)
    expect(result.current.seniorityLevel).toBe(2)
    expect(result.current.displayName).toBe('Senior PM')
    expect(result.current.canApproveShopDrawings).toBe(true)
  })

  it('should correctly analyze executive PM', () => {
    const executivePM = createMockProfile('project_manager', 'executive')
    const { result } = renderHook(() => usePMSeniority(executivePM))

    expect(result.current.seniority).toBe('executive')
    expect(result.current.isPM).toBe(true)
    expect(result.current.hasSeniority).toBe(true)
    expect(result.current.isRegularPM).toBe(false)
    expect(result.current.isSeniorPM).toBe(false)
    expect(result.current.isExecutivePM).toBe(true)
    expect(result.current.seniorityLevel).toBe(3)
    expect(result.current.displayName).toBe('Executive PM')
    expect(result.current.canApproveShopDrawings).toBe(true)
  })

  it('should fallback to permissions for seniority', () => {
    const pmProfile = createMockProfile('project_manager', undefined, 'senior')
    const { result } = renderHook(() => usePMSeniority(pmProfile))

    expect(result.current.seniority).toBe('senior')
    expect(result.current.isSeniorPM).toBe(true)
  })

  it('should default to regular for PM with no seniority', () => {
    const pmProfile = createMockProfile('project_manager')
    const { result } = renderHook(() => usePMSeniority(pmProfile))

    expect(result.current.seniority).toBe('regular')
    expect(result.current.isRegularPM).toBe(true)
  })

  describe('action methods', () => {
    it('should correctly implement getSeniority', () => {
      const seniorPM = createMockProfile('project_manager', 'senior')
      const { result } = renderHook(() => usePMSeniority(seniorPM))

      expect(result.current.getSeniority()).toBe('senior')
    })

    it('should correctly implement isPMWithSeniority', () => {
      const seniorPM = createMockProfile('project_manager', 'senior')
      const { result } = renderHook(() => usePMSeniority(seniorPM))

      expect(result.current.isPMWithSeniority()).toBe(true)
      expect(result.current.isPMWithSeniority('regular')).toBe(true)
      expect(result.current.isPMWithSeniority('senior')).toBe(true)
      expect(result.current.isPMWithSeniority('executive')).toBe(false)
    })

    it('should correctly implement canPerformAction', () => {
      const seniorPM = createMockProfile('project_manager', 'senior')
      const { result } = renderHook(() => usePMSeniority(seniorPM))

      expect(result.current.canPerformAction('regular')).toBe(true)
      expect(result.current.canPerformAction('senior')).toBe(true)
      expect(result.current.canPerformAction('executive')).toBe(false)
    })

    it('should correctly implement compareSeniority', () => {
      const seniorPM = createMockProfile('project_manager', 'senior')
      const { result } = renderHook(() => usePMSeniority(seniorPM))

      expect(result.current.compareSeniority('regular')).toBe('higher')
      expect(result.current.compareSeniority('senior')).toBe('equal')
      expect(result.current.compareSeniority('executive')).toBe('lower')
    })

    it('should correctly implement hasMinimumSeniority', () => {
      const seniorPM = createMockProfile('project_manager', 'senior')
      const { result } = renderHook(() => usePMSeniority(seniorPM))

      expect(result.current.hasMinimumSeniority('regular')).toBe(true)
      expect(result.current.hasMinimumSeniority('senior')).toBe(true)
      expect(result.current.hasMinimumSeniority('executive')).toBe(false)
    })

    it('should return not_pm for compareSeniority when not a PM', () => {
      const managementProfile = createMockProfile('management')
      const { result } = renderHook(() => usePMSeniority(managementProfile))

      expect(result.current.compareSeniority('senior')).toBe('not_pm')
    })
  })
})

describe('canApproveShopDrawings utility', () => {
  it('should return false for null profile', () => {
    expect(canApproveShopDrawings(null)).toBe(false)
  })

  it('should return false for non-PM profiles', () => {
    const managementProfile = createMockProfile('management')
    expect(canApproveShopDrawings(managementProfile)).toBe(false)
  })

  it('should return false for regular PMs', () => {
    const regularPM = createMockProfile('project_manager', 'regular')
    expect(canApproveShopDrawings(regularPM)).toBe(false)
  })

  it('should return true for senior PMs', () => {
    const seniorPM = createMockProfile('project_manager', 'senior')
    expect(canApproveShopDrawings(seniorPM)).toBe(true)
  })

  it('should return true for executive PMs', () => {
    const executivePM = createMockProfile('project_manager', 'executive')
    expect(canApproveShopDrawings(executivePM)).toBe(true)
  })
})

describe('filterPMsBySeniority utility', () => {
  const regularPM = createMockProfile('project_manager', 'regular')
  const seniorPM = createMockProfile('project_manager', 'senior')
  const executivePM = createMockProfile('project_manager', 'executive')
  const managementProfile = createMockProfile('management')

  const allProfiles = [regularPM, seniorPM, executivePM, managementProfile]

  it('should filter PMs by minimum regular level', () => {
    const result = filterPMsBySeniority(allProfiles, 'regular')
    expect(result).toHaveLength(3)
    expect(result).toContain(regularPM)
    expect(result).toContain(seniorPM)
    expect(result).toContain(executivePM)
    expect(result).not.toContain(managementProfile)
  })

  it('should filter PMs by minimum senior level', () => {
    const result = filterPMsBySeniority(allProfiles, 'senior')
    expect(result).toHaveLength(2)
    expect(result).toContain(seniorPM)
    expect(result).toContain(executivePM)
    expect(result).not.toContain(regularPM)
    expect(result).not.toContain(managementProfile)
  })

  it('should filter PMs by minimum executive level', () => {
    const result = filterPMsBySeniority(allProfiles, 'executive')
    expect(result).toHaveLength(1)
    expect(result).toContain(executivePM)
    expect(result).not.toContain(regularPM)
    expect(result).not.toContain(seniorPM)
    expect(result).not.toContain(managementProfile)
  })
})

describe('sortPMsBySeniority utility', () => {
  const regularPM = { ...createMockProfile('project_manager', 'regular'), id: 'regular' }
  const seniorPM = { ...createMockProfile('project_manager', 'senior'), id: 'senior' }
  const executivePM = { ...createMockProfile('project_manager', 'executive'), id: 'executive' }
  const managementProfile = createMockProfile('management')

  it('should sort PMs by seniority level (highest first)', () => {
    const profiles = [regularPM, seniorPM, executivePM, managementProfile]
    const result = sortPMsBySeniority(profiles)
    
    expect(result).toHaveLength(3) // Only PMs should be included
    expect(result[0].id).toBe('executive')
    expect(result[1].id).toBe('senior')
    expect(result[2].id).toBe('regular')
  })

  it('should handle empty array', () => {
    const result = sortPMsBySeniority([])
    expect(result).toEqual([])
  })

  it('should handle array with no PMs', () => {
    const result = sortPMsBySeniority([managementProfile])
    expect(result).toEqual([])
  })
})