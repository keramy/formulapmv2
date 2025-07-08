'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardContent } from './components/DashboardContent';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { GlobalStatsCards } from './components/owner/GlobalStatsCards';
import { ProjectsOverview } from './components/owner/ProjectsOverview';
import { CompanyActivityFeed } from './components/owner/CompanyActivityFeed';

export default function DashboardPage() {
  const { user, profile, isManagement } = useAuth();
  const permissions = usePermissions();
  const { hasPermission } = permissions;

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to view the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission('projects.read.all') && !hasPermission('projects.read.assigned')) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You don't have permission to view the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show simplified owner dashboard for company_owner role
  if (profile.role === 'company_owner') {
    return (
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile.first_name}
            </h1>
            <p className="text-gray-600 capitalize">
              Company Owner Dashboard
            </p>
          </div>
        </div>

        {/* Owner Dashboard Content */}
        <Suspense fallback={<DashboardSkeleton />}>
          <div className="space-y-6">
            <GlobalStatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ProjectsOverview />
              </div>
              <div>
                <CompanyActivityFeed />
              </div>
            </div>
          </div>
        </Suspense>
      </div>
    );
  }

  // Default dashboard for other roles
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.first_name}
          </h1>
          <p className="text-gray-600 capitalize">
            {profile.role.replace('_', ' ')} Dashboard
          </p>
        </div>
      </div>

      {/* Dashboard Content */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}