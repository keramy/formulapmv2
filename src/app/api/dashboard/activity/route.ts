import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { createServerClient } from '@/lib/supabase';

export const GET = withAuth(async (request: NextRequest, { user, profile }) => {
  try {

    const supabase = createServerClient();

    // Fetch recent activities
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id,
        user_id,
        action,
        entity_type,
        entity_name,
        created_at,
        metadata,
        user:user_profiles!audit_logs_user_id_fkey(
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching activities:', error);
      return createErrorResponse('Failed to fetch activities', 500);
    }

    // Format activities for consistent response
    const formattedActivities = (data || []).map((item: any) => ({
      ...item,
      user: item.user ? item.user : null
    }));

    return createSuccessResponse(formattedActivities);
  } catch (error) {
    console.error('Dashboard activity API error:', error);
    return createErrorResponse('Internal server error', 500);
  }
})