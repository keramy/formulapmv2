# Design Document

## Overview

The design focuses on migrating the database schema from the legacy 13-role system to match the already-implemented 6-role application code. This is a database-first migration that will align the data layer with the application layer, enabling proper authentication and role-based access control.

## Architecture

### Current State Analysis
- **Application Layer**: ✅ Already converted to 6-role system
- **Database Layer**: ❌ Still using `user_role_old` (13 roles)
- **RLS Policies**: ❌ Still referencing old role names
- **Mock Data**: ❌ Still present in some components

### Target State
- **Database Layer**: Migrated to `user_role` (6 roles)
- **RLS Policies**: Updated to reference new roles
- **Mock Data**: Completely eliminated
- **Application Layer**: No changes needed (already correct)

## Components and Interfaces

### 1. Database Migration Engine
```sql
-- Core migration strategy
ALTER TABLE user_profiles ALTER COLUMN role TYPE user_role 
USING (
  CASE role::text
    WHEN 'company_owner' THEN 'management'::user_role
    WHEN 'general_manager' THEN 'management'::user_role
    WHEN 'deputy_general_manager' THEN 'management'::user_role
    WHEN 'technical_director' THEN 'technical_lead'::user_role
    WHEN 'architect' THEN 'project_manager'::user_role
    WHEN 'technical_engineer' THEN 'project_manager'::user_role
    WHEN 'field_worker' THEN 'project_manager'::user_role
    WHEN 'purchase_director' THEN 'purchase_manager'::user_role
    WHEN 'purchase_specialist' THEN 'purchase_manager'::user_role
    WHEN 'project_manager' THEN 'project_manager'::user_role
    WHEN 'client' THEN 'client'::user_role
    WHEN 'admin' THEN 'admin'::user_role
    WHEN 'subcontractor' THEN 'project_manager'::user_role
    ELSE 'project_manager'::user_role
  END
);
```

### 2. Seniority Level Assignment
```sql
-- Add seniority based on original role
UPDATE user_profiles SET seniority_level = 
  CASE 
    WHEN role = 'management' THEN 'executive'
    WHEN role = 'technical_lead' THEN 'senior'
    WHEN role = 'purchase_manager' AND previous_role IN ('purchase_director') THEN 'senior'
    WHEN role = 'project_manager' AND previous_role IN ('architect', 'technical_director') THEN 'senior'
    ELSE 'regular'
  END;
```

### 3. RLS Policy Migration Engine
```typescript
interface PolicyMigration {
  policyName: string
  oldRoleReferences: string[]
  newRoleMapping: Record<string, string>
  requiresManualReview: boolean
}

const migratePolicies = async (policies: PolicyMigration[]) => {
  for (const policy of policies) {
    await updateRLSPolicy(policy)
  }
}
```

### 4. Mock Data Elimination Engine
```typescript
interface MockDataLocation {
  filePath: string
  mockDataType: 'hardcoded' | 'mock_file' | 'placeholder'
  replacementAPI: string
  migrationPriority: 'high' | 'medium' | 'low'
}

const eliminateMockData = async (locations: MockDataLocation[]) => {
  // Replace with real API calls
}
```

## Data Models

### Role Mapping Matrix
```typescript
const ROLE_MIGRATION_MAP: Record<string, {
  newRole: UserRole
  seniority: SeniorityLevel
  approvalLimits: ApprovalLimits
}> = {
  'company_owner': {
    newRole: 'management',
    seniority: 'executive',
    approvalLimits: { budget: 'unlimited' }
  },
  'general_manager': {
    newRole: 'management', 
    seniority: 'executive',
    approvalLimits: { budget: 'unlimited' }
  },
  'deputy_general_manager': {
    newRole: 'management',
    seniority: 'senior', 
    approvalLimits: { budget: 'unlimited' }
  },
  'technical_director': {
    newRole: 'technical_lead',
    seniority: 'senior',
    approvalLimits: { budget: 75000 }
  },
  'architect': {
    newRole: 'project_manager',
    seniority: 'senior',
    approvalLimits: { budget: 50000 }
  },
  'technical_engineer': {
    newRole: 'project_manager',
    seniority: 'regular',
    approvalLimits: { budget: 15000 }
  },
  'field_worker': {
    newRole: 'project_manager',
    seniority: 'regular',
    approvalLimits: { budget: 5000 }
  },
  'purchase_director': {
    newRole: 'purchase_manager',
    seniority: 'senior',
    approvalLimits: { budget: 100000 }
  },
  'purchase_specialist': {
    newRole: 'purchase_manager',
    seniority: 'regular',
    approvalLimits: { budget: 25000 }
  },
  'project_manager': {
    newRole: 'project_manager',
    seniority: 'regular',
    approvalLimits: { budget: 15000 }
  },
  'subcontractor': {
    newRole: 'project_manager',
    seniority: 'regular',
    approvalLimits: { budget: 5000 }
  },
  'client': {
    newRole: 'client',
    seniority: 'standard',
    approvalLimits: { document_approval: 'assigned_projects' }
  },
  'admin': {
    newRole: 'admin',
    seniority: 'system',
    approvalLimits: { budget: 'unlimited' }
  }
}
```

### Migration Tracking
```sql
CREATE TABLE migration_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id),
  old_role user_role_old,
  new_role user_role,
  seniority_assigned seniority_level,
  migration_timestamp TIMESTAMPTZ DEFAULT NOW(),
  migration_status TEXT DEFAULT 'completed',
  rollback_data JSONB
);
```

## Error Handling

### Migration Failure Recovery
1. **Pre-migration Backup**: Complete snapshot of user_profiles table
2. **Transaction Rollback**: All changes in single transaction
3. **Validation Checks**: Verify each user can authenticate post-migration
4. **Rollback Script**: Automated restoration to previous state

### Authentication Continuity
```typescript
const maintainSessionDuringMigration = async () => {
  // Keep existing sessions valid during role transition
  // Update JWT tokens with new role information
  // Refresh user permissions in real-time
}
```

### RLS Policy Validation
```sql
-- Test each policy with sample users
SELECT policy_name, test_result 
FROM validate_rls_policies_post_migration();
```

## Testing Strategy

### 1. Pre-Migration Testing
- Backup verification
- Role mapping validation
- RLS policy syntax checking
- Mock data inventory

### 2. Migration Testing
- Transaction integrity
- Data consistency checks
- Authentication flow testing
- Permission verification

### 3. Post-Migration Testing
- User login verification for all roles
- Permission matrix validation
- API endpoint functionality
- Frontend component behavior

### 4. Rollback Testing
- Rollback script execution
- Data restoration verification
- System functionality post-rollback

## Implementation Phases

### Phase 1: Preparation (Day 1)
- Create migration scripts
- Generate backup procedures
- Identify all RLS policies needing updates
- Catalog mock data locations

### Phase 2: Database Migration (Day 2)
- Execute role enum migration
- Update user_profiles table
- Assign seniority levels
- Update RLS policies

### Phase 3: Mock Data Elimination (Day 3)
- Replace hardcoded data with API calls
- Update components to use real data
- Remove mock data files
- Test all CRUD operations

### Phase 4: Validation (Day 4)
- End-to-end testing
- Performance verification
- Security audit
- Documentation updates

## Risk Mitigation

### High-Risk Areas
1. **User Lockout**: Comprehensive authentication testing
2. **Permission Escalation**: Careful role mapping validation
3. **Data Loss**: Multiple backup strategies
4. **Performance Impact**: Optimized migration queries

### Rollback Triggers
- Authentication failure rate > 5%
- Permission errors in critical workflows
- Database performance degradation > 50%
- Any data corruption detected

## Success Metrics

- ✅ 100% of users can authenticate with new roles
- ✅ 0% mock data remaining in codebase
- ✅ All RLS policies reference new role system
- ✅ API response times < 200ms
- ✅ Zero critical security vulnerabilities
- ✅ Complete rollback capability maintained