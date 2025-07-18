import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { createServerClient } from '@/lib/supabase';
import { hasPermission } from '@/lib/permissions';

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {

    const supabase = createServerClient();
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // Build query for scope items (tasks)
    let query = supabase
      .from('scope_items')
      .select(`
        *,
        projects!inner(name)
      `)
      .order('updated_at', { ascending: false })
      .limit(limit);

    // Apply role-based filtering for tasks
    const canViewAll = hasPermission(profile.role, 'projects.read.all');
    if (!canViewAll) {
      // For non-management roles, show only assigned tasks
      query = query.contains('assigned_to', [user.id]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return createErrorResponse('Failed to fetch tasks', 500);
    }

    // Transform data to include project names
    const transformedTasks = (data || []).map((item: any) => ({
      ...item,
      project_name: item.projects?.name || 'Unknown Project'
    }));

    return createSuccessResponse(transformedTasks);
  } catch (error) {
    console.error('Dashboard tasks API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
})