'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { StaggeredLoader } from '@/components/StaggeredLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load dashboard components to prevent thundering herd API calls
const DashboardContent = dynamic(() => import('./components/DashboardContent').then(mod => ({ default: mod.DashboardContent })), {
  loading: () => <DashboardSkeleton />,
  ssr: false
});

const GlobalStatsCards = dynamic(() => import('./components/owner/GlobalStatsCards').then(mod => ({ default: mod.GlobalStatsCards })), {
  loading: () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="h-24">
        <CardContent className="p-4">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </Card>
    ))}
  </div>,
  ssr: false
});

const ProjectsOverview = dynamic(() => import('./components/owner/ProjectsOverview').then(mod => ({ default: mod.ProjectsOverview })), {
  loading: () => <Card className="h-96 animate-pulse">
    <CardHeader>
      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded"></div>
        ))}
      </div>
    </CardContent>
  </Card>,
  ssr: false
});

const CompanyActivityFeed = dynamic(() => import('./components/owner/CompanyActivityFeed').then(mod => ({ default: mod.CompanyActivityFeed })), {
  loading: () => <Card className="h-96 animate-pulse">
    <CardHeader>
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>,
  ssr: false
});

export default function DashboardPage() {
  const { user, profile, isManagement, loading } = useAuth();
  const permissions = usePermissions();
  const { hasPermission } = permissions;

  console.log('📊 Dashboard: Rendering, user:', user?.email, 'profile:', profile?.role, 'loading:', loading);

  if (loading) {
    console.log('⏳ Dashboard: Auth is loading...');
    return <DashboardSkeleton />;
  }

  if (!user || !profile) {
    console.log('❌ Dashboard: No user or profile, showing access required');
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

        {/* Owner Dashboard Content - Staggered Loading */}
        <div className="space-y-6">
          {/* Load stats first */}
          <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-24">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>}>
            <ErrorBoundary>
              <GlobalStatsCards />
            </ErrorBoundary>
          </Suspense>
          
          {/* Load projects and activity with staggered delays */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StaggeredLoader 
                delay={500} 
                fallback={<Card className="h-96 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>}
              >
                <Suspense fallback={<Card className="h-96 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>}>
                  <ErrorBoundary>
                    <ProjectsOverview />
                  </ErrorBoundary>
                </Suspense>
              </StaggeredLoader>
            </div>
            <div>
              <StaggeredLoader 
                delay={800} 
                fallback={<Card className="h-96 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>}
              >
                <Suspense fallback={<Card className="h-96 animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>}>
                  <ErrorBoundary>
                    <CompanyActivityFeed />
                  </ErrorBoundary>
                </Suspense>
              </StaggeredLoader>
            </div>
          </div>
        </div>
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

      {/* Dashboard Content - Staggered Loading */}
      <StaggeredLoader delay={300} fallback={<DashboardSkeleton />}>
        <Suspense fallback={<DashboardSkeleton />}>
          <ErrorBoundary>
            <DashboardContent />
          </ErrorBoundary>
        </Suspense>
      </StaggeredLoader>
    </div>
  );
}