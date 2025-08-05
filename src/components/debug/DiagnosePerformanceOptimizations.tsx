'use client';

import React, { useEffect } from 'react';
import { useLoadingOrchestrator } from '@/components/ui/SimpleLoadingOrchestrator';
import { useAuth } from '@/hooks/useAuth';

/**
 * Diagnostic component to identify console errors from recent performance optimizations
 */
export function DiagnosePerformanceOptimizations() {
  const loading = useLoadingOrchestrator();
  const auth = useAuth();

  useEffect(() => {
    console.log('🔍 [Diagnostics] Starting performance optimization diagnostics...');
    
    // Test 1: Check if LoadingOrchestrator context is available
    try {
      console.log('✅ LoadingOrchestrator context:', loading ? 'Available' : 'Missing');
      if (loading) {
        console.log('  - Loading states:', Object.keys(loading.loadingStates).length);
        console.log('  - Simple loading system active');
      }
    } catch (error) {
      console.error('❌ LoadingOrchestrator error:', error);
    }

    // Test 2: Check auth cache functionality
    try {
      console.log('✅ Auth state:', {
        user: auth.user?.email || 'No user',
        profile: auth.profile?.role || 'No profile',
        cache: auth.cache?.stats || 'Cache available'
      });
    } catch (error) {
      console.error('❌ Auth cache error:', error);
    }

    // Test 3: Test simple loading state
    try {
      loading.setLoading('diagnostic-test', true);
      
      setTimeout(() => {
        loading.setLoading('diagnostic-test', false);
        console.log('✅ Simple loading state lifecycle completed');
      }, 1000);
    } catch (error) {
      console.error('❌ Loading state management error:', error);
    }

    // Test 4: Check for common React errors
    console.log('🔍 Checking for common issues:');
    
    // Check if we're in StrictMode (double rendering)
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Running in development mode - React StrictMode may cause double renders');
    }
    
    // Check for missing providers
    if (!loading) {
      console.error('❌ LoadingProvider not found - wrap app with LoadingProvider');
    }
    
    // Check browser compatibility
    if (typeof window !== 'undefined') {
      console.log('✅ Browser environment detected');
      
      // Check for localStorage access
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        console.log('✅ localStorage accessible');
      } catch (error) {
        console.error('❌ localStorage error:', error);
      }
    }

    console.log('🔍 [Diagnostics] Complete - check console for errors above');
  }, [loading, auth]);

  return (
    <div className="fixed bottom-20 right-4 z-50 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg shadow-lg max-w-sm">
      <h3 className="font-semibold text-sm mb-2">🔍 Performance Diagnostics Active</h3>
      <p className="text-xs">Check browser console for diagnostic output</p>
      <ul className="text-xs mt-2 space-y-1">
        <li>• LoadingOrchestrator: {loading ? '✅' : '❌'}</li>
        <li>• Auth Cache: {auth.cache ? '✅' : '❌'}</li>
        <li>• User: {auth.user ? '✅' : '❌'}</li>
      </ul>
    </div>
  );
}