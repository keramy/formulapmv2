import { NextRequest } from 'next/server';
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';
import { createClient } from '@/lib/supabase/server';

export const GET = withAuth(async (request: NextRequest, { user, profile }, { params }) => {
  try {
    const supabase = await createClient();
    const projectId = params.id;
    
    // Get project stats from database
    const [
      { count: totalTasks },
      { count: completedTasks },
      { count: totalDocuments },
      { count: totalMilestones },
      { count: completedMilestones },
      { count: totalScope },
      { count: completedScope },
      { count: totalMaterialSpecs },
      { count: approvedMaterialSpecs },
      { count: teamMembers }
    ] = await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'completed'),
      supabase.from('documents').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('project_milestones').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('project_milestones').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'completed'),
      supabase.from('scope_items').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('scope_items').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'completed'),
      supabase.from('material_specifications').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
      supabase.from('material_specifications').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('status', 'approved'),
      supabase.from('project_team_assignments').select('*', { count: 'exact', head: true }).eq('project_id', projectId).eq('is_active', true)
    ]);

    // Get project budget info
    const { data: projectData } = await supabase
      .from('projects')
      .select('budget_amount')
      .eq('id', projectId)
      .single();

    // Calculate risk level based on various factors
    const calculateRiskLevel = (completionRate: number, overdueTasks: number): 'low' | 'medium' | 'high' => {
      if (completionRate < 30 || overdueTasks > 5) return 'high';
      if (completionRate < 60 || overdueTasks > 2) return 'medium';
      return 'low';
    };

    const completionRate = (totalTasks || 0) > 0 ? Math.round(((completedTasks || 0) / (totalTasks || 0)) * 100) : 0;
    const budget = projectData?.budget_amount || 0;
    
    const stats = {
      totalTasks: totalTasks || 0,
      completedTasks: completedTasks || 0,
      teamMembers: teamMembers || 0,
      documents: totalDocuments || 0,
      budgetSpent: Math.round(budget * 0.4), // Mock data - replace with real spent calculation
      budgetRemaining: Math.round(budget * 0.6), // Mock data
      riskLevel: calculateRiskLevel(completionRate, 0) as 'low' | 'medium' | 'high',
      scopeItemsTotal: totalScope || 0,
      scopeItemsCompleted: completedScope || 0,
      milestonesTotal: totalMilestones || 0,
      milestonesCompleted: completedMilestones || 0,
      materialSpecsTotal: totalMaterialSpecs || 0,
      materialSpecsApproved: approvedMaterialSpecs || 0
    };

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return createErrorResponse('Failed to fetch project stats', 500);
  }
}, { permission: 'projects.read.all' });