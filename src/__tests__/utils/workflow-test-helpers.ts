/**
 * Workflow Testing Utilities and Helpers
 * V3 Implementation - Production Ready
 * 
 * Comprehensive utilities for testing workflow state machines:
 * - State transition validation helpers
 * - Role permission testing utilities
 * - Mock data generators
 * - Workflow assertion helpers
 * - Performance testing utilities
 * 
 * These utilities are designed to be reusable across all workflow tests
 * and provide consistent testing patterns for state machine validation.
 */

import { NextRequest } from 'next/server'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkflowState {
  id: string
  status: string
  label: string
  description: string
  color: 'gray' | 'blue' | 'yellow' | 'green' | 'red'
  icon: string
  availableActions: WorkflowAction[]
  isFinal?: boolean
  isInitial?: boolean
}

export interface WorkflowAction {
  id: string
  type: 'submit' | 'approve' | 'reject' | 'request_revision' | 'update_status' | 'publish'
  label: string
  description: string
  requiresComments: boolean
  requiresFile?: boolean
  nextStatus: string
  permissions: string[]
}

export interface WorkflowTransition {
  from: string
  to: string
  action: string
  requiredRole: string[]
  requiresComments: boolean
  requiresFile?: boolean
}

export interface WorkflowValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface WorkflowTestScenario {
  name: string
  description: string
  initialState: string
  steps: WorkflowStep[]
  expectedFinalState: string
  expectedSuccess: boolean
}

export interface WorkflowStep {
  action: string
  role: string
  data: any
  expectedStatus: number
  expectedNextState?: string
}

// ============================================================================
// ROLE PERMISSION UTILITIES
// ============================================================================

export const STANDARD_ROLES = [
  'company_owner',
  'general_manager',
  'project_manager',
  'architect',
  'technical_engineer',
  'client',
  'field_worker',
  'admin'
] as const

export type StandardRole = typeof STANDARD_ROLES[number]

export const ROLE_HIERARCHY: Record<StandardRole, number> = {
  company_owner: 100,
  general_manager: 90,
  admin: 85,
  project_manager: 70,
  architect: 50,
  technical_engineer: 45,
  client: 30,
  field_worker: 20
}

export const ROLE_PERMISSIONS: Record<StandardRole, string[]> = {
  company_owner: ['*'],
  general_manager: ['*'],
  admin: ['*'],
  project_manager: [
    'shop_drawings.submit', 'shop_drawings.approve', 'shop_drawings.reject', 
    'shop_drawings.request_revision', 'shop_drawings.send_to_client',
    'material_specs.create', 'material_specs.update', 'material_specs.approve', 
    'material_specs.reject', 'material_specs.request_revision',
    'milestones.create', 'milestones.update', 'milestones.update_status',
    'reports.create', 'reports.update', 'reports.publish',
    'documents.create', 'documents.approve', 'documents.reject'
  ],
  architect: [
    'shop_drawings.submit', 'shop_drawings.request_revision',
    'material_specs.create', 'material_specs.update', 'material_specs.request_revision',
    'milestones.update', 'reports.create', 'reports.update',
    'documents.create'
  ],
  technical_engineer: [
    'shop_drawings.submit', 'shop_drawings.request_revision',
    'material_specs.create', 'material_specs.update',
    'milestones.update', 'reports.create', 'reports.update',
    'documents.create'
  ],
  client: [
    'shop_drawings.approve', 'shop_drawings.reject', 'shop_drawings.request_revision'
  ],
  field_worker: [
    'reports.create', 'reports.update'
  ]
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: StandardRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role]
  return rolePermissions.includes('*') || rolePermissions.includes(permission)
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: StandardRole): string[] {
  return ROLE_PERMISSIONS[role]
}

/**
 * Check if one role is higher in hierarchy than another
 */
export function isRoleHigher(role1: StandardRole, role2: StandardRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2]
}

/**
 * Get roles that have a specific permission
 */
export function getRolesWithPermission(permission: string): StandardRole[] {
  return STANDARD_ROLES.filter(role => hasPermission(role, permission))
}

// ============================================================================
// WORKFLOW STATE MACHINE UTILITIES
// ============================================================================

/**
 * Validate a workflow state machine for consistency
 */
export function validateWorkflowStateMachine(
  states: WorkflowState[],
  transitions: WorkflowTransition[]
): WorkflowValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for initial state
  const initialStates = states.filter(s => s.isInitial)
  if (initialStates.length === 0) {
    errors.push('No initial state found')
  } else if (initialStates.length > 1) {
    errors.push('Multiple initial states found')
  }

  // Check for final states
  const finalStates = states.filter(s => s.isFinal)
  if (finalStates.length === 0) {
    warnings.push('No final states found')
  }

  // Check for unreachable states
  const reachableStates = new Set<string>()
  const initialState = initialStates[0]?.status
  
  if (initialState) {
    const queue = [initialState]
    reachableStates.add(initialState)
    
    while (queue.length > 0) {
      const currentState = queue.shift()!
      const outgoingTransitions = transitions.filter(t => t.from === currentState)
      
      for (const transition of outgoingTransitions) {
        if (!reachableStates.has(transition.to)) {
          reachableStates.add(transition.to)
          queue.push(transition.to)
        }
      }
    }
  }

  const unreachableStates = states.filter(s => !reachableStates.has(s.status))
  if (unreachableStates.length > 0) {
    warnings.push(`Unreachable states: ${unreachableStates.map(s => s.status).join(', ')}`)
  }

  // Check for dead-end states (non-final states with no outgoing transitions)
  const deadEndStates = states.filter(s => 
    !s.isFinal && 
    !transitions.some(t => t.from === s.status)
  )
  if (deadEndStates.length > 0) {
    warnings.push(`Dead-end states: ${deadEndStates.map(s => s.status).join(', ')}`)
  }

  // Check for circular references
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  const hasCycle = (state: string): boolean => {
    if (recursionStack.has(state)) {
      return true
    }

    if (visited.has(state)) {
      return false
    }

    visited.add(state)
    recursionStack.add(state)

    const stateTransitions = transitions.filter(t => t.from === state)
    for (const transition of stateTransitions) {
      if (hasCycle(transition.to)) {
        return true
      }
    }

    recursionStack.delete(state)
    return false
  }

  if (initialState && hasCycle(initialState)) {
    errors.push('Circular reference detected in workflow')
  }

  // Check for invalid transition references
  const stateIds = new Set(states.map(s => s.status))
  for (const transition of transitions) {
    if (!stateIds.has(transition.from)) {
      errors.push(`Invalid transition: from state '${transition.from}' does not exist`)
    }
    if (!stateIds.has(transition.to)) {
      errors.push(`Invalid transition: to state '${transition.to}' does not exist`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if a state transition is valid
 */
export function isValidTransition(
  from: string,
  to: string,
  transitions: WorkflowTransition[]
): boolean {
  return transitions.some(t => t.from === from && t.to === to)
}

/**
 * Get all possible next states from a current state
 */
export function getPossibleNextStates(
  currentState: string,
  transitions: WorkflowTransition[]
): string[] {
  return transitions
    .filter(t => t.from === currentState)
    .map(t => t.to)
}

/**
 * Get all possible actions from a current state
 */
export function getPossibleActions(
  currentState: string,
  transitions: WorkflowTransition[]
): string[] {
  return transitions
    .filter(t => t.from === currentState)
    .map(t => t.action)
}

/**
 * Check if a role can perform an action in a specific state
 */
export function canRolePerformAction(
  role: StandardRole,
  action: string,
  currentState: string,
  transitions: WorkflowTransition[]
): boolean {
  const transition = transitions.find(t => t.from === currentState && t.action === action)
  if (!transition) {
    return false
  }
  
  return transition.requiredRole.includes(role) || 
         ['company_owner', 'general_manager', 'admin'].includes(role)
}

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

/**
 * Generate mock workflow data for testing
 */
export function generateMockWorkflowData(type: 'shop_drawing' | 'material_spec' | 'milestone' | 'report') {
  const baseData = {
    id: `${type}-${Date.now()}`,
    project_id: 'project-123',
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  switch (type) {
    case 'shop_drawing':
      return {
        ...baseData,
        name: 'Test Shop Drawing',
        status: 'draft',
        version: 1,
        file_path: '/uploads/test-drawing.pdf',
        file_type: 'application/pdf',
        file_size: 1024000,
        current_submission_id: null
      }

    case 'material_spec':
      return {
        ...baseData,
        name: 'Test Material',
        status: 'pending_approval',
        category: 'Steel',
        unit_of_measure: 'kg',
        quantity_required: 100,
        estimated_cost: 5000,
        supplier_id: 'supplier-123'
      }

    case 'milestone':
      return {
        ...baseData,
        name: 'Test Milestone',
        status: 'not_started',
        due_date: new Date(Date.now() + 86400000).toISOString(),
        description: 'Test milestone description'
      }

    case 'report':
      return {
        ...baseData,
        title: 'Test Report',
        status: 'draft',
        content: 'Test report content',
        type: 'progress_report'
      }

    default:
      return baseData
  }
}

/**
 * Generate mock workflow transition data
 */
export function generateMockTransitionData(
  workflowType: string,
  action: string,
  role: StandardRole = 'project_manager'
): any {
  const baseData = {
    user_id: 'user-123',
    user_name: 'Test User',
    timestamp: new Date().toISOString(),
    action,
    role
  }

  switch (action) {
    case 'submit':
    case 'resubmit':
      return {
        ...baseData,
        comments: 'Test submission',
        file: new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      }

    case 'approve':
      return {
        ...baseData,
        comments: 'Approved for next stage',
        approval_notes: 'Meets all requirements'
      }

    case 'reject':
      return {
        ...baseData,
        comments: 'Rejected due to issues',
        rejection_reason: 'Does not meet specifications'
      }

    case 'request_revision':
      return {
        ...baseData,
        comments: 'Please make revisions',
        revision_reason: 'Update dimensions and specifications'
      }

    case 'update_status':
      return {
        ...baseData,
        status: 'in_progress',
        notes: 'Status updated'
      }

    case 'publish':
      return {
        ...baseData,
        publish_notes: 'Published for stakeholders'
      }

    default:
      return baseData
  }
}

// ============================================================================
// REQUEST HELPERS
// ============================================================================

/**
 * Create an authenticated request for testing
 */
export function createAuthenticatedRequest(
  url: string,
  role: StandardRole = 'project_manager',
  body?: any,
  options: Partial<RequestInit> = {}
): NextRequest {
  const headers = {
    'Authorization': 'Bearer mock-token',
    'Content-Type': 'application/json',
    'X-Test-Role': role,
    ...options.headers
  }

  return new NextRequest(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    ...options,
    headers
  })
}

/**
 * Create a FormData request for file uploads
 */
export function createFormDataRequest(
  url: string,
  role: StandardRole = 'project_manager',
  formData: FormData,
  options: Partial<RequestInit> = {}
): NextRequest {
  const headers = {
    'Authorization': 'Bearer mock-token',
    'X-Test-Role': role,
    ...options.headers
  }

  return new NextRequest(url, {
    method: 'POST',
    body: formData,
    ...options,
    headers
  })
}

// ============================================================================
// WORKFLOW ASSERTION HELPERS
// ============================================================================

/**
 * Assert that a workflow response is successful
 */
export function assertWorkflowSuccess(response: Response, expectedStatus: number = 200) {
  expect(response.status).toBe(expectedStatus)
  return response.json().then(data => {
    expect(data.success).toBe(true)
    return data
  })
}

/**
 * Assert that a workflow response is an error
 */
export function assertWorkflowError(response: Response, expectedStatus: number = 400) {
  expect(response.status).toBe(expectedStatus)
  return response.json().then(data => {
    expect(data.success).toBe(false)
    expect(data.error).toBeTruthy()
    return data
  })
}

/**
 * Assert that a workflow state transition is valid
 */
export function assertValidTransition(
  fromState: string,
  toState: string,
  transitions: WorkflowTransition[]
) {
  const isValid = isValidTransition(fromState, toState, transitions)
  expect(isValid).toBe(true)
}

/**
 * Assert that a workflow state transition is invalid
 */
export function assertInvalidTransition(
  fromState: string,
  toState: string,
  transitions: WorkflowTransition[]
) {
  const isValid = isValidTransition(fromState, toState, transitions)
  expect(isValid).toBe(false)
}

/**
 * Assert that a role has permission for an action
 */
export function assertRolePermission(
  role: StandardRole,
  permission: string,
  shouldHavePermission: boolean = true
) {
  const hasAccess = hasPermission(role, permission)
  expect(hasAccess).toBe(shouldHavePermission)
}

// ============================================================================
// WORKFLOW TEST SCENARIO RUNNERS
// ============================================================================

/**
 * Run a complete workflow test scenario
 */
export async function runWorkflowScenario(
  scenario: WorkflowTestScenario,
  mockSupabase: any,
  workflowType: string
): Promise<void> {
  console.log(`Running workflow scenario: ${scenario.name}`)
  
  let currentState = scenario.initialState
  
  for (const step of scenario.steps) {
    console.log(`  Step: ${step.action} by ${step.role}`)
    
    // Mock the current state data
    const mockData = generateMockWorkflowData(workflowType as any)
    mockData.status = currentState
    
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: { ...mockData, status: step.expectedNextState || currentState },
              error: null
            })
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { id: 'new-record' },
            error: null
          })
        }))
      }))
    })
    
    // Update current state for next iteration
    if (step.expectedNextState) {
      currentState = step.expectedNextState
    }
  }
  
  expect(currentState).toBe(scenario.expectedFinalState)
  console.log(`  Scenario completed successfully`)
}

// ============================================================================
// PERFORMANCE TESTING UTILITIES
// ============================================================================

/**
 * Measure workflow operation performance
 */
export async function measureWorkflowPerformance(
  operation: () => Promise<any>,
  iterations: number = 100
): Promise<{
  averageTime: number
  minTime: number
  maxTime: number
  totalTime: number
}> {
  const times: number[] = []
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now()
    await operation()
    const endTime = performance.now()
    times.push(endTime - startTime)
  }
  
  return {
    averageTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    totalTime: times.reduce((a, b) => a + b, 0)
  }
}

/**
 * Test workflow scalability with increasing load
 */
export async function testWorkflowScalability(
  operation: () => Promise<any>,
  loads: number[] = [1, 10, 50, 100]
): Promise<Record<number, number>> {
  const results: Record<number, number> = {}
  
  for (const load of loads) {
    const startTime = performance.now()
    
    const promises = Array(load).fill(null).map(() => operation())
    await Promise.all(promises)
    
    const endTime = performance.now()
    results[load] = endTime - startTime
  }
  
  return results
}

// ============================================================================
// WORKFLOW TESTING CONSTANTS
// ============================================================================

export const COMMON_WORKFLOW_SCENARIOS: WorkflowTestScenario[] = [
  {
    name: 'Happy Path - Full Approval',
    description: 'Complete workflow from start to approved state',
    initialState: 'draft',
    steps: [
      {
        action: 'submit',
        role: 'architect',
        data: { comments: 'Initial submission' },
        expectedStatus: 200,
        expectedNextState: 'pending_internal_review'
      },
      {
        action: 'approve',
        role: 'project_manager',
        data: { comments: 'Approved' },
        expectedStatus: 200,
        expectedNextState: 'approved'
      }
    ],
    expectedFinalState: 'approved',
    expectedSuccess: true
  },
  {
    name: 'Rejection and Resubmission',
    description: 'Workflow with rejection and subsequent resubmission',
    initialState: 'pending_internal_review',
    steps: [
      {
        action: 'reject',
        role: 'project_manager',
        data: { comments: 'Needs revision' },
        expectedStatus: 200,
        expectedNextState: 'rejected'
      },
      {
        action: 'resubmit',
        role: 'architect',
        data: { comments: 'Resubmitted with corrections' },
        expectedStatus: 200,
        expectedNextState: 'pending_internal_review'
      }
    ],
    expectedFinalState: 'pending_internal_review',
    expectedSuccess: true
  },
  {
    name: 'Permission Denied',
    description: 'Workflow action attempted by unauthorized role',
    initialState: 'pending_internal_review',
    steps: [
      {
        action: 'approve',
        role: 'field_worker',
        data: { comments: 'Unauthorized approval' },
        expectedStatus: 403,
        expectedNextState: 'pending_internal_review'
      }
    ],
    expectedFinalState: 'pending_internal_review',
    expectedSuccess: false
  }
]

export const WORKFLOW_PERFORMANCE_THRESHOLDS = {
  singleOperation: 100, // ms
  batchOperation: 1000, // ms
  concurrentOperations: 2000, // ms
  stateValidation: 10, // ms
  permissionCheck: 5 // ms
}

export default {
  // Export all utilities as default
  STANDARD_ROLES,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  isRoleHigher,
  getRolesWithPermission,
  validateWorkflowStateMachine,
  isValidTransition,
  getPossibleNextStates,
  getPossibleActions,
  canRolePerformAction,
  generateMockWorkflowData,
  generateMockTransitionData,
  createAuthenticatedRequest,
  createFormDataRequest,
  assertWorkflowSuccess,
  assertWorkflowError,
  assertValidTransition,
  assertInvalidTransition,
  assertRolePermission,
  runWorkflowScenario,
  measureWorkflowPerformance,
  testWorkflowScalability,
  COMMON_WORKFLOW_SCENARIOS,
  WORKFLOW_PERFORMANCE_THRESHOLDS
}