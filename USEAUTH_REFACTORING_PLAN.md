# useAuth Hook Refactoring Plan

## 📊 Current State Analysis

### Hook Metrics
- **Lines of Code**: 448 lines (extremely large for a single hook)
- **Dependencies**: 65 files depend on useAuth
- **Responsibilities**: 10+ distinct concerns mixed together
- **State Variables**: 7 pieces of state
- **Effects**: 2 large useEffect blocks with complex logic
- **Return Values**: 25+ properties and methods

### Identified Issues
1. **Violation of Single Responsibility Principle**
   - Authentication logic
   - Session management
   - Profile fetching
   - Token refresh
   - Impersonation system
   - Role checking
   - Cache management
   - Error handling
   - Debug utilities
   - Seniority calculations

2. **Performance Concerns**
   - All 65 consuming components re-render on any state change
   - Large object creation on every render
   - Unnecessary computations for unused features

3. **Testing Complexity**
   - Difficult to unit test individual features
   - Mock setup requires entire authentication system
   - Side effects are tightly coupled

4. **Maintainability Issues**
   - Hard to modify without breaking existing functionality
   - New developers need to understand entire 448-line file
   - Bug fixes risk affecting unrelated features

## 🎯 Refactoring Strategy

### Phase 1: Extract Core Authentication Hook (Priority: HIGH)
**Timeline**: 2-3 hours
**Risk**: Low
**Files Affected**: ~10-15

#### 1.1 Create `useAuthCore.ts`
```typescript
// Core authentication state and session management only
export const useAuthCore = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Only session management
  useEffect(() => {
    // Session initialization
  }, [])
  
  useEffect(() => {
    // Auth state changes
  }, [])
  
  return {
    user,
    loading,
    error,
    isAuthenticated: !!user
  }
}
```

#### 1.2 Create `useAuthActions.ts`
```typescript
// Separate authentication actions
export const useAuthActions = () => {
  const signIn = useCallback(async (email: string, password: string) => {
    // Sign in logic
  }, [])
  
  const signOut = useCallback(async () => {
    // Sign out logic
  }, [])
  
  return { signIn, signOut }
}
```

### Phase 2: Extract Profile Management (Priority: HIGH)
**Timeline**: 2 hours
**Risk**: Low
**Files Affected**: ~20-25

#### 2.1 Create `useUserProfile.ts`
```typescript
export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!userId) return
    // Fetch profile logic
  }, [userId])
  
  return { profile, loading }
}
```

#### 2.2 Create `useProfileCache.ts`
```typescript
// Dedicated cache management for profiles
export const useProfileCache = () => {
  const getCached = useCallback((userId: string) => {
    return authCache.getCachedAuth()
  }, [])
  
  const setCached = useCallback((user: User, profile: UserProfile) => {
    authCache.setCachedAuth(user, profile)
  }, [])
  
  return { getCached, setCached, clearCache }
}
```

### Phase 3: Extract Role Management (Priority: MEDIUM)
**Timeline**: 1-2 hours
**Risk**: Low
**Files Affected**: ~15-20

#### 3.1 Create `useRoleChecks.ts`
```typescript
export const useRoleChecks = (profile: UserProfile | null) => {
  const isManagement = useMemo(() => 
    profile ? ['management', 'technical_lead', 'admin'].includes(profile.role) : false,
    [profile]
  )
  
  const isProjectRole = useMemo(() =>
    profile ? ['project_manager'].includes(profile.role) : false,
    [profile]
  )
  
  return {
    isManagement,
    isProjectRole,
    isPurchaseRole,
    isFieldRole,
    isExternalRole
  }
}
```

#### 3.2 Create `usePMSeniority.ts`
```typescript
export const usePMSeniority = (profile: UserProfile | null) => {
  const getSeniority = useCallback(() => {
    return profile ? getSeniorityFromProfile(profile) : undefined
  }, [profile])
  
  const isPMWithSeniority = useCallback((requiredLevel?: SeniorityLevel) => {
    // Seniority checking logic
  }, [profile])
  
  return { getSeniority, isPMWithSeniority }
}
```

### Phase 4: Extract Token Management (Priority: HIGH)
**Timeline**: 1-2 hours
**Risk**: Medium (requires careful testing)
**Files Affected**: ~30-40

#### 4.1 Create `useAccessToken.ts`
```typescript
export const useAccessToken = () => {
  const getAccessToken = useCallback(async () => {
    // Token fetching logic with caching
  }, [])
  
  const refreshToken = useCallback(async () => {
    // Token refresh logic
  }, [])
  
  // Auto-refresh setup
  useEffect(() => {
    const interval = setInterval(refreshToken, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshToken])
  
  return { getAccessToken, refreshToken }
}
```

### Phase 5: Create Composition Hook (Priority: CRITICAL)
**Timeline**: 1 hour
**Risk**: Low
**Files Affected**: All 65 files (but backward compatible)

#### 5.1 Create New Modular `useAuth.ts`
```typescript
// Backward-compatible composition of all hooks
export const useAuth = () => {
  // Core hooks
  const { user, loading: authLoading, error: authError, isAuthenticated } = useAuthCore()
  const { signIn, signOut } = useAuthActions()
  const { profile, loading: profileLoading } = useUserProfile(user?.id)
  const { getAccessToken } = useAccessToken()
  
  // Feature hooks (only if profile exists)
  const roleChecks = useRoleChecks(profile)
  const pmSeniority = usePMSeniority(profile)
  const impersonation = useImpersonation()
  
  // Combine loading states
  const loading = authLoading || profileLoading
  
  // Return backward-compatible interface
  return {
    // Core auth state
    user,
    profile,
    loading,
    authError,
    
    // Auth actions
    signIn,
    signOut,
    getAccessToken,
    clearAuthError: () => {}, // Simplified
    
    // Impersonation (spread existing)
    ...impersonation,
    
    // Computed properties
    isAuthenticated,
    authState: computeAuthState(loading, user, profile),
    
    // Role checks (spread for compatibility)
    ...roleChecks,
    
    // PM Seniority (spread for compatibility)
    ...pmSeniority,
    
    // Legacy compatibility
    cache: { /* simplified cache interface */ },
    debugInfo: { /* simplified debug info */ }
  }
}
```

### Phase 6: Gradual Migration Strategy
**Timeline**: 2-4 weeks (can be done incrementally)
**Risk**: Very Low
**Approach**: Incremental adoption

#### 6.1 Migration Path
1. **Week 1**: Migrate high-traffic components to use specific hooks
   - Components only needing auth state → `useAuthCore()`
   - Components only needing profile → `useUserProfile()`
   - Components only checking roles → `useRoleChecks()`

2. **Week 2**: Migrate API routes and middleware
   - API routes → `useAccessToken()` directly
   - Auth middleware → `useAuthCore()` + `useAccessToken()`

3. **Week 3**: Migrate remaining components
   - Gradually replace `useAuth()` with specific hooks
   - Keep backward compatibility for complex components

4. **Week 4**: Cleanup and optimization
   - Remove unused exports from composition hook
   - Add performance monitoring
   - Update documentation

## 📈 Expected Benefits

### Performance Improvements
- **50-70% reduction in re-renders** for most components
- **30-40% faster initial load** due to lazy loading
- **Memory usage reduction** from smaller hook instances

### Developer Experience
- **Easier testing** - Mock only what you need
- **Better code clarity** - Each hook has single purpose
- **Faster onboarding** - New devs can understand pieces independently
- **Improved debugging** - Smaller, focused code paths

### Maintainability
- **Isolated changes** - Modify features without affecting others
- **Type safety** - Better TypeScript inference with smaller interfaces
- **Reusability** - Hooks can be used independently

## 🚨 Risk Mitigation

### Backward Compatibility
- Keep existing `useAuth` hook as composition wrapper
- All existing code continues to work unchanged
- Migration can be done incrementally

### Testing Strategy
1. **Unit tests** for each new hook
2. **Integration tests** for composition hook
3. **E2E tests** remain unchanged
4. **Parallel testing** during migration

### Rollback Plan
- Each phase can be rolled back independently
- Keep old implementation available during migration
- Feature flags for gradual rollout

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Review plan with team
- [ ] Set up feature branch
- [ ] Create test suite structure
- [ ] Document migration guide

### Phase 1: Core Authentication
- [ ] Create `useAuthCore.ts`
- [ ] Create `useAuthActions.ts`
- [ ] Write unit tests
- [ ] Test with 2-3 components

### Phase 2: Profile Management
- [ ] Create `useUserProfile.ts`
- [ ] Create `useProfileCache.ts`
- [ ] Write unit tests
- [ ] Migrate profile-heavy components

### Phase 3: Role Management
- [ ] Create `useRoleChecks.ts`
- [ ] Create `usePMSeniority.ts`
- [ ] Write unit tests
- [ ] Update permission-based components

### Phase 4: Token Management
- [ ] Create `useAccessToken.ts`
- [ ] Implement auto-refresh
- [ ] Write unit tests
- [ ] Test with API calls

### Phase 5: Composition
- [ ] Create new modular `useAuth.ts`
- [ ] Ensure backward compatibility
- [ ] Run full test suite
- [ ] Performance benchmarking

### Phase 6: Migration
- [ ] Week 1: High-traffic components
- [ ] Week 2: API routes and middleware
- [ ] Week 3: Remaining components
- [ ] Week 4: Cleanup and optimization

### Post-Implementation
- [ ] Update documentation
- [ ] Team knowledge sharing
- [ ] Performance monitoring
- [ ] Gather feedback

## 🎯 Success Metrics

### Quantitative
- Reduce average component re-renders by 50%
- Decrease bundle size by 10-15%
- Improve test execution time by 30%
- Reduce auth-related bug reports by 40%

### Qualitative
- Improved developer satisfaction scores
- Faster feature development velocity
- Easier onboarding for new team members
- Better code review efficiency

## 📚 References

### React Best Practices Applied
1. **Separation of Concerns** - Each hook handles one responsibility
2. **Composition over Inheritance** - Small hooks composed together
3. **Performance Optimization** - useMemo and useCallback where needed
4. **Testing in Isolation** - Each hook independently testable

### Design Patterns Used
- **Observer Pattern** - Auth state changes
- **Strategy Pattern** - Different auth strategies
- **Facade Pattern** - Simplified interface for complex operations
- **Cache-Aside Pattern** - Profile caching strategy

## 🚀 Next Steps

1. **Review and Approval** - Get team buy-in on approach
2. **Proof of Concept** - Implement Phase 1 as POC
3. **Performance Testing** - Benchmark improvements
4. **Gradual Rollout** - Start with low-risk components
5. **Monitor and Iterate** - Gather metrics and feedback

---

**Document Version**: 1.0  
**Created**: August 2025  
**Status**: Ready for Review  
**Estimated Total Time**: 15-20 hours of development  
**ROI**: High - Significant performance and maintainability gains