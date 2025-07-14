# 🚀 **OPTIMIZATION MIGRATION GUIDE FOR AI AGENT**

## 📋 **OVERVIEW**

This guide provides exact steps for migrating Formula PM 2.0 codebase to use the new optimization patterns. All patterns have been **tested and validated** - TypeScript compilation passes and examples are working.

## ✅ **VALIDATED OPTIMIZATION PATTERNS**

### **1. API Middleware (`withAuth`) - READY FOR MIGRATION**
- **File:** `src/lib/api-middleware.ts` ✅ **WORKING**
- **Examples:** `src/app/api/auth/profile/route.ts`, `src/app/api/auth/change-password/route.ts`
- **Status:** 8% implemented (3/25+ routes migrated)

### **2. Query Builder - READY FOR USE**
- **File:** `src/lib/query-builder.ts` ✅ **WORKING**
- **Status:** 0% implemented (created but not used)

### **3. API Query Hook - READY FOR USE**
- **File:** `src/hooks/useApiQuery.ts` ✅ **WORKING**
- **Status:** 0% implemented (created but not used)

### **4. Form Validation - READY FOR USE**
- **File:** `src/lib/form-validation.ts` ✅ **WORKING**
- **Status:** 5% implemented (partial usage)

### **5. Loading States - READY FOR USE**
- **File:** `src/components/ui/loading-states.tsx` ✅ **WORKING**
- **Status:** 0% implemented (created but not used)

## 🎯 **MIGRATION PRIORITIES**

### **Phase 1: API Routes (HIGH IMPACT - Start Here)**
**Target:** Migrate 20+ API routes to use `withAuth` middleware

### **Phase 2: Data Fetching (MEDIUM IMPACT)**
**Target:** Replace individual hooks with `useApiQuery`

### **Phase 3: UI Components (LOW IMPACT)**
**Target:** Standardize loading states and form validation

## 📝 **DETAILED MIGRATION INSTRUCTIONS**

### **PATTERN 1: API Route Migration to withAuth**

#### **Files to Migrate (20+ routes still using old pattern):**
```bash
src/app/api/material-specs/[id]/approve/route.ts ✅ DONE (example)
src/app/api/auth/change-password/route.ts ✅ DONE (example)
src/app/api/material-specs/[id]/reject/route.ts
src/app/api/material-specs/[id]/request-revision/route.ts
src/app/api/material-specs/[id]/unlink-scope/route.ts
src/app/api/material-specs/statistics/route.ts
src/app/api/projects/[id]/material-specs/route.ts
src/app/api/test-auth/route.ts
# ... and 15+ more routes
```

#### **Step-by-Step Migration Process:**

**BEFORE (Old Pattern):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  // Authentication check
  const { user, profile, error } = await verifyAuth(request)
  
  if (error || !user || !profile) {
    return NextResponse.json(
      { success: false, error: error || 'Authentication required' },
      { status: 401 }
    )
  }

  // Permission check
  if (!hasPermission(profile.role, 'some.permission')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    // API logic here
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**AFTER (New Pattern):**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'

export const GET = withAuth(async (request, { user, profile }) => {
  // Permission check (if needed)
  if (!hasPermission(profile.role, 'some.permission')) {
    return createErrorResponse('Insufficient permissions', 403)
  }

  try {
    // API logic here
    return createSuccessResponse(data)
  } catch (error) {
    return createErrorResponse('Internal server error', 500)
  }
}, { permission: 'some.permission' }) // Optional: automatic permission check
```

#### **Migration Steps:**
1. **Update imports:**
   ```typescript
   // Remove
   import { verifyAuth } from '@/lib/middleware'
   
   // Add
   import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'
   ```

2. **Change function signature:**
   ```typescript
   // From
   export async function GET(request: NextRequest) {
   
   // To
   export const GET = withAuth(async (request, { user, profile }) => {
   ```

3. **Remove manual auth checks:**
   ```typescript
   // Remove these lines
   const { user, profile, error } = await verifyAuth(request)
   if (error || !user || !profile) {
     return NextResponse.json(...)
   }
   ```

4. **Replace error responses:**
   ```typescript
   // From
   return NextResponse.json({ success: false, error: 'message' }, { status: 400 })
   
   // To
   return createErrorResponse('message', 400)
   ```

5. **Replace success responses:**
   ```typescript
   // From
   return NextResponse.json({ success: true, data })
   
   // To
   return createSuccessResponse(data)
   ```

6. **Add closing bracket:**
   ```typescript
   // Add at the end
   })
   ```

### **PATTERN 2: Data Fetching Hook Migration**

#### **Files to Update:**
```bash
src/hooks/useProjects.ts
src/hooks/useTasks.ts
src/hooks/useScope.ts
src/hooks/useMaterialSpecs.ts
# ... and other data fetching hooks
```

#### **Migration Process:**

**BEFORE (Old Pattern):**
```typescript
export const useProjects = (filters?: ProjectFilters) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/projects')
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, refetch: fetchData }
}
```

**AFTER (New Pattern):**
```typescript
import { useApiQuery } from '@/hooks/useApiQuery'

export const useProjects = (filters?: ProjectFilters) => {
  return useApiQuery({
    endpoint: '/api/projects',
    params: filters,
    cacheKey: `projects-${JSON.stringify(filters)}`
  })
}
```

### **PATTERN 3: Loading States Migration**

#### **BEFORE (Old Pattern):**
```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading...</span>
    </div>
  )
}
```

#### **AFTER (New Pattern):**
```typescript
import { DataStateWrapper } from '@/components/ui/loading-states'

return (
  <DataStateWrapper loading={loading} error={error} data={data}>
    <YourComponent data={data} />
  </DataStateWrapper>
)
```

## 🔍 **TESTING EACH MIGRATION**

### **After Each API Route Migration:**
```bash
# 1. Type check
npm run type-check

# 2. Test the specific route
curl -X GET http://localhost:3000/api/your-route \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Check for errors in console
```

### **After Hook Migration:**
```bash
# 1. Type check
npm run type-check

# 2. Test component using the hook
# 3. Verify data fetching works
# 4. Check network tab for API calls
```

## 📊 **PROGRESS TRACKING**

### **API Routes Migration Progress:**
- ✅ `src/app/api/auth/profile/route.ts`
- ✅ `src/app/api/auth/change-password/route.ts`
- ✅ `src/app/api/material-specs/[id]/approve/route.ts`
- ⏳ `src/app/api/material-specs/[id]/reject/route.ts`
- ⏳ `src/app/api/material-specs/[id]/request-revision/route.ts`
- ⏳ `src/app/api/material-specs/[id]/unlink-scope/route.ts`
- ⏳ `src/app/api/material-specs/statistics/route.ts`
- ⏳ `src/app/api/projects/[id]/material-specs/route.ts`
- ⏳ `src/app/api/test-auth/route.ts`

**Target:** Complete 3-4 routes per day

### **Success Metrics:**
- **Lines of Code Reduced:** Target 1,550 lines
- **API Routes Migrated:** 3/25+ → Target: 25/25
- **TypeScript Errors:** 0 (maintain clean compilation)
- **Performance:** Maintain <200ms API response times

## 🚨 **IMPORTANT NOTES**

### **Do NOT Break These Patterns:**
1. **Always test after each migration** - Run `npm run type-check`
2. **Migrate one file at a time** - Don't batch too many changes
3. **Keep the same API behavior** - Don't change response formats
4. **Preserve error handling** - Maintain same error messages

### **When You Encounter Issues:**
1. **Check TypeScript compilation** first
2. **Verify imports are correct**
3. **Ensure closing brackets match**
4. **Test the specific endpoint**

## 🎯 **NEXT STEPS FOR AI AGENT**

1. **Start with API routes** - Migrate 3-4 per day using the exact pattern above
2. **Test each migration** - Ensure TypeScript passes and endpoints work
3. **Track progress** - Update the progress section above
4. **Move to hooks** - After API routes are complete
5. **Finish with UI** - Loading states and form validation last

**The foundation is ready - all patterns are tested and working. Follow this guide exactly for successful migration.**
