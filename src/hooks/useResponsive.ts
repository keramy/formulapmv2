'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdvancedApiQuery } from './useAdvancedApiQuery'

interface WindowSize {
  width: number
  height: number
}

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    isLarge: windowSize.width >= 1280,
    windowSize,
    // Breakpoint helpers
    breakpoints: {
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      '2xl': 1536,
    },
    // Check if width is within specific breakpoint
    isWithin: (min: number, max?: number) => {
      if (max) {
        return windowSize.width >= min && windowSize.width < max
      }
      return windowSize.width >= min
    }
  }
}

/**
 * Enhanced Responsive hook using advanced patterns
 * This demonstrates optimized responsive design with performance improvements
 */
export function useResponsiveAdvanced() {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  })

  const [isClient, setIsClient] = useState(false)

  // Enhanced resize handler with debouncing
  const handleResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  // Debounced resize handler for performance
  const debouncedHandleResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout
    return () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150) // 150ms debounce
    }
  }, [handleResize])

  useEffect(() => {
    setIsClient(true)

    if (typeof window !== 'undefined') {
      // Initial size
      handleResize()

      // Create debounced handler
      const debouncedHandler = debouncedHandleResize()

      window.addEventListener('resize', debouncedHandler)
      return () => window.removeEventListener('resize', debouncedHandler)
    }
  }, [handleResize, debouncedHandleResize])

  // Enhanced breakpoint detection with custom breakpoints
  const customBreakpoints = {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  }

  const getCurrentBreakpoint = useCallback(() => {
    const width = windowSize.width
    if (width >= customBreakpoints['2xl']) return '2xl'
    if (width >= customBreakpoints.xl) return 'xl'
    if (width >= customBreakpoints.lg) return 'lg'
    if (width >= customBreakpoints.md) return 'md'
    if (width >= customBreakpoints.sm) return 'sm'
    return 'xs'
  }, [windowSize.width])

  return {
    // Enhanced window size
    windowSize,
    width: windowSize.width,
    height: windowSize.height,

    // Client-side rendering check
    isClient,

    // Enhanced breakpoint detection
    currentBreakpoint: getCurrentBreakpoint(),
    breakpoints: customBreakpoints,

    // Enhanced responsive utilities
    isMobile: windowSize.width < customBreakpoints.md,
    isTablet: windowSize.width >= customBreakpoints.md && windowSize.width < customBreakpoints.lg,
    isDesktop: windowSize.width >= customBreakpoints.lg,
    isLargeDesktop: windowSize.width >= customBreakpoints.xl,

    // Enhanced utility functions
    isAbove: (breakpoint: keyof typeof customBreakpoints) =>
      windowSize.width >= customBreakpoints[breakpoint],
    isBelow: (breakpoint: keyof typeof customBreakpoints) =>
      windowSize.width < customBreakpoints[breakpoint],
    isBetween: (min: keyof typeof customBreakpoints, max: keyof typeof customBreakpoints) =>
      windowSize.width >= customBreakpoints[min] && windowSize.width < customBreakpoints[max],

    // Aspect ratio utilities
    aspectRatio: windowSize.height > 0 ? windowSize.width / windowSize.height : 0,
    isLandscape: windowSize.width > windowSize.height,
    isPortrait: windowSize.height > windowSize.width,

    // Performance utilities
    handleResize: debouncedHandleResize()
  }
}