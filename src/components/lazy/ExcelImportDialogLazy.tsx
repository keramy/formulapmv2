/**
 * Lazy loaded wrapper for ExcelImportDialog
 * Priority: MEDIUM
 */
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the component
const ExcelImportDialogLazy = lazy(() => import('../scope/ExcelImportDialog').then(module => ({ default: module.ExcelImportDialog })))

// Loading fallback component
function ExcelImportDialogLoading() {
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
export default function ExcelImportDialogWrapper(props: any) {
  return (
    <Suspense fallback={<ExcelImportDialogLoading />}>
      <ExcelImportDialogLazy {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { ExcelImportDialogLazy }
