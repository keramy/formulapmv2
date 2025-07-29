/**
 * Dashboard Page - Client Component Approach
 * 
 * SIMPLIFIED AUTHENTICATION:
 * - Uses client-side only authentication via LayoutWrapper
 * - LayoutWrapper handles all auth redirects consistently
 * - Eliminates client-server auth state mismatches
 * - Faster development and debugging experience
 */

import { Suspense } from 'react';
import ServerDashboard from './dashboard-server';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardPage() {
  // No server-side auth - LayoutWrapper handles all authentication
  // User will only see this page if LayoutWrapper confirms they're authenticated
  
  return (
    <div className="container mx-auto py-6">
      <ErrorBoundary>
        <Suspense fallback={<DashboardSkeleton />}>
          <ServerDashboard />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// Add metadata for better SEO
export const metadata = {
  title: 'Dashboard | Formula PM',
  description: 'Project management dashboard with real-time insights and team collaboration tools',
};