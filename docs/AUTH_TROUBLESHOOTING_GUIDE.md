# Authentication System Troubleshooting Guide

## Overview

This guide provides comprehensive troubleshooting steps for the Formula PM authentication system, including common issues, diagnostic tools, and resolution procedures.

## System Architecture

The authentication system consists of:
- **Frontend**: React hook (`useAuth`) with circuit breaker pattern
- **Backend**: Supabase authentication with custom middleware
- **Monitoring**: Real-time auth event tracking and loop detection
- **Admin Tools**: Debugging and reset utilities

## Common Issues and Solutions

### 1. Authentication Loops

**Symptoms:**
- User gets stuck in login/logout cycles
- Multiple rapid authentication attempts
- Browser console shows repeated auth state changes

**Diagnostic Steps:**
1. Check browser console for auth loop detection messages
2. Use admin tools to view user's auth state: `GET /api/admin/auth-state?userId=<user-id>`
3. Check monitoring data for loop detection

**Resolution:**
```bash
# Admin API call to reset auth loops
curl -X POST /api/admin/reset-auth \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<user-id>", "resetType": "auth_loops", "reason": "Loop detected"}'
```

### 2. Circuit Breaker Activation

**Symptoms:**
- "Circuit breaker is open" error messages
- Unable to refresh tokens
- Automatic logout after repeated failures

**Diagnostic Steps:**
1. Check circuit breaker state in browser localStorage
2. Review auth monitoring metrics
3. Check recent failure count and timestamps

**Resolution:**
```bash
# Reset circuit breaker for user
curl -X POST /api/admin/reset-auth \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "<user-id>", "resetType": "circuit_breaker", "reason": "Manual reset"}'
```

### 3. Profile Not Found Errors

**Symptoms:**
- "Profile not found" errors after login
- Authentication succeeds but profile fetch fails
- User can't access protected resources

**Diagnostic Steps:**
1. Check if profile exists: `GET /api/auth/diagnostics`
2. Verify RLS policies are not blocking access
3. Check user's role and permissions

**Resolution:**
```bash
# Trigger profile recovery
curl -X POST /api/auth/recover-profile \
  -H "Authorization: Bearer <user-token>"
```

### 4. Token Refresh Failures

**Symptoms:**
- "Invalid or expired token" errors
- Automatic logout during session
- API calls returning 401 errors

**Diagnostic Steps:**
1. Check token expiry time
2. Verify refresh token is valid
3. Check for network connectivity issues

**Resolution:**
- Clear browser cache and localStorage
- Re-authenticate user
- Check Supabase service status

### 5. RLS Policy Errors

**Symptoms:**
- "Access denied" errors
- Profile fetch returns permission errors
- Database queries fail with security errors

**Diagnostic Steps:**
1. Check RLS policies in Supabase dashboard
2. Verify user's role assignments
3. Test with admin user to confirm policy issues

**Resolution:**
- Review and update RLS policies
- Verify user role assignments
- Use admin tools to repair user profile

## Diagnostic Tools

### 1. Auth Diagnostics API

**Endpoint:** `GET /api/auth/diagnostics`

**Usage:**
```bash
curl -X GET /api/auth/diagnostics \
  -H "Authorization: Bearer <user-token>"
```

**Response:**
```json
{
  "success": true,
  "diagnostics": {
    "checks": {
      "authHeader": { "present": true, "format": "valid" },
      "token": { "present": true, "isJWT": true },
      "user": { "authenticated": true, "id": "user-123" },
      "profile": { "exists": true, "role": "client" },
      "rls": { "accessible": true }
    },
    "performance": {
      "totalDuration": 250,
      "tokenValidationDuration": 100,
      "profileFetchDuration": 150
    }
  },
  "overall": "HEALTHY"
}
```

### 2. Admin Auth State Viewer

**Endpoint:** `GET /api/admin/auth-state`

**Usage:**
```bash
# System-wide metrics
curl -X GET /api/admin/auth-state \
  -H "Authorization: Bearer <admin-token>"

# User-specific metrics
curl -X GET /api/admin/auth-state?userId=<user-id> \
  -H "Authorization: Bearer <admin-token>"
```

### 3. Browser Developer Tools

**Auth State Debugging:**
```javascript
// Check auth state in browser console
const authState = JSON.parse(localStorage.getItem('auth_circuit_breaker_state'))
console.log('Circuit Breaker State:', authState)

// Check monitoring data
const monitoringData = JSON.parse(localStorage.getItem('auth_monitoring_events'))
console.log('Auth Events:', monitoringData)
```

## Monitoring and Alerts

### Auth Loop Detection

The system automatically detects auth loops when:
- 5+ authentication failures within 30 seconds
- Same user repeatedly hitting auth errors
- Circuit breaker activations

**Alert Response:**
1. Investigate user's auth state
2. Check for profile or token issues
3. Reset auth state if necessary

### Performance Monitoring

**Slow Operation Thresholds:**
- Token refresh: > 2 seconds
- Profile fetch: > 2 seconds
- Login process: > 5 seconds

**Response Steps:**
1. Check network connectivity
2. Verify Supabase service status
3. Review database performance

## Admin Procedures

### 1. User Auth State Reset

**When to Use:**
- User reporting persistent auth issues
- Circuit breaker stuck in open state
- Auth loop detected

**Procedure:**
```bash
# Full auth reset
curl -X POST /api/admin/reset-auth \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "<user-id>",
    "resetType": "all",
    "reason": "Persistent auth issues reported by user"
  }'
```

### 2. Profile Recovery

**When to Use:**
- Profile not found errors
- Corrupted profile data
- Missing required fields

**Procedure:**
```bash
# User can trigger self-recovery
curl -X POST /api/auth/recover-profile \
  -H "Authorization: Bearer <user-token>"
```

### 3. System-wide Auth Monitoring

**Daily Checks:**
1. Review auth failure rates
2. Check for active auth loops
3. Monitor circuit breaker activations
4. Review performance metrics

**Weekly Maintenance:**
1. Clean old monitoring data
2. Review RLS policy effectiveness
3. Update auth troubleshooting procedures

## Prevention Strategies

### 1. Proactive Monitoring

- Set up alerts for auth loop detection
- Monitor token refresh failure rates
- Track user login success rates

### 2. User Education

- Provide clear error messages
- Guide users through recovery steps
- Document common user mistakes

### 3. System Resilience

- Implement circuit breaker patterns
- Add retry logic with exponential backoff
- Provide multiple recovery paths

## Emergency Procedures

### 1. System-wide Auth Outage

**Immediate Actions:**
1. Check Supabase service status
2. Verify network connectivity
3. Review recent deployments

**Recovery Steps:**
1. Implement auth bypass for critical functions
2. Notify users of service issues
3. Restore service and verify functionality

### 2. Mass Auth Loop Event

**Immediate Actions:**
1. Identify affected users
2. Implement rate limiting
3. Reset circuit breakers

**Recovery Steps:**
1. Bulk user auth state reset
2. Investigate root cause
3. Implement preventive measures

## Testing and Validation

### 1. Auth Flow Testing

**Test Scenarios:**
- Successful login/logout
- Token refresh cycles
- Profile recovery
- Circuit breaker activation
- Error state recovery

### 2. Performance Testing

**Metrics to Monitor:**
- Auth response times
- Token refresh frequency
- Profile fetch duration
- Circuit breaker effectiveness

### 3. Security Testing

**Areas to Test:**
- RLS policy effectiveness
- Token validation
- Admin tool security
- Profile data protection

## Code Examples

### Custom Auth Hook Usage

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { 
    user, 
    profile, 
    isAuthenticated, 
    loading, 
    authError,
    signIn,
    signOut,
    clearAuthError,
    debugInfo
  } = useAuth()

  // Handle auth errors
  if (authError) {
    console.error('Auth Error:', authError)
    // Show user-friendly error message
    // Provide recovery options
  }

  // Check circuit breaker state
  if (debugInfo.isCircuitBreakerOpen) {
    // Show circuit breaker message
    // Provide alternative actions
  }

  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome, {profile?.first_name}!</div>
      ) : (
        <LoginForm onSubmit={signIn} />
      )}
    </div>
  )
}
```

### Monitoring Integration

```typescript
import { authMonitor } from '@/lib/auth-monitoring'

// Record custom auth events
authMonitor.recordAuthFailure(
  userId,
  'Custom auth failure',
  'CUSTOM_ERROR',
  correlationId
)

// Get user metrics
const userMetrics = authMonitor.getUserMetrics(userId)
if (userMetrics.hasActiveLoop) {
  // Handle auth loop
}
```

## Appendix

### Error Codes Reference

| Code | Description | Recovery Action |
|------|-------------|----------------|
| `SIGNIN_ERROR` | Login credentials invalid | Verify credentials |
| `PROFILE_NOT_FOUND` | User profile missing | Trigger profile recovery |
| `PROFILE_RLS_ERROR` | RLS policy blocking access | Check role assignments |
| `TOKEN_REFRESH_FAILED` | Token refresh failed | Re-authenticate |
| `CIRCUIT_BREAKER_OPEN` | Circuit breaker activated | Wait or reset |
| `AUTH_LOOP_DETECTED` | Auth loop detected | Reset auth state |

### Contact Information

**For Development Issues:**
- Check GitHub issues
- Review application logs
- Use diagnostic tools

**For Production Issues:**
- Contact system administrator
- Use admin tools for immediate resolution
- Document issue for future prevention

---

*Last Updated: January 2025*
*Version: 1.0*