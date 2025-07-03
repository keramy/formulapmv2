/**
 * Mobile Optimization Utilities for Client Portal
 * Responsive design helpers and mobile-first optimizations
 */

'use client'

import { useEffect, useState } from 'react'

// Mobile breakpoint detection hook
export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Initial check
    checkMobile()

    // Listen for resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobile
}

// Touch-friendly button sizing
export const getMobileButtonProps = (mobileOptimized: boolean) => ({
  className: mobileOptimized ? 'min-h-[44px] min-w-[44px]' : '',
  size: mobileOptimized ? 'default' as const : 'sm' as const
})

// Mobile-friendly input sizing
export const getMobileInputProps = (mobileOptimized: boolean) => ({
  className: mobileOptimized ? 'min-h-[44px] text-base' : 'min-h-[40px]'
})

// Responsive grid classes
export const getResponsiveGridClasses = (mobileOptimized: boolean) => {
  if (mobileOptimized) {
    return {
      grid1: 'grid grid-cols-1',
      grid2: 'grid grid-cols-1 sm:grid-cols-2',
      grid3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      grid4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      flexCol: 'flex flex-col',
      flexRow: 'flex flex-col sm:flex-row'
    }
  }
  
  return {
    grid1: 'grid grid-cols-1',
    grid2: 'grid grid-cols-2',
    grid3: 'grid grid-cols-3',
    grid4: 'grid grid-cols-4',
    flexCol: 'flex flex-col',
    flexRow: 'flex flex-row'
  }
}

// Mobile-optimized spacing
export const getMobileSpacing = (mobileOptimized: boolean) => ({
  padding: mobileOptimized ? 'p-4' : 'p-6',
  margin: mobileOptimized ? 'm-4' : 'm-6',
  gap: mobileOptimized ? 'gap-4' : 'gap-6',
  spacingY: mobileOptimized ? 'space-y-4' : 'space-y-6',
  spacingX: mobileOptimized ? 'space-x-4' : 'space-x-6'
})

// Mobile-friendly typography
export const getMobileTypography = (mobileOptimized: boolean) => ({
  h1: mobileOptimized ? 'text-xl sm:text-2xl font-bold' : 'text-2xl font-bold',
  h2: mobileOptimized ? 'text-lg sm:text-xl font-semibold' : 'text-xl font-semibold',
  h3: mobileOptimized ? 'text-base sm:text-lg font-medium' : 'text-lg font-medium',
  body: mobileOptimized ? 'text-sm sm:text-base' : 'text-base',
  small: mobileOptimized ? 'text-xs sm:text-sm' : 'text-sm'
})

// Responsive container
export const ResponsiveContainer: React.FC<{
  children: React.ReactNode
  mobileOptimized?: boolean
  className?: string
}> = ({ children, mobileOptimized = true, className = '' }) => {
  const containerClasses = mobileOptimized
    ? 'w-full max-w-full px-4 sm:px-6 lg:px-8'
    : 'w-full max-w-7xl mx-auto px-6'

  return (
    <div className={`${containerClasses} ${className}`}>
      {children}
    </div>
  )
}

// Mobile-optimized card
export const ResponsiveCard: React.FC<{
  children: React.ReactNode
  mobileOptimized?: boolean
  className?: string
}> = ({ children, mobileOptimized = true, className = '' }) => {
  const cardClasses = mobileOptimized
    ? 'bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6'
    : 'bg-white rounded-lg shadow-sm border border-gray-200 p-6'

  return (
    <div className={`${cardClasses} ${className}`}>
      {children}
    </div>
  )
}

// Touch-friendly action sheet for mobile
export const MobileActionSheet: React.FC<{
  children: React.ReactNode
  isOpen: boolean
  onClose: () => void
  title?: string
}> = ({ children, isOpen, onClose, title }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg max-h-[80vh] overflow-hidden">
        {title && (
          <div className="px-4 py-3 border-b">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        )}
        <div className="overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

// Swipe gesture handler for mobile
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) => {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > threshold
    const isRightSwipe = distance < -threshold

    if (isLeftSwipe && onSwipeLeft) {
      onSwipeLeft()
    }
    if (isRightSwipe && onSwipeRight) {
      onSwipeRight()
    }
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}

// Viewport-aware positioning
export const useViewportAwarePosition = () => {
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    setPosition({
      top: rect.bottom > viewport.height ? rect.top - rect.height : rect.bottom,
      left: rect.right > viewport.width ? rect.left - rect.width : rect.left
    })
  }

  return { position, updatePosition }
}

// Safe area utilities for mobile devices
export const getSafeAreaClasses = () => ({
  paddingTop: 'pt-safe-top',
  paddingBottom: 'pb-safe-bottom',
  paddingLeft: 'pl-safe-left',
  paddingRight: 'pr-safe-right',
  marginTop: 'mt-safe-top',
  marginBottom: 'mb-safe-bottom'
})

// Performance optimization for mobile
export const MobilePerformanceWrapper: React.FC<{
  children: React.ReactNode
  lazy?: boolean
}> = ({ children, lazy = true }) => {
  const [isVisible, setIsVisible] = useState(!lazy)

  useEffect(() => {
    if (lazy) {
      const timer = setTimeout(() => setIsVisible(true), 0)
      return () => clearTimeout(timer)
    }
  }, [lazy])

  if (!isVisible) {
    return <div className="animate-pulse bg-gray-200 rounded h-32 w-full" />
  }

  return <>{children}</>
}