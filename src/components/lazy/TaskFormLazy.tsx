/**
 * Lazy loaded wrapper for TaskForm
 * Priority: MEDIUM
 */
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the component
const TaskFormLazy = lazy(() => import('../tasks/TaskForm').then(module => ({ default: module.TaskForm })))

// Loading fallback component
function TaskFormLoading() {
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
export default function TaskFormWrapper(props: any) {
  return (
    <Suspense fallback={<TaskFormLoading />}>
      <TaskFormLazy {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { TaskFormLazy }
