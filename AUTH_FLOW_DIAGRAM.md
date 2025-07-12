# Authentication Flow Diagram - Debug Investigation

## Overview
This document maps out the complete authentication flow to identify potential infinite 401 loop causes.

## 1. Initial Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           AUTH FLOW DIAGRAM                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

USER LOGIN ATTEMPT
        │
        ▼
┌─────────────────┐
│ LoginForm       │
│ .handleSubmit() │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ useAuth.signIn()│
│ [TRACED]        │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ Supabase Auth   │
│ .signIn()       │
└─────────────────┘
        │
        ▼
┌─────────────────┐   SUCCESS   ┌─────────────────┐
│ Auth State      │────────────▶│ SIGNED_IN Event│
│ Change Event    │             │ [TRACED]        │
└─────────────────┘             └─────────────────┘
        │                               │
        │ FAILURE                       ▼
        ▼                       ┌─────────────────┐
┌─────────────────┐             │ setAuthState    │
│ Error State     │             │ ('loading')     │
│ [TRACED]        │             └─────────────────┘
└─────────────────┘                     │
                                        ▼
                                ┌─────────────────┐
                                │ fetchUserProfile│
                                │ [TRACED]        │
                                └─────────────────┘
                                        │
                                        ▼
                        ┌─────────────────┐   SUCCESS   ┌─────────────────┐
                        │ Profile Query   │────────────▶│ setAuthState    │
                        │ [TRACED]        │             │ ('authenticated')│
                        └─────────────────┘             └─────────────────┘
                                │                               │
                                │ FAILURE                       ▼
                                ▼                       ┌─────────────────┐
                        ┌─────────────────┐             │ USER LOGGED IN  │
                        │ setAuthState    │             │ ✅ SUCCESS      │
                        │ ('error')       │             └─────────────────┘
                        └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │ ERROR STATE     │
                        │ ❌ LOGIN FAILED │
                        └─────────────────┘
```

## 2. API Request Flow (Potential Loop Source)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        API REQUEST FLOW                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘

USER ACTION (e.g., create project)
        │
        ▼
┌─────────────────┐
│ React Hook      │
│ (useProjects)   │
│ [TRACED]        │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│ getAccessToken()│
│ [TRACED]        │
└─────────────────┘
        │
        ▼
┌─────────────────┐    CACHED & VALID   ┌─────────────────┐
│ Token Cache     │─────────────────────▶│ Return Token    │
│ Check [TRACED]  │                     │ [TRACED]        │
└─────────────────┘                     └─────────────────┘
        │                                       │
        │ EXPIRED/MISSING                       ▼
        ▼                               ┌─────────────────┐
┌─────────────────┐                     │ Make API Call   │
│ Mutex Check     │                     │ [TRACED]        │
│ [TRACED]        │                     └─────────────────┘
└─────────────────┘                             │
        │                                       ▼
        │ NO ACTIVE REFRESH                     │
        ▼                               ┌─────────────────┐
┌─────────────────┐                     │ middleware.ts   │
│ Start Refresh   │                     │ verifyAuth()    │
│ Operation       │                     │ [TRACED]        │
│ [TRACED]        │                     └─────────────────┘
└─────────────────┘                             │
        │                                       ▼
        ▼                               ┌─────────────────┐
┌─────────────────┐                     │ Token           │
│ supabase.auth   │                     │ Verification    │
│ .getSession()   │                     │ [TRACED]        │
└─────────────────┘                     └─────────────────┘
        │                                       │
        ▼                                       ▼
┌─────────────────┐    NEEDS REFRESH    ┌─────────────────┐   SUCCESS
│ Check Expiry    │─────────────────────▶│ Profile Fetch   │──────────────┐
│ [TRACED]        │                     │ [TRACED]        │              │
└─────────────────┘                     └─────────────────┘              │
        │                                       │                        │
        │ VALID TOKEN                           │ FAILURE                │
        ▼                                       ▼                        ▼
┌─────────────────┐                     ┌─────────────────┐      ┌─────────────────┐
│ Use Existing    │                     │ Return 401      │      │ API Success     │
│ Token [TRACED]  │                     │ [POTENTIAL LOOP]│      │ ✅              │
└─────────────────┘                     └─────────────────┘      └─────────────────┘
        │                                       │
        ▼                                       ▼
┌─────────────────┐                     ┌─────────────────┐
│ Cache Token     │                     │ Client Receives │
│ [TRACED]        │                     │ 401 Error       │
└─────────────────┘                     │ [TRACED]        │
        │                               └─────────────────┘
        ▼                                       │
┌─────────────────┐                             ▼
│ Return Token    │                     ┌─────────────────┐
│ [TRACED]        │                     │ Hook Error      │
└─────────────────┘                     │ Handler         │
        │                               │ [TRACED]        │
        ▼                               └─────────────────┘
┌─────────────────┐                             │
│ Make API Call   │                             ▼
│ [TRACED]        │                     ┌─────────────────┐
└─────────────────┘                     │ Retry Logic?    │
        │                               │ [INVESTIGATE]   │
        ▼                               └─────────────────┘
┌─────────────────┐                             │
│ Success/Failure │                             ▼
│ [TRACED]        │                     ┌─────────────────┐
└─────────────────┘                     │ INFINITE LOOP   │
                                        │ ❌ PROBLEM      │
                                        └─────────────────┘
```

## 3. Potential Loop Scenarios

### Scenario A: Token Refresh Race Condition
```
Request 1: getAccessToken() → Start refresh operation
Request 2: getAccessToken() → Wait for existing refresh
Request 3: getAccessToken() → Wait for existing refresh
    │
    ▼
Refresh Operation Fails
    │
    ▼
All requests get null token
    │
    ▼
All requests fail with 401
    │
    ▼
Components retry → Back to Request 1
```

### Scenario B: Profile Fetch Failure Loop
```
User Authentication Success
    │
    ▼
Profile Fetch Fails (RLS, network, etc.)
    │
    ▼
Auth State: 'error'
    │
    ▼
Component Retry Logic
    │
    ▼
Back to Profile Fetch → Infinite Loop
```

### Scenario C: Token Expiry Edge Case
```
Token cached but actually expired
    │
    ▼
Cache check says "valid"
    │
    ▼
API call with expired token
    │
    ▼
Server returns 401
    │
    ▼
Client doesn't clear cache
    │
    ▼
Next request uses same expired token
    │
    ▼
Back to API call → Infinite Loop
```

### Scenario D: State Transition Race Condition
```
User logged in → authState: 'authenticated'
    │
    ▼
API call starts
    │
    ▼
Token refresh triggered (background)
    │
    ▼
Original API call fails (401)
    │
    ▼
Error handler triggers
    │
    ▼
State changes to 'error'
    │
    ▼
Component sees error, retries
    │
    ▼
Back to API call → Infinite Loop
```

## 4. Debug Logging Points (Now Added)

### ✅ Added Comprehensive Logging:
- **useAuth.ts**: All token operations with request IDs
- **middleware.ts**: All verification steps with timing
- **useProjects.ts**: API call tracing
- **Auth state changes**: Complete event tracing
- **Profile fetching**: Detailed step-by-step logging
- **Token caching**: Cache hits/misses with timing
- **Error propagation**: Full error context

### 🔍 Key Metrics to Monitor:
1. **Token Refresh Frequency**: How often tokens are refreshed
2. **Profile Fetch Success Rate**: Any patterns in profile failures
3. **API Call Timing**: Request timing vs token expiry
4. **State Transition Timing**: Race conditions between states
5. **Cache Hit/Miss Ratios**: Token cache effectiveness
6. **Error Recovery Patterns**: How errors propagate and recover

## 5. Investigation Strategy

### Phase 1: Reproduce the Issue
1. Login with test account
2. Perform actions that trigger 401 loop
3. Monitor console logs for patterns
4. Identify which scenario is occurring

### Phase 2: Analyze Log Patterns
1. Look for repeated request IDs
2. Check token refresh timing
3. Identify profile fetch failures
4. Monitor state transition sequences

### Phase 3: Root Cause Analysis
1. Map actual flow vs expected flow
2. Identify the exact failure point
3. Determine if it's a race condition, cache issue, or logic error
4. Document the specific trigger conditions

### Phase 4: Targeted Fix
1. Implement specific fix for identified root cause
2. Add safeguards to prevent similar issues
3. Test fix thoroughly
4. Update documentation

## 6. Expected Log Patterns

### Normal Flow:
```
🔍 [TRACE] getAccessToken - REQUEST START [abc123]
🔐 [timestamp] getAccessToken - using cached token [abc123]
📡 [useProjects:fetchProjects] Making API call
🔐 [verifyAuth:def456] Starting auth verification
✅ [verifyAuth:def456] Auth verification successful
```

### Problem Flow (to identify):
```
🔍 [TRACE] getAccessToken - REQUEST START [abc123]
🔐 [timestamp] getAccessToken - token expiring soon, refreshing [abc123:xyz789]
❌ [timestamp] getAccessToken - token refresh failed [abc123:xyz789]
📡 [useProjects:fetchProjects] Making API call
❌ [verifyAuth:def456] Token verification failed
❌ [useProjects:fetchProjects] API call failed
🔍 [TRACE] getAccessToken - REQUEST START [ghi456] ← REPEAT PATTERN
```

## 7. Success Criteria

The investigation is complete when:
1. **Exact failure point identified** with log evidence
2. **Root cause documented** with reproduction steps
3. **Fix implemented** and tested
4. **No more infinite 401 loops** in normal usage
5. **Safeguards added** to prevent regression

---

**Status**: Debug logging added, ready for live investigation
**Next Step**: Reproduce the issue and collect logs for analysis