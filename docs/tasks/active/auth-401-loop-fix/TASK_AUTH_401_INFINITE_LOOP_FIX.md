# Task: Fix Authentication Infinite 401 Error Loop

## Type: Improvement
**Priority**: High
**Effort**: 2-3 days  
**Subagents**: 4
**Approach**: Sequential-then-Parallel

## Request Analysis
**Original Request**: "can you identify auth/login issues and why we are having infinite 401 errors. Whats the reason behind it i gotta find it"
**Objective**: Identify root cause of infinite 401 authentication loops and implement comprehensive fixes
**Over-Engineering Check**: Focus on minimal changes to break the loop while maintaining security

## Subagent Assignments

### Wave 1: Investigation & Root Cause Analysis
#### Subagent 1: Authentication Detective - Deep System Investigation
```
TASK_NAME: AUTH_LOOP_INVESTIGATION
TASK_GOAL: Identify exact cause and pattern of infinite 401 authentication loops
REQUIREMENTS:
1. Add comprehensive debug logging to trace auth flow:
   - Token generation and validation in middleware.ts
   - Profile fetch attempts in useAuth.ts
   - API endpoint authentication checks
   - State transitions in auth hook
2. Create auth flow diagram showing all decision points
3. Identify exact failure point causing the loop
4. Document all scenarios that trigger 401 errors
5. Analyze token refresh logic and race conditions
6. Check database state for affected users
CONSTRAINTS:
- Do not modify functionality, only add logging
- Preserve all existing security measures
- Must work in both dev and production environments
DEPENDENCIES: None - this is the foundation
```

### Wave 2: Implementation (Parallel)
#### Subagent 2: Frontend Specialist - Auth Hook Improvements
```
TASK_NAME: AUTH_HOOK_CIRCUIT_BREAKER
TASK_GOAL: Implement circuit breaker pattern and improve auth state management
REQUIREMENTS:
1. Add circuit breaker to prevent infinite token refresh:
   - Max 3 refresh attempts before forcing logout
   - Exponential backoff between attempts
   - Clear error state after successful auth
2. Improve profile fetch error handling:
   - Distinguish between "not found" vs "access denied"
   - Auto-create profile for authenticated users
   - Handle RLS policy violations gracefully
3. Add auth state persistence:
   - Remember failed attempts across page reloads
   - Clear stale auth data on repeated failures
4. Implement proper cleanup on unmount
5. Add comprehensive error codes for debugging
CONSTRAINTS:
- Maintain backward compatibility
- Keep existing auth flow for valid sessions
- Ensure no security vulnerabilities
DEPENDENCIES: Subagent 1 investigation results
```

#### Subagent 3: Backend Specialist - Middleware & API Fixes
```
TASK_NAME: API_AUTH_RESILIENCE
TASK_GOAL: Make API authentication more resilient and informative
REQUIREMENTS:
1. Enhance verifyAuth middleware:
   - Add detailed error responses (not just 401)
   - Implement retry logic for transient failures
   - Cache successful auth validations briefly
2. Create profile recovery endpoint:
   - Auto-create missing profiles for valid users
   - Repair corrupted profile data
   - Validate and fix profile-auth mismatches
3. Add auth diagnostic endpoint:
   - Check token validity
   - Verify profile existence and access
   - Test RLS policies for user
4. Implement request correlation IDs for debugging
5. Add rate limiting to prevent auth spam
CONSTRAINTS:
- No changes to core security model
- Maintain API response compatibility
- Keep performance impact minimal
DEPENDENCIES: Subagent 1 investigation results
```

### Wave 3: Integration & Prevention
#### Subagent 4: QA Engineer - Testing & Monitoring
```
TASK_NAME: AUTH_TESTING_MONITORING
TASK_GOAL: Ensure fixes work and prevent future auth loops
REQUIREMENTS:
1. Create comprehensive auth test suite:
   - Test all auth state transitions
   - Simulate network failures and retries
   - Test profile creation edge cases
   - Verify circuit breaker functionality
2. Add auth monitoring:
   - Track 401 error frequency per user
   - Alert on auth loop detection
   - Monitor token refresh patterns
   - Log auth state machine transitions
3. Create auth debugging tools:
   - Admin panel to view user auth state
   - Tool to reset user auth state
   - Profile repair utilities
4. Document auth troubleshooting guide
5. Add e2e tests for common auth scenarios
CONSTRAINTS:
- Tests must run in CI/CD pipeline
- Monitoring must not impact performance
- Tools must be secure (admin only)
DEPENDENCIES: Subagents 2 & 3 implementations
```

## Technical Details
**Files to modify**: 
- src/hooks/useAuth.ts:341-438 (getAccessToken method)
- src/lib/middleware.ts:15-120 (verifyAuth function)
- src/components/layouts/LayoutWrapper.tsx:36-50 (auth redirect logic)
- src/app/api/auth/profile/route.ts (profile fetch endpoint)
- supabase/migrations/* (RLS policies if needed)

**Patterns to use**: 
- Circuit Breaker pattern for retry logic
- Exponential backoff for failed requests
- State machine for auth states
- Correlation IDs for request tracking

**New endpoints needed**:
- /api/auth/recover-profile
- /api/auth/diagnose
- /api/admin/auth-state (admin only)

## Success Criteria
- Zero infinite 401 loops in production
- Auth failures resolve within 3 attempts or show clear error
- All legitimate users can authenticate successfully
- Failed auth attempts provide actionable error messages
- Monitoring catches auth issues before users report them
- Full test coverage for auth edge cases

## Status Tracking (For Coordinator)

### Wave 1: Investigation
- [ ] Subagent 1: Deep system investigation - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 2: Implementation
- [ ] Subagent 2: Frontend auth hook improvements - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________
- [ ] Subagent 3: Backend middleware fixes - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 3: Integration
- [ ] Subagent 4: Testing and monitoring - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Overall Progress
- **Progress**: 0% (0/4 tasks approved)
- **Blocked**: None
- **Re-delegated**: 0
- **Current Wave**: 1
- **Next Action**: Begin investigation with Subagent 1

### Decisions Made
- Sequential investigation first: Need to understand exact failure pattern before implementing fixes
- Parallel implementation: Frontend and backend fixes can happen simultaneously once root cause identified
- Circuit breaker pattern chosen: Proven solution for preventing infinite retry loops
- Comprehensive monitoring: Essential for catching edge cases in production