import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { parseQueryParams } from '@/lib/enhanced-query-builder';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const params = parseQueryParams(req);
    
    // Build comprehensive shop drawings query
    let query = supabase.from('shop_drawings').select(`
      id,
      drawing_number,
      title,
      description,
      revision,
      status,
      drawing_type,
      project_id,
      scope_item_id,
      submitted_by,
      reviewed_by,
      approved_by,
      submitted_date,
      review_date,
      approval_date,
      due_date,
      priority,
      file_url,
      file_name,
      file_size,
      comments,
      revision_notes,
      created_at,
      updated_at,
      project:projects(id, name, status, client_id),
      scope_item:scope_items(id, item_name, category),
      submitter:user_profiles!shop_drawings_submitted_by_fkey(id, first_name, last_name, email, role),
      reviewer:user_profiles!shop_drawings_reviewed_by_fkey(id, first_name, last_name, email, role),
      approver:user_profiles!shop_drawings_approved_by_fkey(id, first_name, last_name, email, role),
      drawing_comments:shop_drawing_comments(id, comment, comment_type, created_at, created_by,
        user:user_profiles(first_name, last_name, role))
    `);
    
    // Role-based filtering for shop drawings
    if (profile.role === 'client') {
      // Clients see only drawings from their projects
      const clientProjects = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', profile.id);
      
      if (clientProjects.data) {
        const projectIds = clientProjects.data.map(p => p.id);
        query = query.in('project_id', projectIds);
      }
    } else if (profile.role === 'project_manager') {
      // Project managers see drawings from managed projects
      const managedProjects = await supabase
        .from('projects')
        .select('id')
        .eq('project_manager_id', user.id);
      
      if (managedProjects.data) {
        const projectIds = managedProjects.data.map(p => p.id);
        query = query.in('project_id', projectIds);
      }
    } else if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
      // Technical leads and purchase managers see drawings from assigned projects
      const assignedProjects = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (assignedProjects.data) {
        const projectIds = assignedProjects.data.map(p => p.project_id);
        query = query.or(`project_id.in.(${projectIds.join(',')}),submitted_by.eq.${user.id},reviewed_by.eq.${user.id}`);
      } else {
        query = query.or(`submitted_by.eq.${user.id},reviewed_by.eq.${user.id}`);
      }
    }
    // Admin and management see all shop drawings
    
    // Apply filters
    if (params.project_id) {
      query = query.eq('project_id', params.project_id);
    }
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.drawing_type) {
      query = query.eq('drawing_type', params.drawing_type);
    }
    
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }
    
    if (params.submitted_by) {
      query = query.eq('submitted_by', params.submitted_by);
    }
    
    if (params.reviewed_by) {
      query = query.eq('reviewed_by', params.reviewed_by);
    }
    
    if (params.overdue === 'true') {
      query = query.lt('due_date', new Date().toISOString());
    }
    
    if (params.pending_review === 'true') {
      query = query.eq('status', 'submitted').is('reviewed_by', null);
    }
    
    if (params.pending_approval === 'true') {
      query = query.eq('status', 'under_review').is('approved_by', null);
    }
    
    if (params.search) {
      query = query.or(`drawing_number.ilike.%${params.search}%,title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }
    
    // Apply sorting
    if (params.sort_field) {
      query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      query = query.order('priority', { ascending: false })
                   .order('due_date', { ascending: true })
                   .order('submitted_date', { ascending: false });
    }
    
    // Apply pagination
    if (params.limit) {
      const offset = (params.page - 1) * params.limit;
      query = query.range(offset, offset + params.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform and enrich data
    const transformedDrawings = data?.map(drawing => ({
      id: drawing.id,
      drawing_number: drawing.drawing_number,
      title: drawing.title,
      description: drawing.description,
      revision: drawing.revision,
      status: drawing.status,
      drawing_type: drawing.drawing_type,
      priority: drawing.priority,
      project: drawing.project,
      scope_item: drawing.scope_item,
      submitter: drawing.submitter,
      reviewer: drawing.reviewer,
      approver: drawing.approver,
      submitted_date: drawing.submitted_date,
      review_date: drawing.review_date,
      approval_date: drawing.approval_date,
      due_date: drawing.due_date,
      file_info: {
        url: drawing.file_url,
        name: drawing.file_name,
        size: drawing.file_size
      },
      comments: drawing.comments,
      revision_notes: drawing.revision_notes,
      drawing_comments_count: drawing.drawing_comments?.length || 0,
      is_overdue: drawing.due_date ? new Date(drawing.due_date) < new Date() : false,
      days_until_due: drawing.due_date ? Math.ceil((new Date(drawing.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
      workflow_status: getWorkflowStatus(drawing),
      next_action: getNextAction(drawing, profile.role, profile.seniority),
      created_at: drawing.created_at,
      updated_at: drawing.updated_at
    })) || [];
    
    return createSuccessResponse(transformedDrawings);
  } catch (error) {
    console.error('Shop drawings API fetch error:', error);
    throw error;
  }
}

async function POSTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  
  try {
    const body = await req.json();
    
    // Validation
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    if (!body.drawing_number || !body.title || !body.project_id) {
      return createErrorResponse('Drawing number, title, and project ID are required', 400);
    }
    
    // Verify project access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('id', body.project_id)
      .single();
    
    if (projectError || !project) {
      return createErrorResponse('Project not found or access denied', 404);
    }
    
    // Check for duplicate drawing number within project
    const { data: existingDrawing } = await supabase
      .from('shop_drawings')
      .select('id')
      .eq('project_id', body.project_id)
      .eq('drawing_number', body.drawing_number)
      .single();
    
    if (existingDrawing) {
      return createErrorResponse('Drawing number already exists in this project', 409);
    }
    
    // Prepare shop drawing data
    const drawingData = {
      drawing_number: body.drawing_number,
      title: body.title,
      description: body.description || '',
      revision: body.revision || 'A',
      status: body.status || 'draft',
      drawing_type: body.drawing_type || 'general',
      priority: body.priority || 'medium',
      project_id: body.project_id,
      scope_item_id: body.scope_item_id || null,
      submitted_by: user.id,
      submitted_date: body.status === 'submitted' ? new Date().toISOString() : null,
      due_date: body.due_date || null,
      file_url: body.file_url || null,
      file_name: body.file_name || null,
      file_size: body.file_size || null,
      comments: body.comments || '',
      revision_notes: body.revision_notes || '',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('shop_drawings')
      .insert(drawingData)
      .select(`
        id,
        drawing_number,
        title,
        description,
        revision,
        status,
        drawing_type,
        priority,
        project_id,
        scope_item_id,
        submitted_date,
        due_date,
        file_url,
        file_name,
        file_size,
        created_at,
        project:projects(id, name, status),
        submitter:user_profiles!shop_drawings_submitted_by_fkey(id, first_name, last_name, email)
      `)
      .single();
    
    if (error) throw error;
    
    // Create activity log
    await createActivityLog('shop_drawing', 'created', data.id, user.id, {
      drawing_number: data.drawing_number,
      title: data.title,
      project_name: data.project?.name
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Shop drawing creation error:', error);
    throw error;
  }
}

// Helper function to determine workflow status
function getWorkflowStatus(drawing: any) {
  if (drawing.status === 'approved') return 'completed';
  if (drawing.status === 'rejected') return 'rejected';
  if (drawing.status === 'under_review') return 'reviewing';
  if (drawing.status === 'submitted') return 'pending_review';
  if (drawing.status === 'draft') return 'draft';
  return 'unknown';
}

// Helper function to determine next action based on role and seniority
function getNextAction(drawing: any, userRole: string, userSeniority?: string) {
  if (drawing.status === 'draft') return 'Submit for review';
  if (drawing.status === 'submitted') {
    if (['technical_lead', 'management', 'admin'].includes(userRole)) {
      return 'Review drawing';
    }
    if (userRole === 'project_manager' && userSeniority === 'senior') {
      return 'Review drawing';
    }
    return 'Awaiting review';
  }
  if (drawing.status === 'under_review') {
    if (['management', 'admin', 'technical_lead'].includes(userRole)) {
      return 'Approve/Reject';
    }
    if (userRole === 'project_manager' && userSeniority === 'senior') {
      return 'Approve/Reject';
    }
    return 'Awaiting approval';
  }
  if (drawing.status === 'rejected') return 'Revise and resubmit';
  if (drawing.status === 'approved') return 'Implementation';
  return 'No action required';
}

// Helper function to create activity logs
async function createActivityLog(entityType: string, action: string, entityId: string, userId: string, details: any) {
  try {
    await supabase.from('activity_logs').insert({
      entity_type: entityType,
      action: action,
      entity_id: entityId,
      user_id: userId,
      details: details,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.warn('Failed to create activity log:', error);
  }
}

// Enhanced API exports with middleware
export const GET = withAPI(GETOriginal);
export const POST = withAPI(POSTOriginal);