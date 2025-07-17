/**
 * Performance monitoring provider
 * Tracks bundle loading and component performance
 */
'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface PerformanceMetrics {
  bundleLoadTime: number
  componentLoadTimes: Record<string, number>
  totalComponents: number
  lazyComponentsLoaded: number
}

interface PerformanceContextType {
  metrics: PerformanceMetrics
  trackComponentLoad: (componentName: string, loadTime: number) => void
  trackBundleLoad: (loadTime: number) => void
}

const PerformanceContext = createContext<PerformanceContextType | null>(null)

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bundleLoadTime: 0,
    componentLoadTimes: {},
    totalComponents: 0,
    lazyComponentsLoaded: 0
  })

  const trackComponentLoad = (componentName: string, loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      componentLoadTimes: {
        ...prev.componentLoadTimes,
        [componentName]: loadTime
      },
      lazyComponentsLoaded: prev.lazyComponentsLoaded + 1
    }))
  }

  const trackBundleLoad = (loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      bundleLoadTime: loadTime
    }))
  }

  // Log performance metrics in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metrics:', metrics)
    }
  }, [metrics])

  return (
    <PerformanceContext.Provider value={{ metrics, trackComponentLoad, trackBundleLoad }}>
      {children}
    </PerformanceContext.Provider>
  )
}

export function usePerformanceMetrics() {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformanceMetrics must be used within PerformanceProvider')
  }
  return context
}
