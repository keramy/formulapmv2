'use client';

import { Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { DashboardContent } from './components/DashboardContent';
import { DashboardSkeleton } from './components/DashboardSkeleton';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const { hasPermission } = usePermissions();

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Required</h2>
          <p className="text-gray-600">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  if (!hasPermission('projects.read.all') && !hasPermission('projects.read.assigned')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view the dashboard.</p>
        </div>
      </div>
    );
  }

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