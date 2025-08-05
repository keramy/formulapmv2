'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Animation type for the skeleton
   */
  animation?: 'pulse' | 'wave' | 'none';
  
  /**
   * Variant styles for different use cases
   */
  variant?: 'default' | 'rounded' | 'circular' | 'text' | 'rectangular';
  
  /**
   * Size presets for common use cases
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Custom width override
   */
  width?: string | number;
  
  /**
   * Custom height override
   */
  height?: string | number;
}

/**
 * Base Skeleton component with configurable animations and variants
 * Provides content-aware loading states that match actual UI layouts
 */
export function Skeleton({
  className,
  animation = 'pulse',
  variant = 'default',
  size,
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
    none: ''
  };

  const variantClasses = {
    default: 'bg-gray-200 dark:bg-gray-800 rounded-md',
    rounded: 'bg-gray-200 dark:bg-gray-800 rounded-lg',
    circular: 'bg-gray-200 dark:bg-gray-800 rounded-full',
    text: 'bg-gray-200 dark:bg-gray-800 rounded h-4',
    rectangular: 'bg-gray-200 dark:bg-gray-800'
  };

  const sizeClasses = {
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12'
  };

  const customStyle = {
    ...style,
    ...(width && { width: typeof width === 'number' ? `${width}px` : width }),
    ...(height && { height: typeof height === 'number' ? `${height}px` : height })
  };

  return (
    <div
      className={cn(
        animationClasses[animation],
        variantClasses[variant],
        size && sizeClasses[size],
        className
      )}
      style={customStyle}
      role="status"
      aria-label="Loading..."
      {...props}
    />
  );
}

// Additional skeleton utilities
export const SkeletonText = ({ lines = 1, className, ...props }: { lines?: number } & SkeletonProps) => (
  <div className={cn('space-y-2', className)} {...props}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        variant="text"
        className={cn(
          'h-4',
          i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full' // Last line is shorter
        )}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 'md', ...props }: { size?: 'sm' | 'md' | 'lg' } & SkeletonProps) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  return (
    <Skeleton
      variant="circular"
      className={cn(sizes[size])}
      {...props}
    />
  );
};

export const SkeletonButton = ({ size = 'md', ...props }: { size?: 'sm' | 'md' | 'lg' } & SkeletonProps) => {
  const sizes = {
    sm: 'h-8 w-16',
    md: 'h-10 w-20',
    lg: 'h-12 w-24'
  };
  
  return (
    <Skeleton
      variant="rounded"
      className={cn(sizes[size])}
      {...props}
    />
  );
};

export const SkeletonCard = ({ 
  children,
  className,
  ...props 
}: { children?: React.ReactNode } & SkeletonProps) => (
  <div className={cn('p-4 border rounded-lg bg-white dark:bg-gray-900', className)} {...props}>
    {children || (
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <SkeletonText lines={2} />
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-4 w-20" />
          <SkeletonButton size="sm" />
        </div>
      </div>
    )}
  </div>
);

// Wave animation keyframes (add to your global CSS)
export const skeletonWaveCSS = `
@keyframes wave {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
}

.animate-wave {
  animation: wave 2s linear infinite;
  background-size: 200px 100%;
}
`;