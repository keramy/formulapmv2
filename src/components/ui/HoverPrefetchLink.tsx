'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

// Global cache for prefetched routes and data
const prefetchCache = new Set<string>();
const dataPrefetchCache = new Map<string, Promise<any>>();
let activePrefetchCount = 0;
const MAX_CONCURRENT_PREFETCHES = 3;

// Check for reduced data preference
const shouldRespectDataSaving = () => {
  if (typeof window === 'undefined') return false;
  return (
    // @ts-ignore - connection API may not be available in all browsers
    navigator.connection?.saveData ||
    window.matchMedia('(prefers-reduced-data: reduce)').matches
  );
};

interface HoverPrefetchLinkProps {
  href: string;
  prefetchData?: string[]; // API endpoints to prefetch
  delay?: number; // Hover delay before prefetch (default: 150ms)
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  // Advanced options
  priority?: boolean; // Skip delay for high priority links
  disabled?: boolean; // Disable prefetching entirely
  prefetchOnVisible?: boolean; // Prefetch when visible in viewport
}

/**
 * Enterprise-grade Link component with smart hover-based prefetching
 * 
 * Features:
 * - Hover prefetching with configurable delay
 * - API data prefetching for project endpoints
 * - Smart caching (once per session)
 * - Respects user's data saving preferences
 * - Intersection observer for visible links only
 * - Concurrent request limiting
 * - Proper error handling and cleanup
 * 
 * Usage:
 * <HoverPrefetchLink 
 *   href={`/projects/${project.id}`}
 *   prefetchData={[`/api/projects/${project.id}`, `/api/projects/${project.id}/stats`]}
 *   delay={150}
 *   className="table-row"
 * >
 *   {children}
 * </HoverPrefetchLink>
 */
export function HoverPrefetchLink({ 
  href, 
  prefetchData = [],
  delay = 150,
  children, 
  className,
  onClick,
  priority = false,
  disabled = false,
  prefetchOnVisible = false
}: HoverPrefetchLinkProps) {
  const router = useRouter();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [prefetchStarted, setPrefetchStarted] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if prefetching is allowed
  const isPrefetchAllowed = useCallback(() => {
    if (disabled) return false;
    if (shouldRespectDataSaving()) return false;
    if (activePrefetchCount >= MAX_CONCURRENT_PREFETCHES) return false;
    return true;
  }, [disabled]);

  // Intersection Observer for visible links
  useEffect(() => {
    if (!prefetchOnVisible || !linkRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        
        // Auto-prefetch visible high-priority links
        if (entry.isIntersecting && priority && !prefetchStarted) {
          handlePrefetch();
        }
      },
      {
        rootMargin: '100px', // Start prefetching 100px before visible
        threshold: 0.1
      }
    );

    observer.observe(linkRef.current);

    return () => {
      observer.disconnect();
    };
  }, [prefetchOnVisible, priority, prefetchStarted]);

  // Data prefetching function
  const prefetchApiData = useCallback(async (endpoints: string[]) => {
    if (!endpoints.length) return;

    const prefetchPromises = endpoints.map(async (endpoint) => {
      // Check cache first
      if (dataPrefetchCache.has(endpoint)) {
        return dataPrefetchCache.get(endpoint);
      }

      // Create prefetch promise
      const prefetchPromise = fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current?.signal,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to prefetch ${endpoint}: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        // Don't throw on prefetch errors, just log
        if (!abortControllerRef.current?.signal.aborted) {
          console.warn(`[HoverPrefetchLink] Failed to prefetch ${endpoint}:`, error);
        }
        return null;
      });

      // Cache the promise
      dataPrefetchCache.set(endpoint, prefetchPromise);
      
      return prefetchPromise;
    });

    try {
      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      // Ignore prefetch errors
      console.warn('[HoverPrefetchLink] Data prefetch failed:', error);
    }
  }, []);

  // Main prefetch function
  const handlePrefetch = useCallback(async () => {
    if (!isPrefetchAllowed() || prefetchStarted) return;
    if (prefetchCache.has(href)) return; // Already prefetched

    setPrefetchStarted(true);
    activePrefetchCount++;
    
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();

    try {
      // Prefetch the route
      if (!prefetchCache.has(href)) {
        await router.prefetch(href);
        prefetchCache.add(href);
      }

      // Prefetch API data if specified
      if (prefetchData.length > 0) {
        await prefetchApiData(prefetchData);
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.warn('[HoverPrefetchLink] Prefetch failed:', error);
      }
    } finally {
      activePrefetchCount--;
    }
  }, [href, prefetchData, isPrefetchAllowed, prefetchStarted, router, prefetchApiData]);

  // Mouse enter handler with debouncing
  const handleMouseEnter = useCallback(() => {
    // Don't prefetch if not visible when prefetchOnVisible is enabled
    if (prefetchOnVisible && !isVisible) return;
    
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }

    // Skip delay for priority links
    if (priority) {
      handlePrefetch();
      return;
    }

    // Set prefetch delay
    const timeout = setTimeout(() => {
      handlePrefetch();
    }, delay);

    setHoverTimeout(timeout);
  }, [hoverTimeout, priority, delay, handlePrefetch, prefetchOnVisible, isVisible]);

  // Mouse leave handler
  const handleMouseLeave = useCallback(() => {
    // Clear timeout if user leaves before delay
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    // Abort ongoing prefetch requests
    if (abortControllerRef.current && !prefetchStarted) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [hoverTimeout, prefetchStarted]);

  // Click handler
  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();
    
    // If not prefetched yet, prefetch immediately on click
    if (!prefetchCache.has(href)) {
      handlePrefetch();
    }
  }, [onClick, href, handlePrefetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (prefetchStarted) {
        activePrefetchCount = Math.max(0, activePrefetchCount - 1);
      }
    };
  }, [hoverTimeout, prefetchStarted]);

  return (
    <Link
      ref={linkRef}
      href={href}
      prefetch={false} // We handle prefetching manually
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={cn(className)}
    >
      {children}
    </Link>
  );
}

// Export utility functions for external use
export const prefetchUtils = {
  /**
   * Clear all prefetch caches
   */
  clearCache: () => {
    prefetchCache.clear();
    dataPrefetchCache.clear();
  },
  
  /**
   * Get cache statistics
   */
  getCacheStats: () => ({
    routesCached: prefetchCache.size,
    dataCached: dataPrefetchCache.size,
    activePrefetches: activePrefetchCount
  }),
  
  /**
   * Manually prefetch a route and its data
   */
  prefetch: async (href: string, data?: string[]) => {
    const router = useRouter();
    
    if (!prefetchCache.has(href)) {
      await router.prefetch(href);
      prefetchCache.add(href);
    }
    
    if (data?.length) {
      const prefetchPromises = data.map(endpoint => 
        fetch(endpoint).then(res => res.json()).catch(() => null)
      );
      await Promise.allSettled(prefetchPromises);
    }
  }
};