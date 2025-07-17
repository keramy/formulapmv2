/**
 * Performance monitoring hook
 * Helps track component render performance
 */
import { useEffect, useRef } from 'react'

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const startTime = useRef<number>()

  useEffect(() => {
    renderCount.current++
    startTime.current = performance.now()
    
    return () => {
      if (startTime.current) {
        const renderTime = performance.now() - startTime.current
        if (renderTime > 16) { // More than one frame (16ms)
          console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCount.current})`)
        }
      }
    }
  })

  return {
    renderCount: renderCount.current,
    logRender: () => console.log(`${componentName} rendered ${renderCount.current} times`)
  }
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
