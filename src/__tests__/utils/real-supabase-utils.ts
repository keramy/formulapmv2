/**
 * Real Supabase Test Utilities
 * 
 * Replaces complex mock infrastructure with real Supabase database operations
 * for reliable, production-like testing.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// ============================================================================
// REAL SUPABASE CLIENT SETUP
// ============================================================================

export function createTestSupabaseClient() {
  // Use local Supabase credentials directly for testing
  const supabaseUrl = 'http://127.0.0.1:54321'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
  
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// ============================================================================
// TEST USER MANAGEMENT
// ============================================================================

export interface TestUser {
  id: string
  email: string
  password: string
  role: string
  first_name: string
  last_name: string
}

export const TEST_USERS: Record<string, TestUser> = {
  project_manager: {
    id: '11111111-1111-4111-8111-111111111111',
    email: 'pm.test@formulapm.com',
    password: 'testpass123',
    role: 'project_manager',
    first_name: 'Project',
    last_name: 'Manager'
  },
  company_owner: {
    id: '22222222-2222-4222-8222-222222222222',
    email: 'owner.test@formulapm.com', 
    password: 'testpass123',
    role: 'company_owner',
    first_name: 'Company',
    last_name: 'Owner'
  },
  general_manager: {
    id: '33333333-3333-4333-8333-333333333333',
    email: 'gm.test@formulapm.com',
    password: 'testpass123',
    role: 'general_manager',
    first_name: 'General',
    last_name: 'Manager'
  },
  client: {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'client.test@formulapm.com',
    password: 'testpass123',
    role: 'client', 
    first_name: 'Test',
    last_name: 'Client'
  },
  architect: {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'architect.test@formulapm.com',
    password: 'testpass123',
    role: 'architect',
    first_name: 'Test', 
    last_name: 'Architect'
  }
}

// ============================================================================
// TEST DATA SEEDING
// ============================================================================

export async function seedTestUser(supabase: ReturnType<typeof createTestSupabaseClient>, userKey: keyof typeof TEST_USERS) {
  const testUser = TEST_USERS[userKey]
  
  // Check if auth user already exists
  const { data: existingUser } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  })
  
  let authUserId = testUser.id
  const existingAuthUser = existingUser?.users.find(u => u.email === testUser.email)
  
  if (existingAuthUser) {
    authUserId = existingAuthUser.id
  } else {
    // Create new auth user and use the generated ID
    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUser.email,
      password: testUser.password,
      email_confirm: true
    })
    
    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }
    
    authUserId = newUser.user!.id
  }
  
  // Create user profile with the correct auth user ID
  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert({
      id: authUserId,
      role: testUser.role as any,
      first_name: testUser.first_name,
      last_name: testUser.last_name,
      email: testUser.email,
      is_active: true
    })
  
  if (profileError) {
    throw new Error(`Failed to create user profile: ${profileError.message}`)
  }
  
  // Return updated test user with correct ID
  return {
    ...testUser,
    id: authUserId
  }
}

export async function seedTestProject(supabase: ReturnType<typeof createTestSupabaseClient>, projectManagerId: string) {
  const testProject = {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    name: 'Test Project 1',
    description: 'Test project for API testing',
    status: 'active' as const,
    project_manager_id: projectManagerId,
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    budget: 100000,
    location: 'Test Location'
  }
  
  const { error } = await supabase
    .from('projects')
    .upsert(testProject)
  
  if (error) {
    throw new Error(`Failed to create test project: ${error.message}`)
  }
  
  return testProject
}

export async function seedTestTask(supabase: ReturnType<typeof createTestSupabaseClient>, projectId: string, assignedTo: string, assignedBy: string) {
  const testTask = {
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    title: 'Test Task 1',
    description: 'Test task for API testing',
    status: 'pending' as const,
    priority: 'medium' as const,
    project_id: projectId,
    assigned_to: assignedTo,
    assigned_by: assignedBy,
    due_date: '2024-12-31',
    estimated_hours: 8,
    tags: ['test', 'api']
  }
  
  const { error } = await supabase
    .from('tasks')
    .upsert(testTask)
  
  if (error) {
    throw new Error(`Failed to create test task: ${error.message}`)
  }
  
  return testTask
}

export async function seedProjectAssignment(supabase: ReturnType<typeof createTestSupabaseClient>, userId: string, projectId: string, assignedBy: string) {
  const assignment = {
    id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    user_id: userId,
    project_id: projectId,
    role: 'team_member' as const,
    assigned_by: assignedBy,
    assigned_at: new Date().toISOString()
  }
  
  const { error } = await supabase
    .from('project_assignments')
    .upsert(assignment)
  
  if (error) {
    throw new Error(`Failed to create project assignment: ${error.message}`)
  }
  
  return assignment
}

// ============================================================================
// AUTHENTICATION UTILITIES
// ============================================================================

export async function signInTestUser(supabase: ReturnType<typeof createTestSupabaseClient>, userKey: keyof typeof TEST_USERS) {
  const testUser = TEST_USERS[userKey]
  
  // For testing, create a mock session without actual auth
  // In real implementation, the API routes will get user info from JWT
  return {
    session: {
      access_token: createMockJWT(testUser),
      refresh_token: 'mock-refresh-token',
      user: {
        id: testUser.id,
        email: testUser.email
      }
    },
    user: {
      id: testUser.id,
      email: testUser.email
    }
  }
}

function createMockJWT(user: TestUser) {
  // Create a simple mock JWT for testing
  // In production, this would be a real JWT from Supabase
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
  const payload = Buffer.from(JSON.stringify({ 
    sub: user.id,
    email: user.email,
    user_role: user.role,
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  })).toString('base64')
  const signature = 'mock-signature'
  
  return `${header}.${payload}.${signature}`
}

export function createAuthenticatedRequest(
  url: string,
  accessToken: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
  } = {}
) {
  const { method = 'GET', body, headers = {} } = options
  
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...headers
    }
  })
}

export function createUnauthenticatedRequest(url: string, options: { method?: string; body?: any } = {}) {
  const { method = 'GET', body } = options
  
  return new NextRequest(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// ============================================================================
// TEST CLEANUP UTILITIES
// ============================================================================

export async function cleanupTestData(supabase: ReturnType<typeof createTestSupabaseClient>) {
  // Delete in reverse dependency order
  await supabase.from('tasks').delete().like('title', 'Test Task%')
  await supabase.from('project_assignments').delete().eq('role', 'team_member')
  await supabase.from('projects').delete().like('name', 'Test Project%')
  await supabase.from('user_profiles').delete().like('email', '%.test@formulapm.com')
  
  // Clean up auth users for test data
  try {
    for (const userKey of Object.keys(TEST_USERS)) {
      const testUser = TEST_USERS[userKey as keyof typeof TEST_USERS]
      await supabase.auth.admin.deleteUser(testUser.id)
    }
  } catch (error) {
    // Ignore errors when deleting non-existent users
    console.log('Note: Some test auth users may not exist during cleanup')
  }
}

// ============================================================================
// TEST SETUP HELPERS
// ============================================================================

export async function setupBasicTestEnvironment(userRole: keyof typeof TEST_USERS = 'project_manager') {
  const supabase = createTestSupabaseClient()
  
  // Clean up any existing test data
  await cleanupTestData(supabase)
  
  // Create test users
  const user = await seedTestUser(supabase, userRole)
  const projectManager = userRole === 'project_manager' ? user : await seedTestUser(supabase, 'project_manager')
  
  // Create test project
  const project = await seedTestProject(supabase, projectManager.id)
  
  // Create project assignment if user is not project manager
  if (userRole !== 'project_manager') {
    await seedProjectAssignment(supabase, user.id, project.id, projectManager.id)
  }
  
  // Sign in the user
  const authData = await signInTestUser(supabase, userRole)
  
  return {
    supabase,
    user,
    project,
    accessToken: authData.session!.access_token,
    cleanup: () => cleanupTestData(supabase)
  }
}

export function createMockContext(params: Record<string, string>) {
  return {
    params: Promise.resolve(params)
  }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function expectValidApiResponse(response: Response, data: any) {
  expect(response.status).toBeGreaterThanOrEqual(200)
  expect(response.status).toBeLessThan(300)
  expect(data.success).toBe(true)
  expect(data.data).toBeDefined()
}

export function expectApiError(response: Response, data: any, expectedStatus: number) {
  expect(response.status).toBe(expectedStatus)
  expect(data.success).toBe(false)
  expect(data.error).toBeDefined()
}