import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/middleware';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, profile, error: authError } = await verifyAuth(request);
    if (authError || !user || !profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    // Format activities for consistent response
    const formattedActivities = (data || []).map((item: any) => ({
      ...item,
      user: item.user ? item.user : null
    }));

    return NextResponse.json(formattedActivities);
  } catch (error) {
    console.error('Dashboard activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}