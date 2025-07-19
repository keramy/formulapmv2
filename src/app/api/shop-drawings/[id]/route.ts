import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updating shop drawings
const updateShopDrawingSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  discipline: z.enum(['architectural', 'structural', 'mechanical', 'electrical', 'plumbing', 'millwork', 'landscape', 'interior_design', 'other']).optional(),
  revision: z.string().optional(),
  status: z.enum(['draft', 'internal_review', 'internal_approved', 'submitted_to_client', 'client_review', 'approved', 'approved_with_comments', 'rejected', 'revision_required', 'superseded']).optional(),
  scale: z.string().optional(),
  size: z.string().optional(),
  assigned_architect: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// GET /api/shop-drawings/[id] - Get single shop drawing
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const drawingId = params.id;
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('shop_drawings')
      .select(`
        id,
        project_id,
        scope_item_id,
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
        ),
        project:projects(
          id, name, status
        )
      `)
      .eq('id', drawingId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Shop drawing not found', 404);
      }
      console.error('Error fetching shop drawing:', error);
      return createErrorResponse('Failed to fetch shop drawing', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = {
      id: data.id,
      project_id: data.project_id,
      scope_item_id: data.scope_item_id,
      name: data.title,
      description: data.description || '',
      status: mapDbToFrontendStatus(data.status),
      priority: determinePriority(data),
      submittedBy: data.creator 
        ? `${data.creator.first_name} ${data.creator.last_name}`
        : 'Unknown',
      submittedDate: data.created_at.split('T')[0],
      reviewedBy: data.internal_approver 
        ? `${data.internal_approver.first_name} ${data.internal_approver.last_name}`
        : data.client_approver 
          ? `${data.client_approver.first_name} ${data.client_approver.last_name}`
          : undefined,
      reviewedDate: data.internal_approved_at?.split('T')[0] || data.client_approved_at?.split('T')[0],
      version: parseInt(data.revision) || 1,
      category: capitalizeFirstLetter(data.discipline),
      notes: data.metadata?.notes || '',
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
      project: data.project,
      internal_approved_at: data.internal_approved_at,
      submitted_to_client_at: data.submitted_to_client_at,
      client_approved_at: data.client_approved_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    return createSuccessResponse(transformedData);
  } catch (error) {
    console.error('Error in GET /api/shop-drawings/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.read' });

// PUT /api/shop-drawings/[id] - Update shop drawing
export const PUT = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const drawingId = params.id;
    const supabase = createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateShopDrawingSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid shop drawing data', 400, validationResult.error.errors);
    }
    
    // Check if shop drawing exists
    const { data: existingDrawing } = await supabase
      .from('shop_drawings')
      .select('id, title, status, project_id')
      .eq('id', drawingId)
      .single();
    
    if (!existingDrawing) {
      return createErrorResponse('Shop drawing not found', 404);
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (validationResult.data.title) {
      updateData.title = validationResult.data.title;
    }
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.discipline) {
      updateData.discipline = validationResult.data.discipline;
    }
    if (validationResult.data.revision) {
      updateData.revision = validationResult.data.revision;
    }
    if (validationResult.data.status) {
      updateData.status = validationResult.data.status;
    }
    if (validationResult.data.scale) {
      updateData.scale = validationResult.data.scale;
    }
    if (validationResult.data.size) {
      updateData.size = validationResult.data.size;
    }
    if (validationResult.data.assigned_architect) {
      updateData.assigned_architect = validationResult.data.assigned_architect;
    }
    
    // Handle metadata updates (notes)
    if (validationResult.data.notes !== undefined) {
      const currentMetadata = existingDrawing.metadata || {};
      updateData.metadata = {
        ...currentMetadata,
        notes: validationResult.data.notes
      };
    }
    
    // Handle status changes that require approval timestamps
    if (validationResult.data.status) {
      if (validationResult.data.status === 'internal_approved' && existingDrawing.status !== 'internal_approved') {
        updateData.internal_approved_by = profile.id;
        updateData.internal_approved_at = new Date().toISOString();
      }
      if (validationResult.data.status === 'submitted_to_client' && existingDrawing.status !== 'submitted_to_client') {
        updateData.submitted_to_client_at = new Date().toISOString();
      }
      if (['approved', 'approved_with_comments'].includes(validationResult.data.status) && !['approved', 'approved_with_comments'].includes(existingDrawing.status)) {
        updateData.client_approved_by = profile.id;
        updateData.client_approved_at = new Date().toISOString();
      }
    }
    
    // Update the shop drawing
    const { data, error } = await supabase
      .from('shop_drawings')
      .update(updateData)
      .eq('id', drawingId)
      .select(`
        id,
        project_id,
        scope_item_id,
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
        ),
        project:projects(
          id, name, status
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating shop drawing:', error);
      return createErrorResponse('Failed to update shop drawing', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = {
      id: data.id,
      project_id: data.project_id,
      scope_item_id: data.scope_item_id,
      name: data.title,
      description: data.description || '',
      status: mapDbToFrontendStatus(data.status),
      priority: determinePriority(data),
      submittedBy: data.creator 
        ? `${data.creator.first_name} ${data.creator.last_name}`
        : 'Unknown',
      submittedDate: data.created_at.split('T')[0],
      reviewedBy: data.internal_approver 
        ? `${data.internal_approver.first_name} ${data.internal_approver.last_name}`
        : data.client_approver 
          ? `${data.client_approver.first_name} ${data.client_approver.last_name}`
          : undefined,
      reviewedDate: data.internal_approved_at?.split('T')[0] || data.client_approved_at?.split('T')[0],
      version: parseInt(data.revision) || 1,
      category: capitalizeFirstLetter(data.discipline),
      notes: data.metadata?.notes || '',
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
      project: data.project,
      internal_approved_at: data.internal_approved_at,
      submitted_to_client_at: data.submitted_to_client_at,
      client_approved_at: data.client_approved_at,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'shop_drawing.updated',
      resource_type: 'shop_drawing',
      resource_id: drawingId,
      details: {
        changes: validationResult.data,
        project_id: existingDrawing.project_id,
      },
    });
    
    return createSuccessResponse(transformedData);
  } catch (error) {
    console.error('Error in PUT /api/shop-drawings/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.update' });

// DELETE /api/shop-drawings/[id] - Delete shop drawing
export const DELETE = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const drawingId = params.id;
    const supabase = createClient();
    
    // Check if shop drawing exists
    const { data: existingDrawing } = await supabase
      .from('shop_drawings')
      .select('id, title, drawing_number, project_id')
      .eq('id', drawingId)
      .single();
    
    if (!existingDrawing) {
      return createErrorResponse('Shop drawing not found', 404);
    }
    
    // Delete the shop drawing (this will cascade to related records)
    const { error } = await supabase
      .from('shop_drawings')
      .delete()
      .eq('id', drawingId);
    
    if (error) {
      console.error('Error deleting shop drawing:', error);
      return createErrorResponse('Failed to delete shop drawing', 500);
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'shop_drawing.deleted',
      resource_type: 'shop_drawing',
      resource_id: drawingId,
      details: {
        title: existingDrawing.title,
        drawing_number: existingDrawing.drawing_number,
        project_id: existingDrawing.project_id,
      },
    });
    
    return createSuccessResponse({ message: 'Shop drawing deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/shop-drawings/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.delete' });

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