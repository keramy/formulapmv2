import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple debug endpoint to test project fetching
export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS for debugging
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    console.log('🔍 [DEBUG] Testing project fetch...');
    
    // Test fetching the specific project that's causing issues
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, name, code, status, is_active')
      .eq('id', 'e1eda0dc-d09e-4aab-a2ff-83085b121e5b');
    
    // Also check all projects to see what's available
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, name, is_active')
      .limit(10);
    
    console.log('📡 [DEBUG] Database response:', { projects, error, allProjects, allError });
    
    return NextResponse.json({
      success: true,
      data: {
        specificProject: projects?.[0] || null,
        specificProjectCount: projects?.length || 0,
        allProjects: allProjects || [],
        error: error?.message || null,
        allError: allError?.message || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('❌ [DEBUG] Error:', err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}