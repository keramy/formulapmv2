import { withAPI, getRequestData, createSuccessResponse, createErrorResponse } from '@/lib/enhanced-auth-middleware';
import { NextRequest } from 'next/server';
import { buildPaginatedQuery, parseQueryParams, getScopeItemsOptimized, getProjectsOptimized, getTasksOptimized, getDashboardStatsOptimized } from '@/lib/enhanced-query-builder';
import { performanceMonitor } from '@/lib/performance-monitor';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function POSTOriginal(req: NextRequest) {
  const { user, profile } = getRequestData(req);
  const url = new URL(req.url);
  const specId = url.pathname.split('/')[3]; // /api/material-specs/[id]/request-revision
  
  if (!specId) {
    return createErrorResponse('Material spec ID is required', 400);
  }
  
  try {
    const body = await req.json();
    
    // Check if user can request revision
    if (!['technical_lead', 'management', 'admin'].includes(profile.role)) {
      return createErrorResponse('Insufficient permissions to request revision', 403);
    }
    
    // Revision comments are required
    if (!body.comments || body.comments.trim() === '') {
      return createErrorResponse('Revision comments are required', 400);
    }
    
    // Check if spec exists and get current status
    const { data: existingSpec, error: fetchError } = await supabase
      .from('material_specs')
      .select('id, name, status, created_by, project:projects(name)')
      .eq('id', specId)
      .single();
    
    if (fetchError || !existingSpec) {
      return createErrorResponse('Material spec not found', 404);
    }
    
    // Check if spec can have revision requested
    if (!['pending', 'revision_required'].includes(existingSpec.status)) {
      return createErrorResponse('Material spec cannot have revision requested in current status', 400);
    }
    
    // Update material spec status
    const { data: updatedSpec, error: updateError } = await supabase
      .from('material_specs')
      .update({
        status: 'revision_required',
        updated_at: new Date().toISOString()
      })
      .eq('id', specId)
      .select(`
        id,
        name,
        status,
        project:projects(id, name),
        creator:user_profiles!material_specs_created_by_fkey(first_name, last_name)
      `)
      .single();
    
    if (updateError) {
      console.error('Error requesting revision for material spec:', updateError);
      throw updateError;
    }
    
    // Create document approval record
    await supabase.from('document_approvals').insert({
      document_id: specId,
      approver_id: user.id,
      status: 'revision_required',
      comments: body.comments,
      created_at: new Date().toISOString()
    });
    
    // Create activity log
    await createActivityLog('material_spec', 'revision_requested', specId, user.id, {
      spec_name: updatedSpec.name,
      project_name: updatedSpec.project?.name,
      comments: body.comments
    });
    
    return createSuccessResponse({
      message: 'Revision requested for material specification',
      spec: updatedSpec,
      requested_by: `${profile.first_name} ${profile.last_name}`,
      revision_comments: body.comments
    });
    
  } catch (error) {
    console.error('Material spec revision request error:', error);
    throw error;
  }
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
export const POST = withAPI(POSTOriginal);