'use client';

import { ReactNode } from 'react';
import { LoadingProvider } from '@/components/ui/SimpleLoadingOrchestrator';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <LoadingProvider>
      {children}
    </LoadingProvider>
  );
}