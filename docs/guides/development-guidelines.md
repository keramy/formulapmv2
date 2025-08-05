# Development Guidelines - Formula PM V2

## Core Development Principles

### 1. Cloud-Only Development Environment

**⚠️ CRITICAL**: All development uses Supabase Cloud directly. There is NO local Supabase setup.

```bash
# Environment verification
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output: https://your-project.supabase.co (NOT localhost)

# Start development server
npm run dev
# Runs on http://localhost:3003
```

### 2. Simple Solutions First

**Avoid Overengineering**:
- ❌ NO complex patterns (circuit breakers, mutex locks)
- ❌ NO unnecessary abstractions
- ✅ Use basic React state management
- ✅ Simple, readable code over clever solutions
- ✅ Direct API calls when appropriate

### 3. Debugging Approach

**Before Making Code Changes**:

1. **Check Database First**
   ```sql
   -- Verify user exists
   SELECT * FROM auth.users WHERE email = 'test@example.com';
   
   -- Verify profile exists
   SELECT * FROM user_profiles WHERE email = 'test@example.com';
   ```

2. **Test with curl (bypass frontend)**
   ```bash
   curl -H "Authorization: Bearer <token>" localhost:3003/api/test
   ```

3. **Only then modify code**

### 4. Common 401 Error Root Causes

1. **Missing user profiles in cloud database** (most common)
2. **Wrong environment variables** pointing to wrong project
3. **JWT token expiry issues**
4. **NOT usually code complexity** - check data first!

### 5. Development Best Practices

#### API Development
- Always use `withAuth` middleware pattern
- Use standardized response helpers
- Implement proper error handling
- Add TypeScript types for all parameters

#### Frontend Development
- Use `useApiQuery` for data fetching
- Implement loading states with skeletons
- Handle errors gracefully
- Optimize bundle size

#### Database Development
- Always create migrations for schema changes
- Use the SQL validation tool before applying
- Index all foreign keys
- Follow RLS optimization patterns

### 6. Code Style Guidelines

- **NO comments unless explicitly requested**
- Use TypeScript for type safety
- Follow existing patterns in the codebase
- Maintain consistent naming conventions

### 7. Performance Guidelines

#### Bundle Optimization
- Lazy load heavy components
- Use dynamic imports for large libraries
- Monitor bundle size with `npm run analyze`

#### API Performance
- Use pagination for large datasets
- Implement caching where appropriate
- Optimize database queries
- Use proper indexes

### 8. Security Guidelines

- **NEVER** commit secrets or API keys
- Always validate user input
- Use parameterized queries
- Follow OWASP best practices
- Implement proper authentication checks

### 9. Testing Guidelines

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api
npm run test:components
npm run test:integration

# Run with coverage
npm run test:coverage
```

### 10. Git Workflow

```bash
# Before committing
npm run validate-migrations
npm run lint
npm run typecheck

# Commit message format
# feat: Add new feature
# fix: Fix bug
# docs: Update documentation
# refactor: Refactor code
# test: Add tests
```

### 11. Environment Variables

**Required for development**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 12. Common Development Commands

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Validate migrations
npm run validate-migrations

# Check bundle size
npm run analyze
```

### 13. Troubleshooting

#### Authentication Issues
1. Clear browser storage
2. Check user exists in database
3. Verify JWT token is valid
4. Check RLS policies

#### Performance Issues
1. Check for missing indexes
2. Analyze slow queries
3. Review bundle size
4. Check for memory leaks

#### Build Issues
1. Clear .next directory
2. Delete node_modules and reinstall
3. Check for TypeScript errors
4. Verify all imports

### 14. When to Ask for Help

- After checking database state
- After testing with curl
- After reviewing error logs
- When pattern is unclear

### 15. Documentation

- Update CLAUDE.md for critical changes
- Document new patterns
- Keep README up to date
- Add JSDoc comments for complex functions