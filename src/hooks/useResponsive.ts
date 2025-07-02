'use client'

import { useState, useEffect } from 'react'

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