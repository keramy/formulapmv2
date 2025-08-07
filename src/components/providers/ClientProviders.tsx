'use client';

import { ReactNode } from 'react';
import { LoadingProvider } from '@/components/ui/SimpleLoadingOrchestrator';
import { AuthProvider } from '@/contexts/AuthContext';

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Client-side providers for the application
 * 
 * This component wraps the application with necessary providers:
 * 1. AuthProvider - Provides centralized authentication state using AuthenticationService
 * 2. LoadingProvider - Provides loading state orchestration
 * 
 * The new service-based AuthProvider eliminates the circular dependencies and
 * infinite re-render loops that occurred with the previous hook-based approach.
 * This provides stable authentication state management across the application.
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  console.log('🔐 [ClientProviders] Initializing client providers with service-based AuthProvider')
  
  return (
    <AuthProvider>
      <LoadingProvider>
        {children}
      </LoadingProvider>
    </AuthProvider>
  );
}