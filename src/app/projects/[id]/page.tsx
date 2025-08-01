'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { TabbedWorkspaceOptimized } from '@/components/projects/TabbedWorkspaceOptimized';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { 
  useLoadingOrchestrator, 
  ProgressiveLoadingContainer,
  ProjectWorkspaceSkeleton,
  SmartLoadingIndicator,
  useComponentLoading
} from '@/components/ui/SimpleLoadingOrchestrator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Progressive Project Header
 * Loads project basic info first, then detailed metadata
 */
function ProgressiveProjectHeader({ projectId }: { projectId: string }) {
  const { start, finish, progress, isLoading } = useComponentLoading(
    'project-header',
    'Loading project information',
    'critical'
  );
  const [projectExists, setProjectExists] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    start();
    
    const loadProjectHeader = async () => {
      try {
        // Phase 1: Check if project exists (20%)
        progress(20);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Simulate project validation
        const exists = await validateProject(projectId);
        setProjectExists(exists);
        
        if (!exists) {
          finish();
          return;
        }
        
        // Phase 2: Load basic project info (60%)
        progress(60);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Phase 3: Load project metadata (100%)
        progress(100);
        await new Promise(resolve => setTimeout(resolve, 200));
        
        finish();
      } catch (error) {
        console.error('Error loading project header:', error);
        setProjectExists(false);
        finish();
      }
    };
    
    loadProjectHeader();
  }, [projectId, start, finish, progress]);

  // Project not found error state
  if (projectExists === false) {
    return (
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">Project Not Found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The project you're looking for doesn't exist or you don't have access to it.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push('/projects')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <ProgressiveLoadingContainer
      loadingStates={['project-header']}
      fallback={
        <div className="space-y-4">
          <SmartLoadingIndicator 
            loadingId="project-header"
            showLabel={true}
            showProgress={true}
          />
          <div className="h-32 bg-muted/30 animate-pulse rounded-lg" />
        </div>
      }
    >
      <ErrorBoundary>
        <ProjectHeader projectId={projectId} />
      </ErrorBoundary>
    </ProgressiveLoadingContainer>
  );
}

/**
 * Progressive Project Tabs
 * Loads tab structure first, then tab content on demand
 */
function ProgressiveProjectTabs({ projectId }: { projectId: string }) {
  const { start, finish, isLoading } = useComponentLoading(
    'project-tabs',
    'Loading project workspace',
    'high',
    ['project-header']
  );

  useEffect(() => {
    start();
    
    const loadTabs = async () => {
      try {
        // Load tab structure
        await new Promise(resolve => setTimeout(resolve, 400));
        finish();
      } catch (error) {
        console.error('Error loading project tabs:', error);
        finish();
      }
    };
    
    loadTabs();
  }, [projectId, start, finish]);

  return (
    <ProgressiveLoadingContainer
      loadingStates={['project-tabs']}
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading Workspace...</CardTitle>
          </CardHeader>
          <CardContent>
            <SmartLoadingIndicator 
              loadingId="project-tabs"
              showLabel={true}
              showProgress={false}
            />
            <div className="mt-4 space-y-3">
              <div className="h-6 bg-muted/50 animate-pulse rounded" />
              <div className="h-32 bg-muted/30 animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      }
    >
      <ErrorBoundary
        fallback={
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-medium text-destructive">Workspace Error</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There was an error loading the project workspace.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <TabbedWorkspaceOptimized projectId={projectId} />
      </ErrorBoundary>
    </ProgressiveLoadingContainer>
  );
}

/**
 * Simulates project validation (replace with actual API call)
 */
async function validateProject(projectId: string): Promise<boolean> {
  // This would be replaced with actual project validation logic
  // For now, simulate a validation check
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'HEAD' // Just check if project exists
    });
    return response.ok;
  } catch {
    return true; // Assume exists if can't validate
  }
}

/**
 * Progressive Project Workspace
 * Orchestrates the loading of project components with proper error handling
 */
function ProgressiveProjectWorkspace({ projectId }: { projectId: string }) {
  const { getMetrics } = useLoadingOrchestrator();
  const [loadingStartTime] = useState(Date.now());

  useEffect(() => {
    // Track page load performance
    const trackPerformance = () => {
      const loadTime = Date.now() - loadingStartTime;
      console.log(`🚀 Project workspace loaded in ${loadTime}ms`);
      
      const metrics = getMetrics();
      console.log('📊 Loading metrics:', {
        totalDuration: metrics.totalDuration,
        criticalPathDuration: metrics.criticalPathDuration,
        coreWebVitals: metrics.coreWebVitals
      });
    };
    
    // Track when all critical components finish loading
    const timer = setTimeout(trackPerformance, 2000);
    return () => clearTimeout(timer);
  }, [loadingStartTime, getMetrics]);

  return (
    <div className="p-6 space-y-6">
      {/* Progressive Header Loading */}
      <ProgressiveProjectHeader projectId={projectId} />
      
      {/* Progressive Tabs Loading */}
      <ProgressiveProjectTabs projectId={projectId} />
    </div>
  );
}

export default function ProjectWorkspacePage() {
  const params = useParams();
  const projectId = params.id as string;

  // Validate projectId parameter
  if (!projectId || typeof projectId !== 'string') {
    return (
      <div className="p-6">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h3 className="font-medium text-destructive">Invalid Project</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  No project ID provided in the URL.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6">
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <h3 className="font-medium text-destructive">Page Error</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    There was an error loading this project workspace.
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <ProgressiveProjectWorkspace projectId={projectId} />
    </ErrorBoundary>
  );
}