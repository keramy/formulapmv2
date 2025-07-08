/**
 * Formula PM 2.0 Scope Overview API Endpoint
 * Wave 2B Business Logic Implementation
 * 
 * Provides scope overview data for global navigation page
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'

// ============================================================================
// GET /api/scope/overview - Get scope overview for global navigation
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
  if (!hasPermission(profile.role, 'projects.read.all')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to view scope overview' },
      { status: 403 }
    )
  }

  try {

    const supabase = createServerClient()

    // Get accessible projects for this user
    const accessibleProjects = await getAccessibleProjects(supabase, user)
    
    if (accessibleProjects.length === 0) {
      return NextResponse.json({
        success: true,
        overview: getEmptyOverview()
      })
    }

    // Get scope items for accessible projects
    const { data: scopeItems } = await supabase
      .from('scope_items')
      .select(`
        id,
        category,
        status,
        progress_percentage,
        assigned_to,
        requires_client_approval,
        client_approved,
        timeline_end,
        title,
        project_id,
        created_at,
        updated_at,
        project:projects(name)
      `)
      .in('project_id', accessibleProjects)

    if (!scopeItems) {
      return NextResponse.json({
        success: true,
        overview: getEmptyOverview()
      })
    }

    // Calculate category statistics
    const categories = {
      construction: { count: 0, completion: 0, projects: new Set() },
      millwork: { count: 0, completion: 0, projects: new Set() },
      electrical: { count: 0, completion: 0, projects: new Set() },
      mechanical: { count: 0, completion: 0, projects: new Set() }
    }

    let userAssignments = 0
    let pendingApprovals = 0
    let overdueItems = 0
    const today = new Date()

    scopeItems.forEach(item => {
      // Category stats
      const catStats = categories[item.category as keyof typeof categories]
      if (catStats) {
        catStats.count++
        catStats.projects.add(item.project_id)
        if (item.status === 'completed') {
          catStats.completion++
        }
      }

      // User assignments
      if (item.assigned_to?.includes(user.id)) {
        userAssignments++
      }

      // Pending approvals (items requiring client approval that aren't approved yet)
      if (item.requires_client_approval && !item.client_approved) {
        // Check if user can approve (management roles can approve)
        if (hasPermission(user.role, 'projects.update')) {
          pendingApprovals++
        }
      }

      // Overdue items
      if (item.timeline_end && item.status !== 'completed') {
        const endDate = new Date(item.timeline_end)
        if (endDate < today) {
          overdueItems++
        }
      }
    })

    // Calculate completion percentages for categories
    Object.keys(categories).forEach(key => {
      const cat = categories[key as keyof typeof categories]
      if (cat.count > 0) {
        cat.completion = Math.round((cat.completion / cat.count) * 100)
      }
      // Convert Set to count
      const projectCount = cat.projects.size
      ;(cat as any).projects = projectCount
    })

    // Get recent activity (last 10 updates)
    const recentActivity = scopeItems
      .filter(item => item.updated_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 10)
      .map(item => ({
        project_name: (item as any).project?.name || 'Unknown Project',
        item_title: item.title,
        action: 'Updated',
        timestamp: item.updated_at
      }))

    const overview = {
      total_items: scopeItems.length,
      total_projects: accessibleProjects.length,
      categories,
      pending_approvals: pendingApprovals,
      overdue_items: overdueItems,
      user_assignments: userAssignments,
      recent_activity: recentActivity,
      user_role: user.role
    }

    return NextResponse.json({
      success: true,
      overview
    })

  } catch (error) {
    console.error('Scope overview API error:', error)
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
  if (hasPermission(user.role, 'projects.read.all')) {
    const { data: allProjects } = await supabase
      .from('projects')
      .select('id')
    return allProjects?.map((p: any) => p.id) || []
  }

  if (hasPermission(user.role, 'projects.read.assigned')) {
    const { data: assignedProjects } = await supabase
      .from('project_assignments')
      .select('project_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
    return assignedProjects?.map((p: any) => p.project_id) || []
  }

  if (hasPermission(user.role, 'projects.read.own') && user.role === 'client') {
    const { data: clientInfo } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', user.id)
      
    const clientIds = clientInfo?.map((c: any) => c.id) || []
    if (clientIds.length > 0) {
      const { data: clientProjects } = await supabase
        .from('projects')
        .select('id')
        .in('client_id', clientIds)
      return clientProjects?.map((p: any) => p.id) || []
    }
  }

  return []
}

function getEmptyOverview() {
  return {
    total_items: 0,
    total_projects: 0,
    categories: {
      construction: { count: 0, completion: 0, projects: 0 },
      millwork: { count: 0, completion: 0, projects: 0 },
      electrical: { count: 0, completion: 0, projects: 0 },
      mechanical: { count: 0, completion: 0, projects: 0 }
    },
    pending_approvals: 0,
    overdue_items: 0,
    user_assignments: 0,
    recent_activity: []
  }
}