/**
 * Optimized Tabbed Workspace - Dynamic Import Implementation
 * 
 * PERFORMANCE OPTIMIZATION PHASE 1.2:
 * - Lazy loads tab components only when needed
 * - Expected 30-50% bundle size reduction
 * - Faster initial page loads for project pages
 * - Progressive enhancement with loading states
 */

'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Dynamic imports with loading states - only load when tab is accessed
const OverviewTab = dynamic(() => import('./tabs/OverviewTab').then(mod => ({ default: mod.OverviewTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const MilestonesTab = dynamic(() => import('./tabs/MilestonesTab').then(mod => ({ default: mod.MilestonesTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const TasksTab = dynamic(() => import('./tabs/TasksTab').then(mod => ({ default: mod.TasksTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const ScopeListTab = dynamic(() => import('./tabs/RealtimeScopeListTab').then(mod => ({ default: mod.RealtimeScopeListTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const ShopDrawingsTab = dynamic(() => import('./tabs/ShopDrawingsTab').then(mod => ({ default: mod.ShopDrawingsTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const MaterialSpecsTab = dynamic(() => import('./tabs/MaterialSpecsTab').then(mod => ({ default: mod.MaterialSpecsTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

const ReportsTab = dynamic(() => import('./tabs/ReportsTab').then(mod => ({ default: mod.ReportsTab })), {
  loading: () => <TabLoadingSkeleton />,
  ssr: false
});

interface TabbedWorkspaceProps {
  projectId: string;
}

// Loading skeleton for tab content
function TabLoadingSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center space-x-2 py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm text-gray-500">Loading tab content...</span>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Track which tabs have been loaded for performance monitoring
const loadedTabs = new Set<string>();

export function TabbedWorkspaceOptimized({ projectId }: TabbedWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (value: string) => {
    // Track tab loading for analytics
    if (!loadedTabs.has(value)) {
      loadedTabs.add(value);
      console.log(`📊 [TabbedWorkspace] Dynamically loading tab: ${value}`);
    }
    setActiveTab(value);
  };

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="scope">Scope List</TabsTrigger>
          <TabsTrigger value="drawings">Shop Drawings</TabsTrigger>
          <TabsTrigger value="materials">Material Specs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab - Load immediately as it's the default */}
        <TabsContent value="overview" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <OverviewTab projectId={projectId} />
          </Suspense>
        </TabsContent>
        
        {/* Milestones Tab - Dynamic import */}
        <TabsContent value="milestones" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <MilestonesTab projectId={projectId} />
          </Suspense>
        </TabsContent>
        
        {/* Tasks Tab - Dynamic import */}
        <TabsContent value="tasks" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <TasksTab projectId={projectId} />
          </Suspense>
        </TabsContent>
        
        {/* Scope List Tab - Dynamic import */}
        <TabsContent value="scope" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ScopeListTab projectId={projectId} />
          </Suspense>
        </TabsContent>
        
        {/* Shop Drawings Tab - Dynamic import */}
        <TabsContent value="drawings" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ShopDrawingsTab projectId={projectId} />
          </Suspense>
        </TabsContent>
        
        {/* Material Specs Tab - Dynamic import */}
        <TabsContent value="materials" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <MaterialSpecsTab projectId={projectId} />
          </Suspense>
        </TabsContent>
        
        {/* Reports Tab - Dynamic import */}
        <TabsContent value="reports" className="mt-6">
          <Suspense fallback={<TabLoadingSkeleton />}>
            <ReportsTab projectId={projectId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export performance analytics
export function getTabbedWorkspaceMetrics() {
  return {
    totalTabs: 7,
    loadedTabs: loadedTabs.size,
    bundleSavings: ((7 - loadedTabs.size) / 7) * 100,
    loadedTabsList: Array.from(loadedTabs)
  };
}