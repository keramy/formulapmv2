'use client';

import React from 'react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonAvatar } from './Skeleton';
import { cn } from '@/lib/utils';

interface DashboardSkeletonProps {
  className?: string;
  variant?: 'admin' | 'project-manager' | 'client';
}

/**
 * Dashboard Skeleton - matches different dashboard layouts based on user role
 */
export function DashboardSkeleton({ 
  className, 
  variant = 'admin' 
}: DashboardSkeletonProps) {
  
  if (variant === 'client') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 bg-white/20 mb-2" />
              <Skeleton className="h-4 w-64 bg-white/20" />
            </div>
            <SkeletonAvatar size="lg" className="bg-white/20" />
          </div>
        </div>

        {/* Client Projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Skeleton variant="circular" className="w-2 h-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonCard>

          <SkeletonCard className="p-6">
            <Skeleton className="h-6 w-28 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="border-l-4 border-blue-500 pl-4">
                  <Skeleton className="h-4 w-40 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        {/* Recent Activity */}
        <SkeletonCard className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton variant="circular" className="w-8 h-8 mt-1" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    );
  }

  if (variant === 'project-manager') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-12" />
                </div>
                <Skeleton variant="circular" className="w-12 h-12" />
              </div>
            </SkeletonCard>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Overview */}
          <div className="lg:col-span-2">
            <SkeletonCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Skeleton variant="circular" className="w-3 h-3" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <Skeleton className="h-3 w-12 mb-1" />
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <Skeleton className="h-2 w-3/4 rounded-full" />
                        </div>
                      </div>
                      <SkeletonAvatar size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tasks */}
            <SkeletonCard className="p-6">
              <Skeleton className="h-6 w-24 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <Skeleton variant="circular" className="w-4 h-4 mt-1" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </SkeletonCard>

            {/* Team */}
            <SkeletonCard className="p-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <SkeletonAvatar size="sm" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton variant="circular" className="w-2 h-2" />
                  </div>
                ))}
              </div>
            </SkeletonCard>
          </div>
        </div>
      </div>
    );
  }

  // Default admin variant
  return (
    <div className={cn('space-y-6', className)}>
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-20 mt-1" />
              </div>
              <Skeleton variant="circular" className="w-12 h-12" />
            </div>
          </SkeletonCard>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <Skeleton className="h-64 w-full" />
        </SkeletonCard>

        <SkeletonCard className="p-6">
          <Skeleton className="h-6 w-28 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton variant="circular" className="w-3 h-3" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-12" />
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <Skeleton className="h-2 w-3/4 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SkeletonCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="grid grid-cols-5 gap-4 py-3 border-b last:border-b-0">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <div className="flex items-center space-x-2">
                    <SkeletonAvatar size="sm" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </SkeletonCard>
        </div>

        <SkeletonCard className="p-6">
          <Skeleton className="h-6 w-28 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <SkeletonAvatar size="sm" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton variant="circular" className="w-2 h-2" />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
    </div>
  );
}