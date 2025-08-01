/**
 * Formula PM 2.0 Material Specifications API - Statistics Endpoint
 * V3 Phase 1 Implementation
 * 
 * Handles material specification statistics and analytics
 * Following exact patterns from tasks/statistics API for consistency
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'
import { 
  validateMaterialSpecStatisticsParams,
  validateMaterialSpecPermissions
} from '@/lib/validation/material-specs'
import { MaterialSpecStatistics } from '@/types/material-specs'

// ============================================================================
// GET /api/material-specs/statistics - Get material specifications statistics
// ============================================================================

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  if (!user || !profile) {
    return createErrorResponse('Authentication required', 401)
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'read')) {
    return createErrorResponse('Insufficient permissions to view material specification statistics' , 403)
  }

  try {
    const url = new URL(request.url)
    const queryParams = {
      project_id: url.searchParams.get('project_id') || undefined,
      date_range: url.searchParams.get('date_start') && url.searchParams.get('date_end') ? {
        start: url.searchParams.get('date_start')!,
        end: url.searchParams.get('date_end')!
      } : undefined,
      include_costs: url.searchParams.get('include_costs') !== 'false',
      include_delivery_performance: url.searchParams.get('include_delivery_performance') !== 'false',
      group_by: (url.searchParams.get('group_by') || 'status') as any
    }

    // Validate parameters
    const validationResult = validateMaterialSpecStatisticsParams(queryParams)
    if (!validationResult.success) {
      return createErrorResponse('Invalid statistics parameters', 400, {
        details: validationResult.error.issues
      })
    }

    const supabase = createServerClient()

    // Verify project access if project_id is provided
    if (queryParams.project_id) {
      const hasProjectAccess = await verifyProjectAccess(supabase, user, queryParams.project_id)
      if (!hasProjectAccess) {
        return createErrorResponse('Access denied to this project' , 403)
      }
    }

    // Get accessible projects for this user
    const accessibleProjects = await getAccessibleProjects(supabase, user)
    
    // Calculate comprehensive statistics
    const statistics = await calculateComprehensiveMaterialSpecStatistics(
      supabase,
      queryParams,
      accessibleProjects,
      user.id
    )

    // Calculate trends if requested
    const trends = await calculateMaterialSpecTrends(
      supabase,
      queryParams,
      accessibleProjects,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        trends
      }
    })

  } catch (error) {
    console.error('Material spec statistics API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// POST /api/material-specs/statistics - Get custom statistics with filters
// ============================================================================

export const POST = withAuth(async (request: NextRequest, { user, profile }) => {
,
      { status: 401 }
    )
  }

  // Permission check
  if (!validateMaterialSpecPermissions(profile.role, 'read')) {
    return createErrorResponse('Insufficient permissions to view material specification statistics' , 403)
  }

  try {
    const body = await request.json()
    
    // Validate parameters
    const validationResult = validateMaterialSpecStatisticsParams(body)
    if (!validationResult.success) {
      return createErrorResponse('Invalid statistics parameters', 400, {
        details: validationResult.error.issues
      })
    }

    const params = validationResult.data
    const supabase = createServerClient()

    // Verify project access if project_id is provided
    if (params.project_id) {
      const hasProjectAccess = await verifyProjectAccess(supabase, user, params.project_id)
      if (!hasProjectAccess) {
        return createErrorResponse('Access denied to this project' , 403)
      }
    }

    // Get accessible projects for this user
    const accessibleProjects = await getAccessibleProjects(supabase, user)
    
    // Calculate comprehensive statistics with custom filters
    const statistics = await calculateComprehensiveMaterialSpecStatistics(
      supabase,
      params,
      accessibleProjects,
      user.id
    )

    // Calculate trends
    const trends = await calculateMaterialSpecTrends(
      supabase,
      params,
      accessibleProjects,
      user.id
    )

    // Calculate grouped statistics if requested
    const groupedStats = await calculateGroupedStatistics(
      supabase,
      params,
      accessibleProjects,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: {
        statistics,
        trends,
        grouped: groupedStats
      }
    })

  } catch (error) {
    console.error('Material spec custom statistics API error:', error)
    return createErrorResponse('Internal server error' , 500)
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function getAccessibleProjects(supabase: any, user: { id: string; role: string; profile?: any }): Promise<string[]> {
  if (hasPermission(user.role as any, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(user.role as any, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(user.role as any, 'projects.read.own') && user.role === 'client') {
    const { data: clientProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('client_id', user.profile?.id)
    return clientProjects?.map((p: any) => p.id) || []
  }

  return []
}

async function verifyProjectAccess(supabase: any, user: { id: string; role: string; profile?: any }, projectId: string): Promise<boolean> {
  const accessibleProjects = await getAccessibleProjects(supabase, user)
  return accessibleProjects.includes(projectId)
}

async function calculateComprehensiveMaterialSpecStatistics(
  supabase: any,
  params: { project_id?: string; date_range?: { start: string; end: string }; include_costs?: boolean; include_delivery_performance?: boolean; group_by?: string },
  accessibleProjects: string[],
  userId: string
): Promise<MaterialSpecStatistics> {
  let query = supabase.from('material_specs').select('*')
  
  // Apply project filtering
  if (params.project_id) {
    query = query.eq('project_id', params.project_id)
  } else if (accessibleProjects.length > 0) {
    query = query.in('project_id', accessibleProjects)
  } else {
    // No accessible projects, return empty stats
    return getEmptyStatistics()
  }

  // Apply date range filtering
  if (params.date_range) {
    query = query
      .gte('created_at', params.date_range.start)
      .lte('created_at', params.date_range.end)
  }

  const { data: materialSpecs } = await query

  if (!materialSpecs || materialSpecs.length === 0) {
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
  let leadTimeCount = 0

  materialSpecs.forEach((spec: any) => {
    // Count by status
    stats.byStatus[spec.status as keyof typeof stats.byStatus]++

    // Count by priority
    stats.byPriority[spec.priority as keyof typeof stats.byPriority]++

    // Count by category
    if (spec.category) {
      stats.byCategory[spec.category] = (stats.byCategory[spec.category] || 0) + 1
    }

    // Calculate costs if requested
    if (params.include_costs) {
      if (spec.estimated_cost) {
        stats.totalEstimatedCost += spec.estimated_cost * spec.quantity_required
      }
      if (spec.actual_cost) {
        stats.totalActualCost += spec.actual_cost * spec.quantity_required
      }
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
      leadTimeCount++
    }
  })

  // Calculate derived statistics
  stats.supplierCount = uniqueSuppliers.size
  stats.averageLeadTime = leadTimeCount > 0 ? totalLeadTime / leadTimeCount : 0
  
  if (params.include_costs) {
    stats.costVariance = stats.totalEstimatedCost > 0 ? 
      ((stats.totalActualCost - stats.totalEstimatedCost) / stats.totalEstimatedCost) * 100 : 0
  }

  return stats
}

async function calculateMaterialSpecTrends(
  supabase: any,
  params: { project_id?: string; date_range?: { start: string; end: string }; include_costs?: boolean; include_delivery_performance?: boolean; group_by?: string },
  accessibleProjects: string[],
  userId: string
): Promise<any> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Calculate approval rates
  const approvalRates = await calculateApprovalRates(supabase, params, accessibleProjects, sevenDaysAgo, thirtyDaysAgo)
  
  // Calculate cost trends
  const costTrends = await calculateCostTrends(supabase, params, accessibleProjects, thirtyDaysAgo)
  
  // Calculate delivery performance
  const deliveryPerformance = await calculateDeliveryPerformance(supabase, params, accessibleProjects)

  return {
    approval_rate_7_days: approvalRates.sevenDays,
    approval_rate_30_days: approvalRates.thirtyDays,
    cost_trend: costTrends.trend,
    delivery_performance: deliveryPerformance.performance
  }
}

async function calculateApprovalRates(
  supabase: any,
  params: { project_id?: string },
  accessibleProjects: string[],
  sevenDaysAgo: string,
  thirtyDaysAgo: string
): Promise<{ sevenDays: number; thirtyDays: number }> {
  let query7Days = supabase
    .from('material_specs')
    .select('status')
    .gte('created_at', sevenDaysAgo)
    
  let query30Days = supabase
    .from('material_specs')
    .select('status')
    .gte('created_at', thirtyDaysAgo)

  if (params.project_id) {
    query7Days = query7Days.eq('project_id', params.project_id)
    query30Days = query30Days.eq('project_id', params.project_id)
  } else if (accessibleProjects.length > 0) {
    query7Days = query7Days.in('project_id', accessibleProjects)
    query30Days = query30Days.in('project_id', accessibleProjects)
  }

  const { data: specs7Days } = await query7Days
  const { data: specs30Days } = await query30Days

  const calculateRate = (specs: any[]) => {
    if (!specs || specs.length === 0) return 0
    const approved = specs.filter(s => s.status === 'approved').length
    return (approved / specs.length) * 100
  }

  return {
    sevenDays: calculateRate(specs7Days),
    thirtyDays: calculateRate(specs30Days)
  }
}

async function calculateCostTrends(
  supabase: any,
  params: { project_id?: string },
  accessibleProjects: string[],
  thirtyDaysAgo: string
): Promise<{ trend: 'increasing' | 'decreasing' | 'stable' }> {
  let query = supabase
    .from('material_specs')
    .select('estimated_cost, actual_cost, created_at')
    .gte('created_at', thirtyDaysAgo)
    .not('estimated_cost', 'is', null)

  if (params.project_id) {
    query = query.eq('project_id', params.project_id)
  } else if (accessibleProjects.length > 0) {
    query = query.in('project_id', accessibleProjects)
  }

  const { data: specs } = await query

  if (!specs || specs.length === 0) {
    return { trend: 'stable' }
  }

  // Calculate weekly averages
  const weeklyAverages = []
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(Date.now() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000)
    
    const weekSpecs = specs.filter((s: any) => {
      const createdAt = new Date(s.created_at)
      return createdAt >= weekStart && createdAt < weekEnd
    })
    
    if (weekSpecs.length > 0) {
      const average = weekSpecs.reduce((sum: number, s: any) => sum + (s.estimated_cost || 0), 0) / weekSpecs.length
      weeklyAverages.push(average)
    }
  }

  if (weeklyAverages.length < 2) {
    return { trend: 'stable' }
  }

  // Determine trend
  const recent = weeklyAverages[0]
  const older = weeklyAverages[weeklyAverages.length - 1]
  const threshold = older * 0.05 // 5% threshold

  if (recent > older + threshold) {
    return { trend: 'increasing' }
  } else if (recent < older - threshold) {
    return { trend: 'decreasing' }
  } else {
    return { trend: 'stable' }
  }
}

async function calculateDeliveryPerformance(
  supabase: any,
  params: { project_id?: string },
  accessibleProjects: string[]
): Promise<{ performance: number }> {
  let query = supabase
    .from('material_specs')
    .select('delivery_date, status')
    .not('delivery_date', 'is', null)

  if (params.project_id) {
    query = query.eq('project_id', params.project_id)
  } else if (accessibleProjects.length > 0) {
    query = query.in('project_id', accessibleProjects)
  }

  const { data: specs } = await query

  if (!specs || specs.length === 0) {
    return { performance: 0 }
  }

  const today = new Date().toISOString().split('T')[0]
  const onTime = specs.filter((s: any) => 
    s.delivery_date >= today || s.status === 'approved'
  ).length

  return {
    performance: (onTime / specs.length) * 100
  }
}

async function calculateGroupedStatistics(
  supabase: any,
  params: { project_id?: string; date_range?: { start: string; end: string }; group_by?: string },
  accessibleProjects: string[],
  userId: string
): Promise<Record<string, any>> {
  const groupBy = params.group_by || 'status'
  
  let query = supabase.from('material_specs').select(`
    ${groupBy},
    status,
    priority,
    category,
    estimated_cost,
    actual_cost,
    quantity_required,
    project_id,
    supplier_id
  `)

  if (params.project_id) {
    query = query.eq('project_id', params.project_id)
  } else if (accessibleProjects.length > 0) {
    query = query.in('project_id', accessibleProjects)
  }

  if (params.date_range) {
    query = query
      .gte('created_at', params.date_range.start)
      .lte('created_at', params.date_range.end)
  }

  const { data: specs } = await query

  if (!specs || specs.length === 0) {
    return {}
  }

  const grouped = specs.reduce((acc: any, spec: any) => {
    const key = spec[groupBy] || 'unknown'
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        totalEstimatedCost: 0,
        totalActualCost: 0,
        byStatus: {},
        byPriority: {}
      }
    }
    
    acc[key].count++
    acc[key].totalEstimatedCost += (spec.estimated_cost || 0) * spec.quantity_required
    acc[key].totalActualCost += (spec.actual_cost || 0) * spec.quantity_required
    
    acc[key].byStatus[spec.status] = (acc[key].byStatus[spec.status] || 0) + 1
    acc[key].byPriority[spec.priority] = (acc[key].byPriority[spec.priority] || 0) + 1
    
    return acc
  }, {})

  return grouped
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