import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import { createServerClient } from '@/lib/supabase';
import { hasPermission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, profile, error: authError } = await verifyAuth(request);
    if (authError || !user || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Build project query based on user role
    let projectQuery = supabase
      .from('projects')
      .select('*', { count: 'exact' });

    // Apply role-based filtering
    if (!hasPermission(profile.role, 'projects.read.all')) {
      // For non-admin/PM roles, only show projects they're members of
      const { data: memberProjects } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id);
      
      const projectIds = memberProjects?.map((pm: any) => pm.project_id) || [];
      if (projectIds.length > 0) {
        projectQuery = projectQuery.in('id', projectIds);
      } else {
        // No projects for this user
        projectQuery = projectQuery.eq('id', 'none');
      }
    }

    // Execute all queries in parallel
    const [
      { count: totalProjects },
      { count: activeProjects },
      { data: scopeItems, count: totalScopeItems },
      { data: teamData, count: teamMembers },
      { data: tenderData }
    ] = await Promise.all([
      projectQuery.in('status', ['planning', 'active', 'bidding']),
      projectQuery.eq('status', 'active'),
      supabase.from('scope_items').select('*', { count: 'exact' }),
      hasPermission(profile.role, 'users.read.all') 
        ? supabase.from('user_profiles').select('*', { count: 'exact' }).eq('is_active', true)
        : { data: [], count: 0 },
      hasPermission(profile.role, 'financials.view')
        ? supabase.from('financial_tenders').select('estimated_value, currency')
        : { data: [] }
    ]);

    // Calculate scope item statistics
    const completedScopeItems = scopeItems?.filter((item: any) => item.status === 'completed').length || 0;
    const overdueScopeItems = scopeItems?.filter((item: any) => 
      item.timeline_end && 
      new Date(item.timeline_end) < new Date() && 
      item.status !== 'completed'
    ).length || 0;

    // Calculate budget (sum of estimated tender values)
    const budget = tenderData?.reduce((sum: number, tender: any) => {
      return sum + (tender.estimated_value || 0);
    }, 0) || 0;

    const stats = {
      totalProjects: totalProjects || 0,
      activeProjects: activeProjects || 0,
      totalScopeItems: totalScopeItems || 0,
      completedScopeItems,
      overdueScopeItems,
      teamMembers: teamMembers || 0,
      budget,
      // Add permissions for frontend to know what to show
      permissions: {
        canViewProjects: hasPermission(profile.role, 'projects.read.all') || hasPermission(profile.role, 'projects.read.assigned'),
        canViewUsers: hasPermission(profile.role, 'users.read.all'),
        canViewFinancials: hasPermission(profile.role, 'financials.view')
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard comprehensive stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}