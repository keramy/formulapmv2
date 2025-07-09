# API Error Handling Pattern

## Purpose
Standardize error handling across all API routes to prevent 500 errors and provide consistent responses.

## Pattern Overview
All API routes should follow this error handling structure to ensure reliability and debugging capability.

## Implementation Pattern

### 1. Route Structure
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export async function GET(request: NextRequest) {
  try {
    // 1. Authentication
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // 2. Input validation (if needed)
    // Use Zod schemas for validation

    // 3. Database operations with error handling
    const supabase = createClient()
    const { data, error } = await supabase
      .from('table')
      .select('*')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      )
    }

    // 4. Success response
    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    // 5. Catch-all error handler
    console.error('API route error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
```

### 2. Error Response Format
```typescript
interface ErrorResponse {
  success: false
  error: string
  details?: any // Optional detailed error info for development
}

interface SuccessResponse<T> {
  success: true
  data: T
  metadata?: {
    total?: number
    page?: number
    limit?: number
  }
}
```

### 3. Common Error Handlers
```typescript
// Validation error handler
export function handleValidationError(error: z.ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      details: error.errors
    },
    { status: 400 }
  )
}

// Permission error handler
export function handlePermissionError(required: string) {
  return NextResponse.json(
    {
      success: false,
      error: `Insufficient permissions. Required: ${required}`
    },
    { status: 403 }
  )
}

// Not found error handler
export function handleNotFoundError(resource: string) {
  return NextResponse.json(
    {
      success: false,
      error: `${resource} not found`
    },
    { status: 404 }
  )
}
```

### 4. Database Error Handling
```typescript
// Wrap database operations
async function safeDbOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { data, error } = await operation()
    if (error) {
      console.error('Database error:', error)
      return { data: null, error: 'Database operation failed' }
    }
    return { data, error: null }
  } catch (err) {
    console.error('Unexpected database error:', err)
    return { data: null, error: 'Unexpected database error' }
  }
}
```

## Error Logging Pattern
```typescript
// Centralized error logger
export function logApiError(
  route: string,
  method: string,
  error: any,
  context?: any
) {
  console.error(`[API Error] ${method} ${route}`, {
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error,
    context,
    timestamp: new Date().toISOString()
  })
}

// Usage
logApiError('/api/projects', 'GET', error, { userId: authResult.user.id })
```

## Testing Pattern
```typescript
// Test for proper error handling
describe('API Error Handling', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const response = await GET(mockRequest)
    expect(response.status).toBe(401)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBeDefined()
  })

  it('should return 500 with error message for database failures', async () => {
    // Mock database error
    mockSupabase.from.mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })
    }))

    const response = await GET(mockAuthenticatedRequest)
    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toBe('Database operation failed')
  })
})
```

## Migration Checklist
When fixing existing API routes:

1. [ ] Add try-catch wrapper around entire route handler
2. [ ] Check authentication result properly
3. [ ] Validate input with Zod schemas
4. [ ] Handle database errors explicitly
5. [ ] Use consistent error response format
6. [ ] Add proper error logging
7. [ ] Test error scenarios
8. [ ] Document expected error responses

## Common Pitfalls to Avoid
- Don't expose sensitive error details in production
- Don't return 500 for client errors (use 4xx codes)
- Don't forget to log errors for debugging
- Don't mix error response formats
- Always include `success: false` in error responses