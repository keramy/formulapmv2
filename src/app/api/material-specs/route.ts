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
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    const { searchParams } = new URL(req.url);
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      project_id: searchParams.get('project_id'),
      sort_field: searchParams.get('sort_field'),
      sort_direction: searchParams.get('sort_direction') || 'desc'
    };
    
    // Build comprehensive material specs query
    let query = supabase.from('material_specs').select(`
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
      project:projects(id, name, status),
      scope_item:scope_items(id, item_no, description),
      supplier:suppliers(id, name, contact_person),
      creator:user_profiles!material_specs_created_by_fkey(id, first_name, last_name, email),
      approver:user_profiles!material_specs_approved_by_fkey(id, first_name, last_name, email),
      approvals:document_approvals(id, status, comments, created_at, 
        approver:user_profiles(first_name, last_name, role))
    `);
    
    // Role-based filtering
    if (profile.role === 'client') {
      // Clients see only material specs from their projects
      const clientProjects = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', profile.id);
      
      if (clientProjects.data) {
        const projectIds = clientProjects.data.map(p => p.id);
        query = query.in('project_id', projectIds);
      }
    } else if (profile.role === 'project_manager') {
      // Project managers see specs from managed projects
      const managedProjects = await supabase
        .from('projects')
        .select('id')
        .eq('project_manager_id', user.id);
      
      if (managedProjects.data) {
        const projectIds = managedProjects.data.map(p => p.id);
        query = query.in('project_id', projectIds);
      }
    } else if (['technical_lead', 'purchase_manager'].includes(profile.role)) {
      // Technical leads and purchase managers see specs from assigned projects
      const assignedProjects = await supabase
        .from('project_assignments')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (assignedProjects.data) {
        const projectIds = assignedProjects.data.map(p => p.project_id);
        query = query.or(`project_id.in.(${projectIds.join(',')}),created_by.eq.${user.id}`);
      } else {
        query = query.eq('created_by', user.id);
      }
    }
    // Admin and management see all material specs
    
    // Apply filters
    if (params.project_id) {
      query = query.eq('project_id', params.project_id);
    }
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    if (params.category) {
      query = query.eq('category', params.category);
    }
    
    if (params.priority) {
      query = query.eq('priority', params.priority);
    }
    
    if (params.supplier_id) {
      query = query.eq('supplier_id', params.supplier_id);
    }
    
    if (params.search) {
      query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%,specification.ilike.%${params.search}%`);
    }
    
    // Apply sorting
    if (params.sort_field) {
      query = query.order(params.sort_field, { ascending: params.sort_direction === 'asc' });
    } else {
      query = query.order('priority', { ascending: false })
                   .order('status', { ascending: true })
                   .order('created_at', { ascending: false });
    }
    
    // Apply pagination
    if (params.limit) {
      const offset = (params.page - 1) * params.limit;
      query = query.range(offset, offset + params.limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform and enrich data
    const transformedSpecs = data?.map(spec => ({
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
      can_edit: canEditSpec(spec, user, profile)
    })) || [];
    
    return createSuccessResponse(transformedSpecs);
  } catch (error) {
    console.error('Material specs API fetch error:', error);
    throw error;
  }
}

async function POSTOriginal(req: NextRequest) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  try {
    const body = await req.json();
    
    // Validation
    if (!body || Object.keys(body).length === 0) {
      return createErrorResponse('Request body is required', 400);
    }
    
    if (!body.name || !body.project_id) {
      return createErrorResponse('Name and project ID are required', 400);
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
    
    // Prepare material spec data
    const specData = {
      project_id: body.project_id,
      scope_item_id: body.scope_item_id || null,
      name: body.name,
      description: body.description || '',
      specification: body.specification || '',
      status: body.status || 'pending',
      priority: body.priority || 'medium',
      category: body.category || 'other',
      supplier_id: body.supplier_id || null,
      notes: body.notes || '',
      created_by: user.id,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('material_specs')
      .insert(specData)
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
    
    if (error) throw error;
    
    // Create activity log
    await createActivityLog('material_spec', 'created', data.id, user.id, {
      spec_name: data.name,
      project_name: data.project?.name
    });
    
    return createSuccessResponse(data);
  } catch (error) {
    console.error('Material spec creation error:', error);
    throw error;
  }
}

// Helper functions
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
