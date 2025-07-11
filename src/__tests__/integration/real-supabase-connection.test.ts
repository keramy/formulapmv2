/**
 * Test Supabase connection and user creation
 */

import { setupBasicTestEnvironment, cleanupTestData, createTestSupabaseClient } from '../utils/real-supabase-utils'

describe('Real Supabase Connection', () => {
  let cleanup: () => Promise<void>

  afterEach(async () => {
    if (cleanup) {
      await cleanup()
    }
  })

  test('should create test environment successfully', async () => {
    const { supabase, user, project, accessToken, cleanup: cleanupFn } = await setupBasicTestEnvironment('project_manager')
    cleanup = cleanupFn

    expect(user).toBeDefined()
    expect(user.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/) // Valid UUID
    expect(user.email).toBe('pm.test@formulapm.com')
    expect(user.role).toBe('project_manager')
    expect(project).toBeDefined()
    expect(project.project_manager_id).toBe(user.id)
    expect(accessToken).toBeDefined()
  })

  test('should connect to local Supabase instance', async () => {
    const supabase = createTestSupabaseClient()
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count(*)')
      .limit(1)

    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
})