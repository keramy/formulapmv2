import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for updating milestones
const updateMilestoneSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  target_date: z.string().optional(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
  actual_date: z.string().nullable().optional(),
});

// GET /api/milestones/[id] - Get single milestone
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const milestoneId = params.id;
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('project_milestones')
      .select(`
        id,
        title,
        description,
        milestone_date,
        status,
        milestone_type,
        completion_percentage,
        actual_completion_date,
        notes,
        created_at,
        updated_at,
        creator:user_profiles!project_milestones_created_by_fkey(
          id, first_name, last_name, email
        ),
        project:projects(
          id, name, status
        )
      `)
      .eq('id', milestoneId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return createErrorResponse('Milestone not found', 404);
      }
      console.error('Error fetching milestone:', error);
      return createErrorResponse('Failed to fetch milestone', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = {
      id: data.id,
      project_id: data.project?.id,
      name: data.title,
      description: data.description,
      target_date: data.milestone_date,
      actual_date: data.actual_completion_date,
      status: mapDbToFrontendStatus(data.status),
      created_by: data.creator?.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      creator: data.creator ? {
        id: data.creator.id,
        full_name: `${data.creator.first_name} ${data.creator.last_name}`,
        email: data.creator.email
      } : undefined,
      project: data.project
    };
    
    return createSuccessResponse(transformedData);
  } catch (error) {
    console.error('Error in GET /api/milestones/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.read' });

// PUT /api/milestones/[id] - Update milestone
export const PUT = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const milestoneId = params.id;
    const supabase = createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateMilestoneSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid milestone data', 400, validationResult.error.errors);
    }
    
    // Check if milestone exists
    const { data: existingMilestone } = await supabase
      .from('project_milestones')
      .select('id, status')
      .eq('id', milestoneId)
      .single();
    
    if (!existingMilestone) {
      return createErrorResponse('Milestone not found', 404);
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };
    
    if (validationResult.data.name) {
      updateData.title = validationResult.data.name;
    }
    if (validationResult.data.description !== undefined) {
      updateData.description = validationResult.data.description;
    }
    if (validationResult.data.target_date) {
      updateData.milestone_date = validationResult.data.target_date;
    }
    if (validationResult.data.status) {
      updateData.status = mapFrontendToDbStatus(validationResult.data.status);
    }
    if (validationResult.data.actual_date !== undefined) {
      updateData.actual_completion_date = validationResult.data.actual_date;
    }
    
    // If status is changing to completed, set actual completion date if not provided
    if (validationResult.data.status === 'completed' && existingMilestone.status !== 'completed') {
      updateData.actual_completion_date = updateData.actual_completion_date || new Date().toISOString().split('T')[0];
      updateData.completion_percentage = 100;
    }
    
    // Update the milestone
    const { data, error } = await supabase
      .from('project_milestones')
      .update(updateData)
      .eq('id', milestoneId)
      .select(`
        id,
        title,
        description,
        milestone_date,
        status,
        milestone_type,
        completion_percentage,
        actual_completion_date,
        notes,
        created_at,
        updated_at,
        creator:user_profiles!project_milestones_created_by_fkey(
          id, first_name, last_name, email
        ),
        project:projects(
          id, name, status
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating milestone:', error);
      return createErrorResponse('Failed to update milestone', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = {
      id: data.id,
      project_id: data.project?.id,
      name: data.title,
      description: data.description,
      target_date: data.milestone_date,
      actual_date: data.actual_completion_date,
      status: mapDbToFrontendStatus(data.status),
      created_by: data.creator?.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      creator: data.creator ? {
        id: data.creator.id,
        full_name: `${data.creator.first_name} ${data.creator.last_name}`,
        email: data.creator.email
      } : undefined,
      project: data.project
    };
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'milestone.updated',
      resource_type: 'milestone',
      resource_id: milestoneId,
      details: {
        changes: validationResult.data,
      },
    });
    
    return createSuccessResponse(transformedData);
  } catch (error) {
    console.error('Error in PUT /api/milestones/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.update' });

// DELETE /api/milestones/[id] - Delete milestone
export const DELETE = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const milestoneId = params.id;
    const supabase = createClient();
    
    // Check if milestone exists
    const { data: existingMilestone } = await supabase
      .from('project_milestones')
      .select('id, title, project_id')
      .eq('id', milestoneId)
      .single();
    
    if (!existingMilestone) {
      return createErrorResponse('Milestone not found', 404);
    }
    
    // Delete the milestone
    const { error } = await supabase
      .from('project_milestones')
      .delete()
      .eq('id', milestoneId);
    
    if (error) {
      console.error('Error deleting milestone:', error);
      return createErrorResponse('Failed to delete milestone', 500);
    }
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'milestone.deleted',
      resource_type: 'milestone',
      resource_id: milestoneId,
      details: {
        title: existingMilestone.title,
        project_id: existingMilestone.project_id,
      },
    });
    
    return createSuccessResponse({ message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/milestones/[id]:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.delete' });

// Helper functions to map between frontend and database status values
function mapFrontendToDbStatus(frontendStatus: string): string {
  const mapping: Record<string, string> = {
    'upcoming': 'not_started',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'overdue': 'overdue',
    'cancelled': 'cancelled'
  };
  return mapping[frontendStatus] || frontendStatus;
}

function mapDbToFrontendStatus(dbStatus: string): string {
  const mapping: Record<string, string> = {
    'not_started': 'upcoming',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'overdue': 'overdue',
    'cancelled': 'cancelled'
  };
  return mapping[dbStatus] || dbStatus;
}