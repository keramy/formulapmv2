/**
 * Memoization utilities for performance optimization
 */
import React, { useMemo, useCallback } from 'react'
import type { UserRole } from '@/types/auth'

// Memoized permission checker
export function useMemoizedPermissions(userRole: UserRole, requiredPermissions: string[]) {
  return useMemo(() => {
    // Add your permission logic here
    return requiredPermissions.every(permission => {
      // Implement permission checking logic
      return true // implementation
    })
  }, [userRole, requiredPermissions])
}

// Memoized role-based component renderer
export function useMemoizedRoleComponent<T>(
  userRole: UserRole,
  componentMap: Record<UserRole, React.ComponentType<T>>,
  props: T
) {
  return useMemo(() => {
    const Component = componentMap[userRole]
    return Component ? <Component {...(props as any)} /> : null
  }, [userRole, componentMap, props])
}

// Debounced callback for expensive operations
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList
): T {
  return useCallback(
    debounce(callback, delay),
    deps
  ) as T
}

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout
  return ((...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}
