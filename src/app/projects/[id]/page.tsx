'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ProjectHeader } from '@/components/projects/ProjectHeader';
import { TabbedWorkspaceOptimized } from '@/components/projects/TabbedWorkspaceOptimized';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/useAuth';
import { 
  ProgressiveLoadingContainer,
  ProjectWorkspaceSkeleton,
  SimpleLoadingIndicator,
  useComponentLoading
} from '@/components/ui/SimpleLoadingOrchestrator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Simplified Project Header
 * Loads project information with basic validation
 */
function ProgressiveProjectHeader({ projectId }: { projectId: string }) {
  const { start, finish } = useComponentLoading('project-header');
  const { getAccessToken } = useAuth();
  const [projectExists, setProjectExists] = useState<boolean | null>(null);
  const router = useRouter();
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate loading for the same project
    if (loadedRef.current === projectId) return;
    
    loadedRef.current = projectId;
    start();
    
    const loadProjectHeader = async () => {
      try {
        // Validate project with authentication
        const exists = await validateProject(projectId, getAccessToken);
        setProjectExists(exists);
        
        finish();
      } catch (error) {
        console.error('Error loading project header:', error);
        setProjectExists(false);
        finish();
      }
    };
    
    loadProjectHeader();
  }, [projectId]); // Only depend on projectId to prevent infinite loops

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
      loadingId="project-header"
      fallback={
        <div className="space-y-4">
          <SimpleLoadingIndicator 
            loadingId="project-header"
            label="Loading project information..."
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
 * Simplified Project Tabs
 * Loads project workspace without artificial delays
 */
function ProgressiveProjectTabs({ projectId }: { projectId: string }) {
  const { start, finish } = useComponentLoading('project-tabs');
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    // Prevent duplicate loading for the same project
    if (loadedRef.current === projectId) return;
    
    loadedRef.current = projectId;
    start();
    
    const loadTabs = async () => {
      try {
        // Immediate loading - no artificial delays
        finish();
      } catch (error) {
        console.error('Error loading project tabs:', error);
        finish();
      }
    };
    
    loadTabs();
  }, [projectId]); // Only depend on projectId to prevent infinite loops

  return (
    <ProgressiveLoadingContainer
      loadingId="project-tabs"
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Loading Workspace...</CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleLoadingIndicator 
              loadingId="project-tabs"
              label="Loading workspace..."
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
 * Validates project existence with proper authentication
 */
async function validateProject(projectId: string, getAccessToken: () => Promise<string | null>): Promise<boolean> {
  try {
    // Get authentication token
    const token = await getAccessToken();
    if (!token) {
      console.warn('🔐 [validateProject] No auth token available');
      return false;
    }

    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'HEAD', // Just check if project exists
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Reduced console logging to prevent spam
    if (!response.ok) {
      console.warn(`🔍 [validateProject] Project ${projectId} validation failed:`, response.status);
    }
    
    return response.ok;
  } catch (error) {
    console.error('🔍 [validateProject] Validation error:', error);
    return false; // Return false on error to show proper error state
  }
}

/**
 * Simplified Project Workspace
 * Clean loading of project components without complex tracking
 */
function ProgressiveProjectWorkspace({ projectId }: { projectId: string }) {
  const [loadingStartTime] = useState(Date.now());

  useEffect(() => {
    // Simple performance tracking
    const trackPerformance = () => {
      const loadTime = Date.now() - loadingStartTime;
      console.log(`🚀 Project workspace loaded in ${loadTime}ms`);
    };
    
    // Track when components finish loading
    const timer = setTimeout(trackPerformance, 1000);
    return () => clearTimeout(timer);
  }, [loadingStartTime]);

  return (
    <div className="p-6 space-y-6">
      {/* Simplified Header Loading */}
      <ProgressiveProjectHeader projectId={projectId} />
      
      {/* Simplified Tabs Loading */}
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