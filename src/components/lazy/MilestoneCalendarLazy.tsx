/**
 * Lazy loaded wrapper for MilestoneCalendar
 * Priority: MEDIUM
 */
import { lazy, Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load the component
const MilestoneCalendarLazy = lazy(() => import('../milestones/MilestoneCalendar').then(module => ({ default: module.MilestoneCalendar })))

// Loading fallback component
function MilestoneCalendarLoading() {
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
export default function MilestoneCalendarWrapper(props: any) {
  return (
    <Suspense fallback={<MilestoneCalendarLoading />}>
      <MilestoneCalendarLazy {...props} />
    </Suspense>
  )
}

// Re-export for convenience
export { MilestoneCalendarLazy }
