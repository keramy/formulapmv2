# Authentication Debugging Patterns

## Overview
Common patterns and solutions for debugging authentication issues in Next.js + Supabase applications.

## Issue Categories

### 1. Bundle/Compilation Errors

#### Webpack Bundle Errors
**Pattern**: `__webpack_require__.n is not a function`
- **Location**: Usually in React components with import issues
- **Root Cause**: Import/export pattern mismatch with Next.js webpack
- **Solution**: Use dual export pattern (default + named exports)
- **Reference**: See `nextjs-15-import-patterns.md`

#### TypeScript Compilation Errors
**Pattern**: ZodEffects `.omit()` errors
- **Location**: Validation schema files
- **Root Cause**: Zod `.refine()` creates ZodEffects which doesn't have `.omit()`
- **Solution**: Create separate base schema without refinement for `.omit()` operations

```typescript
// ❌ Causes compilation error
const schema = z.object({...}).refine(...)
const updateSchema = schema.omit({...})

// ✅ Correct pattern
const baseSchema = z.object({...})
const createSchema = baseSchema.refine(...)
const updateSchema = baseSchema.omit({...})
```

### 2. Environment Setup Issues

#### Port Configuration
**Problem**: App running on different port than configured
- **Check**: NEXT_PUBLIC_APP_URL environment variable
- **Solution**: Update .env.local to match actual port

#### Supabase Connection
**Problem**: Authentication API calls fail
- **Check**: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Solution**: Verify keys match `npx supabase start` output

### 3. Route Protection Issues

#### Middleware Configuration
**Check**: `src/middleware.ts` for route matching
```typescript
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

#### Protected Route Implementation
**Pattern**: Check for proper auth state verification
```typescript
// In protected components
const { user, loading } = useAuth()

if (loading) return <Loading />
if (!user) return <Redirect to="/auth/login" />
```

### 4. Database Integration Issues

#### RLS Policies
**Problem**: User profiles not accessible during login
- **Check**: Row Level Security policies in Supabase
- **Solution**: Ensure proper service role access for user operations

#### Auth User Synchronization
**Problem**: auth.users not synced with user_profiles
- **Check**: Database triggers and functions
- **Solution**: Verify trigger functions are enabled

## Debugging Workflow

### 1. Initial Diagnostics
```bash
# Check services
npx supabase status
npm run dev

# Check compilation
npm run type-check
npm run build
```

### 2. Authentication Flow Testing
```typescript
// Test auth state
console.log('Auth user:', supabase.auth.getUser())
console.log('Session:', supabase.auth.getSession())

// Test API endpoints
fetch('/api/auth/profile').then(res => console.log(res))
```

### 3. Browser Console Debugging
- Check Network tab for API call failures
- Look for JavaScript errors in Console
- Verify cookies/localStorage for auth tokens

### 4. Database Debugging
```sql
-- Check auth users
SELECT * FROM auth.users LIMIT 5;

-- Check user profiles
SELECT * FROM user_profiles LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

## Common Solutions

### Quick Fixes for Development
```bash
# Clear Next.js cache
rm -rf .next

# Reset Supabase (if needed)
npx supabase db reset

# Restart development server
npm run dev
```

### Environment Reset
```bash
# Stop all services
npx supabase stop

# Start fresh
npx supabase start
npm run dev
```

## Testing Patterns

### Authentication Flow Testing
```typescript
// Basic auth test
const testLogin = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'password123'
  })
  
  console.log('Login result:', { data, error })
}
```

### Role-Based Access Testing
```typescript
// Test different user roles
const testRoles = ['admin', 'pm', 'client', 'subcontractor']

testRoles.forEach(async (role) => {
  // Login with role-specific account
  // Verify access to role-specific routes
  // Test permissions
})
```

## Error Resolution Hierarchy

### 1. Critical Blockers (Fix First)
- Compilation errors (TypeScript, webpack)
- Service connection failures (Supabase, database)
- Missing environment variables

### 2. Authentication Logic
- Login/logout functionality
- Route protection
- Session management

### 3. User Experience
- Error messages
- Loading states
- Navigation flow

## Documentation Updates

After resolving authentication issues:

1. **Update CLAUDE.md** with troubleshooting steps
2. **Create pattern documents** for reusable solutions
3. **Update task documents** with resolution status
4. **Document environment setup** for future developers

## Prevention Strategies

### Development Practices
- Test authentication changes in clean environment
- Verify import/export patterns before committing
- Use consistent authentication patterns across components
- Document authentication flow for team reference

### Code Quality
- Use TypeScript strictly for auth-related code
- Implement comprehensive error handling
- Add logging for authentication state changes
- Test with multiple user roles during development

### Environment Management
- Use environment-specific configuration
- Document required environment variables
- Test setup scripts on clean installations
- Maintain backup authentication methods for development