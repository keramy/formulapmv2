'use client';

import React from 'react';
import { Skeleton, SkeletonText, SkeletonButton, SkeletonAvatar } from './Skeleton';
import { cn } from '@/lib/utils';

interface ProjectCardSkeletonProps {
  className?: string;
  variant?: 'grid' | 'list' | 'compact';
}

/**
 * Project Card Skeleton - matches ProjectCard component layout
 */
export function ProjectCardSkeleton({ 
  className, 
  variant = 'grid' 
}: ProjectCardSkeletonProps) {
  if (variant === 'list') {
    return (
      <div className={cn(
        'flex items-center space-x-4 p-4 border rounded-lg bg-white dark:bg-gray-900',
        className
      )}>
        {/* Project Status Indicator */}
        <div className="flex-shrink-0">
          <Skeleton variant="circular" className="w-3 h-3" />
        </div>
        
        {/* Project Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16 rounded-full" /> {/* Status badge */}
          </div>
          <Skeleton className="h-4 w-48" />
        </div>
        
        {/* Project Manager */}
        <div className="flex items-center space-x-2">
          <SkeletonAvatar size="sm" />
          <div className="hidden sm:block">
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        
        {/* Dates and Actions */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-right">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-3 w-12" />
          </div>
          <SkeletonButton size="sm" />
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'p-3 border rounded-md bg-white dark:bg-gray-900',
        className
      )}>
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full mb-2" />
        <div className="flex items-center justify-between">
          <SkeletonAvatar size="sm" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  // Default grid variant
  return (
    <div className={cn(
      'p-6 border rounded-lg bg-white dark:bg-gray-900 hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="h-6 w-40" /> {/* Project name */}
            <Skeleton className="h-5 w-20 rounded-full" /> {/* Status badge */}
          </div>
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton variant="circular" className="w-2 h-2 ml-2" /> {/* Status dot */}
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <Skeleton className="h-8 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-8 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-16 mx-auto" />
        </div>
        <div className="text-center">
          <Skeleton className="h-8 w-8 mx-auto mb-1" />
          <Skeleton className="h-3 w-14 mx-auto" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <Skeleton className="h-2 w-2/3 rounded-full" />
        </div>
      </div>

      {/* Team and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SkeletonAvatar size="sm" />
          <div>
            <Skeleton className="h-3 w-20 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex space-x-2">
          <SkeletonButton size="sm" />
          <Skeleton variant="circular" className="w-8 h-8" />
        </div>
      </div>
    </div>
  );
}

/**
 * Multiple Project Cards Skeleton
 */
export function ProjectCardsSkeleton({ 
  count = 6, 
  variant = 'grid',
  className 
}: { 
  count?: number;
  variant?: 'grid' | 'list';
  className?: string;
}) {
  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {Array.from({ length: count }).map((_, i) => (
          <ProjectCardSkeleton key={i} variant="list" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
      className
    )}>
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} variant="grid" />
      ))}
    </div>
  );
}