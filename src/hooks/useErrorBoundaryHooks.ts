'use client';

import { useState, useCallback, useEffect } from 'react';
import { useErrorHandler } from '@/components/ui/GlobalErrorBoundary';

/**
 * Enhanced Error Boundary Integration for Data Fetching Hooks
 * 
 * This module provides error boundary integration for critical data fetching hooks,
 * ensuring graceful error handling and recovery patterns throughout the application.
 */

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  lastRetryTime: number;
}

interface ErrorBoundaryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableAutoRetry?: boolean;
  fallbackData?: any;
  onError?: (error: Error) => void;
  onRetry?: (retryCount: number) => void;
  onMaxRetriesExceeded?: (error: Error) => void;
}

/**
 * Hook for adding error boundary support to data fetching hooks
 * Provides retry logic, fallback data, and error reporting
 */
export function useDataFetchingErrorBoundary<T>(options: ErrorBoundaryOptions = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    enableAutoRetry = true,
    fallbackData,
    onError,
    onRetry,
    onMaxRetriesExceeded
  } = options;

  const reportError = useErrorHandler();
  const [errorState, setErrorState] = useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    retryCount: 0,
    lastRetryTime: 0
  });

  const [data, setData] = useState<T | null>(fallbackData || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error: Error) => {
    console.error('🚨 [DataFetchingErrorBoundary] Error caught:', error);
    
    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error
    }));

    // Report to custom error handler
    onError?.(error);

    // Auto-retry logic
    if (enableAutoRetry && errorState.retryCount < maxRetries) {
      const now = Date.now();
      if (now - errorState.lastRetryTime > retryDelay) {
        setTimeout(() => {
          retry();
        }, retryDelay * Math.pow(2, errorState.retryCount)); // Exponential backoff
      }
    } else if (errorState.retryCount >= maxRetries) {
      onMaxRetriesExceeded?.(error);
      // Report to global error boundary as last resort
      reportError(error);
    }
  }, [enableAutoRetry, errorState.retryCount, errorState.lastRetryTime, maxRetries, retryDelay, onError, onMaxRetriesExceeded, reportError]);

  const retry = useCallback(() => {
    const newRetryCount = errorState.retryCount + 1;
    
    console.log(`🔄 [DataFetchingErrorBoundary] Retry attempt ${newRetryCount}/${maxRetries}`);
    
    setErrorState(prev => ({
      ...prev,
      retryCount: newRetryCount,
      lastRetryTime: Date.now(),
      hasError: false,
      error: null
    }));

    onRetry?.(newRetryCount);
  }, [errorState.retryCount, maxRetries, onRetry]);

  const reset = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      retryCount: 0,
      lastRetryTime: 0
    });
    setData(fallbackData || null);
  }, [fallbackData]);

  const executeWithErrorBoundary = useCallback(async <R>(
    operation: () => Promise<R>
  ): Promise<R | null> => {
    setIsLoading(true);
    
    try {
      const result = await operation();
      
      // Success - reset error state
      setErrorState({
        hasError: false,
        error: null,
        retryCount: 0,
        lastRetryTime: 0
      });
      
      return result;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [handleError]);

  return {
    // Error state
    hasError: errorState.hasError,
    error: errorState.error,
    retryCount: errorState.retryCount,
    canRetry: errorState.retryCount < maxRetries,
    
    // Data state
    data,
    setData,
    isLoading,
    
    // Actions
    executeWithErrorBoundary,
    handleError,
    retry,
    reset
  };
}

/**
 * Enhanced useAuth hook with error boundary integration
 */
export function useAuthWithErrorBoundary() {
  const errorBoundary = useDataFetchingErrorBoundary({
    maxRetries: 2,
    enableAutoRetry: false, // Don't auto-retry auth failures
    onError: (error) => {
      console.error('Authentication error:', error);
      // Could trigger logout or redirect to login
    }
  });

  const [authState, setAuthState] = useState({
    user: null,
    profile: null,
    loading: true,
    isAuthenticated: false
  });

  const signIn = useCallback(async (email: string, password: string) => {
    return errorBoundary.executeWithErrorBoundary(async () => {
      // Simulate auth operation
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error('Authentication failed');
      }
      
      const result = await response.json();
      setAuthState({
        user: result.user,
        profile: result.profile,
        loading: false,
        isAuthenticated: true
      });
      
      return result;
    });
  }, [errorBoundary]);

  const signOut = useCallback(async () => {
    return errorBoundary.executeWithErrorBoundary(async () => {
      await fetch('/api/auth/signout', { method: 'POST' });
      
      setAuthState({
        user: null,
        profile: null,
        loading: false,
        isAuthenticated: false
      });
    });
  }, [errorBoundary]);

  return {
    ...authState,
    ...errorBoundary,
    signIn,
    signOut
  };
}

/**
 * Enhanced useProjects hook with error boundary integration
 */
export function useProjectsWithErrorBoundary() {
  const errorBoundary = useDataFetchingErrorBoundary({
    maxRetries: 3,
    enableAutoRetry: true,
    fallbackData: [],
    onError: (error) => {
      console.error('Projects loading error:', error);
    },
    onMaxRetriesExceeded: (error) => {
      console.error('Max retries exceeded for projects loading:', error);
    }
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    return errorBoundary.executeWithErrorBoundary(async () => {
      setLoading(true);
      
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProjects(data.projects || []);
      errorBoundary.setData(data.projects || []);
      
      return data;
    });
  }, [errorBoundary]);

  const createProject = useCallback(async (projectData: any) => {
    return errorBoundary.executeWithErrorBoundary(async () => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      
      const newProject = await response.json();
      setProjects(prev => [...prev, newProject]);
      
      return newProject;
    });
  }, [errorBoundary]);

  const updateProject = useCallback(async (id: string, updates: any) => {
    return errorBoundary.executeWithErrorBoundary(async () => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update project: ${response.statusText}`);
      }
      
      const updatedProject = await response.json();
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      return updatedProject;
    });
  }, [errorBoundary]);

  const deleteProject = useCallback(async (id: string) => {
    return errorBoundary.executeWithErrorBoundary(async () => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete project: ${response.statusText}`);
      }
      
      setProjects(prev => prev.filter(p => p.id !== id));
      
      return true;
    });
  }, [errorBoundary]);

  // Auto-fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading: loading || errorBoundary.isLoading,
    ...errorBoundary,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  };
}

/**
 * Enhanced useProjectStats hook with error boundary integration
 */
export function useProjectStatsWithErrorBoundary(projectId: string) {
  const errorBoundary = useDataFetchingErrorBoundary({
    maxRetries: 2,
    enableAutoRetry: true,
    fallbackData: {
      totalTasks: 0,
      completedTasks: 0,
      progress: 0,
      budget: { allocated: 0, spent: 0 },
      timeline: { start: null, end: null, daysRemaining: 0 }
    },
    onError: (error) => {
      console.error(`Project stats error for ${projectId}:`, error);
    }
  });

  const [stats, setStats] = useState(errorBoundary.data);

  const fetchStats = useCallback(async () => {
    if (!projectId) return null;
    
    return errorBoundary.executeWithErrorBoundary(async () => {
      const response = await fetch(`/api/projects/${projectId}/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      setStats(data.stats);
      errorBoundary.setData(data.stats);
      
      return data.stats;
    });
  }, [projectId, errorBoundary]);

  // Auto-fetch stats when projectId changes
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading: errorBoundary.isLoading,
    ...errorBoundary,
    fetchStats
  };
}

/**
 * Error Recovery Strategies for Data Fetching
 */
export const DataFetchingErrorStrategies = {
  // Retry with exponential backoff
  retryWithBackoff: async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },
  
  // Fallback to cached or default data
  withFallback: async <T>(
    operation: () => Promise<T>,
    fallbackData: T
  ): Promise<T> => {
    try {
      return await operation();
    } catch (error) {
      console.warn('Operation failed, using fallback data:', error);
      return fallbackData;
    }
  },
  
  // Timeout with fallback
  withTimeout: async <T>(
    operation: () => Promise<T>,
    timeoutMs: number,
    fallbackData?: T
  ): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    try {
      return await Promise.race([operation(), timeoutPromise]);
    } catch (error) {
      if (fallbackData !== undefined) {
        console.warn('Operation timed out, using fallback data:', error);
        return fallbackData;
      }
      throw error;
    }
  }
};
