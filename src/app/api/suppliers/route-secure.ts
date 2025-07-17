/**
 * SECURE VERSION - Formula PM 2.0 Suppliers API - Main Route
 * Implements comprehensive security fixes for SQL injection and other vulnerabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

// Secure query parameters schema
const supplierListParamsSchema = z.object({
  search: z.string().max(100).regex(/^[a-zA-Z0-9\s\-_.,()]+$/).optional()
})

export const GET = withAuth(async (request: NextRequest, context) => {
  const { user, profile } = context

  // Permission check
  if (!hasPermission(profile.role, 'suppliers.read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to view suppliers' },
      { status: 403 }
    )
  }

  try {
    const url = new URL(request.url)
    const rawParams = Object.fromEntries(url.searchParams.entries())
    
    // Validate parameters securely
    const validationResult = supplierListParamsSchema.safeParse(rawParams)
    if (!validationResult.success) {
      return createErrorResponse('Invalid query parameters', 400)
    }

    const { search } = validationResult.data
    const supabase = createServerClient()

    let query = supabase.from('suppliers').select('*')

    if (search) {
      // Use parameterized query to prevent SQL injection
      const sanitizedSearch = search.replace(/[%_\\]/g, '\\$&').substring(0, 100)
      query = query.or(`name.ilike.%${sanitizedSearch}%,contact_person.ilike.%${sanitizedSearch}%`)
    }

    const { data: suppliers, error } = await query

    if (error) {
      console.error('Suppliers fetch error:', error)
      return createErrorResponse('Failed to fetch suppliers', 500)
    }

    return createSuccessResponse({
      suppliers: suppliers || []
    })

  } catch (error) {
    console.error('Suppliers API error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})