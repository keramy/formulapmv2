'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats } from './DashboardStats';
import { ProjectOverview } from './ProjectOverview';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { TaskSummary } from './TaskSummary';
import Link from 'next/link';

export function DashboardContent() {
  const { user } = useAuth();
  const { hasPermission, canAccess, canViewClientPortalAdmin, checkPermission } = usePermissions();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* New Dashboard Test Banner */}
      {hasPermission('projects.read.all') || hasPermission('projects.read.assigned') ? (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">Try the New Simplified Dashboard</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Experience our redesigned Project Manager Dashboard with a cleaner, more focused interface.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/project-manager">
                  Try New Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Dashboard Statistics */}
      <DashboardStats />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Overview */}
          {(hasPermission('projects.read.all') || hasPermission('projects.read.assigned')) && <ProjectOverview />}
          
          {/* Task Summary for role-specific views */}
          {hasPermission('tasks.view') && <TaskSummary />}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <RecentActivity />
          
          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}