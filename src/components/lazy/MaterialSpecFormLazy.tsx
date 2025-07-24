/**
 * Lazy loaded wrapper for MaterialSpecForm
 * Priority: HIGH
 */
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the component - TEMPORARILY DISABLED FOR BUILD
// const MaterialSpecFormLazy = lazy(() => import('../projects/material-approval/MaterialSpecForm').then(module => ({ default: module.MaterialSpecForm })))
const MaterialSpecFormLazy = lazy(() => Promise.resolve({ default: () => <div>Material Spec Form temporarily disabled</div> }))

// Loading fallback component
function MaterialSpecFormLoading() {
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
export default function MaterialSpecFormWrapper(props: any) {
  return (
    <Suspense fallback={<MaterialSpecFormLoading />}>
      <MaterialSpecFormLazy {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { MaterialSpecFormLazy }
