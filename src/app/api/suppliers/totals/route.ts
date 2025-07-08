import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, profile, error: authError } = await verifyAuth(request)
    if (authError || !user || !profile) {
      return NextResponse.json({ error: authError || 'Authentication required' }, { status: 401 })
    }

    // Check permission
    if (!hasPermission(profile.role, 'projects.read.all')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const url = new URL(request.url)
    const projectId = url.searchParams.get('project_id')
    
    const supabase = createServerClient()

    // Build query to get supplier totals from scope items
    let query = supabase
      .from('scope_items')
      .select(`
        supplier_id,
        total_price,
        actual_cost,
        suppliers!inner(
          id,
          name,
          contact_person,
          email,
          specialties
        )
      `)
      .not('supplier_id', 'is', null)

    // Filter by project if specified
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data: scopeItems, error } = await query

    if (error) {
      console.error('Error fetching scope items:', error)
      return NextResponse.json({ error: 'Failed to fetch supplier totals' }, { status: 500 })
    }

    // Calculate totals per supplier
    const supplierTotals = new Map()

    scopeItems?.forEach((item: any) => {
      if (item.supplier_id && item.suppliers) {
        const supplier = item.suppliers
        const existing = supplierTotals.get(item.supplier_id) || {
          id: item.supplier_id,
          name: supplier.name,
          contact_person: supplier.contact_person,
          email: supplier.email,
          specialties: supplier.specialties,
          total_estimated: 0,
          total_actual: 0,
          item_count: 0
        }

        existing.total_estimated += item.total_price || 0
        existing.total_actual += item.actual_cost || 0
        existing.item_count += 1

        supplierTotals.set(item.supplier_id, existing)
      }
    })

    const totalsArray = Array.from(supplierTotals.values()).sort((a, b) => 
      b.total_estimated - a.total_estimated
    )

    return NextResponse.json({
      success: true,
      data: totalsArray,
      summary: {
        total_suppliers: totalsArray.length,
        grand_total_estimated: totalsArray.reduce((sum, s) => sum + s.total_estimated, 0),
        grand_total_actual: totalsArray.reduce((sum, s) => sum + s.total_actual, 0),
        total_scope_items: totalsArray.reduce((sum, s) => sum + s.item_count, 0)
      }
    })

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}