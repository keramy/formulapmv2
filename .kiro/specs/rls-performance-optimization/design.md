# Design Document

## Overview

This design addresses the systematic optimization of Row Level Security (RLS) policies across 17 database tables to resolve performance issues identified by the Supabase Performance Advisor. The current state shows 25+ direct auth function calls that need optimization, with zero policies currently optimized.

The optimization transforms direct `auth.uid()` and `auth.jwt()` calls into subquery patterns `(SELECT auth.uid())` and `(SELECT auth.jwt())`, which are evaluated once per query instead of once per row, dramatically improving performance at scale.

## Architecture

### Current State Analysis
Based on validation results, the following tables require optimization:
- **activity_summary**: 3 policies, 2 direct calls
- **audit_logs**: 2 policies, 1 direct call  
- **document_approvals**: 2 policies, 1 direct call
- **documents**: 6 policies, 2 direct calls
- **field_reports**: 3 policies, 1 direct call
- **invoice_items**: 1 policy, 1 direct call
- **invoices**: 4 policies, 3 direct calls
- **mobile_devices**: 1 policy, 1 direct call
- **notifications**: 1 policy, 1 direct call
- **payments**: 2 policies, 1 direct call
- **permission_templates**: 1 policy, 1 direct call
- **project_budgets**: 3 policies, 2 direct calls
- **suppliers**: 3 policies, 2 direct calls
- **system_settings**: 2 policies, 1 direct call
- **task_comments**: 1 policy, 1 direct call
- **tasks**: 4 policies, 1 direct call
- **tenders**: 3 policies, 1 direct call

### Optimization Strategy

The design follows a three-phase approach:

1. **Discovery Phase**: Query existing policies to identify optimization targets
2. **Transformation Phase**: Apply systematic pattern replacement
3. **Validation Phase**: Verify optimization success and security preservation

### Pattern Transformations

#### Direct Function Call Pattern (Current - Inefficient)
```sql
-- Evaluated for every row
user_id = auth.uid()
role = (auth.jwt() ->> 'user_role')
```

#### Optimized Subquery Pattern (Target - Efficient)  
```sql
-- Evaluated once per query
user_id = (SELECT auth.uid())
role = ((SELECT auth.jwt()) ->> 'user_role')
```

## Components and Interfaces

### Core Components

#### 1. Policy Discovery Engine
- **Purpose**: Identify all policies requiring optimization
- **Input**: Database schema metadata
- **Output**: List of policies with optimization requirements
- **Query Pattern**: 
```sql
SELECT tablename, policyname, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%')
AND qual NOT LIKE '%(SELECT auth.%'
```

#### 2. Pattern Transformation Engine
- **Purpose**: Apply systematic pattern replacements
- **Input**: Policy definitions with direct auth calls
- **Output**: Optimized policy definitions
- **Transformation Rules**:
  - `auth.uid()` → `(SELECT auth.uid())`
  - `auth.jwt()` → `(SELECT auth.jwt())`
  - Preserve all logical operators and conditions
  - Maintain policy names and descriptions

#### 3. Policy Recreation Engine
- **Purpose**: Drop and recreate policies with optimized patterns
- **Input**: Optimized policy definitions
- **Output**: Applied database changes
- **Safety Features**:
  - Transaction-based operations
  - Rollback capability on errors
  - Detailed logging of all changes

#### 4. Validation Engine
- **Purpose**: Verify optimization success and security preservation
- **Input**: Database state after optimization
- **Output**: Validation reports and metrics
- **Validation Queries**:
```sql
-- Count optimization status
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(CASE WHEN qual LIKE '%(SELECT auth.%' THEN 1 END) as optimized,
  COUNT(CASE WHEN qual LIKE '%auth.uid()%' OR qual LIKE '%auth.jwt()%' 
             AND qual NOT LIKE '%(SELECT auth.%' THEN 1 END) as direct
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename;
```

## Data Models

### Policy Metadata Structure
```typescript
interface PolicyMetadata {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}
```

### Optimization Status
```typescript
interface OptimizationStatus {
  tablename: string;
  total_policies: number;
  optimized: number;
  nested: number;
  direct: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}
```

### Transformation Result
```typescript
interface TransformationResult {
  original_policy: PolicyMetadata;
  optimized_policy: PolicyMetadata;
  changes_applied: string[];
  success: boolean;
  error_message?: string;
}
```

## Error Handling

### Error Categories

#### 1. Policy Discovery Errors
- **Cause**: Database connection issues, permission problems
- **Handling**: Retry with exponential backoff, fallback to manual policy list
- **Recovery**: Continue with known critical policies

#### 2. Pattern Transformation Errors
- **Cause**: Complex policy syntax, nested conditions
- **Handling**: Log problematic policies, apply manual transformation rules
- **Recovery**: Skip problematic policies, continue with others

#### 3. Policy Recreation Errors
- **Cause**: Syntax errors, dependency conflicts, permission issues
- **Handling**: Transaction rollback, detailed error logging
- **Recovery**: Restore original policy, mark for manual review

#### 4. Validation Errors
- **Cause**: Incomplete optimization, security regression
- **Handling**: Generate detailed reports, flag issues for review
- **Recovery**: Provide rollback scripts, manual verification steps

### Error Recovery Strategies

#### Automatic Recovery
- Transaction-based operations with automatic rollback
- Retry mechanisms for transient failures
- Fallback to known-good policy definitions

#### Manual Recovery
- Detailed error logs with specific policy information
- Rollback scripts for each transformation
- Step-by-step manual verification procedures

## Testing Strategy

### Unit Testing
- **Policy Discovery**: Test query accuracy against known policy sets
- **Pattern Transformation**: Verify transformation rules with sample policies
- **Validation Logic**: Test optimization detection algorithms

### Integration Testing
- **End-to-End Optimization**: Test complete optimization workflow
- **Security Preservation**: Verify access controls remain unchanged
- **Performance Validation**: Measure query performance improvements

### Performance Testing
- **Before/After Comparison**: Measure query execution times
- **Scale Testing**: Test with large datasets to verify performance gains
- **Load Testing**: Ensure optimized policies handle concurrent access

### Security Testing
- **Access Control Verification**: Test all user roles and permissions
- **Regression Testing**: Ensure no security vulnerabilities introduced
- **Audit Trail**: Verify all changes are properly logged

### Rollback Testing
- **Recovery Procedures**: Test rollback scripts and procedures
- **Data Integrity**: Verify no data loss during rollback
- **System Stability**: Ensure system remains stable during recovery

## Implementation Phases

### Phase 1: Discovery and Analysis
- Query existing policies and categorize optimization needs
- Generate comprehensive policy inventory
- Identify high-priority tables based on Performance Advisor warnings

### Phase 2: Pattern Development
- Develop and test transformation rules
- Create policy recreation templates
- Build validation and verification queries

### Phase 3: Systematic Optimization
- Apply optimizations table by table
- Validate each transformation before proceeding
- Generate detailed progress reports

### Phase 4: Validation and Monitoring
- Run comprehensive validation suite
- Generate performance comparison reports
- Establish ongoing monitoring for policy changes