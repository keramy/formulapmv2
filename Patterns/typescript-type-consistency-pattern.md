# TypeScript Type Consistency Pattern

## Purpose
Ensure consistent type definitions, exports, and imports across the codebase to prevent compilation errors.

## Pattern Overview
Establish clear conventions for defining, exporting, and using TypeScript types throughout the application.

## Type Definition Patterns

### 1. Central Type Files Structure
```
src/types/
├── index.ts          # Re-exports all types
├── auth.ts           # Authentication types
├── database.ts       # Database schema types
├── api.ts            # API request/response types
├── projects.ts       # Project-related types
├── scope.ts          # Scope management types
├── material-specs.ts # Material specification types
└── common.ts         # Shared utility types
```

### 2. Type Export Pattern
```typescript
// ❌ BAD - Inconsistent exports
// auth.ts
interface User { ... }  // Not exported
export type UserProfile = { ... }  // Type alias

// ✅ GOOD - Consistent exports
// auth.ts
export interface User {
  id: string
  email: string
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  role: UserRole
  full_name: string
  // ... other fields
}

export type UserRole = 'admin' | 'owner' | 'project_manager' | 'viewer'

// Always export from index.ts for central access
// types/index.ts
export * from './auth'
export * from './projects'
export * from './scope'
```

### 3. Import Pattern
```typescript
// ❌ BAD - Deep imports
import { User } from '@/types/auth'
import { Project } from '@/types/projects'

// ✅ GOOD - Central imports
import { User, Project, UserProfile } from '@/types'

// Or if you need many types from one domain
import type { User, UserProfile, UserRole } from '@/types'
```

### 4. Extending Types Pattern
```typescript
// ❌ BAD - Redefining types
interface MaterialSpec {
  id: string
  name: string
  // Duplicating base fields
}

// ✅ GOOD - Extending properly
import { BaseEntity } from '@/types'

export interface MaterialSpec extends BaseEntity {
  name: string
  specification: string
  project_id: string
  // Additional fields only
}

// For API responses
export interface MaterialSpecResponse extends MaterialSpec {
  project?: Project
  supplier?: Supplier
  created_by_user?: User
}
```

### 5. Optional Properties Pattern
```typescript
// ❌ BAD - Not handling undefined
const stockLevel = formData.minimum_stock_level.toString() // Error if undefined

// ✅ GOOD - Proper optional handling
export interface MaterialSpecFormData {
  minimum_stock_level?: number
  lead_time_days?: number
}

// In usage
const stockLevel = formData.minimum_stock_level?.toString() ?? '0'
// Or with validation
if (formData.minimum_stock_level !== undefined) {
  const stockLevel = formData.minimum_stock_level.toString()
}
```

### 6. Database Type Pattern
```typescript
// ❌ BAD - Inconsistent with database
interface ScopeItem {
  name: string
  quantity: number
  // Missing fields that exist in database
}

// ✅ GOOD - Match database schema
export interface ScopeItem {
  // Required fields from database
  id: string
  project_id: string
  category: string
  name: string
  // ... all database columns

  // Computed/joined fields (optional)
  scope_item?: {  // For joined data
    id: string
    name: string
  }
  
  // Relationship fields
  materials?: MaterialSpec[]
  supplier?: Supplier
}
```

### 7. API Type Pattern
```typescript
// API Request types
export interface CreateMaterialSpecRequest {
  name: string
  specification: string
  project_id: string
  scope_item_ids?: string[]
}

// API Response types
export interface ApiResponse<T> {
  success: true
  data: T
  metadata?: {
    total?: number
    page?: number
  }
}

export interface ApiError {
  success: false
  error: string
  details?: any
}

export type ApiResult<T> = ApiResponse<T> | ApiError
```

### 8. Form Data Pattern
```typescript
// Separate form data from entity types
export interface MaterialSpecFormData {
  name: string
  specification: string
  // Only fields that can be edited
}

// Convert to API request
export function toCreateRequest(
  formData: MaterialSpecFormData,
  projectId: string
): CreateMaterialSpecRequest {
  return {
    ...formData,
    project_id: projectId
  }
}
```

## Type Validation Pattern
```typescript
// Type guards for runtime validation
export function isUser(obj: any): obj is User {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.email === 'string'
}

// Usage with API responses
const { data } = await response.json()
if (isUser(data)) {
  // TypeScript knows data is User here
}
```

## Test Type Pattern
```typescript
// Test-specific type utilities
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Mock factories
export function createMockUser(overrides?: DeepPartial<User>): User {
  return {
    id: 'test-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...overrides
  }
}
```

## Migration Checklist
When fixing type errors:

1. [ ] Check if type is properly exported
2. [ ] Verify import is from correct location
3. [ ] Ensure all required properties are included
4. [ ] Handle optional properties with `?` or `| undefined`
5. [ ] Use type guards for runtime validation
6. [ ] Match database schema exactly
7. [ ] Create separate form/request types
8. [ ] Test type changes don't break consumers

## Common Type Fixes

### Missing Export
```typescript
// Before
interface User { ... }

// After  
export interface User { ... }
```

### Missing Properties
```typescript
// Before
interface ScopeItem {
  id: string
  name: string
}

// After
interface ScopeItem {
  id: string
  name: string
  scope_item?: { id: string; name: string } // Added missing property
  quantity_needed?: number // Added missing property
  notes?: string // Added missing property
}
```

### Import Errors
```typescript
// Before
import { User } from './auth' // TS2305: not exported

// After
import { User } from '@/types'
```

### Undefined Access
```typescript
// Before
const value = data.field.toString() // Error if field is optional

// After
const value = data.field?.toString() ?? 'default'
```

## Benefits
- Prevents "type not found" errors
- Ensures consistency across codebase
- Improves IDE autocomplete
- Makes refactoring easier
- Reduces runtime errors