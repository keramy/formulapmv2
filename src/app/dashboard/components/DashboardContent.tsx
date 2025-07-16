'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardSkeleton } from './DashboardSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users, 
  FileText, 
  TrendingUp,
  Plus 
} from 'lucide-react';

interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  teamMembers: number;
  documents: number;
}

export function DashboardContent() {
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardStats();
    }
  }, [profile]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      // Simulate API call - replace with actual data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats({
        totalProjects: 12,
        activeProjects: 8,
        completedTasks: 156,
        pendingTasks: 23,
        teamMembers: 15,
        documents: 89
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading || statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {profile?.first_name} {profile?.last_name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="capitalize">
            {profile?.role?.replace('_', ' ')}
          </Badge>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingTasks} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teamMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.documents}</div>
            <p className="text-xs text-muted-foreground">
              Total files
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Task completed</p>
                  <p className="text-muted-foreground">Foundation work finished</p>
                </div>
                <span className="text-xs text-muted-foreground">2h ago</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Attention needed</p>
                  <p className="text-muted-foreground">Material delivery delayed</p>
                </div>
                <span className="text-xs text-muted-foreground">4h ago</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-500" />
                <div className="flex-1 text-sm">
                  <p className="font-medium">Meeting scheduled</p>
                  <p className="text-muted-foreground">Team standup at 10:00 AM</p>
                </div>
                <span className="text-xs text-muted-foreground">6h ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Construction Site A</p>
                  <p className="text-sm text-muted-foreground">85% complete</p>
                </div>
                <Badge variant="default">On Track</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Office Building B</p>
                  <p className="text-sm text-muted-foreground">60% complete</p>
                </div>
                <Badge variant="secondary">In Progress</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Residential Complex C</p>
                  <p className="text-sm text-muted-foreground">25% complete</p>
                </div>
                <Badge variant="outline">Planning</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
