# Task: Consolidate Multiple Permissive Policies

## Task Overview
- **Name**: consolidate_multiple_permissive_policies
- **Goal**: Consolidate overlapping RLS policies to eliminate 365 performance warnings by combining multiple permissive policies into efficient single policies
- **Context**: Supabase analysis identified 365 warnings from multiple permissive policies affecting 19 tables, with highest impact on purchase_requests (21 instances), vendor_ratings, suppliers, and scope_items

## Current State Analysis

### Tables with Multiple Permissive Policies (Top Priority)

#### 1. **purchase_requests** - 6 Separate PERMISSIVE Policies
Current policies that need consolidation:
- `"Management purchase request access"` (FOR ALL) - Management + Purchase dept
- `"Project team purchase request read"` (FOR SELECT) - Project team read access  
- `"Requester own purchase request access"` (FOR ALL) - Own requests access
- `"Field worker purchase request read"` (FOR SELECT) - Field worker read access
- `"Purchase request status protection"` (FOR UPDATE) - Status change protection
- `"Purchase request deletion restriction"` (FOR DELETE) - Deletion restrictions

**Consolidation Target**: 2-3 unified policies using UNION conditions

#### 2. **vendor_ratings** - 4 Separate PERMISSIVE Policies  
Current policies that need consolidation:
- `"Management vendor rating access"` (FOR ALL) - Management + Purchase dept
- `"Project manager vendor rating"` (FOR ALL) - PM rating access
- `"Rater own vendor rating access"` (FOR ALL) - Own ratings access
- `"Team member vendor rating read"` (FOR SELECT) - Team read access

**Consolidation Target**: 2 unified policies (one for ALL, one for SELECT)

#### 3. **suppliers** - 4 Separate PERMISSIVE Policies
Current policies that need consolidation:
- `"Management supplier access"` (FOR ALL) - Management + Purchase dept
- `"Project team supplier read"` (FOR SELECT) - Project team read access
- `"Users can view active suppliers"` (FOR SELECT) - Active suppliers view
- `"Project managers can manage suppliers"` (FOR ALL) - PM management access

**Consolidation Target**: 2 unified policies (one for ALL, one for SELECT)

#### 4. **scope_items** - 7 Separate PERMISSIVE Policies
Current policies that need consolidation:
- `"Management scope full access"` (FOR ALL) - Management access
- `"Technical purchase scope access"` (FOR ALL) - Technical/Purchase roles
- `"Project team scope access"` (FOR SELECT) - Project team read
- `"Field worker scope access"` (FOR SELECT) - Field worker read
- `"Field worker scope update"` (FOR UPDATE) - Field worker update
- `"Client scope limited access"` (FOR SELECT) - Client read access
- `"Subcontractor scope access"` (FOR SELECT) - Subcontractor read

**Consolidation Target**: 3-4 unified policies (ALL, SELECT, UPDATE, specialized)

### Performance Impact Analysis
- **Total**: 365 warnings across 19 tables
- **High Impact Tables**: purchase_requests (21 instances), vendor_ratings, suppliers, scope_items
- **Query Performance**: Each overlapping policy requires separate evaluation
- **Authentication Overhead**: Redundant policy checks on every query
- **Database Load**: Multiple policy evaluations per table access

## Requirements

### 1. Policy Analysis Phase
- Map all existing permissive policies per table
- Identify overlapping role conditions
- Document current access patterns
- Measure baseline query performance

### 2. Consolidation Strategy
- Create unified policies using CASE/WHEN or OR conditions
- Combine role-based checks into single policies
- Use UNION patterns for complex multi-role access
- Maintain exact same security semantics

### 3. Implementation Approach

#### Example 1: Purchase Requests Consolidation
```sql
-- BEFORE: 6 separate policies
-- AFTER: 2-3 consolidated policies

-- Consolidated Read Access Policy
CREATE POLICY "purchase_requests_read_access" ON purchase_requests
FOR SELECT
TO authenticated
USING (
  -- Management and purchase department (full access)
  (is_management_role() OR has_purchase_department_access()) OR
  
  -- Project team read access
  (has_project_access(project_id) AND 
   EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid()) 
           AND role IN ('project_manager', 'technical_engineer', 'architect'))) OR
  
  -- Own requests access
  (requester_id = (select auth.uid())) OR
  
  -- Field worker read access
  (EXISTS (SELECT 1 FROM user_profiles up
           JOIN project_assignments pa ON pa.user_id = up.id
           WHERE up.id = (select auth.uid()) AND up.role = 'field_worker'
           AND pa.project_id = purchase_requests.project_id AND pa.is_active = true))
);

-- Consolidated Write Access Policy
CREATE POLICY "purchase_requests_write_access" ON purchase_requests
FOR INSERT, UPDATE, DELETE
TO authenticated
USING (
  -- Management and purchase department (full access)
  (is_management_role() OR has_purchase_department_access()) OR
  
  -- Own requests (draft status only)
  (requester_id = (select auth.uid()) AND status = 'draft') OR
  
  -- Project team create access
  (can_create_purchase_requests() AND has_project_access(project_id))
)
WITH CHECK (
  -- Status change validation
  (status = 'draft' AND requester_id = (select auth.uid())) OR
  (status = 'pending_approval' AND can_create_purchase_requests()) OR
  (status IN ('approved', 'rejected', 'cancelled') AND has_purchase_department_access())
);
```

#### Example 2: Vendor Ratings Consolidation
```sql
-- BEFORE: 4 separate policies
-- AFTER: 2 consolidated policies

-- Consolidated All Access Policy
CREATE POLICY "vendor_ratings_full_access" ON vendor_ratings
FOR ALL
TO authenticated
USING (
  -- Management and purchase department
  (is_management_role() OR has_purchase_department_access()) OR
  
  -- Project managers for their projects
  (EXISTS (SELECT 1 FROM user_profiles up
           JOIN projects p ON p.project_manager_id = up.id
           WHERE up.id = (select auth.uid()) AND up.role = 'project_manager'
           AND p.id = vendor_ratings.project_id)) OR
  
  -- Own ratings access
  (rater_id = (select auth.uid()))
);

-- Consolidated Read Access Policy
CREATE POLICY "vendor_ratings_read_access" ON vendor_ratings
FOR SELECT
TO authenticated
USING (
  -- Team members can view ratings for their project vendors
  (has_project_access(project_id) AND 
   EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid())
           AND role IN ('project_manager', 'technical_engineer', 'architect')))
);
```

#### Example 3: Suppliers Consolidation
```sql
-- BEFORE: 4 separate policies
-- AFTER: 2 consolidated policies

-- Consolidated Full Access Policy
CREATE POLICY "suppliers_full_access" ON suppliers
FOR ALL
TO authenticated
USING (
  -- Management and purchase department
  (is_management_role() OR has_purchase_department_access()) OR
  
  -- Project managers can manage
  (EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid())
           AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'project_manager')))
);

-- Consolidated Read Access Policy
CREATE POLICY "suppliers_read_access" ON suppliers
FOR SELECT
TO authenticated
USING (
  -- Active suppliers view for project team
  (status = 'active' AND 
   EXISTS (SELECT 1 FROM user_profiles WHERE id = (select auth.uid())
           AND role IN ('project_manager', 'technical_engineer', 'architect')))
);
```

### 4. Priority Tables for Consolidation

#### Purchase Requests (21 policies)
- Combine owner/admin/pm read policies
- Merge approval-based access policies
- Consolidate vendor access policies

#### Vendor Ratings
- Unify role-based read access
- Combine create/update policies by role

#### Suppliers
- Merge multi-role read policies
- Consolidate vendor-specific access

#### Scope Items
- Combine project team access policies
- Merge role-based modification policies

## Constraints

### Security Constraints
- **CRITICAL**: Do NOT change access control logic
- Maintain exact same permission boundaries
- Preserve all existing security checks
- No new access paths or permissions

### Technical Constraints
- Policies must remain readable and maintainable
- Performance must improve, not degrade
- Must support easy rollback if issues arise
- Test coverage for all access patterns

## Implementation Steps

### Phase 1: Analysis and Mapping
1. **Query Current Policies**
   ```sql
   -- Get all policies for target tables
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
   FROM pg_policies 
   WHERE tablename IN ('purchase_requests', 'vendor_ratings', 'suppliers', 'scope_items')
   ORDER BY tablename, policyname;
   ```

2. **Document Current Access Patterns**
   - Map each role to specific access requirements
   - Document business logic for each policy
   - Identify overlapping conditions

3. **Create Consolidation Matrix**
   - Group policies by operation type (SELECT, INSERT, UPDATE, DELETE)
   - Identify redundant conditions
   - Plan UNION-based consolidation

### Phase 2: Test Environment Setup
1. **Create Test Schema**
   ```sql
   -- Create test schema with identical structure
   CREATE SCHEMA test_consolidation;
   -- Clone tables and policies
   ```

2. **Benchmark Current Performance**
   ```sql
   -- Measure query performance before consolidation
   EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM purchase_requests LIMIT 100;
   ```

3. **Create Test Suite**
   - Test all role combinations
   - Test edge cases and boundary conditions
   - Test performance under load

### Phase 3: Policy Consolidation (Priority Order)

#### Step 1: Purchase Requests (Highest Impact)
```sql
-- Drop existing 6 policies
DROP POLICY IF EXISTS "Management purchase request access" ON purchase_requests;
DROP POLICY IF EXISTS "Project team purchase request read" ON purchase_requests;
DROP POLICY IF EXISTS "Requester own purchase request access" ON purchase_requests;
DROP POLICY IF EXISTS "Field worker purchase request read" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase request status protection" ON purchase_requests;
DROP POLICY IF EXISTS "Purchase request deletion restriction" ON purchase_requests;

-- Create 2 consolidated policies
CREATE POLICY "purchase_requests_read_access" ON purchase_requests FOR SELECT...;
CREATE POLICY "purchase_requests_write_access" ON purchase_requests FOR INSERT, UPDATE, DELETE...;
```

#### Step 2: Vendor Ratings
```sql
-- Drop existing 4 policies and create 2 consolidated policies
-- Similar pattern as purchase_requests
```

#### Step 3: Suppliers
```sql
-- Drop existing 4 policies and create 2 consolidated policies
-- Similar pattern as purchase_requests
```

#### Step 4: Scope Items
```sql
-- Drop existing 7 policies and create 3-4 consolidated policies
-- More complex due to multiple operation types
```

### Phase 4: Validation and Testing

#### Security Testing
1. **Role-Based Access Testing**
   ```sql
   -- Test each role's access patterns
   SET ROLE 'project_manager';
   SELECT * FROM purchase_requests; -- Should work for assigned projects
   
   SET ROLE 'field_worker';
   SELECT * FROM purchase_requests; -- Should work for assigned projects only
   ```

2. **Edge Case Testing**
   - Test with NULL values
   - Test with missing project assignments
   - Test with inactive users
   - Test with expired sessions

#### Performance Testing
1. **Query Performance Comparison**
   ```sql
   -- Before consolidation
   EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM purchase_requests WHERE project_id = $1;
   
   -- After consolidation
   EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM purchase_requests WHERE project_id = $1;
   ```

2. **Concurrent Load Testing**
   - Test with multiple simultaneous users
   - Test with different role combinations
   - Monitor query planning time

### Phase 5: Production Deployment

#### Pre-Deployment Checklist
1. **Create Rollback Scripts**
   ```sql
   -- Store original policies in rollback file
   -- Test rollback procedures in staging
   ```

2. **Deployment Window Planning**
   - Schedule during low-traffic period
   - Have DBA monitoring ready
   - Prepare rollback procedures

3. **Monitoring Setup**
   ```sql
   -- Monitor query performance
   -- Track policy evaluation times
   -- Monitor error rates
   ```

#### Deployment Steps
1. **Apply Consolidation Migration**
   ```bash
   # Apply new consolidated policies
   npx supabase db push
   ```

2. **Immediate Validation**
   - Run smoke tests
   - Check query performance
   - Verify no access errors

3. **Rollback If Needed**
   ```bash
   # If issues detected, rollback immediately
   npx supabase db reset --linked
   ```

## Success Criteria

### Performance Metrics
- **Policy Reduction**: 21 policies → 8-10 policies (50%+ reduction)
- **Query Performance**: 30-50% improvement in query execution time
- **Policy Evaluation**: 60%+ reduction in policy evaluation overhead
- **Database Load**: Reduced CPU usage during authentication
- **Planning Time**: Faster query planning with fewer policies to evaluate

### Functional Requirements
- **Zero Access Changes**: Identical access control behavior maintained
- **All Queries Work**: No breaking changes to existing application queries
- **No Auth Failures**: All existing authentication flows continue working
- **Audit Trail**: All security logs and audit trails preserved
- **Role Matrix**: All 13 user roles maintain exact same permissions

### Expected Performance Improvements

#### Purchase Requests Table
- **Before**: 6 separate policies, 21 warnings
- **After**: 2 consolidated policies
- **Expected**: 65% reduction in policy evaluation time

#### Vendor Ratings Table  
- **Before**: 4 separate policies, high warning count
- **After**: 2 consolidated policies
- **Expected**: 50% reduction in policy evaluation time

#### Suppliers Table
- **Before**: 4 separate policies, multiple overlaps
- **After**: 2 consolidated policies  
- **Expected**: 50% reduction in policy evaluation time

#### Scope Items Table
- **Before**: 7 separate policies, complex overlaps
- **After**: 3-4 consolidated policies
- **Expected**: 45% reduction in policy evaluation time

### Overall System Impact
- **Total Policy Count**: 365 warnings → ~150 warnings (60% reduction)
- **High-Impact Tables**: 75% performance improvement
- **Database CPU**: 20-30% reduction during peak usage
- **Query Latency**: 40-60% improvement for affected tables

## Rollback Strategy

### Immediate Rollback
```sql
-- Store original policies before changes
-- Keep rollback scripts ready
-- Monitor for any access issues
-- Rollback within 5 minutes if problems
```

### Rollback Procedures
1. Pre-stage all original policy definitions
2. Create automated rollback script
3. Test rollback in staging
4. Document rollback process

## Testing Requirements

### Security Testing
- Test all role combinations
- Verify no new access paths
- Check edge cases
- Validate with production-like data

### Performance Testing
- Benchmark before/after
- Test with realistic data volumes
- Measure under concurrent load
- Profile specific slow queries

## Deliverables

1. **Policy Analysis Report**
   - Current policy inventory
   - Consolidation opportunities
   - Risk assessment

2. **Consolidated Policy Scripts**
   - New unified policies
   - Migration scripts
   - Rollback scripts

3. **Performance Validation**
   - Benchmark results
   - Query plan comparisons
   - Performance improvement metrics

4. **Deployment Package**
   - Step-by-step deployment guide
   - Monitoring queries
   - Rollback procedures

## Risk Mitigation

### High-Risk Areas
- Complex multi-condition policies
- Policies with dynamic conditions
- Cross-table permission dependencies
- Time-based access controls

### Mitigation Strategies
- Extensive testing in staging
- Gradual rollout by table
- Real-time monitoring
- Quick rollback capability

## Notes for Implementation

- Start with simple consolidations first
- Keep original policies commented in code
- Document every consolidation decision
- Create performance baseline before changes
- Test with production-like data volumes
- Have DBA review consolidated policies
- Monitor for 24 hours post-deployment