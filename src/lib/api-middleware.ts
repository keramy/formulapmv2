/**
 * API Middleware Utilities - OPTIMIZATION PHASE 2.1
 * Centralized middleware patterns to reduce code duplication
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission, Permission } from '@/lib/permissions'
import { z } from 'zod'

// Standard API response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    has_more: boolean
  }
}

// Higher-order function for API route protection
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, context: { user: any, profile: any }, ...args: T) => Promise<NextResponse>,
  options?: {
    permission?: Permission
    roles?: string[]
    requireProfile?: boolean
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // 1. Authentication check
      const authResult = await verifyAuth(request)
      if (authResult.error) {
        return NextResponse.json(
          { success: false, error: authResult.error },
          { status: 401 }
        )
      }

      const { user, profile } = authResult

      // 2. Profile requirement check
      if (options?.requireProfile !== false && !profile) {
        return NextResponse.json(
          { success: false, error: 'User profile required' },
          { status: 403 }
        )
      }

      // 3. Permission check
      if (options?.permission && profile && !hasPermission(profile.role, options.permission)) {
        return NextResponse.json(
          { success: false, error: `Insufficient permissions. Required: ${options.permission}` },
          { status: 403 }
        )
      }

      // 4. Role check
      if (options?.roles && profile && !options.roles.includes(profile.role)) {
        return NextResponse.json(
          { success: false, error: `Access denied. Required roles: ${options.roles.join(', ')}` },
          { status: 403 }
        )
      }

      // 5. Call the actual handler
      return await handler(request, { user, profile }, ...args)

    } catch (error) {
      console.error('API middleware error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Internal server error' 
        },
        { status: 500 }
      )
    }
  }
}

// Validation middleware
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return function<U extends any[]>(
    handler: (request: NextRequest, validatedData: T, ...args: U) => Promise<NextResponse>
  ) {
    return async (request: NextRequest, ...args: U): Promise<NextResponse> => {
      try {
        const body = await request.json()
        const validatedData = schema.parse(body)
        return await handler(request, validatedData, ...args)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            {
              success: false,
              error: 'Validation failed',
              details: error.errors
            },
            { status: 400 }
          )
        }
        throw error
      }
    }
  }
}

// Enhanced database operation wrapper with detailed error handling
export async function withDatabase<T>(
  operation: (supabase: any) => Promise<{ data: T | null, error: any }>
): Promise<{ data: T | null, error: string | null }> {
  try {
    const supabase = createServerClient()
    const { data, error } = await operation(supabase)

    if (error) {
      // Log detailed error information for debugging
      console.error('Database operation error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })

      // Return user-friendly error messages based on error type
      if (error.code === 'PGRST116') {
        return { data: null, error: 'Record not found' }
      } else if (error.code === 'PGRST302') {
        return { data: null, error: 'Access denied' }
      } else if (error.code?.startsWith('23')) {
        return { data: null, error: 'Data validation error' }
      } else {
        return { data: null, error: 'Database operation failed' }
      }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Database wrapper error:', error)
    return { data: null, error: 'Database connection failed' }
  }
}

// Database health check function
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency: number
  error?: string
}> {
  const startTime = Date.now()

  try {
    const supabase = createServerClient()
    const { error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)

    const latency = Date.now() - startTime

    if (error) {
      return {
        healthy: false,
        latency,
        error: error.message
      }
    }

    return {
      healthy: true,
      latency
    }
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Standard success response
export function createSuccessResponse<T>(
  data: T,
  pagination?: ApiResponse['pagination']
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(pagination && { pagination })
  })
}

// Standard error response
export function createErrorResponse(
  error: string,
  status: number = 500,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details })
    },
    { status }
  )
}

// Query parameter parser
export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    search: searchParams.get('search') || undefined,
    sort_field: searchParams.get('sort_field') || undefined,
    sort_direction: (searchParams.get('sort_direction') || 'asc') as 'asc' | 'desc',
    filters: Object.fromEntries(
      Array.from(searchParams.entries())
        .filter(([key]) => !['page', 'limit', 'search', 'sort_field', 'sort_direction'].includes(key))
    )
  }
}

// Pagination helper
export function createPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    has_more: page * limit < total
  }
}
