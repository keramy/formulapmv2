# Development Patterns Guide

**Created**: July 19, 2025  
**Purpose**: Consolidate Kiro's established patterns for consistent development  
**Status**: MUST FOLLOW - These patterns ensure performance and security

## Table of Contents

1. [RLS Optimization Patterns](#rls-optimization-patterns)
2. [API Development Patterns](#api-development-patterns)
3. [Security Implementation Patterns](#security-implementation-patterns)
4. [Testing Patterns](#testing-patterns)
5. [Performance Best Practices](#performance-best-practices)
6. [Database Migration Patterns](#database-migration-patterns)
7. [UI Component Patterns](#ui-component-patterns)
8. [Error Handling Patterns](#error-handling-patterns)

---

## RLS Optimization Patterns

### ✅ CORRECT Pattern - Always Use Subqueries

```sql
-- ✅ OPTIMIZED: Use subquery pattern for auth functions
CREATE POLICY "policy_name" ON "table_name"
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  -- ✅ GOOD: Subquery pattern
  user_id = (SELECT auth.uid())
  AND status = 'active'
  
  -- ✅ GOOD: Complex conditions with optimized auth calls
  OR (
    role = 'admin' 
    AND ((SELECT auth.jwt()) ->> 'role') = 'admin'
  )
)
WITH CHECK (
  -- ✅ GOOD: Optimized auth calls in WITH CHECK clause
  user_id = (SELECT auth.uid())
  AND created_by = (SELECT auth.uid())
);
```

### ❌ WRONG Pattern - Direct Auth Calls

```sql
-- ❌ AVOID: Direct auth function calls (10-100x slower)
CREATE POLICY "bad_policy" ON "table_name"
USING (
  user_id = auth.uid()  -- ❌ Direct call
  AND (auth.jwt() ->> 'role') = 'admin'  -- ❌ Direct call
);
```

### Validation Query

```sql
-- Use this to validate policies follow optimized patterns
SELECT 
  policyname,
  CASE 
    WHEN (qual LIKE '%(SELECT auth.uid())%' OR qual LIKE '%(SELECT auth.jwt())%')
    THEN '✅ OPTIMIZED'
    ELSE '❌ NEEDS_OPTIMIZATION'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## API Development Patterns

### ✅ CORRECT Pattern - withAuth Middleware

```typescript
import { withAuth } from '@/lib/api-middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';

// ✅ CORRECT: Clean, authenticated API route
export const GET = withAuth(async (request, { user, profile }) => {
  // Only business logic here
  const data = await fetchData(user.id);
  return createSuccessResponse(data);
}, { permission: 'projects.read' });

// ✅ CORRECT: With query parameters
export const POST = withAuth(async (request, { user, profile }) => {
  const body = await request.json();
  const result = await createResource(body, user.id);
  return createSuccessResponse(result);
}, { permission: 'projects.create' });
```

### ❌ WRONG Pattern - Manual Authentication

```typescript
// ❌ AVOID: Manual authentication (20-30 extra lines)
export async function GET(request: NextRequest) {
  const { user, profile, error } = await verifyAuth(request);
  if (error || !user || !profile) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!hasPermission(profile.role, 'projects.read')) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  // Business logic
}
```

### Query Parameter Parsing

```typescript
import { parseQueryParams } from '@/lib/api-utils';

export const GET = withAuth(async (request, { user, profile }) => {
  // Automatically parse common query parameters
  const { page, limit, search, sort_field, sort_direction, filters } = parseQueryParams(request);
  
  const data = await fetchPaginatedData({
    page,
    limit,
    search,
    orderBy: { [sort_field]: sort_direction },
    filters
  });
  
  return createSuccessResponse(data);
});
```

---

## Security Implementation Patterns

### Authentication Headers

```typescript
// ✅ CORRECT: Use getAccessToken() for Bearer tokens
const response = await fetch('/api/resource', {
  headers: {
    'Authorization': `Bearer ${getAccessToken()}`,  // ✅ JWT token
    'Content-Type': 'application/json'
  }
});

// ❌ WRONG: Using profile.id as token
const response = await fetch('/api/resource', {
  headers: {
    'Authorization': `Bearer ${profile.id}`,  // ❌ UUID, not JWT
  }
});
```

### Security Headers Configuration

```typescript
// Applied automatically via middleware
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'",
};
```

### Rate Limiting

```typescript
// Automatically applied to all API routes
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
};
```

---

## Testing Patterns

### API Route Testing

```typescript
import { createMocks } from 'node-mocks-http';
import { GET } from '@/app/api/projects/route';

describe('Projects API', () => {
  it('should return projects for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token',
      },
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });
});
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/ProjectCard';

describe('ProjectCard', () => {
  it('should render project information', () => {
    const project = {
      id: '1',
      name: 'Test Project',
      status: 'active'
    };

    render(<ProjectCard project={project} />);
    
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});
```

---

## Performance Best Practices

### Data Fetching with useApiQuery

```typescript
import { useApiQuery } from '@/hooks/useApiQuery';

// ✅ CORRECT: Centralized data fetching with caching
export function useProjects(filters) {
  return useApiQuery({
    endpoint: '/api/projects',
    params: filters,
    cacheKey: ['projects', filters],
    cacheTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Features included:
// - Automatic caching
// - Request deduplication
// - Loading/error states
// - Refetch capabilities
```

### Query Builder Pattern

```typescript
import { buildQuery } from '@/lib/query-builder';

// ✅ CORRECT: Standardized query construction
const query = buildQuery(supabase, 'projects')
  .select(['id', 'name', 'status', 'created_at'])
  .filters({ status: 'active', user_id: userId })
  .pagination(page, limit)
  .sort('created_at', 'desc')
  .execute();
```

### Optimistic Updates

```typescript
// ✅ CORRECT: Immediate UI feedback
const updateProject = useMutation({
  mutationFn: async (data) => {
    return fetch(`/api/projects/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  onMutate: async (newData) => {
    // Optimistically update UI
    queryClient.setQueryData(['projects', newData.id], newData);
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['projects', newData.id], context.previousData);
  },
});
```

---

## Database Migration Patterns

### Schema Migration Template

```sql
-- Migration: YYYYMMDD_descriptive_name.sql
BEGIN;

-- 1. Create/modify tables
CREATE TABLE IF NOT EXISTS new_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE new_feature ENABLE ROW LEVEL SECURITY;

-- 3. Create optimized policies (using subquery pattern)
CREATE POLICY "new_feature_select" ON new_feature
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()));

-- 4. Create indexes for performance
CREATE INDEX idx_new_feature_user_id ON new_feature(user_id);
CREATE INDEX idx_new_feature_created_at ON new_feature(created_at DESC);

-- 5. Add to migrations table
INSERT INTO migrations (version, name, executed_at)
VALUES ('YYYYMMDD', 'descriptive_name', NOW())
ON CONFLICT (version) DO NOTHING;

COMMIT;
```

### Validation Before Migration

```bash
# Always validate migrations before applying
npm run validate-migrations supabase/migrations/new_migration.sql
```

---

## UI Component Patterns

### Loading States Pattern

```typescript
import { DataStateWrapper } from '@/components/ui/loading-states';

// ✅ CORRECT: Standardized loading/error/empty states
export function ProjectList() {
  const { data, loading, error, refetch } = useProjects();

  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      data={data}
      onRetry={refetch}
      emptyMessage="No projects found"
    >
      {data.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </DataStateWrapper>
  );
}
```

### Form Validation Pattern

```typescript
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const projectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold']),
});

export function ProjectForm() {
  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      status: 'active',
    },
  });

  const onSubmit = async (data) => {
    const result = await createProject(data);
    if (result.success) {
      toast.success('Project created successfully');
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Error Handling Patterns

### API Error Responses

```typescript
import { createErrorResponse } from '@/lib/api-response';

// ✅ CORRECT: Consistent error handling
export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.name) {
      return createErrorResponse('Name is required', 400);
    }
    
    // Business logic
    const result = await createResource(body);
    return createSuccessResponse(result);
    
  } catch (error) {
    console.error('API Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
});
```

### Client-Side Error Handling

```typescript
// ✅ CORRECT: Graceful error handling
export function useCreateProject() {
  const [error, setError] = useState(null);
  
  const createProject = async (data) => {
    try {
      setError(null);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create project');
      }
      
      return await response.json();
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      throw err;
    }
  };
  
  return { createProject, error };
}
```

---

## Summary

These patterns have been established and proven by Kiro's comprehensive optimization work. Following them ensures:

1. **Performance**: 10-100x faster RLS policies, 31% overall improvement
2. **Security**: 100% implementation rate, consistent authentication
3. **Maintainability**: 20-30 lines saved per API route
4. **Reliability**: 92-100% success rate under load
5. **Consistency**: Standardized patterns across the codebase

**IMPORTANT**: Always refer to these patterns when implementing new features or refactoring existing code. The patterns in `analysis-reports/` folder provide additional detailed examples.

---

**References**:
- `analysis-reports/validation/future-agent-patterns-*.md`
- `analysis-reports/security-verification/security-patterns-*.md`
- `analysis-reports/refined-optimization-summary.md`
- `CLAUDE.md` - Code optimization patterns section