import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { parseQueryParams } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for creating shop drawings
const createShopDrawingSchema = z.object({
  scope_item_id: z.string().uuid().optional(),
  drawing_number: z.string().optional(), // Auto-generated if not provided
  title: z.string().min(1),
  discipline: z.enum(['architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'millwork', 'landscape', 'interior_design', 'other']),
  description: z.string().optional(),
  revision: z.string().default('A'),
  scale: z.string().optional(),
  size: z.string().optional(),
  file_path: z.string().optional(),
  file_size: z.number().optional(),
  assigned_architect: z.string().uuid().optional(),
});

// GET /api/projects/[id]/shop-drawings - List project shop drawings
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = createClient();
    
    // Parse query parameters for filtering and pagination
    const { page, limit, search, sort_field = 'created_at', sort_direction = 'desc', filters } = parseQueryParams(request);
    
    // Build query for shop drawings
    let query = supabase
      .from('shop_drawings')
      .select(`
        id,
        drawing_number,
        title,
        discipline,
        description,
        revision,
        status,
        scale,
        size,
        original_file_path,
        current_file_path,
        file_size,
        thumbnail_path,
        created_at,
        updated_at,
        internal_approved_at,
        submitted_to_client_at,
        client_approved_at,
        metadata,
        creator:user_profiles!shop_drawings_created_by_fkey(
          id, first_name, last_name, email
        ),
        assigned_architect_user:user_profiles!shop_drawings_assigned_architect_fkey(
          id, first_name, last_name, email
        ),
        internal_approver:user_profiles!shop_drawings_internal_approved_by_fkey(
          id, first_name, last_name, email
        ),
        client_approver:user_profiles!shop_drawings_client_approved_by_fkey(
          id, first_name, last_name, email
        ),
        scope_item:scope_items(
          id, name, description
        )
      `, { count: 'exact' })
      .eq('project_id', projectId);
    
    // Apply search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,drawing_number.ilike.%${search}%`);
    }
    
    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    // Apply discipline filter
    if (filters?.discipline) {
      query = query.eq('discipline', filters.discipline);
    }
    
    // Apply revision filter
    if (filters?.revision) {
      query = query.eq('revision', filters.revision);
    }
    
    // Apply date range filters
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    
    // Apply special filters
    if (filters?.has_approvals === 'true') {
      query = query.not('internal_approved_at', 'is', null);
    }
    if (filters?.pending_approval === 'true') {
      query = query.in('status', ['internal_review', 'client_review']);
    }
    
    // Apply sorting
    query = query.order(sort_field, { ascending: sort_direction === 'asc' });
    
    // Apply pagination
    if (limit) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching shop drawings:', error);
      return createErrorResponse('Failed to fetch shop drawings', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = data.map(drawing => ({
      id: drawing.id,
      name: drawing.title,
      description: drawing.description || '',
      status: mapDbToFrontendStatus(drawing.status),
      priority: determinePriority(drawing),
      submittedBy: drawing.creator 
        ? `${drawing.creator.first_name} ${drawing.creator.last_name}`
        : 'Unknown',
      submittedDate: drawing.created_at.split('T')[0],
      reviewedBy: drawing.internal_approver 
        ? `${drawing.internal_approver.first_name} ${drawing.internal_approver.last_name}`
        : drawing.client_approver 
          ? `${drawing.client_approver.first_name} ${drawing.client_approver.last_name}`
          : undefined,
      reviewedDate: drawing.internal_approved_at?.split('T')[0] || drawing.client_approved_at?.split('T')[0],
      version: parseInt(drawing.revision) || 1,
      category: capitalizeFirstLetter(drawing.discipline),
      notes: drawing.metadata?.notes || '',
      fileSize: formatFileSize(drawing.file_size),
      fileType: 'PDF',
      
      // Additional shop drawing specific data
      drawing_number: drawing.drawing_number,
      discipline: drawing.discipline,
      revision: drawing.revision,
      scale: drawing.scale,
      size: drawing.size,
      file_path: drawing.current_file_path || drawing.original_file_path,
      thumbnail_path: drawing.thumbnail_path,
      assigned_architect: drawing.assigned_architect_user ? {
        id: drawing.assigned_architect_user.id,
        name: `${drawing.assigned_architect_user.first_name} ${drawing.assigned_architect_user.last_name}`,
        email: drawing.assigned_architect_user.email
      } : undefined,
      scope_item: drawing.scope_item,
      internal_approved_at: drawing.internal_approved_at,
      submitted_to_client_at: drawing.submitted_to_client_at,
      client_approved_at: drawing.client_approved_at,
      created_at: drawing.created_at,
      updated_at: drawing.updated_at
    }));
    
    // Calculate statistics
    const statsQuery = await supabase
      .from('shop_drawings')
      .select('status, discipline')
      .eq('project_id', projectId);
    
    const statistics = calculateShopDrawingStatistics(statsQuery.data || []);
    
    return createSuccessResponse(transformedData, {
      page,
      limit,
      total: count || 0,
      statistics,
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/shop-drawings:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.read' });

// POST /api/projects/[id]/shop-drawings - Create new shop drawing
export const POST = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createShopDrawingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid shop drawing data', 400, validationResult.error.errors);
    }
    
    const drawingData = {
      project_id: projectId,
      created_by: profile.id,
      ...validationResult.data,
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Create the shop drawing
    const { data, error } = await supabase
      .from('shop_drawings')
      .insert(drawingData)
      .select(`
        id,
        drawing_number,
        title,
        discipline,
        description,
        revision,
        status,
        scale,
        size,
        original_file_path,
        current_file_path,
        file_size,
        thumbnail_path,
        created_at,
        updated_at,
        internal_approved_at,
        submitted_to_client_at,
        client_approved_at,
        metadata,
        creator:user_profiles!shop_drawings_created_by_fkey(
          id, first_name, last_name, email
        ),
        assigned_architect_user:user_profiles!shop_drawings_assigned_architect_fkey(
          id, first_name, last_name, email
        ),
        scope_item:scope_items(
          id, name, description
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating shop drawing:', error);
      return createErrorResponse('Failed to create shop drawing', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = {
      id: data.id,
      name: data.title,
      description: data.description || '',
      status: mapDbToFrontendStatus(data.status),
      priority: determinePriority(data),
      submittedBy: data.creator 
        ? `${data.creator.first_name} ${data.creator.last_name}`
        : 'Unknown',
      submittedDate: data.created_at.split('T')[0],
      version: parseInt(data.revision) || 1,
      category: capitalizeFirstLetter(data.discipline),
      fileSize: formatFileSize(data.file_size),
      fileType: 'PDF',
      
      // Additional shop drawing specific data
      drawing_number: data.drawing_number,
      discipline: data.discipline,
      revision: data.revision,
      scale: data.scale,
      size: data.size,
      file_path: data.current_file_path || data.original_file_path,
      thumbnail_path: data.thumbnail_path,
      assigned_architect: data.assigned_architect_user ? {
        id: data.assigned_architect_user.id,
        name: `${data.assigned_architect_user.first_name} ${data.assigned_architect_user.last_name}`,
        email: data.assigned_architect_user.email
      } : undefined,
      scope_item: data.scope_item,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'shop_drawing.created',
      resource_type: 'shop_drawing',
      resource_id: data.id,
      details: {
        project_id: projectId,
        drawing_number: data.drawing_number,
        title: data.title,
        discipline: data.discipline,
      },
    });
    
    return createSuccessResponse(transformedData, null, 201);
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/shop-drawings:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.create' });

// Helper functions
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatFileSize(sizeInBytes?: number): string {
  if (!sizeInBytes) return '0 KB';
  
  const sizeInKB = sizeInBytes / 1024;
  if (sizeInKB < 1000) {
    return `${Math.round(sizeInKB)} KB`;
  } else {
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }
}

function mapDbToFrontendStatus(dbStatus: string): string {
  const mapping: Record<string, string> = {
    'draft': 'pending',
    'internal_review': 'under_review',
    'internal_approved': 'under_review',
    'submitted_to_client': 'under_review',
    'client_review': 'under_review',
    'approved': 'approved',
    'approved_with_comments': 'approved',
    'rejected': 'rejected',
    'revision_required': 'revision_required',
    'superseded': 'rejected'
  };
  return mapping[dbStatus] || dbStatus;
}

function determinePriority(drawing: any): 'low' | 'medium' | 'high' {
  // Determine priority based on discipline and approval urgency
  if (['structural', 'electrical'].includes(drawing.discipline)) return 'high';
  if (drawing.status === 'revision_required' || drawing.status === 'rejected') return 'high';
  if (['mechanical', 'plumbing'].includes(drawing.discipline)) return 'medium';
  return 'low';
}

function calculateShopDrawingStatistics(drawings: any[]) {
  const stats = {
    total: drawings.length,
    byStatus: {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      revision_required: 0
    },
    byDiscipline: {
      architectural: 0,
      structural: 0,
      mechanical: 0,
      electrical: 0,
      plumbing: 0,
      millwork: 0,
      other: 0
    },
    pendingApproval: 0,
    recentSubmissions: 0
  };
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  drawings.forEach(drawing => {
    // Count by status
    const frontendStatus = mapDbToFrontendStatus(drawing.status);
    if (stats.byStatus[frontendStatus as keyof typeof stats.byStatus] !== undefined) {
      stats.byStatus[frontendStatus as keyof typeof stats.byStatus]++;
    }
    
    // Count by discipline
    if (stats.byDiscipline[drawing.discipline as keyof typeof stats.byDiscipline] !== undefined) {
      stats.byDiscipline[drawing.discipline as keyof typeof stats.byDiscipline]++;
    }
    
    // Count pending approvals
    if (['internal_review', 'client_review', 'submitted_to_client'].includes(drawing.status)) {
      stats.pendingApproval++;
    }
    
    // Count recent submissions (assuming created_at exists in the drawing object)
    if (drawing.created_at && new Date(drawing.created_at) >= oneWeekAgo) {
      stats.recentSubmissions++;
    }
  });
  
  return stats;
}