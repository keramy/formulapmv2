# Performance Optimization Guide

**Priority**: HIGH  
**Timeline**: Weeks 11-12 (Phase 5)  
**Effort**: 80 hours total  
**Focus**: Frontend & Backend Performance

## Overview

This guide covers comprehensive performance optimization including bundle size reduction, rendering optimization, API performance, and database optimization.

## Current Performance Issues

### Frontend Issues
- **Large Bundle Size**: ~2.5MB initial load
- **Unnecessary Re-renders**: 12 components with performance issues
- **Memory Leaks**: 3 confirmed leaks in document viewer
- **Blocking Operations**: 5 operations freezing UI
- **Poor Lighthouse Score**: ~65/100

### Backend Issues  
- **Slow API Responses**: Average 450ms response time
- **N+1 Query Problems**: 8 identified instances
- **Database Query Time**: Average 120ms per query
- **No Caching**: Missing response and query caching
- **Inefficient Queries**: Complex joins without optimization

## Week 11: Frontend Performance (40 hours)

### Task 1: Bundle Optimization (12 hours)

#### Code Splitting Implementation
```typescript
// src/components/LazyComponents.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from './ui/LoadingSpinner';

// Lazy load heavy components
export const AdminPanel = lazy(() => import('./AdminPanel'));
export const ReportsGenerator = lazy(() => import('./ReportsGenerator'));
export const DocumentViewer = lazy(() => import('./DocumentViewer'));

// Wrapper with loading state
export const LazyAdminPanel = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <AdminPanel />
  </Suspense>
);
```

#### Dynamic Imports for Routes
```typescript
// src/app/admin/page.tsx
import dynamic from 'next/dynamic';

const AdminPanel = dynamic(() => import('../../components/AdminPanel'), {
  loading: () => <div>Loading admin panel...</div>,
  ssr: false
});

export default function AdminPage() {
  return <AdminPanel />;
}
```

### Task 2: Rendering Optimization (12 hours)

#### React.memo Implementation
```typescript
// src/components/optimized/ProjectCard.tsx
import React, { memo } from 'react';

interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ProjectCard = memo<ProjectCardProps>(({ project, onEdit, onDelete }) => {
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="actions">
        <button onClick={() => onEdit(project.id)}>Edit</button>
        <button onClick={() => onDelete(project.id)}>Delete</button>
      </div>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';
```

#### useMemo and useCallback Optimization
```typescript
// src/hooks/useOptimizedData.ts
import { useMemo, useCallback } from 'react';

export const useOptimizedProjectData = (projects: Project[], filters: Filters) => {
  // Memoize expensive calculations
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (filters.status && project.status !== filters.status) return false;
      if (filters.search && !project.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [projects, filters.status, filters.search]);

  const totalBudget = useMemo(() => {
    return filteredProjects.reduce((sum, project) => sum + project.budget, 0);
  }, [filteredProjects]);

  // Memoize callbacks
  const handleProjectUpdate = useCallback((id: string, updates: Partial<Project>) => {
    // Update logic here
  }, []);

  return {
    filteredProjects,
    totalBudget,
    handleProjectUpdate
  };
};
```

### Task 3: Virtual Scrolling (8 hours)

```typescript
// src/components/VirtualizedList.tsx
import { FixedSizeList as List } from 'react-window';

interface VirtualizedProjectListProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const ProjectItem = ({ index, style, data }) => (
  <div style={style} className="project-item">
    <ProjectCard 
      project={data.projects[index]} 
      onClick={data.onProjectClick}
    />
  </div>
);

export const VirtualizedProjectList: React.FC<VirtualizedProjectListProps> = ({
  projects,
  onProjectClick
}) => {
  return (
    <List
      height={600}
      itemCount={projects.length}
      itemSize={120}
      itemData={{ projects, onProjectClick }}
    >
      {ProjectItem}
    </List>
  );
};
```

### Task 4: Image Optimization (8 hours)

```typescript
// src/components/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false
}) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onLoadingComplete={() => setIsLoading(false)}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
```

## Week 12: Backend Performance (40 hours)

### Task 1: API Response Caching (16 hours)

```typescript
// src/lib/cache/redis-cache.ts
import Redis from 'ioredis';

class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }
}

export const cacheService = new CacheService();
```

### Task 2: Database Query Optimization (16 hours)

```typescript
// src/lib/database/optimized-queries.ts
export class OptimizedQueries {
  // Fix N+1 query problem
  static async getProjectsWithDetails(projectIds: string[]) {
    // Instead of multiple queries, use joins
    const { data } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(*),
        manager:users!manager_id(*),
        milestones(count),
        tasks(count),
        scope_items(
          id,
          name,
          total_cost
        )
      `)
      .in('id', projectIds);

    return data;
  }

  // Optimized pagination
  static async getPaginatedProjects(page: number, limit: number, filters: any) {
    let query = supabase
      .from('projects')
      .select('*, client:clients(name)', { count: 'exact' });

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  // Batch operations
  static async batchUpdateProjects(updates: Array<{id: string, data: any}>) {
    const promises = updates.map(({ id, data }) =>
      supabase
        .from('projects')
        .update(data)
        .eq('id', id)
    );

    return Promise.all(promises);
  }
}
```

### Task 3: Connection Pooling (8 hours)

```typescript
// src/lib/database/connection-pool.ts
import { createClient } from '@supabase/supabase-js';

class DatabasePool {
  private pools: Map<string, any> = new Map();

  getConnection(type: 'read' | 'write' = 'read') {
    if (!this.pools.has(type)) {
      const config = {
        read: {
          url: process.env.SUPABASE_READ_URL,
          key: process.env.SUPABASE_READ_KEY,
        },
        write: {
          url: process.env.SUPABASE_URL,
          key: process.env.SUPABASE_SERVICE_ROLE_KEY,
        }
      };

      this.pools.set(type, createClient(
        config[type].url,
        config[type].key,
        {
          db: {
            schema: 'public',
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      ));
    }

    return this.pools.get(type);
  }
}

export const dbPool = new DatabasePool();
```

## Performance Monitoring

```typescript
// src/lib/monitoring/performance-monitor.ts
export class PerformanceMonitor {
  static measureApiCall = (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        console.log(`API Call ${propertyName}: ${duration}ms`);
        
        // Send to monitoring service
        if (process.env.NODE_ENV === 'production') {
          // Send metrics to DataDog, New Relic, etc.
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`API Call ${propertyName} failed after ${duration}ms:`, error);
        throw error;
      }
    };
  };

  static measureComponentRender = (componentName: string) => {
    return (WrappedComponent: React.ComponentType<any>) => {
      return (props: any) => {
        const renderStart = performance.now();
        
        useEffect(() => {
          const renderEnd = performance.now();
          const renderTime = renderEnd - renderStart;
          
          if (renderTime > 16) { // Longer than one frame
            console.warn(`Slow render: ${componentName} took ${renderTime.toFixed(2)}ms`);
          }
        });

        return <WrappedComponent {...props} />;
      };
    };
  };
}
```

## Expected Results

### Before Optimization
- Bundle Size: ~2.5MB
- First Load: ~3.2s  
- API Response: ~450ms
- Lighthouse Score: ~65

### After Optimization  
- Bundle Size: <1.5MB (-40%)
- First Load: <1.5s (-53%)
- API Response: <200ms (-56%)
- Lighthouse Score: >90 (+38%)

This comprehensive performance optimization will significantly improve user experience and system efficiency.