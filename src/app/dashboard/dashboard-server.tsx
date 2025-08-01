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
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Server-side components for data fetching
import { ServerDashboardStats } from './components/server/ServerDashboardStats';
import { ServerProjectsOverview } from './components/server/ServerProjectsOverview';
import { ServerActivityFeed } from './components/server/ServerActivityFeed';

// Client components for interactivity (keep existing when needed)
import { ClientDashboardActions } from './components/client/ClientDashboardActions';
import { ConstructionDashboard } from '@/components/dashboard/ConstructionDashboard';

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
    const supabase = await createClient();

    // Get the session from cookies
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      // Handle specific auth errors gracefully - return null instead of throwing
      console.log('🔐 [ServerDashboard] Auth error (expected in some cases):', userError.message);
      return null;
    }
    
    if (!user) {
      console.log('🔐 [ServerDashboard] No user found in server session');
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

    console.log('✅ [ServerDashboard] User authenticated on server:', profile.email);
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
    console.log('🔐 [ServerDashboard] Server auth failed (client auth still valid):', error);
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

  // Handle server authentication failure - fallback to client-side dashboard
  if (!user) {
    // Import client dashboard dynamically to avoid SSR issues
    const { ClientDashboard } = await import('./components/client/ClientDashboard');
    return <ClientDashboard />;
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
  if (user.role === 'management') {
    return (
      <div className="space-y-6">
        {/* Dashboard Header - Static content, render immediately */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user.first_name}
            </h1>
            <p className="text-gray-600 capitalize">
              Project Control Center
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
          
          {/* Construction Dashboard Section */}
          <div className="mt-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <ConstructionDashboard />
            </Suspense>
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
      
      {/* Construction Dashboard Section */}
      <div className="mt-6">
        <Suspense fallback={<DashboardSkeleton />}>
          <ConstructionDashboard />
        </Suspense>
      </div>
    </div>
  );
}

export default ServerDashboard;