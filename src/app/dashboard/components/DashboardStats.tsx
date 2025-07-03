'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { FolderOpen, CheckSquare, Users, DollarSign, AlertTriangle, Clock } from 'lucide-react';

interface DashboardStatsData {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  budget: number;
  pendingApprovals: number;
}

export function DashboardStats() {
  const { user } = useAuth();
  const { hasPermission, canAccess } = usePermissions();
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      
      try {
        setLoading(true);

        // Fetch projects based on user role
        let projectQuery = supabase
          .from('projects')
          .select('*', { count: 'exact' });

        // Apply role-based filtering
        if (!canAccess(['admin', 'project_manager'])) {
          // For non-admin/PM roles, only show projects they're members of
          const { data: memberProjects } = await supabase
            .from('project_assignments')
            .select('project_id')
            .eq('user_id', user.id);
          
          const projectIds = memberProjects?.map(pm => pm.project_id) || [];
          if (projectIds.length > 0) {
            projectQuery = projectQuery.in('id', projectIds);
          } else {
            // No projects for this user
            projectQuery = projectQuery.eq('id', 'none');
          }
        }

        const [
          { count: totalProjects },
          { count: activeProjects },
          { data: scopeItems, count: totalTasks },
          { data: teamData, count: teamMembers },
          { data: tenderData }
        ] = await Promise.all([
          projectQuery.eq('is_active', true),
          projectQuery.eq('status', 'active').eq('is_active', true),
          supabase.from('scope_items').select('*', { count: 'exact' }),
          hasPermission('users.read.all') 
            ? supabase.from('user_profiles').select('*', { count: 'exact' }).eq('is_active', true)
            : { data: [], count: 0 },
          hasPermission('financials.view')
            ? supabase.from('financial_tenders').select('estimated_value, currency')
            : { data: [] }
        ]);

        // Calculate task statistics
        const completedTasks = scopeItems?.filter(item => item.status === 'completed').length || 0;
        const overdueTasks = scopeItems?.filter(item => 
          item.timeline_end && 
          new Date(item.timeline_end) < new Date() && 
          item.status !== 'completed'
        ).length || 0;

        // Calculate budget (sum of estimated tender values)
        const budget = tenderData?.reduce((sum, tender) => {
          return sum + (tender.estimated_value || 0);
        }, 0) || 0;

        // Calculate pending approvals (shop drawings with pending status)
        const { count: pendingApprovals } = await supabase
          .from('shop_drawings_mobile')
          .select('*', { count: 'exact' })
          .eq('status', 'pending');

        setStats({
          totalProjects: totalProjects || 0,
          activeProjects: activeProjects || 0,
          totalTasks: totalTasks || 0,
          completedTasks,
          overdueTasks,
          teamMembers: teamMembers || 0,
          budget,
          pendingApprovals: pendingApprovals || 0
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user, hasPermission, canAccess]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      total: stats.totalProjects,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      show: hasPermission('projects.read.all') || hasPermission('projects.read.assigned')
    },
    {
      title: 'Tasks Completed',
      value: stats.completedTasks,
      total: stats.totalTasks,
      icon: CheckSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      show: hasPermission('tasks.view')
    },
    {
      title: 'Overdue Tasks',
      value: stats.overdueTasks,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      show: hasPermission('tasks.view')
    },
    {
      title: 'Team Members',
      value: stats.teamMembers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      show: hasPermission('users.read.all')
    },
    {
      title: 'Total Budget',
      value: `$${(stats.budget / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      show: hasPermission('financials.view')
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      show: hasPermission('documents.read.all') || hasPermission('documents.read.project')
    }
  ].filter(card => card.show);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-full ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value}
              </div>
              {stat.total !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  of {stat.total} total
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}