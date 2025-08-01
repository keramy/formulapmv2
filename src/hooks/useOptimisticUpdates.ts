'use client';

import { useState, useCallback, useRef } from 'react';
import { useWebVitals } from '@/lib/performance/WebVitalsTracker';

/**
 * Optimistic Updates System
 * 
 * This module provides optimistic updates for better perceived performance
 * by immediately updating the UI and then syncing with the server.
 */

interface OptimisticAction<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  rollbackData?: T;
  retryCount: number;
}

interface OptimisticUpdateOptions {
  maxRetries?: number;
  retryDelay?: number;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onRollback?: () => void;
}

/**
 * Hook for managing optimistic updates
 */
export function useOptimisticUpdates<T>(
  initialData: T[],
  options: OptimisticUpdateOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    onRollback
  } = options;

  const [data, setData] = useState<T[]>(initialData);
  const [pendingActions, setPendingActions] = useState<Map<string, OptimisticAction<T>>>(new Map());
  const [isOptimistic, setIsOptimistic] = useState(false);
  const { addCustomMetric, markStart, markEnd } = useWebVitals(false);
  const actionCounter = useRef(0);

  const generateActionId = useCallback(() => {
    return `action_${Date.now()}_${++actionCounter.current}`;
  }, []);

  const addOptimisticAction = useCallback((action: OptimisticAction<T>) => {
    setPendingActions(prev => new Map(prev).set(action.id, action));
    setIsOptimistic(true);
    
    // Track optimistic update performance
    addCustomMetric('optimistic-update-started', performance.now(), {
      actionType: action.type,
      actionId: action.id
    });
  }, [addCustomMetric]);

  const removeOptimisticAction = useCallback((actionId: string) => {
    setPendingActions(prev => {
      const newMap = new Map(prev);
      newMap.delete(actionId);
      
      // If no more pending actions, we're no longer optimistic
      if (newMap.size === 0) {
        setIsOptimistic(false);
      }
      
      return newMap;
    });
  }, []);

  const rollbackAction = useCallback((actionId: string) => {
    const action = pendingActions.get(actionId);
    if (!action) return;

    console.warn(`🔄 [OptimisticUpdate] Rolling back action ${actionId}`);

    // Rollback the data change
    setData(prev => {
      switch (action.type) {
        case 'create':
          // Remove the optimistically added item
          return prev.filter(item => (item as any).id !== (action.data as any).id);
        
        case 'update':
          // Restore the original data
          if (action.rollbackData) {
            return prev.map(item => 
              (item as any).id === (action.rollbackData as any).id 
                ? action.rollbackData 
                : item
            );
          }
          return prev;
        
        case 'delete':
          // Re-add the deleted item
          if (action.rollbackData) {
            return [...prev, action.rollbackData];
          }
          return prev;
        
        default:
          return prev;
      }
    });

    removeOptimisticAction(actionId);
    onRollback?.();
    
    // Track rollback metrics
    addCustomMetric('optimistic-update-rollback', performance.now(), {
      actionType: action.type,
      actionId: action.id,
      retryCount: action.retryCount
    });
  }, [pendingActions, removeOptimisticAction, onRollback, addCustomMetric]);

  const confirmAction = useCallback((actionId: string) => {
    const action = pendingActions.get(actionId);
    if (!action) return;

    console.log(`✅ [OptimisticUpdate] Confirmed action ${actionId}`);
    
    setPendingActions(prev => {
      const newMap = new Map(prev);
      const confirmedAction = newMap.get(actionId);
      if (confirmedAction) {
        newMap.set(actionId, { ...confirmedAction, status: 'confirmed' });
      }
      return newMap;
    });

    // Remove confirmed action after a short delay
    setTimeout(() => removeOptimisticAction(actionId), 1000);
    
    onSuccess?.();
    
    // Track success metrics
    addCustomMetric('optimistic-update-confirmed', performance.now(), {
      actionType: action.type,
      actionId: action.id,
      duration: performance.now() - action.timestamp
    });
  }, [pendingActions, removeOptimisticAction, onSuccess, addCustomMetric]);

  const retryAction = useCallback(async (actionId: string, serverOperation: () => Promise<any>) => {
    const action = pendingActions.get(actionId);
    if (!action || action.retryCount >= maxRetries) {
      rollbackAction(actionId);
      return;
    }

    console.log(`🔄 [OptimisticUpdate] Retrying action ${actionId} (attempt ${action.retryCount + 1})`);

    // Update retry count
    setPendingActions(prev => {
      const newMap = new Map(prev);
      const retryAction = newMap.get(actionId);
      if (retryAction) {
        newMap.set(actionId, { ...retryAction, retryCount: retryAction.retryCount + 1 });
      }
      return newMap;
    });

    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, action.retryCount)));

    try {
      await serverOperation();
      confirmAction(actionId);
    } catch (error) {
      console.error(`❌ [OptimisticUpdate] Retry failed for action ${actionId}:`, error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Try again or rollback
      if (action.retryCount + 1 >= maxRetries) {
        rollbackAction(actionId);
      } else {
        retryAction(actionId, serverOperation);
      }
    }
  }, [pendingActions, maxRetries, retryDelay, rollbackAction, confirmAction, onError]);

  // Optimistic Create
  const optimisticCreate = useCallback(async (
    newItem: T,
    serverOperation: () => Promise<T>
  ) => {
    const actionId = generateActionId();
    const startTime = performance.now();
    markStart(`optimistic-create-${actionId}`);

    // Immediately add to UI
    setData(prev => [...prev, newItem]);

    const action: OptimisticAction<T> = {
      id: actionId,
      type: 'create',
      data: newItem,
      timestamp: startTime,
      status: 'pending',
      retryCount: 0
    };

    addOptimisticAction(action);

    try {
      // Perform server operation
      const serverResult = await serverOperation();
      
      // Update with server data if different
      setData(prev => prev.map(item => 
        item === newItem ? serverResult : item
      ));
      
      confirmAction(actionId);
      
      const duration = markEnd(`optimistic-create-${actionId}`);
      console.log(`✅ [OptimisticCreate] Completed in ${duration.toFixed(2)}ms`);
      
      return serverResult;
    } catch (error) {
      console.error('❌ [OptimisticCreate] Failed:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Start retry process
      retryAction(actionId, serverOperation);
      
      return null;
    }
  }, [generateActionId, markStart, markEnd, addOptimisticAction, confirmAction, onError, retryAction]);

  // Optimistic Update
  const optimisticUpdate = useCallback(async (
    itemId: string | number,
    updates: Partial<T>,
    serverOperation: () => Promise<T>
  ) => {
    const actionId = generateActionId();
    const startTime = performance.now();
    markStart(`optimistic-update-${actionId}`);

    // Find and store original item for rollback
    const originalItem = data.find(item => (item as any).id === itemId);
    if (!originalItem) {
      console.error('[OptimisticUpdate] Item not found for update');
      return null;
    }

    // Immediately update UI
    setData(prev => prev.map(item => 
      (item as any).id === itemId 
        ? { ...item, ...updates }
        : item
    ));

    const action: OptimisticAction<T> = {
      id: actionId,
      type: 'update',
      data: { ...originalItem, ...updates } as T,
      timestamp: startTime,
      status: 'pending',
      rollbackData: originalItem,
      retryCount: 0
    };

    addOptimisticAction(action);

    try {
      const serverResult = await serverOperation();
      
      // Update with server data
      setData(prev => prev.map(item => 
        (item as any).id === itemId ? serverResult : item
      ));
      
      confirmAction(actionId);
      
      const duration = markEnd(`optimistic-update-${actionId}`);
      console.log(`✅ [OptimisticUpdate] Completed in ${duration.toFixed(2)}ms`);
      
      return serverResult;
    } catch (error) {
      console.error('❌ [OptimisticUpdate] Failed:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      retryAction(actionId, serverOperation);
      return null;
    }
  }, [data, generateActionId, markStart, markEnd, addOptimisticAction, confirmAction, onError, retryAction]);

  // Optimistic Delete
  const optimisticDelete = useCallback(async (
    itemId: string | number,
    serverOperation: () => Promise<void>
  ) => {
    const actionId = generateActionId();
    const startTime = performance.now();
    markStart(`optimistic-delete-${actionId}`);

    // Find and store item for rollback
    const itemToDelete = data.find(item => (item as any).id === itemId);
    if (!itemToDelete) {
      console.error('[OptimisticDelete] Item not found for deletion');
      return false;
    }

    // Immediately remove from UI
    setData(prev => prev.filter(item => (item as any).id !== itemId));

    const action: OptimisticAction<T> = {
      id: actionId,
      type: 'delete',
      data: itemToDelete,
      timestamp: startTime,
      status: 'pending',
      rollbackData: itemToDelete,
      retryCount: 0
    };

    addOptimisticAction(action);

    try {
      await serverOperation();
      
      confirmAction(actionId);
      
      const duration = markEnd(`optimistic-delete-${actionId}`);
      console.log(`✅ [OptimisticDelete] Completed in ${duration.toFixed(2)}ms`);
      
      return true;
    } catch (error) {
      console.error('❌ [OptimisticDelete] Failed:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      retryAction(actionId, serverOperation);
      return false;
    }
  }, [data, generateActionId, markStart, markEnd, addOptimisticAction, confirmAction, onError, retryAction]);

  return {
    data,
    isOptimistic,
    pendingActions: Array.from(pendingActions.values()),
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    rollbackAction,
    confirmAction
  };
}

/**
 * Hook for optimistic form submissions
 */
export function useOptimisticForm<T>({
  onSubmit,
  onSuccess,
  onError,
  optimisticData
}: {
  onSubmit: (data: T) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  optimisticData?: T;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addCustomMetric, markStart, markEnd } = useWebVitals(false);

  const submitOptimistically = useCallback(async (formData: T) => {
    const submitId = `form-submit-${Date.now()}`;
    markStart(submitId);
    
    setIsSubmitting(true);
    setIsOptimistic(true);
    setError(null);

    // If optimistic data provided, immediately show success state
    if (optimisticData) {
      onSuccess?.(optimisticData);
    }

    try {
      const result = await onSubmit(formData);
      
      // Real success - update with actual data
      onSuccess?.(result);
      
      const duration = markEnd(submitId);
      addCustomMetric('optimistic-form-submit', duration, {
        success: true,
        hasOptimisticData: !!optimisticData
      });
      
      console.log(`✅ [OptimisticForm] Submitted successfully in ${duration.toFixed(2)}ms`);
      
    } catch (submitError) {
      const error = submitError instanceof Error ? submitError : new Error(String(submitError));
      
      console.error('❌ [OptimisticForm] Submission failed:', error);
      setError(error);
      onError?.(error);
      
      addCustomMetric('optimistic-form-submit', markEnd(submitId), {
        success: false,
        error: error.message
      });
      
    } finally {
      setIsSubmitting(false);
      setIsOptimistic(false);
    }
  }, [onSubmit, onSuccess, onError, optimisticData, markStart, markEnd, addCustomMetric]);

  return {
    submitOptimistically,
    isSubmitting,
    isOptimistic,
    error
  };
}

/**
 * Performance-aware optimistic updates
 * Adapts behavior based on network conditions
 */
export function useAdaptiveOptimisticUpdates<T>(
  initialData: T[],
  options: OptimisticUpdateOptions = {}
) {
  const basicOptimistic = useOptimisticUpdates(initialData, options);
  const [networkQuality, setNetworkQuality] = useState<'fast' | 'slow' | 'offline'>('fast');

  // Monitor network conditions
  useState(() => {
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateNetworkQuality = () => {
        if (!navigator.onLine) {
          setNetworkQuality('offline');
        } else if (connection.effectiveType === '4g' && connection.downlink > 1.5) {
          setNetworkQuality('fast');
        } else {
          setNetworkQuality('slow');
        }
      };

      updateNetworkQuality();
      connection.addEventListener('change', updateNetworkQuality);
      window.addEventListener('online', updateNetworkQuality);
      window.addEventListener('offline', updateNetworkQuality);
    }
  });

  // Adaptive create - more aggressive on fast networks
  const adaptiveCreate = useCallback(async (
    newItem: T,
    serverOperation: () => Promise<T>
  ) => {
    if (networkQuality === 'offline') {
      console.log('📶 [AdaptiveOptimistic] Offline - queuing create operation');
      // In a real app, you'd queue this for when online
      return null;
    }

    if (networkQuality === 'slow') {
      console.log('🐌 [AdaptiveOptimistic] Slow network - enhanced optimistic create');
      // More aggressive optimistic updates on slow networks
    }

    return basicOptimistic.optimisticCreate(newItem, serverOperation);
  }, [networkQuality, basicOptimistic]);

  return {
    ...basicOptimistic,
    networkQuality,
    adaptiveCreate,
    adaptiveUpdate: basicOptimistic.optimisticUpdate,
    adaptiveDelete: basicOptimistic.optimisticDelete
  };
}
