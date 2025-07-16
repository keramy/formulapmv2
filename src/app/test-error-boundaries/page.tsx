'use client';

import { ErrorBoundaryTestPage } from '@/components/ErrorBoundary/test-components';
import { ErrorBoundaryProvider } from '@/components/ErrorBoundary';

export default function TestErrorBoundariesPage() {
  return (
    <ErrorBoundaryProvider>
      <ErrorBoundaryTestPage />
    </ErrorBoundaryProvider>
  );
}