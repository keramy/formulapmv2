import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse, parseQueryParams } from '@/lib/api-middleware';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for creating milestones
const createMilestoneSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  target_date: z.string(),
  status: z.enum(['upcoming', 'in_progress', 'completed', 'overdue', 'cancelled']).optional(),
});

// GET /api/projects/[id]/milestones - List project milestones
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = await createClient();
    
    // Parse query parameters for filtering and pagination
    const { page, limit, search, sort_field = 'due_date', sort_direction = 'asc', filters } = parseQueryParams(request);
    
    // Build query without foreign key references (constraints don't exist in cloud DB yet)
    let query = supabase
      .from('milestones')
      .select(`
        id,
        name,
        description,
        due_date,
        completed_date,
        status,
        percentage_weight,
        amount,
        responsible_user_id,
        created_by,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('project_id', projectId);
    
    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // Apply status filter
    if (filters?.status) {
      // Map frontend status to database status
      const dbStatus = mapFrontendToDbStatus(filters.status);
      query = query.eq('status', dbStatus);
    }
    
    // Apply date range filters
    if (filters?.target_date_start) {
      query = query.gte('due_date', filters.target_date_start);
    }
    if (filters?.target_date_end) {
      query = query.lte('due_date', filters.target_date_end);
    }
    
    // Apply special filters
    if (filters?.overdue_only === 'true') {
      query = query.lt('due_date', new Date().toISOString().split('T')[0])
                   .neq('status', 'completed');
    }
    if (filters?.completed_only === 'true') {
      query = query.eq('status', 'completed');
    }
    if (filters?.upcoming_only === 'true') {
      query = query.eq('status', 'pending')
                   .gte('due_date', new Date().toISOString().split('T')[0]);
    }
    
    // Apply sorting
    const dbSortField = sort_field === 'target_date' ? 'due_date' : sort_field;
    query = query.order(dbSortField, { ascending: sort_direction === 'asc' });
    
    // Apply pagination
    if (limit) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching milestones:', error);
      return createErrorResponse('Failed to fetch milestones', 500);
    }
    
    // Transform data to match frontend types (no related data until FK constraints are added)
    const transformedData = data.map(milestone => ({
      id: milestone.id,
      project_id: projectId,
      name: milestone.name,
      description: milestone.description,
      target_date: milestone.due_date,
      actual_date: milestone.completed_date,
      status: mapDbToFrontendStatus(milestone.status),
      created_by: milestone.created_by,
      created_at: milestone.created_at,
      updated_at: milestone.updated_at,
      // Related data will be available once FK constraints are added to cloud DB
      creator: undefined,
      responsible: undefined,
      project: undefined
    }));
    
    // Calculate statistics
    const statsQuery = await supabase
      .from('milestones')
      .select('status, due_date')
      .eq('project_id', projectId);
    
    const statistics = calculateMilestoneStatistics(statsQuery.data || []);
    
    return createSuccessResponse({
      data: transformedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        has_more: (page * limit) < (count || 0)
      },
      statistics
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/milestones:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.read.all' });

// POST /api/projects/[id]/milestones - Create new milestone
export const POST = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = await createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createMilestoneSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid milestone data', 400);
    }
    
    const milestoneData = {
      project_id: projectId,
      name: validationResult.data.name,
      description: validationResult.data.description,
      due_date: validationResult.data.target_date,
      status: mapFrontendToDbStatus(validationResult.data.status || 'upcoming'),
      created_by: profile.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Create the milestone
    const { data, error } = await supabase
      .from('milestones')
      .insert(milestoneData)
      .select(`
        id,
        name,
        description,
        due_date,
        completed_date,
        status,
        percentage_weight,
        amount,
        responsible_user_id,
        created_by,
        created_at,
        updated_at
      `)
      .single();
    
    if (error) {
      console.error('Error creating milestone:', error);
      return createErrorResponse('Failed to create milestone', 500);
    }
    
    // Transform data to match frontend types (no related data until FK constraints are added)
    const transformedData = {
      id: data.id,
      project_id: projectId,
      name: data.name,
      description: data.description,
      target_date: data.due_date,
      actual_date: data.completed_date,
      status: mapDbToFrontendStatus(data.status),
      created_by: data.created_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // Related data will be available once FK constraints are added to cloud DB
      creator: undefined
    };
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'milestone.created',
      resource_type: 'milestone',
      resource_id: data.id,
      details: {
        project_id: projectId,
        title: data.name,
      },
    });
    
    return createSuccessResponse(transformedData);
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/milestones:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.create' });

// Helper functions to map between frontend and database status values
function mapFrontendToDbStatus(frontendStatus: string): string {
  const mapping: Record<string, string> = {
    'upcoming': 'pending',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'overdue': 'delayed',
    'cancelled': 'cancelled'
  };
  return mapping[frontendStatus] || frontendStatus;
}

function mapDbToFrontendStatus(dbStatus: string): string {
  const mapping: Record<string, string> = {
    'pending': 'upcoming',
    'in_progress': 'in_progress',
    'completed': 'completed',
    'delayed': 'overdue',
    'cancelled': 'cancelled'
  };
  return mapping[dbStatus] || dbStatus;
}

function calculateMilestoneStatistics(milestones: any[]) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  
  const stats = {
    total: milestones.length,
    byStatus: {
      upcoming: 0,
      in_progress: 0,
      completed: 0,
      overdue: 0,
      cancelled: 0
    },
    overdue: 0,
    upcoming: 0,
    completed: 0,
    completionRate: 0
  };
  
  milestones.forEach(milestone => {
    const frontendStatus = mapDbToFrontendStatus(milestone.status);
    stats.byStatus[frontendStatus as keyof typeof stats.byStatus]++;
    
    if (milestone.status === 'completed') {
      stats.completed++;
    } else if (milestone.due_date < today && milestone.status !== 'completed') {
      stats.overdue++;
    } else if (milestone.status === 'pending') {
      stats.upcoming++;
    }
  });
  
  stats.completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
  
  return stats;
}