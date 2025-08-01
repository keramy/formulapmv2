'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Simplified Loading Orchestrator
 * Manages coordinated loading states without the complexity that caused errors
 */

interface LoadingState {
  id: string;
  isLoading: boolean;
  progress?: number;
}

interface LoadingContextType {
  loadingStates: Record<string, LoadingState>;
  startLoading: (id: string, progress?: number) => void;
  finishLoading: (id: string) => void;
  updateProgress: (id: string, progress: number) => void;
  isLoading: (id: string) => boolean;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

export function useLoadingOrchestrator() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingOrchestrator must be used within LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const startLoading = useCallback((id: string, progress: number = 0) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: { id, isLoading: true, progress }
    }));
  }, []);

  const finishLoading = useCallback((id: string) => {
    setLoadingStates(prev => {
      const { [id]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const updateProgress = useCallback((id: string, progress: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: prev[id] ? { ...prev[id], progress } : prev[id]
    }));
  }, []);

  const isLoading = useCallback((id: string) => {
    return !!loadingStates[id]?.isLoading;
  }, [loadingStates]);

  return (
    <LoadingContext.Provider value={{
      loadingStates,
      startLoading,
      finishLoading,
      updateProgress,
      isLoading
    }}>
      {children}
    </LoadingContext.Provider>
  );
}

interface ProgressiveLoadingContainerProps {
  children: ReactNode;
  loadingId: string;
  fallback?: ReactNode;
  showProgress?: boolean;
  className?: string;
}

export function ProgressiveLoadingContainer({
  children,
  loadingId,
  fallback,
  showProgress = false,
  className = ''
}: ProgressiveLoadingContainerProps) {
  const { isLoading, loadingStates } = useLoadingOrchestrator();
  const isCurrentlyLoading = isLoading(loadingId);
  const progress = loadingStates[loadingId]?.progress || 0;

  if (isCurrentlyLoading) {
    return (
      <div className={className}>
        {fallback || (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading...</span>
            </div>
            {showProgress && progress > 0 && (
              <div className="ml-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

interface SimpleLoadingIndicatorProps {
  loadingId: string;
  showProgress?: boolean;
  label?: string;
}

export function SimpleLoadingIndicator({ 
  loadingId, 
  showProgress = false,
  label = "Loading..."
}: SimpleLoadingIndicatorProps) {
  const { isLoading, loadingStates } = useLoadingOrchestrator();
  const isCurrentlyLoading = isLoading(loadingId);
  const progress = loadingStates[loadingId]?.progress || 0;
  
  if (!isCurrentlyLoading) return null;
  
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600">{label}</span>
      {showProgress && progress > 0 && (
        <div className="flex items-center space-x-2">
          <div className="w-20 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

// Hook for component-level loading management
export function useComponentLoading(componentId: string) {
  const { startLoading, finishLoading, updateProgress, isLoading } = useLoadingOrchestrator();
  
  const start = useCallback((initialProgress: number = 0) => {
    startLoading(componentId, initialProgress);
  }, [componentId, startLoading]);
  
  const finish = useCallback(() => {
    finishLoading(componentId);
  }, [componentId, finishLoading]);
  
  const progress = useCallback((value: number) => {
    updateProgress(componentId, value);
  }, [componentId, updateProgress]);
  
  return { 
    isLoading: isLoading(componentId), 
    start, 
    finish, 
    progress 
  };
}

// Additional skeleton components for compatibility
export function ProjectWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Project Header Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        {/* Status Bar */}
        <div className="flex space-x-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b">
        <div className="flex space-x-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
      </div>

      {/* Tab Content Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Smart Loading Indicator with advanced features
interface SmartLoadingIndicatorProps {
  loadingId: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showProgress?: boolean;
  label?: string;
}

export function SmartLoadingIndicator({ 
  loadingId, 
  size = 'md', 
  showLabel = true,
  showProgress = false,
  label = "Loading..."
}: SmartLoadingIndicatorProps) {
  const { isLoading, loadingStates } = useLoadingOrchestrator();
  const state = loadingStates[loadingId];
  
  if (!state || !state.isLoading) return null;
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className={`animate-spin ${sizeClasses[size]} text-primary`} />
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {label}
        </span>
      )}
      {showProgress && state.progress !== undefined && (
        <div className="flex items-center space-x-2">
          <div className="w-20 bg-muted rounded-full h-2">
            <div 
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(state.progress)}%
          </span>
        </div>
      )}
    </div>
  );
}

// Note: useLoadingOrchestrator is already exported above as the main hook