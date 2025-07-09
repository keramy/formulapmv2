'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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