import { renderHook } from '@testing-library/react'
import { useRoleChecks, hasRoleType, getRoleTypes, hasAnyRoleType } from '@/hooks/auth/useRoleChecks'
import { UserProfile } from '@/types/auth'

const createMockProfile = (role: string): UserProfile => ({
  id: '1',
  role: role as any,
  first_name: 'Test',
  last_name: 'User',
  email: 'test@example.com',
  permissions: {},
  is_active: true,
  created_at: '2023-01-01',
  updated_at: '2023-01-01'
})

describe('useRoleChecks', () => {
  it('should return false for all role checks when profile is null', () => {
    const { result } = renderHook(() => useRoleChecks(null))

    expect(result.current.isManagement).toBe(false)
    expect(result.current.isProjectRole).toBe(false)
    expect(result.current.isPurchaseRole).toBe(false)
    expect(result.current.isFieldRole).toBe(false)
    expect(result.current.isExternalRole).toBe(false)
  })

  it('should correctly identify management roles', () => {
    const managementProfile = createMockProfile('management')
    const { result } = renderHook(() => useRoleChecks(managementProfile))

    expect(result.current.isManagement).toBe(true)
    expect(result.current.isProjectRole).toBe(false)
    expect(result.current.isPurchaseRole).toBe(false)
    expect(result.current.isFieldRole).toBe(false)
    expect(result.current.isExternalRole).toBe(false)
  })

  it('should correctly identify technical_lead as management', () => {
    const techLeadProfile = createMockProfile('technical_lead')
    const { result } = renderHook(() => useRoleChecks(techLeadProfile))

    expect(result.current.isManagement).toBe(true)
  })

  it('should correctly identify admin as management', () => {
    const adminProfile = createMockProfile('admin')
    const { result } = renderHook(() => useRoleChecks(adminProfile))

    expect(result.current.isManagement).toBe(true)
  })

  it('should correctly identify project manager roles', () => {
    const pmProfile = createMockProfile('project_manager')
    const { result } = renderHook(() => useRoleChecks(pmProfile))

    expect(result.current.isManagement).toBe(false)
    expect(result.current.isProjectRole).toBe(true)
    expect(result.current.isFieldRole).toBe(true) // PM is also field role
    expect(result.current.isPurchaseRole).toBe(false)
    expect(result.current.isExternalRole).toBe(false)
  })

  it('should correctly identify purchase manager roles', () => {
    const purchaseProfile = createMockProfile('purchase_manager')
    const { result } = renderHook(() => useRoleChecks(purchaseProfile))

    expect(result.current.isManagement).toBe(false)
    expect(result.current.isProjectRole).toBe(false)
    expect(result.current.isPurchaseRole).toBe(true)
    expect(result.current.isFieldRole).toBe(false)
    expect(result.current.isExternalRole).toBe(false)
  })

  it('should correctly identify client roles', () => {
    const clientProfile = createMockProfile('client')
    const { result } = renderHook(() => useRoleChecks(clientProfile))

    expect(result.current.isManagement).toBe(false)
    expect(result.current.isProjectRole).toBe(false)
    expect(result.current.isPurchaseRole).toBe(false)
    expect(result.current.isFieldRole).toBe(false)
    expect(result.current.isExternalRole).toBe(true)
  })
})

describe('hasRoleType utility', () => {
  it('should return false for null profile', () => {
    expect(hasRoleType(null, 'management')).toBe(false)
  })

  it('should correctly check management role type', () => {
    const managementProfile = createMockProfile('management')
    const pmProfile = createMockProfile('project_manager')

    expect(hasRoleType(managementProfile, 'management')).toBe(true)
    expect(hasRoleType(pmProfile, 'management')).toBe(false)
  })
})

describe('getRoleTypes utility', () => {
  it('should return empty array for null profile', () => {
    expect(getRoleTypes(null)).toEqual([])
  })

  it('should return correct role types for management', () => {
    const managementProfile = createMockProfile('management')
    const roleTypes = getRoleTypes(managementProfile)

    expect(roleTypes).toContain('management')
    expect(roleTypes.length).toBe(1)
  })

  it('should return correct role types for project manager', () => {
    const pmProfile = createMockProfile('project_manager')
    const roleTypes = getRoleTypes(pmProfile)

    expect(roleTypes).toContain('project')
    expect(roleTypes).toContain('field')
    expect(roleTypes.length).toBe(2)
  })
})

describe('hasAnyRoleType utility', () => {
  it('should return false for null profile', () => {
    expect(hasAnyRoleType(null, ['management'])).toBe(false)
  })

  it('should return false for empty role types array', () => {
    const profile = createMockProfile('management')
    expect(hasAnyRoleType(profile, [])).toBe(false)
  })

  it('should return true when ANY role type matches (OR logic)', () => {
    const pmProfile = createMockProfile('project_manager')
    
    expect(hasAnyRoleType(pmProfile, ['management', 'project'], false)).toBe(true)
    expect(hasAnyRoleType(pmProfile, ['management', 'purchase'], false)).toBe(false)
  })

  it('should return true when ALL role types match (AND logic)', () => {
    const pmProfile = createMockProfile('project_manager')
    
    expect(hasAnyRoleType(pmProfile, ['project', 'field'], true)).toBe(true)
    expect(hasAnyRoleType(pmProfile, ['project', 'management'], true)).toBe(false)
  })
})