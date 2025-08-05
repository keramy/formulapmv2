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
  const user = (req as any).user;
  const profile = (req as any).profile;
  const url = new URL(req.url);
  const specId = url.pathname.split('/')[3]; // /api/material-specs/[id]/reject
  
  if (!specId) {
    return createErrorResponse('Material spec ID is required', 400);
  }
  
  try {
    const body = await req.json();
    
    // Check if user can reject
    if (!['technical_lead', 'management', 'admin'].includes(profile.role)) {
      return createErrorResponse('Insufficient permissions to reject', 403);
    }
    
    // Rejection comments are required
    if (!body.comments || body.comments.trim() === '') {
      return createErrorResponse('Rejection comments are required', 400);
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
    
    // Check if spec can be rejected
    if (!['pending', 'revision_required'].includes(existingSpec.status)) {
      return createErrorResponse('Material spec cannot be rejected in current status', 400);
    }
    
    // Update material spec status
    const { data: updatedSpec, error: updateError } = await supabase
      .from('material_specs')
      .update({
        status: 'rejected',
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
      console.error('Error rejecting material spec:', updateError);
      throw updateError;
    }
    
    // Create document approval record
    await supabase.from('document_approvals').insert({
      document_id: specId,
      approver_id: user.id,
      status: 'rejected',
      comments: body.comments,
      created_at: new Date().toISOString()
    });
    
    // Create activity log
    await createActivityLog('material_spec', 'rejected', specId, user.id, {
      spec_name: updatedSpec.name,
      project_name: updatedSpec.project?.name,
      comments: body.comments
    });
    
    return createSuccessResponse({
      message: 'Material specification rejected',
      spec: updatedSpec,
      rejected_by: `${profile.first_name} ${profile.last_name}`,
      rejection_comments: body.comments
    });
    
  } catch (error) {
    console.error('Material spec rejection error:', error);
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