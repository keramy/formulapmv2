/**
 * Dashboard Page - Optimized Performance Implementation
 * 
 * PERFORMANCE FEATURES:
 * - Simplified loading with React Suspense
 * - Error boundaries for graceful failure handling
 * - Immediate content display without artificial delays
 */

'use client';

import { Suspense } from 'react';
import { ConstructionDashboardOptimized } from '@/components/dashboard/ConstructionDashboardOptimized';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';


function DashboardContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
          Project Control Center
        </h1>
        <p className="text-lg text-gray-600">
          Monitor your construction projects, track progress, and manage resources
        </p>
      </div>
      
      <ErrorBoundary>
        <ConstructionDashboardOptimized />
      </ErrorBoundary>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent />
        </Suspense>
      </div>
    </div>
  );
}

// Metadata is handled by layout.tsx for Client Components