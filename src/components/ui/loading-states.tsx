/**
 * Loading State Components - OPTIMIZATION PHASE 2.1
 * Centralized loading patterns to reduce component duplication
 */

'use client'

import React from 'react'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Basic loading spinner
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  text
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {text && <span className="ml-2 text-sm text-muted-foreground">{text}</span>}
    </div>
  )
}

// Full page loading
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingSpinner size="lg" text={text} />
  </div>
)

// Card loading state
export const CardLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <Card>
    <CardContent className="p-8">
      <LoadingSpinner text={text} />
    </CardContent>
  </Card>
)

// Table loading skeleton
export const TableLoading: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4
}) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

// List loading skeleton
export const ListLoading: React.FC<{ items?: number }> = ({ items = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

// Error state component
export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryText?: string
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data.',
  onRetry,
  retryText = 'Try again',
  className
}) => (
  <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        {retryText}
      </Button>
    )}
  </div>
)

// Empty state component
export interface EmptyStateProps {
  title?: string
  message?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  message = 'There are no items to display.',
  action,
  icon,
  className
}) => (
  <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
    {icon && <div className="mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4 max-w-md">{message}</p>
    {action}
  </div>
)

// Inline loading for buttons
export const ButtonLoading: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => (
  <>
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    {text}
  </>
)

// Data state wrapper component
export interface DataStateWrapperProps {
  loading: boolean
  error: string | null
  data: any
  onRetry?: () => void
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
  emptyComponent?: React.ReactNode
  children: React.ReactNode
  emptyWhen?: (data: any) => boolean
}

export const DataStateWrapper: React.FC<DataStateWrapperProps> = ({
  loading,
  error,
  data,
  onRetry,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  emptyWhen = (data) => !data || (Array.isArray(data) && data.length === 0)
}) => {
  if (loading) {
    return <>{loadingComponent || <PageLoading />}</>
  }

  if (error) {
    return <>{errorComponent || <ErrorState message={error} onRetry={onRetry} />}</>
  }

  if (emptyWhen(data)) {
    return <>{emptyComponent || <EmptyState />}</>
  }

  return <>{children}</>
}

// Higher-order component for loading states
export function withLoadingStates<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    loadingComponent?: React.ComponentType
    errorComponent?: React.ComponentType<{ error: string; onRetry?: () => void }>
    emptyComponent?: React.ComponentType
  }
) {
  return React.forwardRef<any, P & {
    loading?: boolean
    error?: string | null
    data?: any
    onRetry?: () => void
  }>((props, ref) => {
    const { loading, error, data, onRetry, ...componentProps } = props

    return (
      <DataStateWrapper
        loading={loading || false}
        error={error || null}
        data={data}
        onRetry={onRetry}
        loadingComponent={options?.loadingComponent ? <options.loadingComponent /> : undefined}
        errorComponent={options?.errorComponent && error ? 
          <options.errorComponent error={error} onRetry={onRetry} /> : undefined}
        emptyComponent={options?.emptyComponent ? <options.emptyComponent /> : undefined}
      >
        <Component ref={ref} {...(componentProps as P)} />
      </DataStateWrapper>
    )
  })
}

// Skeleton components for specific layouts
export const ProjectCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const TaskCardSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </CardContent>
  </Card>
)

export const ScopeItemSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
)
