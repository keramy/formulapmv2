'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataStateWrapper } from '@/components/ui/loading-states';
import { OverviewTab } from './tabs/OverviewTab';
import { MilestonesTab } from './tabs/MilestonesTab';
import { TasksTab } from './tabs/TasksTab';
import { ScopeListTab } from './tabs/ScopeListTab';
import { ShopDrawingsTab } from './tabs/ShopDrawingsTab';
import { MaterialSpecsTab } from './tabs/MaterialSpecsTab';
import { ReportsTab } from './tabs/ReportsTab';

interface TabbedWorkspaceProps {
  projectId: string;
}

export function TabbedWorkspace({ projectId }: TabbedWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="scope">Scope List</TabsTrigger>
          <TabsTrigger value="drawings">Shop Drawings</TabsTrigger>
          <TabsTrigger value="materials">Material Specs</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <OverviewTab projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="milestones" className="mt-6">
          <MilestonesTab projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="tasks" className="mt-6">
          <TasksTab projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="scope" className="mt-6">
          <ScopeListTab projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="drawings" className="mt-6">
          <ShopDrawingsTab projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="materials" className="mt-6">
          <MaterialSpecsTab projectId={projectId} />
        </TabsContent>
        
        <TabsContent value="reports" className="mt-6">
          <ReportsTab projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Enhanced TabbedWorkspace with DataStateWrapper integration
 * This provides consistent loading states for project workspace tabs
 */
export function TabbedWorkspaceEnhanced({ projectId }: TabbedWorkspaceProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={projectId}
      onRetry={() => setError(null)}
      emptyComponent={
        <div className="text-center py-12">
          <div className="text-muted-foreground">No project selected</div>
        </div>
      }
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="scope">Scope</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="scope" className="space-y-4">
            <ScopeListTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <MilestonesTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <TasksTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <MaterialSpecsTab projectId={projectId} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <ReportsTab projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </DataStateWrapper>
  );
}