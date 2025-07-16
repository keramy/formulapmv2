/**
 * Dashboard Page - Client Component with Auth Guard
 * 
 * AUTHENTICATION FIX:
 * - Converted back to client-side authentication to avoid NEXT_REDIRECT errors
 * - Uses AuthGuard component for proper authentication handling
 * - Maintains same UX with proper loading states
 * - Avoids server-side redirect issues
 */

'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardContent } from './components/DashboardContent';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { PageErrorBoundary, FeatureErrorBoundary } from '@/components/ErrorBoundary';

export default function DashboardPage() {
  return (
    <PageErrorBoundary pageName="Dashboard Page">
      <AuthGuard fallback={<DashboardSkeleton />}>
        <div className="container mx-auto py-6">
          <FeatureErrorBoundary featureName="Dashboard Content">
            <DashboardContent />
          </FeatureErrorBoundary>
        </div>
      </AuthGuard>
    </PageErrorBoundary>
  );
}