import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/projects/[id] - Get single project (FIXED: 2025-07-31)
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return createErrorResponse('Project ID is required', 400);
    }

    console.log('🔍 [GET /api/projects/[id]] Fetching project', {
      projectId,
      userId: user.id,
      userRole: profile.role
    });

    const supabase = await createClient();
    
    // ROLE-BASED ACCESS CONTROL: Admin/Management bypass RLS
    let project, projectError;
    
    if (['admin', 'management'].includes(profile.role)) {
      // Admin/Management: Use service role to bypass RLS
      const { createServiceClient } = await import('@/lib/supabase/service');
      const serviceSupabase = createServiceClient();
      
      const result = await serviceSupabase
        .from('projects')
        .select(`
          id,
          name,
          code,
          description,
          client_id,
          status,
          start_date,
          end_date,
          location,
          budget_amount,
          actual_cost,
          progress_percentage,
          created_by,
          project_manager_id,
          is_active,
          metadata,
          created_at,
          updated_at
        `)
        .eq('id', projectId)
        .eq('is_active', true)
        .single();
        
      project = result.data;
      projectError = result.error;
      
    } else {
      // Regular users: Use authenticated client with RLS
      const result = await supabase
        .from('projects')
        .select(`
          id,
          name,
          code,
          description,
          client_id,
          status,
          start_date,
          end_date,
          location,
          budget_amount,
          actual_cost,
          progress_percentage,
          created_by,
          project_manager_id,
          is_active,
          metadata,
          created_at,
          updated_at
        `)
        .eq('id', projectId)
        .eq('is_active', true)
        .single();
        
      project = result.data;
      projectError = result.error;
    }

    if (projectError) {
      console.error('❌ [GET /api/projects/[id]] Database error:', projectError);
      
      if (projectError.code === 'PGRST116') {
        return createErrorResponse('Project not found', 404);
      }
      
      return createErrorResponse('Failed to fetch project', 500);
    }

    if (!project) {
      return createErrorResponse('Project not found', 404);
    }

    // Fetch related data separately since there are no foreign key constraints
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, contact_person, email, phone')
      .eq('id', project.client_id)
      .single();

    const { data: projectManager } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('id', project.project_manager_id)
      .single();

    const { data: createdByUser } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, role')
      .eq('id', project.created_by)
      .single();

    const { data: assignments } = await supabase
      .from('project_assignments')
      .select(`
        id,
        user_id,
        role_in_project,
        is_active,
        assigned_at
      `)
      .eq('project_id', project.id)
      .eq('is_active', true);

    // Fetch user details for assignments
    let assignmentUsers = [];
    if (assignments && assignments.length > 0) {
      const userIds = assignments.map(a => a.user_id);
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, role')
        .in('id', userIds);
      
      assignmentUsers = users || [];
    }

    // Combine project with related data
    const enrichedProject = {
      ...project,
      client: client || null,
      project_manager: projectManager || null,
      created_by_user: createdByUser || null,
      assignments: assignments?.map(assignment => ({
        ...assignment,
        user: assignmentUsers.find(u => u.id === assignment.user_id) || null
      })) || []
    };

    console.log('✅ [GET /api/projects/[id]] Project found', {
      projectId: enrichedProject.id,
      projectName: enrichedProject.name,
      hasAssignments: !!enrichedProject.assignments?.length
    });

    // Access control check (only for non-admin users since admin bypassed RLS)
    if (!['admin', 'management'].includes(profile.role)) {
      const hasAccess = checkUserProjectAccess(profile, enrichedProject);
      
      console.log('🔍 [GET /api/projects/[id]] Access check result', {
        hasAccess,
        projectId,
        userId: user.id,
        userRole: profile.role
      });
      
      if (!hasAccess) {
        console.warn('⚠️ [GET /api/projects/[id]] Access denied', {
          projectId,
          userId: user.id,
          userRole: profile.role
        });
        return createErrorResponse('Access denied', 403);
      }
    }

    // Transform data for frontend
    const transformedProject = {
      ...enrichedProject,
      budget: enrichedProject.budget_amount,
      client: enrichedProject.client,
      project_manager: enrichedProject.project_manager,
      created_by_user: enrichedProject.created_by_user,
      assignments: enrichedProject.assignments?.filter((a: any) => a.is_active) || []
    };

    return createSuccessResponse({
      project: transformedProject
    });

  } catch (error) {
    console.error('❌ [GET /api/projects/[id]] Unexpected error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.read' });

// Helper function to check user access to project
function checkUserProjectAccess(profile: any, project: any): boolean {
  console.log('🔐 [checkUserProjectAccess] Checking access', {
    userId: profile.id,
    userRole: profile.role,
    projectId: project.id,
    projectName: project.name,
    projectManagerId: project.project_manager_id,
    createdBy: project.created_by,
    assignmentsCount: project.assignments?.length || 0
  });

  // Admin role can access all projects (using 'admin' instead of 'management')
  if (['admin', 'management', 'owner'].includes(profile.role)) {
    console.log('✅ [checkUserProjectAccess] Admin/Management access granted');
    return true;
  }

  // Purchase manager and technical lead can access projects they're involved in
  if (['purchase_manager', 'technical_lead', 'project_manager'].includes(profile.role)) {
    console.log('✅ [checkUserProjectAccess] Staff role access granted');
    return true;
  }

  // Project manager can access their projects
  if (project.project_manager_id === profile.id) {
    console.log('✅ [checkUserProjectAccess] Project manager access granted');
    return true;
  }

  // Check if user is assigned to project
  const assignment = project.assignments?.find((a: any) => 
    a.user_id === profile.id && a.is_active
  );
  if (assignment) {
    console.log('✅ [checkUserProjectAccess] Assignment access granted', {
      assignmentRole: assignment.role_in_project
    });
    return true;
  }

  // Project creator can access
  if (project.created_by === profile.id) {
    console.log('✅ [checkUserProjectAccess] Creator access granted');
    return true;
  }

  // Client access (if client relationship exists)
  if (profile.role === 'client' && project.client?.user_id === profile.id) {
    console.log('✅ [checkUserProjectAccess] Client access granted');
    return true;
  }

  console.log('❌ [checkUserProjectAccess] Access denied - no matching criteria');
  return false;
}