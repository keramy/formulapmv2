/**
 * Server Component Dashboard - Phase 1 Optimization
 * 
 * This is the new server-rendered version of the dashboard that:
 * 1. Fetches data on the server for faster initial loads
 * 2. Reduces client-side JavaScript bundle
 * 3. Improves SEO and Core Web Vitals
 * 4. Maintains the same UX with progressive enhancement
 */

import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Server-side components for data fetching
import { ServerDashboardStats } from './components/server/ServerDashboardStats';
import { ServerProjectsOverview } from './components/server/ServerProjectsOverview';
import { ServerActivityFeed } from './components/server/ServerActivityFeed';

// Client components for interactivity (keep existing when needed)
import { ClientDashboardActions } from './components/client/ClientDashboardActions';
import { RealtimeDashboard } from '@/components/dashboard/RealtimeDashboard';

// PM-specific dashboard components
import { MyProjectsOverview } from './components/pm/MyProjectsOverview';
import { MyTasksAndActions } from './components/pm/MyTasksAndActions';
import { RecentProjectActivity } from './components/pm/RecentProjectActivity';
import { CriticalAlerts } from './components/pm/CriticalAlerts';

interface DashboardUser {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  permissions: Record<string, any>;
}

async function getAuthenticatedUser(): Promise<DashboardUser | null> {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the session from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ [ServerDashboard] No authenticated user:', userError?.message);
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.log('❌ [ServerDashboard] Profile fetch failed:', profileError?.message);
      return null;
    }

    if (!profile.is_active) {
      console.log('❌ [ServerDashboard] User account is deactivated');
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      is_active: profile.is_active,
      permissions: profile.permissions || {}
    };
  } catch (error) {
    console.error('❌ [ServerDashboard] Authentication error:', error);
    return null;
  }
}

function hasPermission(permissions: Record<string, any>, permission: string): boolean {
  const keys = permission.split('.');
  let current: any = permissions;
  
  for (const key of keys) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return false;
    }
    current = current[key];
  }
  
  return Boolean(current);
}

async function ServerDashboard() {
  const user = await getAuthenticatedUser();

  // Handle unauthenticated users
  if (!user) {
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

  // Check permissions server-side
  const canReadProjects = hasPermission(user.permissions, 'projects.read.all') || 
                          hasPermission(user.permissions, 'projects.read.assigned');

  if (!canReadProjects) {
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

  // Company Owner Dashboard
  if (user.role === 'company_owner') {
    return (
      <div className="space-y-6">
        {/* Dashboard Header - Static content, render immediately */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.first_name}
            </h1>
            <p className="text-gray-600 capitalize">
              Company Owner Dashboard
            </p>
          </div>
          {/* Client component for interactive actions */}
          <Suspense fallback={<div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />}>
            <ClientDashboardActions userId={user.id} role={user.role} />
          </Suspense>
        </div>

        {/* Dashboard Content - Progressive enhancement */}
        <div className="space-y-6">
          {/* Stats Cards - Critical data, fetch on server */}
          <Suspense fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="h-24">
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          }>
            <ErrorBoundary>
              <ServerDashboardStats userId={user.id} role={user.role} />
            </ErrorBoundary>
          </Suspense>
          
          {/* Projects and Activity - Stream in progressively */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Suspense fallback={
                <Card className="h-96 animate-pulse">
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
                </Card>
              }>
                <ErrorBoundary>
                  <ServerProjectsOverview userId={user.id} role={user.role} />
                </ErrorBoundary>
              </Suspense>
            </div>
            <div>
              <Suspense fallback={
                <Card className="h-96 animate-pulse">
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
                </Card>
              }>
                <ErrorBoundary>
                  <ServerActivityFeed userId={user.id} role={user.role} />
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
          
          {/* Real-time Dashboard Section */}
          <div className="mt-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <RealtimeDashboard />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  // Project Manager Dashboard
  if (user.role === 'project_manager') {
    return (
      <div className="space-y-6">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.first_name}
            </h1>
            <p className="text-gray-600">
              Project Manager Dashboard
            </p>
          </div>
          <Suspense fallback={<div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />}>
            <ClientDashboardActions userId={user.id} role={user.role} />
          </Suspense>
        </div>

        {/* PM Dashboard Content - Specialized for project management */}
        <div className="space-y-6">
          {/* Critical Alerts - Top priority */}
          <Suspense fallback={
            <Card className="h-32 animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          }>
            <ErrorBoundary>
              <CriticalAlerts userId={user.id} />
            </ErrorBoundary>
          </Suspense>

          {/* Tasks and Projects Overview - Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={
              <Card className="h-96 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            }>
              <ErrorBoundary>
                <MyTasksAndActions userId={user.id} />
              </ErrorBoundary>
            </Suspense>

            <Suspense fallback={
              <Card className="h-96 animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            }>
              <ErrorBoundary>
                <MyProjectsOverview userId={user.id} />
              </ErrorBoundary>
            </Suspense>
          </div>

          {/* Projects and Activity Feed - Secondary content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Suspense fallback={
                <Card className="h-96 animate-pulse">
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
                </Card>
              }>
                <ErrorBoundary>
                  <ServerProjectsOverview userId={user.id} role={user.role} />
                </ErrorBoundary>
              </Suspense>
            </div>
            
            <div>
              <Suspense fallback={
                <Card className="h-96 animate-pulse">
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
                </Card>
              }>
                <ErrorBoundary>
                  <RecentProjectActivity userId={user.id} />
                </ErrorBoundary>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default Dashboard for other roles - optimized with server components
  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.first_name}
          </h1>
          <p className="text-gray-600 capitalize">
            {user.role.replace('_', ' ')} Dashboard
          </p>
        </div>
        <Suspense fallback={<div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />}>
          <ClientDashboardActions userId={user.id} role={user.role} />
        </Suspense>
      </div>

      {/* Dashboard Content - Server-rendered with progressive enhancement */}
      <Suspense fallback={<DashboardSkeleton />}>
        <ErrorBoundary>
          <ServerDashboardStats userId={user.id} role={user.role} />
        </ErrorBoundary>
      </Suspense>
      
      {/* Real-time Dashboard Section */}
      <div className="mt-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <RealtimeDashboard />
        </Suspense>
      </div>
    </div>
  );
}

export default ServerDashboard;