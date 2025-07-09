# Application Health Fix Summary and Patterns

## Quick Reference for Common Fixes

### 1. TypeScript Type Errors
**Pattern**: [typescript-type-consistency-pattern.md](/Patterns/typescript-type-consistency-pattern.md)

**Common Fixes**:
```typescript
// Missing export
export interface User { ... }  // Add export

// Missing properties
interface ScopeItem {
  // Add missing properties from error messages
  scope_item?: { id: string; name: string }
  quantity_needed?: number
  notes?: string
}

// Import from wrong location
import { User, Project } from '@/types' // Use central imports

// Optional property access
const value = data.field?.toString() ?? 'default' // Use optional chaining
```

### 2. API 500 Errors
**Pattern**: [error-handling-api-pattern.md](/Patterns/error-handling-api-pattern.md)

**Common Fixes**:
```typescript
// Wrap entire route in try-catch
export async function GET(request: NextRequest) {
  try {
    // Check auth properly
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Handle database errors
    const { data, error } = await supabase.from('table').select()
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { success: false, error: 'Database operation failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3. Test Import Errors
**Pattern**: [test-infrastructure-pattern.md](/Patterns/test-infrastructure-pattern.md)

**Common Fixes**:
```typescript
// Correct testing library imports
import { render, screen, waitFor } from '@testing-library/react'
import { renderHook, act } from '@testing-library/react'

// Fix API route imports
// Check if route exports the method
const { GET, POST } = await import('@/app/api/resource/route')

// Fix mock setup
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase)
}))
```

## Priority Fix Order

### Phase 1: Foundation (Block Everything)
1. **Fix Type Exports** in `src/types/`
   - Add missing exports to auth.ts, projects.ts
   - Add missing properties to interfaces
   - Fix import paths throughout codebase

### Phase 2: API Stability
2. **Fix API Routes** in `src/app/api/`
   - Add try-catch to all route handlers
   - Fix authentication checks
   - Add proper error responses
   - Log errors for debugging

### Phase 3: Security
3. **Update Dependencies**
   - Update Next.js to 15.3.5+
   - Replace or update xlsx package
   - Run `npm audit fix` where safe

### Phase 4: Testing
4. **Fix Test Suite**
   - Update test imports
   - Fix mock implementations  
   - Update assertions to match API
   - Configure ESLint

## Verification Checklist

After implementing fixes, verify:

- [ ] `npm run type-check` - No errors
- [ ] `npm run build` - Builds successfully
- [ ] `npm run test` - All tests pass
- [ ] `npm run lint` - ESLint configured and passing
- [ ] `npm audit` - No high/critical vulnerabilities
- [ ] API endpoints return proper status codes (not 500)
- [ ] No console errors in development

## Quick Debug Commands

```bash
# Check TypeScript errors
npm run type-check

# Test specific API route
npm test -- --testPathPattern="api/material-specs"

# Check for vulnerable packages
npm audit

# Test build
npm run build

# Run specific test file
npm test src/__tests__/api/scope.test.ts
```

## Pattern Files Created

1. **[API Error Handling Pattern](/Patterns/error-handling-api-pattern.md)**
   - Standardizes error responses
   - Prevents 500 errors
   - Provides debugging info

2. **[TypeScript Type Consistency Pattern](/Patterns/typescript-type-consistency-pattern.md)**
   - Ensures proper exports/imports
   - Handles optional properties
   - Maintains type safety

3. **[Test Infrastructure Pattern](/Patterns/test-infrastructure-pattern.md)**
   - Fixes import issues
   - Standardizes mocking
   - Handles async properly

## Notes for Future Tasks

1. **Always check types are exported** before using in other files
2. **Wrap API routes in try-catch** to prevent 500 errors
3. **Log errors with context** for easier debugging
4. **Test error cases** not just success paths
5. **Keep dependencies updated** to avoid security issues
6. **Use central type imports** from `@/types`
7. **Mock external dependencies** properly in tests

## Emergency Fixes

If something is critically broken:

1. **Type Error**: Add `// @ts-ignore` temporarily and create fix task
2. **API 500**: Add try-catch and return generic error
3. **Test Failure**: Skip test with `it.skip()` and fix later
4. **Import Error**: Use dynamic import as fallback

Remember: These are temporary - always create tasks to fix properly!