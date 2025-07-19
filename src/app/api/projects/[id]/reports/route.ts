import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { parseQueryParams } from '@/lib/api-utils';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema for creating reports
const createReportSchema = z.object({
  report_type: z.enum(['daily', 'weekly', 'incident', 'quality', 'safety']),
  report_date: z.string(),
  weather_conditions: z.string().optional(),
  workers_present: z.number().optional(),
  work_performed: z.string().min(1),
  issues_encountered: z.string().optional(),
  materials_used: z.array(z.any()).optional(),
  equipment_used: z.array(z.any()).optional(),
  photos: z.array(z.string()).optional(),
  safety_incidents: z.number().optional(),
  incident_details: z.string().optional(),
  next_steps: z.string().optional(),
});

// GET /api/projects/[id]/reports - List project reports
export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = createClient();
    
    // Parse query parameters for filtering and pagination
    const { page, limit, search, sort_field = 'report_date', sort_direction = 'desc', filters } = parseQueryParams(request);
    
    // Build query for field reports
    let query = supabase
      .from('field_reports')
      .select(`
        id,
        report_type,
        report_date,
        weather_conditions,
        workers_present,
        work_performed,
        issues_encountered,
        materials_used,
        equipment_used,
        photos,
        safety_incidents,
        incident_details,
        next_steps,
        created_at,
        updated_at,
        submitted_by_user:user_profiles!field_reports_submitted_by_fkey(
          id, first_name, last_name, email
        )
      `, { count: 'exact' })
      .eq('project_id', projectId);
    
    // Apply search filter
    if (search) {
      query = query.or(`work_performed.ilike.%${search}%,issues_encountered.ilike.%${search}%,next_steps.ilike.%${search}%`);
    }
    
    // Apply report type filter
    if (filters?.type) {
      query = query.eq('report_type', filters.type);
    }
    
    // Apply date range filters
    if (filters?.date_from) {
      query = query.gte('report_date', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('report_date', filters.date_to);
    }
    
    // Apply special filters
    if (filters?.has_incidents === 'true') {
      query = query.gt('safety_incidents', 0);
    }
    if (filters?.has_photos === 'true') {
      query = query.not('photos', 'eq', '[]');
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
      console.error('Error fetching reports:', error);
      return createErrorResponse('Failed to fetch reports', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = data.map(report => ({
      id: report.id,
      name: `${capitalizeFirstLetter(report.report_type)} Report - ${formatDate(report.report_date)}`,
      description: report.work_performed.length > 100 
        ? report.work_performed.substring(0, 100) + '...'
        : report.work_performed,
      type: report.report_type,
      status: 'completed', // Field reports are always completed when submitted
      generatedBy: report.submitted_by_user 
        ? `${report.submitted_by_user.first_name} ${report.submitted_by_user.last_name}`
        : 'Unknown',
      generatedDate: report.report_date,
      reviewedBy: null,
      reviewedDate: null,
      fileSize: calculateFileSize(report),
      fileType: 'Report',
      reportPeriod: formatDate(report.report_date),
      priority: report.safety_incidents > 0 ? 'high' : 'medium',
      summary: report.issues_encountered || 'No issues reported',
      // Additional field report specific data
      weather_conditions: report.weather_conditions,
      workers_present: report.workers_present,
      work_performed: report.work_performed,
      issues_encountered: report.issues_encountered,
      materials_used: report.materials_used,
      equipment_used: report.equipment_used,
      photos: report.photos,
      safety_incidents: report.safety_incidents,
      incident_details: report.incident_details,
      next_steps: report.next_steps,
      created_at: report.created_at,
      updated_at: report.updated_at
    }));
    
    // Calculate statistics
    const statsQuery = await supabase
      .from('field_reports')
      .select('report_type, safety_incidents')
      .eq('project_id', projectId);
    
    const statistics = calculateReportStatistics(statsQuery.data || []);
    
    return createSuccessResponse(transformedData, {
      page,
      limit,
      total: count || 0,
      statistics,
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/reports:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.read' });

// POST /api/projects/[id]/reports - Create new report
export const POST = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const projectId = params.id;
    const supabase = createClient();
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = createReportSchema.safeParse(body);
    
    if (!validationResult.success) {
      return createErrorResponse('Invalid report data', 400, validationResult.error.errors);
    }
    
    const reportData = {
      project_id: projectId,
      submitted_by: profile.id,
      ...validationResult.data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    // Create the report
    const { data, error } = await supabase
      .from('field_reports')
      .insert(reportData)
      .select(`
        id,
        report_type,
        report_date,
        weather_conditions,
        workers_present,
        work_performed,
        issues_encountered,
        materials_used,
        equipment_used,
        photos,
        safety_incidents,
        incident_details,
        next_steps,
        created_at,
        updated_at,
        submitted_by_user:user_profiles!field_reports_submitted_by_fkey(
          id, first_name, last_name, email
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating report:', error);
      return createErrorResponse('Failed to create report', 500);
    }
    
    // Transform data to match frontend types
    const transformedData = {
      id: data.id,
      name: `${capitalizeFirstLetter(data.report_type)} Report - ${formatDate(data.report_date)}`,
      description: data.work_performed.length > 100 
        ? data.work_performed.substring(0, 100) + '...'
        : data.work_performed,
      type: data.report_type,
      status: 'completed',
      generatedBy: data.submitted_by_user 
        ? `${data.submitted_by_user.first_name} ${data.submitted_by_user.last_name}`
        : 'Unknown',
      generatedDate: data.report_date,
      fileSize: calculateFileSize(data),
      fileType: 'Report',
      reportPeriod: formatDate(data.report_date),
      priority: data.safety_incidents > 0 ? 'high' : 'medium',
      summary: data.issues_encountered || 'No issues reported',
      // Additional field report specific data
      weather_conditions: data.weather_conditions,
      workers_present: data.workers_present,
      work_performed: data.work_performed,
      issues_encountered: data.issues_encountered,
      materials_used: data.materials_used,
      equipment_used: data.equipment_used,
      photos: data.photos,
      safety_incidents: data.safety_incidents,
      incident_details: data.incident_details,
      next_steps: data.next_steps,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
    
    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: profile.id,
      action: 'report.created',
      resource_type: 'report',
      resource_id: data.id,
      details: {
        project_id: projectId,
        report_type: data.report_type,
        report_date: data.report_date,
      },
    });
    
    return createSuccessResponse(transformedData, null, 201);
  } catch (error) {
    console.error('Error in POST /api/projects/[id]/reports:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'projects.create' });

// Helper functions
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function calculateFileSize(report: any): string {
  // Rough estimation based on content length
  const contentLength = JSON.stringify(report).length;
  const sizeInKB = Math.round(contentLength / 1024);
  if (sizeInKB < 1000) {
    return `${sizeInKB} KB`;
  } else {
    return `${(sizeInKB / 1024).toFixed(1)} MB`;
  }
}

function calculateReportStatistics(reports: any[]) {
  const stats = {
    total: reports.length,
    byType: {
      daily: 0,
      weekly: 0,
      incident: 0,
      quality: 0,
      safety: 0
    },
    safetyIncidents: 0,
    recentReports: 0
  };
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  reports.forEach(report => {
    stats.byType[report.report_type as keyof typeof stats.byType]++;
    stats.safetyIncidents += report.safety_incidents || 0;
    
    if (new Date(report.report_date) >= oneWeekAgo) {
      stats.recentReports++;
    }
  });
  
  return stats;
}