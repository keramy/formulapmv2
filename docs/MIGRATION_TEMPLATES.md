# Migration Templates for Optimization Patterns

## API Route Migration Template (verifyAuth → withAuth)

### Step 1: Import Changes
```typescript
// BEFORE
import { verifyAuth } from '@/lib/middleware'

// AFTER  
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
```

### Step 2: Function Conversion
```typescript
// BEFORE
export async function GET(request: NextRequest) {
  const { user, profile, error } = await verifyAuth(request)
  if (error || !user || !profile) {
    return NextResponse.json({ success: false, error: error || 'Auth required' }, { status: 401 })
  }
  if (!hasPermission(profile.role, 'permission.name')) {
    return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 })
  }
  
  try {
    // Business logic here
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// AFTER
export const GET = withAuth(async (request, { user, profile }) => {
  try {
    // Business logic here (same as before)
    return createSuccessResponse(result)
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'permission.name' })
```

### Step 3: Common Patterns
```typescript
// Query parameter parsing
const { page, limit, search, sort_field, sort_direction, filters } = parseQueryParams(request)

// Pagination response
return createSuccessResponse(data, createPagination(page, limit, total))

// Error responses
return createErrorResponse('Not found', 404)
return createErrorResponse('Bad request', 400, validationErrors)
```

## Hook Migration Template (manual → useApiQuery)

### Step 1: Import Changes
```typescript
// BEFORE
import { useState, useEffect, useCallback } from 'react'

// AFTER
import { useApiQuery } from '@/hooks/useApiQuery'
```

### Step 2: State Management Conversion
```typescript
// BEFORE
const [data, setData] = useState([])
const [loading, setLoading] = useState(false)
const [error, setError] = useState(null)

const fetchData = useCallback(async () => {
  setLoading(true)
  setError(null)
  try {
    const response = await fetch('/api/endpoint')
    const result = await response.json()
    if (result.success) {
      setData(result.data)
    } else {
      setError(result.error)
    }
  } catch (err) {
    setError(err.message)
  } finally {
    setLoading(false)
  }
}, [dependency])

useEffect(() => {
  fetchData()
}, [fetchData])

// AFTER
const { data, loading, error, refetch } = useApiQuery({
  endpoint: '/api/endpoint',
  params: { dependency },
  cacheKey: 'unique-cache-key',
  enabled: true
})
```

### Step 3: Advanced Patterns
```typescript
// Conditional fetching
const { data } = useApiQuery({
  endpoint: '/api/data',
  enabled: shouldFetch,
  cacheKey: 'conditional-data'
})

// With filters
const { data } = useApiQuery({
  endpoint: '/api/data',
  params: { page, limit, search, filters },
  cacheKey: ['data', page, limit, search, filters]
})

// Manual refetch
const { refetch } = useApiQuery({
  endpoint: '/api/data',
  cacheKey: 'manual-data'
})
```

## Component Migration Template (manual loading → DataStateWrapper)

### Step 1: Import Changes
```typescript
// BEFORE
import { LoadingSpinner } from '@/components/ui/loading-spinner'

// AFTER
import { DataStateWrapper } from '@/components/ui/loading-states'
```

### Step 2: Loading State Conversion
```typescript
// BEFORE
if (loading) {
  return <LoadingSpinner />
}

if (error) {
  return (
    <div className="text-red-500">
      Error: {error}
      <button onClick={() => refetch()}>Retry</button>
    </div>
  )
}

if (!data || data.length === 0) {
  return <div>No data available</div>
}

return (
  <div>
    {data.map(item => (
      <ItemComponent key={item.id} item={item} />
    ))}
  </div>
)

// AFTER
return (
  <DataStateWrapper
    loading={loading}
    error={error}
    data={data}
    onRetry={refetch}
    emptyMessage="No data available"
  >
    {data.map(item => (
      <ItemComponent key={item.id} item={item} />
    ))}
  </DataStateWrapper>
)
```

### Step 3: Advanced DataStateWrapper Usage
```typescript
// Custom loading component
<DataStateWrapper
  loading={loading}
  error={error}
  data={data}
  loadingComponent={<CustomSpinner />}
  errorComponent={<CustomError />}
>
  {/* Content */}
</DataStateWrapper>

// With custom empty state
<DataStateWrapper
  loading={loading}
  error={error}
  data={data}
  emptyComponent={<CustomEmptyState />}
>
  {/* Content */}
</DataStateWrapper>
```

## Form Migration Template (inline validation → centralized)

### Step 1: Import Changes
```typescript
// BEFORE
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email')
})

// AFTER
import { validateData } from '@/lib/form-validation'
import { projectSchemas } from '@/lib/validation/projects'
```

### Step 2: Validation Conversion
```typescript
// BEFORE
const [errors, setErrors] = useState({})

const handleSubmit = async (formData) => {
  try {
    const validatedData = formSchema.parse(formData)
    // Submit logic
  } catch (error) {
    if (error instanceof z.ZodError) {
      setErrors(error.flatten().fieldErrors)
    }
  }
}

// AFTER
const [errors, setErrors] = useState({})

const handleSubmit = async (formData) => {
  const validationResult = validateData(projectSchemas.create, formData)
  
  if (!validationResult.success) {
    setErrors(validationResult.fieldErrors)
    return
  }
  
  // Submit logic with validationResult.data
}
```

### Step 3: Form Field Error Display
```typescript
// Error display pattern
<Input
  {...field}
  error={errors[field.name]}
  helperText={errors[field.name]?.[0]}
/>

// Or with custom error component
{errors[field.name] && (
  <ErrorMessage>{errors[field.name][0]}</ErrorMessage>
)}
```

## Quick Migration Commands

### Generate Migration Report
```bash
# Find files using old patterns
grep -r "verifyAuth" src/app/api --include="*.ts" | wc -l
grep -r "useState.*loading" src/hooks --include="*.ts" | wc -l
grep -r "if.*loading.*return" src/components --include="*.tsx" | wc -l
```

### Batch Find and Replace Patterns
```bash
# Replace common imports (use with caution)
find src/app/api -name "*.ts" -exec sed -i 's/verifyAuth/withAuth/g' {} \;
find src/hooks -name "*.ts" -exec sed -i 's/useState.*loading/useApiQuery/g' {} \;
```

## Testing Migration

### After Each Migration
```bash
# TypeScript compilation
npm run type-check

# Test build
npm run build

# Run tests
npm test

# Lint check
npm run lint
```

### API Route Testing
```bash
# Test endpoint
curl -X GET http://localhost:3000/api/endpoint -H "Authorization: Bearer <token>"

# Test with invalid auth
curl -X GET http://localhost:3000/api/endpoint
```

## Migration Checklist

### API Route Migration
- [ ] Import withAuth and helpers
- [ ] Convert function declaration to withAuth wrapper
- [ ] Replace manual auth checks with options
- [ ] Replace response patterns with helpers
- [ ] Add proper TypeScript types
- [ ] Test endpoint functionality
- [ ] Verify error handling

### Hook Migration
- [ ] Import useApiQuery
- [ ] Replace useState/useEffect with useApiQuery
- [ ] Update component usage
- [ ] Test loading states
- [ ] Verify error handling
- [ ] Test refetch functionality

### Component Migration
- [ ] Import DataStateWrapper
- [ ] Replace manual loading checks
- [ ] Wrap content in DataStateWrapper
- [ ] Test loading states
- [ ] Verify error display
- [ ] Test retry functionality

### Form Migration
- [ ] Import centralized validation
- [ ] Replace inline schemas
- [ ] Update validation calls
- [ ] Test form submission
- [ ] Verify error display
- [ ] Test edge cases

## Common Pitfalls

### API Routes
- Missing closing bracket in withAuth wrapper
- Incorrect permission naming
- Missing error response helpers
- Forgetting to remove old imports

### Hooks
- Not updating component prop names
- Missing cache key configuration
- Incorrect dependency arrays
- Not handling loading states properly

### Components
- Not wrapping correct content
- Missing retry handlers
- Incorrect data prop checking
- Not handling empty states

### Forms
- Schema mismatch with form fields
- Missing error state updates
- Incorrect validation timing
- Not clearing errors on success