/**
 * Construction Dashboard Stats Component
 * 
 * Fetches construction project statistics on the server for immediate rendering
 * Displays construction-industry focused metrics and terminology
 * This replaces the client-side data fetching for better performance
 */

import { createServerClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, ClipboardList, TrendingUp, AlertTriangle, Hammer, Calendar } from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalBudget: number;
  totalSpent: number;
  activeTasks: number;
  overdueTasks: number;
  teamMembers: number;
  completionRate: number;
}

async function getDashboardStats(userId: string, role: string): Promise<DashboardStats> {
  const supabase = createServerClient();
  
  try {
    // Parallel queries for better performance
    const [
      projectsResult,
      tasksResult,
      usersResult,
      budgetResult
    ] = await Promise.all([
      // Projects stats
      supabase
        .from('projects')
        .select('id, status, budget, actual_cost')
        .order('created_at', { ascending: false }),
      
      // Tasks stats
      supabase
        .from('tasks')
        .select('id, status, due_date')
        .in('status', ['in_progress', 'review', 'blocked']),
      
      // Team members count
      supabase
        .from('user_profiles')
        .select('id')
        .eq('is_active', true),
      
      // Budget calculations
      supabase
        .from('projects')
        .select('budget, actual_cost')
        .in('status', ['active', 'planning', 'bidding'])
    ]);

    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const users = usersResult.data || [];
    const budgetData = budgetResult.data || [];

    // Calculate stats
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    
    const totalBudget = budgetData.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = budgetData.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
    
    const activeTasks = tasks.length;
    const overdueTasks = tasks.filter(t => 
      t.due_date && new Date(t.due_date) < new Date()
    ).length;
    
    const teamMembers = users.length;
    
    // Calculate completion rate
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

    return {
      totalProjects,
      activeProjects,
      totalBudget,
      totalSpent,
      activeTasks,
      overdueTasks,
      teamMembers,
      completionRate
    };
  } catch (error) {
    console.error('❌ [ServerDashboardStats] Error fetching stats:', error);
    // Return default stats on error
    return {
      totalProjects: 0,
      activeProjects: 0,
      totalBudget: 0,
      totalSpent: 0,
      activeTasks: 0,
      overdueTasks: 0,
      teamMembers: 0,
      completionRate: 0
    };
  }
}

interface ServerDashboardStatsProps {
  userId: string;
  role: string;
}

export async function ServerDashboardStats({ userId, role }: ServerDashboardStatsProps) {
  const stats = await getDashboardStats(userId, role);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${Math.round(value)}%`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Projects */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Projects in Progress</CardTitle>
          <Building2 className="h-5 w-5 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.activeProjects}</div>
          <p className="text-xs text-gray-600">
            of {stats.totalProjects} total projects
          </p>
        </CardContent>
      </Card>

      {/* Project Spending */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Project Spending</CardTitle>
          <DollarSign className="h-5 w-5 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</div>
          <p className="text-xs text-gray-600">
            of {formatCurrency(stats.totalBudget)} allocated
          </p>
        </CardContent>
      </Card>

      {/* Work Orders */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Active Work Orders</CardTitle>
          <ClipboardList className="h-5 w-5 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{stats.activeTasks}</div>
          <p className="text-xs text-gray-600">
            {stats.overdueTasks > 0 && (
              <span className="text-red-600 font-medium">
                {stats.overdueTasks} behind schedule
              </span>
            )}
            {stats.overdueTasks === 0 && "All on schedule"}
          </p>
        </CardContent>
      </Card>

      {/* Project Completion Rate */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Completion Rate</CardTitle>
          <TrendingUp className="h-5 w-5 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{formatPercentage(stats.completionRate)}</div>
          <p className="text-xs text-gray-600">
            project completion • {stats.teamMembers} team members
          </p>
        </CardContent>
      </Card>
    </div>
  );
}