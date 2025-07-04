'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { DashboardStats } from './DashboardStats';
import { ProjectOverview } from './ProjectOverview';
import { RecentActivity } from './RecentActivity';
import { QuickActions } from './QuickActions';
import { TaskSummary } from './TaskSummary';
import { ClientPortalCard } from './ClientPortalCard';
import { SubcontractorPortalCard } from './SubcontractorPortalCard';

export function DashboardContent() {
  const { user } = useAuth();
  const { hasPermission, canAccess, canViewClientPortalAdmin, checkPermission } = usePermissions();

  if (!user) return null;

  return (
    <div className="space-y-6">
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
          {/* Client Portal Card - Only for admin users */}
          {canViewClientPortalAdmin() && <ClientPortalCard />}
          
          {/* Subcontractor Portal Card - Only for admin users */}
          {canViewClientPortalAdmin() && <SubcontractorPortalCard />}
          
          {/* Recent Activity */}
          <RecentActivity />
          
          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}