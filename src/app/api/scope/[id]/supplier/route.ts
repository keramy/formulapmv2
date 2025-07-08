import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { z } from 'zod'

const AssignSupplierSchema = z.object({
  supplier_id: z.string().uuid().nullable()
})

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    
    // Verify authentication
    const { user, profile, error: authError } = await verifyAuth(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(profile.role, 'projects.update')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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
      return NextResponse.json({ error: 'Scope item not found' }, { status: 404 })
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
        return NextResponse.json({ error: 'Supplier not found or inactive' }, { status: 400 })
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
      return NextResponse.json({ error: 'Failed to assign supplier' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedScope,
      message: validatedData.supplier_id 
        ? 'Supplier assigned successfully' 
        : 'Supplier unassigned successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input data', details: error.errors }, { status: 400 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    
    // Verify authentication
    const { user, profile, error: authError } = await verifyAuth(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(profile.role, 'projects.read.all')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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
      return NextResponse.json({ error: 'Scope item not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: scopeItem
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}