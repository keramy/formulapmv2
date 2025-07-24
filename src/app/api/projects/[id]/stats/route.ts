import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: projectId } = await params;
    
    // Get project stats from database
    const [
      { count: totalTasks },
      { count: completedTasks },
      { count: totalDocuments },
      { count: totalMilestones }
    ] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'completed'),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('project_milestones').select('*', { count: 'exact', head: true }).eq('project_id', projectId)
    ]);

    const stats = {
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      totalDocuments: totalDocuments || 0,
      totalMilestones: totalMilestones || 0,
      completionRate: (totalTasks || 0) > 0 ? Math.round(((completedTasks || 0) / (totalTasks || 0)) * 100) : 0
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json({ error: 'Failed to fetch project stats' }, { status: 500 });
  }
}