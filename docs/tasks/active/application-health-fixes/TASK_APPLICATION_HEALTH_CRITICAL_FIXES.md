# Task: Fix Critical Application Health Issues

## Type: Improvement
**Priority**: High
**Effort**: 2-3 days
**Subagents**: 4
**Approach**: Sequential-then-Parallel

## Request Analysis
**Original Request**: "Read application health report and implement solutions with patterns for consistency"
**Objective**: Resolve all critical TypeScript errors, API failures, and security vulnerabilities
**Over-Engineering Check**: Minimum viable fixes targeting root causes, not symptoms

## Critical Issues Summary
1. **TypeScript Compilation**: 27+ type errors preventing build
2. **API Failures**: Widespread 500 errors in all API endpoints
3. **Security**: Critical vulnerabilities in Next.js and xlsx
4. **Test Suite**: Integration tests completely broken

## Subagent Assignments

### Wave 1: Foundation (Sequential)
#### Subagent 1: code - Fix TypeScript Type Definitions
```
TASK_NAME: fix_typescript_type_definitions
TASK_GOAL: Resolve all TypeScript type errors and missing exports
REQUIREMENTS:
1. Fix User and UserProfile type exports in src/types/auth.ts
2. Add missing properties to ScopeItem type (scope_item, quantity_needed, notes)
3. Fix Project type export in src/types/projects.ts
4. Update MaterialSpec type imports and exports
5. Fix all property access errors in material-specs API routes
6. Ensure all types compile without errors
CONSTRAINTS:
- DO NOT change existing API contracts
- Maintain backward compatibility
- Follow existing type patterns
DEPENDENCIES: None - foundation task
```

### Wave 2: Core Fixes (Parallel)
#### Subagent 2: api-secure - Debug and Fix API 500 Errors
```
TASK_NAME: fix_api_500_errors
TASK_GOAL: Resolve all API endpoints returning 500 errors
REQUIREMENTS:
1. Debug src/app/api/auth/login/route.ts GET export issue
2. Fix all material-specs API routes error handling
3. Investigate database connection issues causing 500s
4. Add proper error handling and logging
5. Fix permission error message consistency
6. Ensure all API routes return proper status codes
CONSTRAINTS:
- Maintain existing API contracts
- Add comprehensive error logging
- Follow established error response patterns
DEPENDENCIES: Subagent 1 (type fixes)
```

#### Subagent 3: security - Update Vulnerable Dependencies
```
TASK_NAME: update_vulnerable_dependencies
TASK_GOAL: Resolve critical security vulnerabilities
REQUIREMENTS:
1. Update Next.js to 15.3.5 or later (fix critical vulnerabilities)
2. Research and replace xlsx package with secure alternative
3. Test all functionality after updates
4. Document any breaking changes
5. Update package-lock.json properly
CONSTRAINTS:
- Test thoroughly for breaking changes
- Document migration steps if needed
- Maintain functionality
DEPENDENCIES: None - can run parallel
```

### Wave 3: Integration
#### Subagent 4: quality-check - Fix Tests and Configure Linting
```
TASK_NAME: fix_tests_configure_linting
TASK_GOAL: Restore test suite functionality and setup ESLint
REQUIREMENTS:
1. Fix @testing-library/react imports (waitFor export)
2. Update test assertions to match actual API responses
3. Fix integration test mocking and imports
4. Configure ESLint with project standards
5. Run and fix all linting issues
6. Ensure all tests pass
CONSTRAINTS:
- Use existing test patterns
- Configure ESLint to match project style
- Don't reduce test coverage
DEPENDENCIES: Subagents 1, 2 (types and API fixes)
```

## Technical Details
**Files to modify**:
- `src/types/*.ts` - Type definitions
- `src/app/api/**/route.ts` - API routes
- `src/__tests__/**/*.test.ts` - Test files
- `package.json` - Dependencies
- `.eslintrc.js` - ESLint config

**Patterns to establish**:
- Consistent type exports/imports
- Standardized error handling in APIs
- Test assertion patterns
- Dependency update process

## Success Criteria
- Zero TypeScript compilation errors
- All API endpoints return correct status codes
- No critical security vulnerabilities
- All tests passing
- ESLint configured and passing
- Compilation: `npm run build` succeeds

## Status Tracking (For Coordinator)

### Wave 1: Foundation
- [ ] Subagent 1: TypeScript Types - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 2: Core Fixes
- [ ] Subagent 2: API Fixes - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________
- [ ] Subagent 3: Security Updates - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 3: Integration
- [ ] Subagent 4: Tests & Linting - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Overall Progress
- **Progress**: 0% (0/4 tasks approved)
- **Blocked**: 0
- **Re-delegated**: 0
- **Current Wave**: 1
- **Next Action**: Start with TypeScript type fixes

### Decisions Made
- None yet