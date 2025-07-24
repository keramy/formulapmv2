/**
 * Lazy loaded wrapper for RealtimeScopeListTab
 * Priority: HIGH
 */
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the component
const RealtimeScopeListTabLazy = lazy(() => import('../projects/tabs/RealtimeScopeListTab').then(module => ({ default: module.RealtimeScopeListTab })))

// Loading fallback component
function RealtimeScopeListTabLoading() {
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
export default function RealtimeScopeListTabWrapper(props: any) {
  return (
    <Suspense fallback={<RealtimeScopeListTabLoading />}>
      <RealtimeScopeListTabLazy {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { RealtimeScopeListTabLazy }
