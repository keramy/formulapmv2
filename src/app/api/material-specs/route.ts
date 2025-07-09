/**
 * Formula PM 2.0 Material Specifications API - Main Route
 * V3 Phase 1 Implementation
 * 
 * Handles material specification listing, creation, and bulk operations with role-based access control
 * Following exact patterns from tasks API for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMaterialSpecFormData,
  validateMaterialSpecListParams,
  validateMaterialSpecPermissions,
  validateMaterialSpecAccess,
  calculateMaterialAvailabilityStatus,
  calculateMaterialCostVariance,
  calculateDaysUntilDelivery
} from '@/lib/validation/material-specs'
import { MaterialSpec, MaterialSpecFilters, MaterialSpecStatistics } from '@/types/material-specs'

// ============================================================================
// GET /api/material-specs - List material specifications with filtering and pagination
// ============================================================================

export async function GET(request: NextRequest) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'projects.read.all') && 
      !hasPermission(profile.role, 'projects.read.assigned') &&
      !hasPermission(profile.role, 'projects.read.own')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to view material specifications' },
      { status: 403 }
    )
  }

  try {
    const url = new URL(request.url)
    const queryParams = {
      page: parseInt(url.searchParams.get('page') || '1'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      include_project: url.searchParams.get('include_project') === 'true',
      include_supplier: url.searchParams.get('include_supplier') === 'true',
      include_creator: url.searchParams.get('include_creator') === 'true',
      include_approver: url.searchParams.get('include_approver') === 'true',
      include_scope_items: url.searchParams.get('include_scope_items') === 'true',
      project_id: url.searchParams.get('project_id') || undefined,
      filters: {
        status: url.searchParams.get('status')?.split(',') as any || undefined,
        priority: url.searchParams.get('priority')?.split(',') as any || undefined,
        category: url.searchParams.get('category')?.split(',') || undefined,
        supplier_id: url.searchParams.get('supplier_id') || undefined,
        search: url.searchParams.get('search') || undefined,
        created_by: url.searchParams.get('created_by') || undefined,
        approved_by: url.searchParams.get('approved_by') || undefined,
        delivery_date_start: url.searchParams.get('delivery_date_start') || undefined,
        delivery_date_end: url.searchParams.get('delivery_date_end') || undefined,
        cost_range: url.searchParams.get('cost_min') || url.searchParams.get('cost_max') ? {
          min: url.searchParams.get('cost_min') ? parseFloat(url.searchParams.get('cost_min')!) : undefined,
          max: url.searchParams.get('cost_max') ? parseFloat(url.searchParams.get('cost_max')!) : undefined
        } : undefined,
        quantity_range: url.searchParams.get('quantity_min') || url.searchParams.get('quantity_max') ? {
          min: url.searchParams.get('quantity_min') ? parseInt(url.searchParams.get('quantity_min')!) : undefined,
          max: url.searchParams.get('quantity_max') ? parseInt(url.searchParams.get('quantity_max')!) : undefined
        } : undefined,
        overdue_only: url.searchParams.get('overdue_only') === 'true',
        approval_required_only: url.searchParams.get('approval_required_only') === 'true',
        low_stock_only: url.searchParams.get('low_stock_only') === 'true',
        has_supplier: url.searchParams.get('has_supplier') === 'true',
        has_delivery_date: url.searchParams.get('has_delivery_date') === 'true',
        scope_item_id: url.searchParams.get('scope_item_id') || undefined
      },
      sort: url.searchParams.get('sort_field') ? {
        field: url.searchParams.get('sort_field') as any,
        direction: (url.searchParams.get('sort_direction') || 'asc') as 'asc' | 'desc'
      } : undefined
    }

    // Validate parameters
    const validationResult = validateMaterialSpecListParams(queryParams)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid parameters',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Build base query
    let query = supabase
      .from('material_specs')
      .select(`
        *,
        ${queryParams.include_project ? 'project:projects!project_id(id, name, status),' : ''}
        ${queryParams.include_supplier ? 'supplier:suppliers!supplier_id(id, name, email, phone, contact_person),' : ''}
        ${queryParams.include_creator ? 'creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url),' : ''}
        ${queryParams.include_approver ? 'approver:user_profiles!approved_by(id, first_name, last_name, email, avatar_url),' : ''}
        ${queryParams.include_scope_items ? 'scope_items:scope_material_links!material_spec_id(id, quantity_needed, notes, scope_item:scope_items!scope_item_id(id, item_no, title, description)),' : ''}
        project_id
      `, { count: 'exact' })

    // Apply role-based filtering for project access
    if (!hasPermission(profile.role, 'projects.read.all')) {
      // Get accessible projects for this user
      const accessibleProjects = await getAccessibleProjects(supabase, user)
      if (accessibleProjects.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            material_specs: [],
            statistics: getEmptyStatistics()
          },
          pagination: {
            page: 1,
            limit: queryParams.limit,
            total: 0,
            has_more: false
          }
        })
      }
      query = query.in('project_id', accessibleProjects)
    }

    // Apply project filter if specified
    if (queryParams.project_id) {
      // Verify user has access to this project
      const hasProjectAccess = await verifyProjectAccess(supabase, user, queryParams.project_id)
      if (!hasProjectAccess) {
        return NextResponse.json(
          { success: false, error: 'Access denied to this project' },
          { status: 403 }
        )
      }
      query = query.eq('project_id', queryParams.project_id)
    }

    // Apply filters
    const filters = queryParams.filters
    if (filters) {
      if (filters.status?.length) {
        query = query.in('status', filters.status)
      }

      if (filters.priority?.length) {
        query = query.in('priority', filters.priority)
      }

      if (filters.category?.length) {
        query = query.in('category', filters.category)
      }

      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,category.ilike.%${filters.search}%,brand.ilike.%${filters.search}%`)
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by)
      }

      if (filters.approved_by) {
        query = query.eq('approved_by', filters.approved_by)
      }

      if (filters.delivery_date_start) {
        query = query.gte('delivery_date', filters.delivery_date_start)
      }

      if (filters.delivery_date_end) {
        query = query.lte('delivery_date', filters.delivery_date_end)
      }

      if (filters.cost_range) {
        if (filters.cost_range.min !== undefined) {
          query = query.gte('estimated_cost', filters.cost_range.min)
        }
        if (filters.cost_range.max !== undefined) {
          query = query.lte('estimated_cost', filters.cost_range.max)
        }
      }

      if (filters.quantity_range) {
        if (filters.quantity_range.min !== undefined) {
          query = query.gte('quantity_required', filters.quantity_range.min)
        }
        if (filters.quantity_range.max !== undefined) {
          query = query.lte('quantity_required', filters.quantity_range.max)
        }
      }

      if (filters.scope_item_id) {
        query = query.eq('scope_material_links.scope_item_id', filters.scope_item_id)
      }

      // Handle exclusive filters
      if (filters.overdue_only) {
        const today = new Date().toISOString().split('T')[0]
        query = query
          .lt('delivery_date', today)
          .not('status', 'in', ['approved', 'discontinued'])
      }

      if (filters.approval_required_only) {
        query = query.eq('status', 'pending_approval')
      }

      if (filters.low_stock_only) {
        query = query.lt('quantity_available', 'minimum_stock_level')
      }

      if (filters.has_supplier) {
        query = query.not('supplier_id', 'is', null)
      }

      if (filters.has_delivery_date) {
        query = query.not('delivery_date', 'is', null)
      }
    }

    // Apply sorting
    if (queryParams.sort) {
      query = query.order(queryParams.sort.field, { ascending: queryParams.sort.direction === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Apply pagination
    const from = (queryParams.page - 1) * queryParams.limit
    const to = from + queryParams.limit - 1
    query = query.range(from, to)

    const { data: materialSpecs, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Material specs fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch material specifications' },
        { status: 500 }
      )
    }

    // Calculate additional fields for material specs
    const enhancedMaterialSpecs = materialSpecs?.map(spec => {
      const availabilityStatus = calculateMaterialAvailabilityStatus(
        (spec as any).quantity_required,
        (spec as any).quantity_available,
        (spec as any).minimum_stock_level
      )
      
      const costVariance = calculateMaterialCostVariance(
        (spec as any).estimated_cost,
        (spec as any).actual_cost
      )
      
      const isOverdue = (spec as any).delivery_date && 
        new Date((spec as any).delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes((spec as any).status)
      
      const daysUntilDelivery = (spec as any).delivery_date ? 
        calculateDaysUntilDelivery((spec as any).delivery_date) : null
      
      const approvalRequired = (spec as any).status === 'pending_approval'
      
      return {
        ...(spec as any),
        availability_status: availabilityStatus,
        cost_variance: costVariance,
        is_overdue: isOverdue,
        days_until_delivery: daysUntilDelivery,
        approval_required: approvalRequired,
        project: queryParams.include_project ? (spec as any).project : undefined,
        supplier: queryParams.include_supplier ? (spec as any).supplier : undefined,
        creator: queryParams.include_creator ? (spec as any).creator : undefined,
        approver: queryParams.include_approver ? (spec as any).approver : undefined,
        scope_items: queryParams.include_scope_items ? (spec as any).scope_items : undefined
      }
    }) || []

    // Calculate statistics
    const statistics = await calculateMaterialSpecStatistics(
      supabase,
      queryParams.project_id,
      queryParams.filters,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        material_specs: enhancedMaterialSpecs,
        statistics
      },
      pagination: {
        page: queryParams.page,
        limit: queryParams.limit,
        total: count || 0,
        has_more: queryParams.page * queryParams.limit < (count || 0)
      }
    })

  } catch (error) {
    console.error('Material specs API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/material-specs - Create new material specification
// ============================================================================

export async function POST(request: NextRequest) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'create')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to create material specifications' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    
    // Validate material spec data
    const validationResult = validateMaterialSpecFormData(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid material specification data',
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const materialSpecData = validationResult.data
    const supabase = createServerClient()

    // Verify user has access to the project
    const hasProjectAccess = await verifyProjectAccess(supabase, user, materialSpecData.project_id)
    if (!hasProjectAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this project' },
        { status: 403 }
      )
    }

    // Check if project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name, status')
      .eq('id', materialSpecData.project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Verify supplier exists if provided
    if (materialSpecData.supplier_id) {
      const { data: supplier, error: supplierError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('id', materialSpecData.supplier_id)
        .single()

      if (supplierError || !supplier) {
        return NextResponse.json(
          { success: false, error: 'Supplier not found' },
          { status: 404 }
        )
      }
    }

    // Verify scope items exist if provided
    if (materialSpecData.scope_item_ids?.length) {
      const { data: scopeItems, error: scopeError } = await supabase
        .from('scope_items')
        .select('id')
        .in('id', materialSpecData.scope_item_ids)
        .eq('project_id', materialSpecData.project_id)

      if (scopeError || !scopeItems || scopeItems.length !== materialSpecData.scope_item_ids.length) {
        return NextResponse.json(
          { success: false, error: 'One or more scope items not found in this project' },
          { status: 404 }
        )
      }
    }

    // Prepare material spec data
    const insertData = {
      project_id: materialSpecData.project_id,
      supplier_id: materialSpecData.supplier_id || null,
      name: materialSpecData.name,
      description: materialSpecData.description || null,
      category: materialSpecData.category,
      subcategory: materialSpecData.subcategory || null,
      brand: materialSpecData.brand || null,
      model: materialSpecData.model || null,
      specifications: materialSpecData.specifications || {},
      unit_of_measure: materialSpecData.unit_of_measure,
      estimated_cost: materialSpecData.estimated_cost || null,
      quantity_required: materialSpecData.quantity_required,
      quantity_available: 0,
      minimum_stock_level: materialSpecData.minimum_stock_level || 0,
      status: materialSpecData.status || 'pending_approval',
      priority: materialSpecData.priority || 'medium',
      lead_time_days: materialSpecData.lead_time_days || 0,
      delivery_date: materialSpecData.delivery_date || null,
      created_by: user.id
    }

    const { data: materialSpec, error: insertError } = await supabase
      .from('material_specs')
      .insert(insertData)
      .select(`
        *,
        project:projects!project_id(id, name, status),
        supplier:suppliers!supplier_id(id, name, email, phone, contact_person),
        creator:user_profiles!created_by(id, first_name, last_name, email, avatar_url)
      `)
      .single()

    if (insertError) {
      console.error('Material spec creation error:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create material specification' },
        { status: 500 }
      )
    }

    // Create scope item links if provided
    if (materialSpecData.scope_item_ids?.length) {
      const linkData = materialSpecData.scope_item_ids.map(scopeItemId => ({
        scope_item_id: scopeItemId,
        material_spec_id: materialSpec.id,
        quantity_needed: materialSpecData.quantity_required,
        notes: null
      }))

      const { error: linkError } = await supabase
        .from('scope_material_links')
        .insert(linkData)

      if (linkError) {
        console.error('Scope material link creation error:', linkError)
        // Don't fail the whole operation, just log the error
      }
    }

    // Add computed fields
    const enhancedMaterialSpec = {
      ...materialSpec,
      availability_status: calculateMaterialAvailabilityStatus(
        materialSpec.quantity_required,
        materialSpec.quantity_available,
        materialSpec.minimum_stock_level
      ),
      cost_variance: calculateMaterialCostVariance(
        materialSpec.estimated_cost,
        materialSpec.actual_cost
      ),
      is_overdue: materialSpec.delivery_date && 
        new Date(materialSpec.delivery_date) < new Date() && 
        !['approved', 'discontinued'].includes(materialSpec.status),
      days_until_delivery: materialSpec.delivery_date ? 
        calculateDaysUntilDelivery(materialSpec.delivery_date) : null,
      approval_required: materialSpec.status === 'pending_approval'
    }

    return NextResponse.json({
      success: true,
      message: 'Material specification created successfully',
      data: {
        material_spec: enhancedMaterialSpec
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Material spec creation API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: any): Promise<string[]> {
  if (hasPermission(user.profile?.role || user.role, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(user.profile?.role || user.role, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(user.profile?.role || user.role, 'projects.read.own') && (user.profile?.role || user.role) === 'client') {
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.profile?.id)
    return clientProjects?.map((p: any) => p.id) || []
  }

  return []
}

async function verifyProjectAccess(supabase: any, user: any, projectId: string): Promise<boolean> {
  const accessibleProjects = await getAccessibleProjects(supabase, user)
  return accessibleProjects.includes(projectId)
}

async function calculateMaterialSpecStatistics(
  supabase: any,
  projectId?: string,
  filters?: MaterialSpecFilters,
  userId?: string
): Promise<MaterialSpecStatistics> {
  let query = supabase.from('material_specs').select('*')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  // Apply filters if provided
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority)
    }
    if (filters.category?.length) {
      query = query.in('category', filters.category)
    }
    if (filters.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }
    if (filters.approved_by) {
      query = query.eq('approved_by', filters.approved_by)
    }
    if (filters.delivery_date_start) {
      query = query.gte('delivery_date', filters.delivery_date_start)
    }
    if (filters.delivery_date_end) {
      query = query.lte('delivery_date', filters.delivery_date_end)
    }
  }

  const { data: materialSpecs } = await query

  if (!materialSpecs) {
    return getEmptyStatistics()
  }

  const today = new Date().toISOString().split('T')[0]
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  const stats: MaterialSpecStatistics = {
    total: materialSpecs.length,
    byStatus: {
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      revision_required: 0,
      discontinued: 0,
      substitution_required: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    byCategory: {},
    totalEstimatedCost: 0,
    totalActualCost: 0,
    costVariance: 0,
    overdue: 0,
    approvalRequired: 0,
    lowStock: 0,
    outOfStock: 0,
    deliveryThisWeek: 0,
    deliveryThisMonth: 0,
    averageLeadTime: 0,
    supplierCount: 0
  }

  const uniqueSuppliers = new Set<string>()
  let totalLeadTime = 0

  materialSpecs.forEach((spec: any) => {
    // Count by status
    stats.byStatus[spec.status as keyof typeof stats.byStatus]++

    // Count by priority
    stats.byPriority[spec.priority as keyof typeof stats.byPriority]++

    // Count by category
    if (spec.category) {
      stats.byCategory[spec.category] = (stats.byCategory[spec.category] || 0) + 1
    }

    // Calculate costs
    if (spec.estimated_cost) {
      stats.totalEstimatedCost += spec.estimated_cost * spec.quantity_required
    }
    if (spec.actual_cost) {
      stats.totalActualCost += spec.actual_cost * spec.quantity_required
    }

    // Count specific categories
    if (spec.status === 'pending_approval') {
      stats.approvalRequired++
    }

    if (spec.delivery_date && spec.delivery_date < today && !['approved', 'discontinued'].includes(spec.status)) {
      stats.overdue++
    }

    if (spec.delivery_date && spec.delivery_date >= today && spec.delivery_date <= weekFromNow) {
      stats.deliveryThisWeek++
    }

    if (spec.delivery_date && spec.delivery_date >= today && spec.delivery_date <= monthFromNow) {
      stats.deliveryThisMonth++
    }

    if (spec.quantity_available < spec.minimum_stock_level) {
      stats.lowStock++
    }

    if (spec.quantity_available === 0) {
      stats.outOfStock++
    }

    if (spec.supplier_id) {
      uniqueSuppliers.add(spec.supplier_id)
    }

    if (spec.lead_time_days > 0) {
      totalLeadTime += spec.lead_time_days
    }
  })

  // Calculate derived statistics
  stats.supplierCount = uniqueSuppliers.size
  stats.averageLeadTime = materialSpecs.length > 0 ? totalLeadTime / materialSpecs.length : 0
  stats.costVariance = stats.totalEstimatedCost > 0 ? 
    ((stats.totalActualCost - stats.totalEstimatedCost) / stats.totalEstimatedCost) * 100 : 0

  return stats
}

function getEmptyStatistics(): MaterialSpecStatistics {
  return {
    total: 0,
    byStatus: {
      pending_approval: 0,
      approved: 0,
      rejected: 0,
      revision_required: 0,
      discontinued: 0,
      substitution_required: 0
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    },
    byCategory: {},
    totalEstimatedCost: 0,
    totalActualCost: 0,
    costVariance: 0,
    overdue: 0,
    approvalRequired: 0,
    lowStock: 0,
    outOfStock: 0,
    deliveryThisWeek: 0,
    deliveryThisMonth: 0,
    averageLeadTime: 0,
    supplierCount: 0
  }
}