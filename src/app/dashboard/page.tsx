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
import { ConstructionDashboard } from '@/components/dashboard/ConstructionDashboard';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardPage() {
  // No server-side auth - LayoutWrapper handles all authentication
  // User will only see this page if LayoutWrapper confirms they're authenticated
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorBoundary>
          <Suspense fallback={<DashboardSkeleton />}>
            <ConstructionDashboard />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// Add metadata for better SEO
export const metadata = {
  title: 'Project Control Center | Formula PM',
  description: 'Professional construction project management dashboard with portfolio overview, project tracking, and comprehensive project insights',
};