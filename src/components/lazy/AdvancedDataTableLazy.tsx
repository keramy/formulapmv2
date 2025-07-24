/**
 * Lazy loaded wrapper for AdvancedDataTable
 * Priority: HIGH
 */
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the component
const AdvancedDataTableLazy = lazy(() => import('../advanced/AdvancedDataTable').then(module => ({ default: module.AdvancedDataTable })))

// Loading fallback component
function AdvancedDataTableLoading() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

// Wrapper component with Suspense
export default function AdvancedDataTableWrapper(props: any) {
  return (
    <Suspense fallback={<AdvancedDataTableLoading />}>
      <AdvancedDataTableLazy {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { AdvancedDataTableLazy }
