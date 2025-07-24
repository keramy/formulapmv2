# Task: Phase 1 - Foundation Correction & Role Migration

## Type: Refactoring
**Priority**: Critical (Blocks all other phases)
**Effort**: 2 weeks  
**Subagents**: 2 (working in parallel)
**Approach**: Parallel

## Request Analysis
**Original Request**: "Fix role system discrepancy and eliminate all mock data"
**Objective**: Migrate from 13-role to 6-role system and replace all mock data with real APIs
**Over-Engineering Check**: Using proven migration patterns, minimum database changes

## Subagent Assignments

### Week 1-2: Parallel Execution

#### Subagent A: Database & Role Migration Specialist
```
TASK_NAME: ROLE_SYSTEM_MIGRATION
TASK_GOAL: Successfully migrate from 13-role to 6-role system with zero data loss
REQUIREMENTS:
1. Create new 6-role enum type in database
2. Map all 13 existing roles to new 6-role system
3. Update user_profiles table with new role structure
4. Add seniority levels for PM hierarchy
5. Update all RLS policies for new roles
6. Create rollback scripts for safety
7. Test with all existing users
8. Ensure compilation: npm run build
CONSTRAINTS:
- Zero downtime during migration
- Maintain user session continuity
- All existing permissions must map correctly
- Follow RLS optimization: (SELECT auth.uid())
DEPENDENCIES: Access to production database schema
OUTPUT_ARTIFACTS:
- Migration scripts (up and down)
- Role mapping documentation
- Updated RLS policies
- Test results
```

#### Subagent B: API Integration Specialist
```
TASK_NAME: MOCK_DATA_ELIMINATION
TASK_GOAL: Replace 100% of mock data with functional API calls
REQUIREMENTS:
1. Identify all mock data usage in codebase
2. Create real API endpoints using withAuth pattern
3. Update all frontend components to use real APIs
4. Implement proper loading and error states
5. Add data validation for all inputs
6. Test CRUD operations for all entities
7. Ensure compilation: npm run build
CONSTRAINTS:
- Use Kiro's withAuth pattern for all endpoints
- Maintain existing UI/UX behavior
- Follow TypeScript strict mode
- Use established error handling patterns
DEPENDENCIES: Subagent A's role system (for permissions)
OUTPUT_ARTIFACTS:
- API endpoint documentation
- Updated frontend components
- Test coverage report
- Performance metrics
```

## Technical Details

### Database Changes (Subagent A)
```sql
-- New 6-role enum
CREATE TYPE new_user_role AS ENUM (
  'management',         -- Replaces: company_owner, general_manager, deputy_general_manager
  'purchase_manager',   -- Replaces: purchase_director, purchase_specialist
  'technical_lead',     -- Replaces: technical_director, architect, technical_engineer
  'project_manager',    -- Keeps: project_manager (with seniority)
  'client',            -- Keeps: client
  'admin'              -- Keeps: admin
);

-- Seniority for PM hierarchy
ALTER TABLE user_profiles ADD COLUMN seniority TEXT DEFAULT 'regular' 
  CHECK (seniority IN ('executive', 'senior', 'regular'));
```

### API Patterns (Subagent B)
```typescript
// ALL endpoints must use this pattern
export const GET = withAuth(async (request, { user, profile }) => {
  // Real database queries here
  const data = await supabase
    .from('table')
    .select('*')
    .eq('user_id', user.id);
  
  return createSuccessResponse(data);
}, { permission: 'permission.name' });
```

### Files to Modify
**Subagent A Focus**:
- `supabase/migrations/` - New migration files
- `src/lib/permissions.ts` - Role mappings
- `src/lib/supabase.ts` - RLS policy updates
- All RLS policies in database

**Subagent B Focus**:
- `src/app/api/` - All API routes
- `src/hooks/` - All data fetching hooks
- `src/components/` - Remove mock data imports
- `src/lib/mock-data/` - Delete entire directory

## Success Criteria

### Subagent A Success Metrics
- [ ] All 13 roles successfully mapped to 6 roles
- [ ] Zero user authentication failures after migration
- [ ] All RLS policies updated and tested
- [ ] Rollback scripts tested and verified
- [ ] Performance maintained (<200ms response)
- [ ] 100% of existing users can log in

### Subagent B Success Metrics
- [ ] 0% mock data remaining in codebase
- [ ] All API endpoints return real data
- [ ] Frontend displays live database content
- [ ] CRUD operations functional for all entities
- [ ] Loading states implemented everywhere
- [ ] Error handling consistent across app

## Coordination Points

### Daily Sync Requirements
1. Subagent A reports role migration progress
2. Subagent B reports API conversion status
3. Identify any blocking dependencies
4. Performance metrics review
5. Risk assessment update

### Week 1 Checkpoint
- Role enum created and tested
- 50% of mock data eliminated
- Initial integration testing

### Week 2 Completion
- Full role migration complete
- 100% mock data eliminated
- End-to-end testing passed

## Risk Mitigation

### Role Migration Risks
- **Risk**: User lockout during migration
- **Mitigation**: Test with backup database first, maintain session continuity

### Mock Data Risks  
- **Risk**: Missing API endpoints discovered
- **Mitigation**: Complete mock data audit first, create endpoint checklist

### Integration Risks
- **Risk**: Permission mismatches with new roles
- **Mitigation**: Comprehensive permission testing matrix

## Status Tracking (For Coordinator)

### Week 1 Progress
- [ ] Database schema migration script created
- [ ] Role mapping logic implemented
- [ ] 25% of APIs converted from mock data
- [ ] Initial testing completed

### Week 2 Progress
- [ ] RLS policies updated for 6-role system
- [ ] All users migrated successfully
- [ ] 100% of APIs using real data
- [ ] Integration testing passed

### Blocker Log
- [Date]: [Blocker description] - [Resolution]

### Performance Metrics
- API Response Time: ___ms (Target: <200ms)
- Database Query Time: ___ms (Target: <50ms)
- Frontend Load Time: ___s (Target: <2s)

### Subagent Status
- [ ] Subagent A: Role Migration - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________
- [ ] Subagent B: Mock Data Elimination - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Phase Completion Criteria
- [ ] All users can authenticate with new role system
- [ ] Zero mock data references in codebase
- [ ] All tests passing (90%+ coverage)
- [ ] Performance targets met
- [ ] No critical bugs in production
- [ ] Documentation updated

### Handoff to Phase 2
**Prerequisites for Phase 2**:
1. Role system fully operational
2. Authentication working for all roles
3. API infrastructure established
4. No mock data dependencies
5. Performance baseline established