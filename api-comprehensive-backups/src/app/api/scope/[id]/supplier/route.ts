import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const AssignSupplierSchema = z.object({
  supplier_id: z.string().uuid().nullable()
})

export const PUT = withAuth(async (request: NextRequest, { user, profile }, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    
    // Check permission
    if (!hasPermission(profile.role, 'projects.update')) {
      return createErrorResponse('Insufficient permissions', 403)
    }

    const body = await request.json()
    const validatedData = AssignSupplierSchema.parse(body)
    const supabase = createServerClient()

    // Check if scope item exists
    const { data: scopeItem, error: scopeError } = await supabase
      .from('scope_items')
      .select('id, project_id, title, supplier_id')
      .eq('id', id)
      .single()

    if (scopeError || !scopeItem) {
      return createErrorResponse('Scope item not found', 404)
    }

    // If assigning a supplier, verify supplier exists
    if (validatedData.supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id, name, status')
        .eq('id', validatedData.supplier_id)
        .eq('status', 'active')
        .single()

      if (supplierError || !supplier) {
        return createErrorResponse('Supplier not found or inactive', 400)
      }
    }

    // Update scope item with supplier assignment
    const { data: updatedScope, error: updateError } = await supabase
      .from('scope_items')
      .update({
        supplier_id: validatedData.supplier_id,
        last_updated_by: profile.id
      })
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single()

    if (updateError) {
      console.error('Error updating scope item:', updateError)
      return createErrorResponse('Failed to assign supplier', 500)
    }

    return createSuccessResponse({
      ...updatedScope,
      message: validatedData.supplier_id 
        ? 'Supplier assigned successfully' 
        : 'Supplier unassigned successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid input data', 400, error.errors)
    }
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})

export const GET = withAuth(async (request: NextRequest, { user, profile }, context: { params: Promise<{ id: string }> }) => {
  try {
    const { id } = await context.params
    
    // Check permission
    if (!hasPermission(profile.role, 'projects.read.all')) {
      return createErrorResponse('Insufficient permissions', 403)
    }

    const supabase = createServerClient()

    // Get scope item with supplier info
    const { data: scopeItem, error: scopeError } = await supabase
      .from('scope_items')
      .select(`
        id,
        title,
        supplier_id,
        supplier:suppliers(
          id,
          name,
          contact_person,
          email,
          phone,
          specialties
        )
      `)
      .eq('id', id)
      .single()

    if (scopeError || !scopeItem) {
      return createErrorResponse('Scope item not found', 404)
    }

    return createSuccessResponse(scopeItem)

  } catch (error) {
    console.error('Unexpected error:', error)
    return createErrorResponse('Internal server error', 500)
  }
})