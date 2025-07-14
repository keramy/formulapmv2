/**
 * Optimized Dashboard Page - Server Component
 * 
 * PERFORMANCE OPTIMIZATION PHASE 1:
 * - Converted from 100% client-side to server-side rendering
 * - Expected 40-60% faster initial page loads
 * - Reduced client-side JavaScript bundle size
 * - Better SEO and Core Web Vitals scores
 * - Maintains same UX with progressive enhancement
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase';
import ServerDashboard from './dashboard-server';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Server-side authentication check
async function checkAuth() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('❌ [Dashboard] Authentication failed, redirecting to login');
      redirect('/auth/login');
    }

    return user;
  } catch (error) {
    console.error('❌ [Dashboard] Auth check error:', error);
    redirect('/auth/login');
  }
}

export default async function DashboardPage() {
  // Server-side auth check - no loading states needed
  await checkAuth();

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