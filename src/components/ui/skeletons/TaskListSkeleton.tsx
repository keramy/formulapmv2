'use client';

import React from 'react';
import { Skeleton, SkeletonText, SkeletonAvatar } from './Skeleton';
import { cn } from '@/lib/utils';

interface TaskListSkeletonProps {
  className?: string;
  variant?: 'kanban' | 'list' | 'table';
  itemCount?: number;
}

/**
 * Task List Skeleton - matches different task display formats
 */
export function TaskListSkeleton({ 
  className, 
  variant = 'list',
  itemCount = 5
}: TaskListSkeletonProps) {
  
  if (variant === 'kanban') {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6', className)}>
        {['To Do', 'In Progress', 'Review', 'Done'].map((column, colIndex) => (
          <div key={column} className="space-y-4">
            {/* Column Header */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton variant="circular" className="w-5 h-5" />
              </div>
              <Skeleton className="h-4 w-8" />
            </div>
            
            {/* Task Cards */}
            <div className="space-y-3">
              {Array.from({ length: Math.max(1, itemCount - colIndex) }).map((_, i) => (
                <div key={i} className="p-4 bg-white dark:bg-gray-900 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-12 rounded-full" />
                  </div>
                  <SkeletonText lines={2} className="mb-3" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <SkeletonAvatar size="sm" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('border rounded-lg bg-white dark:bg-gray-900', className)}>
        {/* Table Header */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b bg-gray-50 dark:bg-gray-800">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-4 w-12" />
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center space-x-2">
              <Skeleton variant="circular" className="w-4 h-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-3 w-12 rounded-full" />
            <div className="flex items-center space-x-2">
              <SkeletonAvatar size="sm" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-12" />
            <Skeleton variant="circular" className="w-6 h-6" />
          </div>
        ))}
      </div>
    );
  }

  // Default list variant
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg bg-white dark:bg-gray-900">
          {/* Checkbox */}
          <Skeleton variant="circular" className="w-5 h-5 mt-0.5" />
          
          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
            </div>
            <SkeletonText lines={Math.random() > 0.5 ? 1 : 2} />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <SkeletonAvatar size="sm" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex space-x-1">
                  <Skeleton variant="circular" className="w-6 h-6" />
                  <Skeleton variant="circular" className="w-6 h-6" />
                  <Skeleton variant="circular" className="w-6 h-6" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton variant="circular" className="w-4 h-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Task Board Skeleton - for full task management view
 */
export function TaskBoardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton variant="circular" className="w-9 h-9" />
        </div>
      </div>

      {/* Board Content */}
      <TaskListSkeleton variant="kanban" itemCount={4} />
    </div>
  );
}