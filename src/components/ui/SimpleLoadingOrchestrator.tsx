'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Simplified Loading System
 * Replaces complex 752-line orchestrator with simple React patterns
 */

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (id: string, loading: boolean) => void;
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
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((id: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [id]: loading
    }));
  }, []);

  const isLoading = useCallback((id: string) => {
    return !!loadingStates[id];
  }, [loadingStates]);

  return (
    <LoadingContext.Provider value={{ loadingStates, setLoading, isLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

interface ProgressiveLoadingContainerProps {
  children: ReactNode;
  loadingId: string;
  fallback?: ReactNode;
  className?: string;
}

export function ProgressiveLoadingContainer({
  children,
  loadingId,
  fallback,
  className = ''
}: ProgressiveLoadingContainerProps) {
  const { isLoading } = useLoadingOrchestrator();
  
  if (isLoading(loadingId)) {
    return (
      <div className={className}>
        {fallback || (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
          </div>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

interface SimpleLoadingIndicatorProps {
  loadingId: string;
  label?: string;
}

export function SimpleLoadingIndicator({ 
  loadingId, 
  label = "Loading..."
}: SimpleLoadingIndicatorProps) {
  const { isLoading } = useLoadingOrchestrator();
  
  if (!isLoading(loadingId)) return null;
  
  return (
    <div className="flex items-center space-x-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

// Simplified hook for component-level loading management
export function useComponentLoading(componentId: string) {
  const { setLoading, isLoading } = useLoadingOrchestrator();
  
  const start = useCallback(() => {
    setLoading(componentId, true);
  }, [componentId, setLoading]);
  
  const finish = useCallback(() => {
    setLoading(componentId, false);
  }, [componentId, setLoading]);
  
  const setProgress = useCallback((_progress: number) => {
    // Simplified - no progress tracking
  }, []);
  
  return { 
    isLoading: isLoading(componentId),
    start, 
    finish, 
    setProgress 
  };
}

// Skeleton components for compatibility
export function ProjectWorkspaceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="flex space-x-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      <div className="border-b">
        <div className="flex space-x-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
          
          <div className="border rounded-lg p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}