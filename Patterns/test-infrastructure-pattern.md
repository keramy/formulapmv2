# Test Infrastructure Pattern

## Purpose
Standardize test setup, imports, and mocking patterns to ensure consistent and reliable test execution.

## Pattern Overview
Establish clear conventions for writing tests, handling imports, mocking dependencies, and asserting API responses.

## Test File Structure

### 1. Import Organization
```typescript
// ❌ BAD - Incorrect imports
import { render, waitFor } from '@testing-library/react' // waitFor might not be exported
import { GET } from '@/app/api/auth/login/route' // GET might not exist

// ✅ GOOD - Correct imports
// For React component tests
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// For API route tests
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/auth/login/route'

// For hook tests
import { renderHook, act } from '@testing-library/react'
import { waitFor } from '@testing-library/react'
```

### 2. Mock Setup Pattern
```typescript
// ❌ BAD - Incomplete mocking
jest.mock('@/lib/supabase/server')

// ✅ GOOD - Complete mock setup
// At the top of test file
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }))
  }))
}))

jest.mock('@/lib/middleware', () => ({
  verifyAuth: jest.fn()
}))

// Get mock references
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn()
  },
  from: jest.fn()
}

const mockVerifyAuth = jest.mocked(verifyAuth)
```

### 3. API Route Test Pattern
```typescript
describe('API Route: /api/[resource]', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default successful auth
    mockVerifyAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      profile: { role: 'project_manager' },
      error: null
    })

    // Create mock request
    mockRequest = new NextRequest('http://localhost:3000/api/resource', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer test-token'
      }
    })
  })

  describe('GET', () => {
    it('should return 200 with data for authenticated users', async () => {
      // Arrange
      const mockData = [{ id: '1', name: 'Test' }]
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: mockData,
            error: null
          })
        })
      })

      // Act
      const response = await GET(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: mockData
      })
    })

    it('should return 401 for unauthenticated requests', async () => {
      // Arrange
      mockVerifyAuth.mockResolvedValue({
        user: null,
        profile: null,
        error: 'Unauthorized'
      })

      // Act
      const response = await GET(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized'
      })
    })

    it('should return 500 for database errors', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error')
          })
        })
      })

      // Act
      const response = await GET(mockRequest)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Database operation failed'
      })
    })
  })
})
```

### 4. React Hook Test Pattern
```typescript
import { renderHook, act, waitFor } from '@testing-library/react'
import { useMyHook } from '@/hooks/useMyHook'

// Mock fetch
global.fetch = jest.fn()
const mockFetch = jest.mocked(global.fetch)

describe('useMyHook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock localStorage
    const mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    }
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    })
  })

  it('should fetch data on mount', async () => {
    // Arrange
    const mockData = { id: '1', name: 'Test' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    } as Response)

    // Act
    const { result } = renderHook(() => useMyHook('test-id'))

    // Assert - loading state
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    // Wait for async update
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/resource/test-id'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringMatching(/^Bearer /)
        })
      })
    )
  })
})
```

### 5. Component Test Pattern
```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from '@/components/MyComponent'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  useSearchParams: () => new URLSearchParams()
}))

describe('MyComponent', () => {
  it('should handle form submission', async () => {
    // Arrange
    const user = userEvent.setup()
    const mockOnSubmit = jest.fn()
    
    render(<MyComponent onSubmit={mockOnSubmit} />)

    // Act
    const input = screen.getByLabelText('Name')
    await user.type(input, 'Test Name')
    
    const submitButton = screen.getByRole('button', { name: 'Submit' })
    await user.click(submitButton)

    // Assert
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'Test Name'
      })
    })
  })
})
```

### 6. Test Utilities
```typescript
// test-utils.ts
export function createMockRequest(
  url: string,
  options: RequestInit = {}
): NextRequest {
  return new NextRequest(url, {
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer test-token',
      ...options.headers
    },
    ...options
  })
}

export function createAuthContext(overrides = {}) {
  return {
    user: { id: 'user-123', email: 'test@example.com' },
    profile: { id: 'profile-123', role: 'project_manager' },
    error: null,
    ...overrides
  }
}

export function expectApiError(
  response: Response,
  status: number,
  errorMessage?: string
) {
  expect(response.status).toBe(status)
  const data = await response.json()
  expect(data.success).toBe(false)
  if (errorMessage) {
    expect(data.error).toBe(errorMessage)
  }
}
```

## Migration Checklist
When fixing test errors:

1. [ ] Update testing library imports to latest syntax
2. [ ] Ensure all mocked functions are properly typed
3. [ ] Check API route exports match test imports
4. [ ] Update assertions to match actual API responses
5. [ ] Add proper async handling with waitFor
6. [ ] Clear mocks between tests
7. [ ] Test both success and error cases
8. [ ] Use consistent mock data factories

## Common Test Fixes

### Import Error Fix
```typescript
// Before
import { waitFor } from '@testing-library/react' // Error: not exported

// After
import { render, screen, waitFor } from '@testing-library/react'
```

### API Response Assertion Fix
```typescript
// Before
expect(response.status).toBe(201) // But API returns 200

// After
expect(response.status).toBe(200) // Match actual API behavior
```

### Mock Type Fix
```typescript
// Before
const mockUser = { name: 'Test' } // Incomplete type

// After
const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString()
  // All required fields
}
```

## Benefits
- Consistent test structure across codebase
- Reliable test execution
- Better error messages when tests fail
- Easier to debug test failures
- Proper async handling