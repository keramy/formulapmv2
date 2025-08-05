'use client';

import React from 'react';
import { Skeleton, SkeletonAvatar } from './Skeleton';
import { cn } from '@/lib/utils';

interface DataTableSkeletonProps {
  className?: string;
  columns?: number;
  rows?: number;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

/**
 * Data Table Skeleton - matches table layouts with headers, pagination, and filters
 */
export function DataTableSkeleton({ 
  className,
  columns = 5,
  rows = 10,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  variant = 'default'
}: DataTableSkeletonProps) {
  
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Header with Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {showSearch && (
              <div className="relative">
                <Skeleton className="h-10 w-64" />
              </div>
            )}
            {showFilters && (
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-16" />
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton variant="circular" className="w-10 h-10" />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg bg-white dark:bg-gray-900 overflow-hidden">
        {/* Table Header */}
        <div className={cn(
          'grid gap-4 p-4 border-b bg-gray-50 dark:bg-gray-800',
          `grid-cols-${columns}`
        )}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-20" />
              {i < 2 && <Skeleton variant="circular" className="w-3 h-3" />}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className={cn(
              'grid gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800',
              `grid-cols-${columns}`,
              isCompact && 'p-3',
              isDetailed && 'p-6'
            )}>
              {Array.from({ length: columns }).map((_, colIndex) => {
                // First column often has special content (checkbox, name, etc.)
                if (colIndex === 0) {
                  return (
                    <div key={colIndex} className="flex items-center space-x-3">
                      <Skeleton variant="circular" className="w-4 h-4" />
                      <div className="flex items-center space-x-2">
                        {isDetailed && <SkeletonAvatar size="sm" />}
                        <Skeleton className={cn(
                          'h-4',
                          isCompact ? 'w-16' : isDetailed ? 'w-24' : 'w-20'
                        )} />
                      </div>
                    </div>
                  );
                }
                
                // Status columns (badges)
                if (colIndex === 1 || colIndex === 2) {
                  return (
                    <Skeleton 
                      key={colIndex} 
                      className="h-5 w-16 rounded-full" 
                    />
                  );
                }
                
                // User/Avatar columns
                if (colIndex === columns - 2 && isDetailed) {
                  return (
                    <div key={colIndex} className="flex items-center space-x-2">
                      <SkeletonAvatar size="sm" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  );
                }
                
                // Date/numeric columns
                if (colIndex >= columns - 2) {
                  return (
                    <Skeleton 
                      key={colIndex} 
                      className={cn(
                        'h-4',
                        isCompact ? 'w-12' : 'w-16'
                      )} 
                    />
                  );
                }
                
                // Regular text columns
                return (
                  <Skeleton 
                    key={colIndex} 
                    className={cn(
                      'h-4',
                      Math.random() > 0.3 ? 'w-full' : 'w-3/4'
                    )} 
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <div className="flex space-x-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="circular" className="w-8 h-8" />
              ))}
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple Table Skeleton - for basic data tables
 */
export function SimpleTableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('border rounded-lg bg-white dark:bg-gray-900', className)}>
      {/* Header */}
      <div className={cn(
        'grid gap-4 p-4 border-b bg-gray-50 dark:bg-gray-800',
        `grid-cols-${columns}`
      )}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={cn(
          'grid gap-4 p-4 border-b last:border-b-0',
          `grid-cols-${columns}`
        )}>
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Statistics Table Skeleton - for dashboard statistics
 */
export function StatsTableSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-3">
            <Skeleton variant="circular" className="w-8 h-8" />
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="text-right">
            <Skeleton className="h-6 w-12 mb-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      ))}
    </div>
  );
}