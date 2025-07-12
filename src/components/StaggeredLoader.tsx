'use client';

import { useState, useEffect, ReactNode } from 'react';

interface StaggeredLoaderProps {
  children: ReactNode;
  delay: number; // delay in milliseconds
  fallback?: ReactNode;
}

export function StaggeredLoader({ children, delay, fallback }: StaggeredLoaderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldLoad(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!shouldLoad) {
    return fallback || null;
  }

  return <>{children}</>;
}