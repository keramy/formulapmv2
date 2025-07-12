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
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Transform data to include project names
    const transformedTasks = (data || []).map((item: any) => ({
      ...item,
      project_name: item.projects?.name || 'Unknown Project'
    }));

    return NextResponse.json(transformedTasks);
  } catch (error) {
    console.error('Dashboard tasks API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}