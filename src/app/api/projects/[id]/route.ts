import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { NextRequest, NextResponse } from 'next/server';
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

// PUT /api/projects/[id] - Update project
export const PUT = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  console.log('🔄 [PUT /api/projects/[id]] Route handler started', {
    projectId: params?.id,
    userId: user?.id,
    userRole: profile?.role
  });
  
  try {
    const projectId = params.id;
    
    if (!projectId) {
      return createErrorResponse('Project ID is required', 400);
    }

    const body = await request.json();
    
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }

    console.log('🔄 [PUT /api/projects/[id]] Updating project', {
      projectId,
      userId: user.id,
      userRole: profile.role,
      updates: Object.keys(body)
    });

    const supabase = await createClient();
    
    // Check if project exists and user has access - Admin bypass RLS
    console.log('🔍 [PUT] Checking project access...');
    let existingProject, fetchError;
    
    try {
      if (['admin', 'management'].includes(profile.role)) {
        console.log('🔑 [PUT] Using service client for admin/management user');
        // Admin/Management: Use service role to bypass RLS
        const { createServiceClient } = await import('@/lib/supabase/service');
        const serviceSupabase = createServiceClient();
        
        const result = await serviceSupabase
          .from('projects')
          .select('id, name, project_manager_id, created_by')
          .eq('id', projectId)
          .eq('is_active', true)
          .single();
          
        existingProject = result.data;
        fetchError = result.error;
        console.log('🔍 [PUT] Service client result:', { data: existingProject, error: fetchError });
      } else {
        console.log('🔑 [PUT] Using regular client for standard user');
        // Regular users: Use authenticated client with RLS
        const result = await supabase
          .from('projects')
          .select('id, name, project_manager_id, created_by')
          .eq('id', projectId)
          .eq('is_active', true)
          .single();
          
        existingProject = result.data;
        fetchError = result.error;
        console.log('🔍 [PUT] Regular client result:', { data: existingProject, error: fetchError });
      }
    } catch (accessError) {
      console.error('❌ [PUT] Error during project access check:', accessError);
      throw accessError;
    }

    if (fetchError || !existingProject) {
      console.error('❌ [PUT /api/projects/[id]] Project fetch error:', fetchError);
      return createErrorResponse('Project not found', 404);
    }

    // Access control - only admin, management, project manager, or creator can update
    const canUpdate = ['admin', 'management'].includes(profile.role) ||
                     existingProject.project_manager_id === profile.id ||
                     existingProject.created_by === profile.id;

    if (!canUpdate) {
      return createErrorResponse('Access denied - insufficient permissions to update this project', 403);
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Add fields that can be updated
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.start_date !== undefined) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.budget_amount !== undefined) updateData.budget_amount = body.budget_amount;
    if (body.progress_percentage !== undefined) updateData.progress_percentage = body.progress_percentage;
    if (body.project_manager_id !== undefined) updateData.project_manager_id = body.project_manager_id;

    // Update the project
    console.log('💾 [PUT] Performing database update with data:', updateData);
    
    // Use the appropriate client (service client for admin, regular for others)
    let updateClient;
    if (['admin', 'management'].includes(profile.role)) {
      const { createServiceClient } = await import('@/lib/supabase/service');
      updateClient = createServiceClient();
      console.log('🔑 [PUT] Using service client for update');
    } else {
      updateClient = supabase;
      console.log('🔑 [PUT] Using regular client for update');
    }
    
    const { data: updatedProject, error: updateError } = await updateClient
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
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
      .single();
      
    console.log('💾 [PUT] Database update result:', { data: updatedProject, error: updateError });

    if (updateError) {
      console.error('❌ [PUT /api/projects/[id]] Update error:', updateError);
      return createErrorResponse(`Failed to update project: ${updateError.message}`, 500);
    }

    if (!updatedProject) {
      console.error('❌ [PUT /api/projects/[id]] No project returned after update');
      return createErrorResponse('Failed to update project - no data returned', 500);
    }

    console.log('✅ [PUT /api/projects/[id]] Project updated successfully', {
      projectId: updatedProject.id,
      projectName: updatedProject.name
    });

    return createSuccessResponse({
      project: updatedProject,
      message: 'Project updated successfully'
    });

  } catch (error) {
    console.error('❌ [PUT /api/projects/[id]] Unexpected error:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack trace',
      projectId: params?.id,
      userId: user?.id,
      userRole: profile?.role
    });
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.update' });

// DELETE /api/projects/[id] - Delete project (soft delete)
export const DELETE = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  console.log('🗑️ [DELETE] Starting delete operation:', {
    projectId: params?.id,
    userId: user?.id,
    userRole: profile?.role,
    timestamp: new Date().toISOString()
  });

  try {
    const projectId = params?.id;
    
    if (!projectId) {
      console.error('❌ [DELETE] Missing project ID');
      return createErrorResponse('Project ID is required', 400);
    }

    // Use service client for admin/management users
    let client;
    if (['admin', 'management'].includes(profile.role)) {
      console.log('🔑 [DELETE] Using service client for admin user');
      const { createServiceClient } = await import('@/lib/supabase/service');
      client = createServiceClient();
    } else {
      console.log('🔑 [DELETE] Using regular client for standard user');
      client = await createClient();
    }
    
    // Check if project exists (including already deleted ones)
    console.log('🔍 [DELETE] Checking project existence...');
    const { data: existingProject, error: fetchError } = await client
      .from('projects')
      .select('id, name, project_manager_id, created_by, status, is_active')
      .eq('id', projectId)
      .single();

    if (fetchError || !existingProject) {
      console.error('❌ [DELETE] Project not found:', fetchError);
      return createErrorResponse('Project not found', 404);
    }

    console.log('✅ [DELETE] Project found:', existingProject.name);

    // Check if project is already deleted
    if (!existingProject.is_active) {
      console.log('ℹ️ [DELETE] Project already deleted:', existingProject.name);
      return createSuccessResponse({
        message: 'Project was already deleted',
        project_id: projectId,
        deleted_project: {
          id: existingProject.id,
          name: existingProject.name
        }
      });
    }

    // Access control
    const canDelete = ['admin', 'management'].includes(profile.role) ||
                     existingProject.created_by === profile.id;

    if (!canDelete) {
      console.error('❌ [DELETE] Access denied for user');
      return createErrorResponse('Access denied - insufficient permissions', 403);
    }

    // Business logic - only restrict for non-admin users
    if (existingProject.status === 'active' && !['admin', 'management'].includes(profile.role)) {
      console.error('❌ [DELETE] Cannot delete active project (non-admin user)');
      return createErrorResponse('Cannot delete active project. Change status first.', 400);
    }

    // Perform soft delete
    console.log('💾 [DELETE] Performing soft delete...');
    const { error: deleteError } = await client
      .from('projects')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (deleteError) {
      console.error('❌ [DELETE] Delete operation failed:', deleteError);
      return createErrorResponse('Failed to delete project', 500);
    }

    console.log('✅ [DELETE] Project deleted successfully:', existingProject.name);
    
    // Use createSuccessResponse for consistent response format
    return createSuccessResponse({
      message: 'Project deleted successfully',
      project_id: projectId,
      deleted_project: {
        id: existingProject.id,
        name: existingProject.name
      }
    });

  } catch (error) {
    console.error('❌ [DELETE] Unexpected error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.delete' });