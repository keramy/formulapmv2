# Post-Wave 2 Architecture Patterns

## Created: 2025-07-08
## Status: Active - Wave 2 Cleanup Complete

### Overview
This document captures the simplified architecture patterns established after Wave 2 deprecated feature removal. These patterns should be followed for all new development and serve as the foundation for Wave 3 testing framework.

## 🏗️ Simplified Architecture Principles

### 1. Core Systems Only
After Wave 2 cleanup, the system focuses on essential business functionality:
- **Project Management**: Core project lifecycle
- **Scope Management**: Scope items with Excel integration
- **Purchase Management**: Procurement and vendor workflows
- **Financial Management**: Budget and cost tracking
- **Client Portal**: External client communication
- **User Management**: Role-based authentication

### 2. Removed Complexity
Eliminated systems that added complexity without core business value:
- ❌ Shop drawings workflow system
- ❌ Complex task management with threading
- ❌ Multi-stage document approval workflows
- ❌ Deprecated permission mappings
- ❌ Legacy authentication patterns

## 📡 API Route Patterns

### Standard Authentication Pattern
**All API routes now use this consistent pattern:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'
import { createServerClient } from '@/lib/supabase'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  // 1. Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // 2. Permission check
  if (!hasPermission(profile.role, 'projects.read.all')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // 3. Parameter extraction
  const params = await context.params

  try {
    const supabase = createServerClient()
    
    // 4. Business logic
    const { data, error } = await supabase
      .from('table_name')
      .select('*')
      .eq('id', params.id)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      )
    }

    // 5. Success response
    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Key Pattern Elements
1. **Consistent Import Structure**: Standard imports for all API routes
2. **Inline Authentication**: No wrapper functions, direct verification
3. **Proper Error Handling**: Consistent error response format
4. **Parameter Handling**: Await context.params for dynamic routes
5. **Database Client**: Use createServerClient() consistently
6. **Response Format**: Standardized success/error response structure

## 🧩 Component Patterns

### Simplified Component Structure
Components now follow simplified patterns without deprecated dependencies:

```typescript
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { usePermissions } from '@/hooks/usePermissions'
import { supabase } from '@/lib/supabase'

interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export function ComponentName({ className, children }: ComponentProps) {
  const { user, profile } = useAuth()
  const { hasPermission } = usePermissions()
  
  // State management
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Effect hooks
  useEffect(() => {
    // Data fetching logic
  }, [user])

  // Permission checks
  if (!hasPermission('required.permission')) {
    return <div>Access denied</div>
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Component Title</CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}
```

## 📊 Type System Patterns

### Simplified Type Definitions
Types now focus on core business entities:

```typescript
// Core entity types
export interface Project {
  id: string
  name: string
  status: ProjectStatus
  priority: number
  budget?: number
  client_id: string
  created_at: string
  updated_at: string
}

// Standardized response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Valid permissions only
export type Permission = 
  | 'projects.create'
  | 'projects.read.all'
  | 'projects.update'
  | 'scope.create'
  | 'financials.view'
  // ... only current, valid permissions
```

## 🔐 Permission System Patterns

### Simplified Permission Structure
```typescript
// Valid permission categories:
- projects.*     // Project management
- scope.*        // Scope management  
- purchase.*     // Purchase management
- financials.*   // Financial data
- users.*        // User management
- client_portal.* // Client portal access
- system.*       // System administration

// Usage pattern:
if (hasPermission(profile.role, 'projects.read.all')) {
  // Allow access
}
```

## 🗂️ Directory Structure Patterns

### Cleaned File Organization
```
src/
├── app/
│   ├── api/
│   │   ├── projects/           # Project management
│   │   ├── scope/              # Scope management
│   │   ├── purchase/           # Purchase workflows
│   │   ├── suppliers/          # Supplier management
│   │   └── client-portal/      # Client portal access
│   ├── (dashboard)/            # Internal dashboard
│   ├── client-portal/          # External client access
│   └── projects/               # Project pages
├── components/
│   ├── ui/                     # Shadcn/ui components
│   ├── scope/                  # Scope-specific components
│   └── client-portal/          # Client portal components
├── lib/
│   ├── middleware/             # Authentication middleware
│   ├── permissions.ts          # Permission checking
│   └── supabase/               # Database utilities
└── types/
    ├── index.ts                # Core type definitions
    ├── scope.ts                # Scope-specific types
    └── client-portal.ts        # Client portal types
```

## 🧪 Testing Patterns (Wave 3 Target)

### API Route Testing Pattern
```typescript
import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/projects/route'

describe('/api/projects', () => {
  it('should return projects for authenticated user', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: {
        authorization: 'Bearer valid-token'
      }
    })

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBeDefined()
  })
})
```

### Component Testing Pattern
```typescript
import { render, screen } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />)
    expect(screen.getByText('Component Title')).toBeInTheDocument()
  })
})
```

## 🚀 Migration Guidelines

### For Existing Code
1. **API Routes**: Migrate to new authentication pattern
2. **Components**: Remove deprecated feature dependencies
3. **Types**: Use simplified type definitions
4. **Permissions**: Update to valid permission names

### For New Code
1. **Follow Patterns**: Use established patterns from this document
2. **Test Coverage**: Include comprehensive tests (Wave 3)
3. **Type Safety**: Maintain strict TypeScript compliance
4. **Documentation**: Update patterns when extending

## 📈 Benefits Achieved

### Code Quality
- **Consistency**: Unified patterns across all API routes
- **Maintainability**: Simplified, focused codebase
- **Type Safety**: 100% TypeScript compliance
- **Performance**: Faster build times with reduced complexity

### Developer Experience
- **Predictability**: Consistent patterns reduce cognitive load
- **Debugging**: Clear error handling and logging
- **Testing**: Simplified structure easier to test
- **Documentation**: Clear patterns for new team members

## 🎯 Wave 3 Testing Integration

### Testing Strategy
1. **API Coverage**: Test all remaining API routes
2. **Component Coverage**: Test core UI components
3. **Integration Coverage**: Test authentication flows
4. **E2E Coverage**: Test critical user journeys

### Quality Metrics Target
- **API Routes**: 90%+ test coverage
- **Components**: 85%+ test coverage
- **Critical Paths**: 100% coverage
- **Performance**: < 2s page loads

---

**Status**: ✅ **Architecture Simplified - Ready for Wave 3 Testing Implementation**