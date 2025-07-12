import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import { createServerClient } from '@/lib/supabase';
import { hasPermission } from '@/lib/permissions';

interface ActivityItem {
  id: string;
  type: 'project' | 'document' | 'scope_item' | 'user';
  title: string;
  description: string;
  timestamp: string;
  user_name?: string;
  project_name?: string;
  status?: string;
}

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
    const activities: ActivityItem[] = [];

    // Check if user can access all data or only their own
    const canViewAll = hasPermission(profile.role, 'projects.read.all');

    // Fetch recent projects (limited based on access)
    let projectQuery = supabase
      .from('projects')
      .select('id, name, status, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3);

    if (!canViewAll) {
      // For non-management, only show projects they're assigned to
      const { data: memberProjects } = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id);
      
      const projectIds = memberProjects?.map((pm: any) => pm.project_id) || [];
      if (projectIds.length > 0) {
        projectQuery = projectQuery.in('id', projectIds);
      } else {
        projectQuery = projectQuery.eq('id', 'none'); // No projects
      }
    }

    const { data: projects } = await projectQuery;

    // Add project activities
    projects?.forEach((project: any) => {
      activities.push({
        id: `project-${project.id}`,
        type: 'project',
        title: `Project updated: ${project.name}`,
        description: `Status: ${project.status}`,
        timestamp: project.updated_at,
        status: project.status
      });
    });

    // Fetch recent scope items (tasks)
    let scopeQuery = supabase
      .from('scope_items')
      .select(`
        id, description, status, updated_at,
        projects!inner(name)
      `)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (!canViewAll) {
      scopeQuery = scopeQuery.contains('assigned_to', [user.id]);
    }

    const { data: scopeItems } = await scopeQuery;

    // Add scope item activities
    scopeItems?.forEach((item: any) => {
      activities.push({
        id: `scope-${item.id}`,
        type: 'scope_item',
        title: `Task updated: ${item.description.substring(0, 50)}...`,
        description: `Project: ${item.projects?.name || 'Unknown'}`,
        timestamp: item.updated_at,
        status: item.status
      });
    });

    // Fetch recent documents
    let documentQuery = supabase
      .from('documents')
      .select(`
        id, title, status, updated_at,
        projects!inner(name)
      `)
      .order('updated_at', { ascending: false })
      .limit(3);

    const { data: documents } = await documentQuery;

    // Add document activities
    documents?.forEach((doc: any) => {
      activities.push({
        id: `doc-${doc.id}`,
        type: 'document',
        title: `Document updated: ${doc.title}`,
        description: `Project: ${doc.projects?.name || 'Unknown'}`,
        timestamp: doc.updated_at,
        status: doc.status
      });
    });

    // Sort all activities by timestamp and take the 5 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    return NextResponse.json(sortedActivities);
  } catch (error) {
    console.error('Dashboard recent activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}