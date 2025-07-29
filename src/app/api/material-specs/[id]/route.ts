import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { buildPaginatedQuery, parseQueryParams, getScopeItemsOptimized, getProjectsOptimized, getTasksOptimized, getDashboardStatsOptimized } from '@/lib/enhanced-query-builder';
import { performanceMonitor } from '@/lib/performance-monitor';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function GETOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const specId = url.pathname.split('/').pop();
  
  if (!specId) {
    return createErrorResponse('Material spec ID is required', 400);
  }
  
  try {
    const { data: spec, error } = await supabase
      .from('material_specs')
      .select(`
        id,
        project_id,
        scope_item_id,
        name,
        description,
        specification,
        status,
        priority,
        category,
        supplier_id,
        notes,
        created_at,
        updated_at,
        created_by,
        approved_by,
        approved_at,
        project:projects(id, name, status, client_id),
        scope_item:scope_items(id, item_no, description),
        supplier:suppliers(id, name, contact_person, email),
        creator:user_profiles!material_specs_created_by_fkey(id, first_name, last_name, email),
        approver:user_profiles!material_specs_approved_by_fkey(id, first_name, last_name, email),
        approvals:document_approvals(id, status, comments, created_at, 
          approver:user_profiles(first_name, last_name, role))
      `)
      .eq('id', specId)
      .single();
    
    if (error || !spec) {
      return createErrorResponse('Material spec not found', 404);
    }
    
    // Role-based access control
    const hasAccess = await checkSpecAccess(spec, user, profile);
    if (!hasAccess) {
      return createErrorResponse('Access denied', 403);
    }
    
    // Transform data for frontend
    const transformedSpec = {
      id: spec.id,
      project: spec.project,
      scope_item: spec.scope_item,
      name: spec.name,
      description: spec.description,
      specification: spec.specification,
      status: spec.status,
      priority: spec.priority,
      category: spec.category,
      supplier: spec.supplier,
      notes: spec.notes,
      creator: spec.creator,
      approver: spec.approver,
      created_at: spec.created_at,
      updated_at: spec.updated_at,
      approved_at: spec.approved_at,
      approvals: spec.approvals || [],
      approval_status: getApprovalStatus(spec),
      pending_approvals: spec.approvals?.filter(a => a.status === 'pending').length || 0,
      can_approve: canApproveSpec(spec, user, profile),
      can_edit: canEditSpec(spec, user, profile),
      workflow_status: getWorkflowStatus(spec),
      next_action: getNextAction(spec, profile.role)
    };
    
    return createSuccessResponse(transformedSpec);
  } catch (error) {
    console.error('Get material spec error:', error);
    throw error;
  }
}

async function PUTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const specId = url.pathname.split('/').pop();
  
  if (!specId) {
    return createErrorResponse('Material spec ID is required', 400);
  }
  
  try {
    const body = await req.json();
    
    // Check if spec exists and user has access
    const { data: existingSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('*')
      .eq('id', specId)
      .single();
    
    if (fetchError || !existingSpec) {
      return createErrorResponse('Material spec not found', 404);
    }
    
    const hasAccess = await checkSpecAccess(existingSpec, user, profile);
    if (!hasAccess) {
      return createErrorResponse('Access denied', 403);
    }
    
    if (!canEditSpec(existingSpec, user, profile)) {
      return createErrorResponse('Cannot edit spec in current status', 403);
    }
    
    // Prepare update data
    const updateData: any = {};
    let activityAction = 'updated';
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.specification !== undefined) updateData.specification = body.specification;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.supplier_id !== undefined) updateData.supplier_id = body.supplier_id;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.scope_item_id !== undefined) updateData.scope_item_id = body.scope_item_id;
    
    if (Object.keys(updateData).length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }
    
    updateData.updated_at = new Date().toISOString();
    
    const { data: spec, error } = await supabase
      .from('material_specs')
      .update(updateData)
      .eq('id', specId)
      .select(`
        id,
        project_id,
        scope_item_id,
        name,
        description,
        specification,
        status,
        priority,
        category,
        supplier_id,
        notes,
        created_at,
        updated_at,
        project:projects(id, name, status),
        scope_item:scope_items(id, item_no, description),
        supplier:suppliers(id, name, contact_person),
        creator:user_profiles!material_specs_created_by_fkey(id, first_name, last_name, email)
      `)
      .single();
    
    if (error) {
      console.error('Error updating material spec:', error);
      throw error;
    }
    
    // Create activity log
    await createActivityLog('material_spec', activityAction, spec.id, user.id, {
      spec_name: spec.name,
      project_name: spec.project?.name,
      changes: updateData
    });
    
    return createSuccessResponse(spec);
  } catch (error) {
    console.error('Update material spec error:', error);
    throw error;
  }
}

async function DELETEOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const specId = url.pathname.split('/').pop();
  
  if (!specId) {
    return createErrorResponse('Material spec ID is required', 400);
  }
  
  try {
    // Check if spec exists and user has access
    const { data: existingSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('id, name, status, created_by, project:projects(name)')
      .eq('id', specId)
      .single();
    
    if (fetchError || !existingSpec) {
      return createErrorResponse('Material spec not found', 404);
    }
    
    // Only allow deletion of non-approved specs or by admin/management
    if (existingSpec.status === 'approved' && !['admin', 'management'].includes(profile.role)) {
      return createErrorResponse('Cannot delete approved specifications', 403);
    }
    
    // Only owner or admin/management can delete
    if (existingSpec.created_by !== user.id && !['admin', 'management'].includes(profile.role)) {
      return createErrorResponse('Access denied', 403);
    }
    
    const { error } = await supabase
      .from('material_specs')
      .delete()
      .eq('id', specId);
    
    if (error) {
      console.error('Error deleting material spec:', error);
      throw error;
    }
    
    // Create activity log
    await createActivityLog('material_spec', 'deleted', specId, user.id, {
      spec_name: existingSpec.name,
      project_name: existingSpec.project?.name
    });
    
    return createSuccessResponse({ 
      message: 'Material spec deleted successfully',
      id: specId,
      name: existingSpec.name
    });
  } catch (error) {
    console.error('Delete material spec error:', error);
    throw error;
  }
}

// Helper functions
async function checkSpecAccess(spec: any, user: any, profile: any): Promise<boolean> {
  if (['admin', 'management'].includes(profile.role)) return true;
  
  if (profile.role === 'client') {
    // Clients can access specs from their projects
    const { data: project } = await supabase
      .from('projects')
      .select('client_id')
      .eq('id', spec.project_id)
      .single();
    return project?.client_id === profile.id;
  }
  
  if (profile.role === 'project_manager') {
    // Project managers can access specs from managed projects
    const { data: project } = await supabase
      .from('projects')
      .select('project_manager_id')
      .eq('id', spec.project_id)
      .single();
    return project?.project_manager_id === user.id;
  }
  
  if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
    // Check if user is assigned to the project
    const { data: assignment } = await supabase
      .from('project_assignments')
      .select('id')
      .eq('project_id', spec.project_id)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    return !!assignment || spec.created_by === user.id;
  }
  
  return false;
}

function getApprovalStatus(spec: any) {
  if (spec.status === 'approved') return 'approved';
  if (spec.status === 'rejected') return 'rejected';
  if (spec.approvals?.some((a: any) => a.status === 'pending')) return 'pending_approval';
  return 'draft';
}

function canApproveSpec(spec: any, user: any, profile: any): boolean {
  if (!['technical_lead', 'management', 'admin'].includes(profile.role)) return false;
  if (spec.status !== 'pending' && spec.status !== 'revision_required') return false;
  return spec.created_by !== user.id; // Can't approve own specs
}

function canEditSpec(spec: any, user: any, profile: any): boolean {
  if (['admin', 'management'].includes(profile.role)) return true;
  if (spec.status === 'approved') return false;
  return spec.created_by === user.id;
}

function getWorkflowStatus(spec: any) {
  if (spec.status === 'approved') return 'completed';
  if (spec.status === 'rejected') return 'rejected';
  if (spec.status === 'pending') return 'pending_approval';
  if (spec.status === 'revision_required') return 'needs_revision';
  return 'draft';
}

function getNextAction(spec: any, userRole: string) {
  if (spec.status === 'pending') {
    if (['technical_lead', 'management', 'admin'].includes(userRole)) {
      return 'Review and approve';
    }
    return 'Awaiting approval';
  }
  if (spec.status === 'revision_required') return 'Address feedback and resubmit';
  if (spec.status === 'rejected') return 'Revise specification';
  if (spec.status === 'approved') return 'Ready for procurement';
  return 'Submit for approval';
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
export const PUT = withAPI(PUTOriginal);
export const DELETE = withAPI(DELETEOriginal);