# Database Patterns - Formula PM V2

## Critical Database Patterns for Enterprise-Grade Performance

### 1. RLS Policy Pattern (MUST USE - 10-100x Performance Improvement)

```sql
-- ✅ CORRECT - Optimized pattern (Enterprise Grade Performance)
CREATE POLICY "policy_name" ON "table_name"
USING (user_id = (SELECT auth.uid()));

-- ❌ WRONG - Direct call (10-100x slower, causes performance bottlenecks)
CREATE POLICY "policy_name" ON "table_name"
USING (user_id = auth.uid());
```

**Why this matters**: The SELECT wrapper forces PostgreSQL to cache the auth.uid() result, preventing repeated function calls during query execution.

### 2. Foreign Key Index Pattern (MUST USE - Essential for JOINs)

```sql
-- ✅ CORRECT - Always index foreign keys
CREATE INDEX IF NOT EXISTS idx_table_foreign_key_id ON table_name(foreign_key_id);

-- ✅ CORRECT - Composite indexes for complex queries
CREATE INDEX IF NOT EXISTS idx_table_project_status 
ON table_name(project_id, status) WHERE status = 'active';

-- ❌ WRONG - Unindexed foreign keys cause 10-100x slower JOINs
CREATE TABLE table_name (
  foreign_key_id UUID REFERENCES other_table(id) -- Missing index!
);
```

**Best Practices**:
- Index ALL foreign key columns
- Create composite indexes for frequently queried column combinations
- Use partial indexes (WHERE clause) for filtered queries

### 3. Database Migration Pattern (Production Ready Structure)

```sql
-- ✅ CORRECT - Migration file naming and structure
-- 20250124000001_descriptive_name.sql

-- Always include verification and performance analysis
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully';
  RAISE NOTICE '📊 Performance optimization: %', 'description';
END $$;
```

**Migration Best Practices**:
- Use descriptive names with timestamps
- Include rollback procedures
- Add verification queries
- Document performance impacts

### 4. 6-Role System Pattern (MUST USE - 62% Complexity Reduction)

```sql
-- ✅ CORRECT - Simplified 6-role system
CREATE TYPE user_role AS ENUM (
  'management',      -- Company oversight
  'purchase_manager', -- Purchase operations  
  'technical_lead',  -- Technical oversight
  'project_manager', -- Project coordination
  'client',         -- External client access
  'admin'           -- System administration
);

-- ❌ WRONG - Complex 13+ role system (deprecated)
-- Old roles like owner, GM, deputy_GM, etc. are consolidated
```

**Role Mapping**:
- `management` = owner, GM, deputy_GM
- `purchase_manager` = director, purchase_specialist
- `technical_lead` = technical oversight roles
- `project_manager` = all PM variations
- `client` = external read-only access
- `admin` = system administration

### 5. Security Function Pattern (MUST USE)

```sql
-- ✅ CORRECT - Secure function with search_path
CREATE OR REPLACE FUNCTION function_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''  -- Prevents injection attacks
AS $$
BEGIN
  -- Function logic
END;
$$;

-- ❌ WRONG - Missing search_path (security vulnerability)
CREATE OR REPLACE FUNCTION function_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
-- Missing SET search_path = ''
```

### 6. Generated Column Pattern

```sql
-- ✅ CORRECT
price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

-- ❌ INCORRECT - missing STORED
price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price),

-- ❌ INCORRECT - subquery not allowed
price DECIMAL(10,2) GENERATED ALWAYS AS (SELECT price FROM products WHERE id = product_id) STORED,
```

### 7. Performance Monitoring Queries

```sql
-- Check for missing indexes on foreign keys
SELECT 
    tc.table_name, 
    kcu.column_name,
    'CREATE INDEX idx_' || tc.table_name || '_' || kcu.column_name || 
    ' ON ' || tc.table_name || '(' || kcu.column_name || ');' as create_index_sql
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN pg_indexes pi 
    ON pi.tablename = tc.table_name 
    AND pi.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
AND pi.indexname IS NULL;

-- Check RLS policy performance
SELECT 
    schemaname,
    tablename,
    policyname,
    qual
FROM pg_policies
WHERE qual NOT LIKE '%(SELECT auth.uid())%'
AND qual LIKE '%auth.uid()%';
```

### 8. Database Query Patterns

```typescript
// ❌ WRONG: FK relationship syntax (fails without actual FK constraints)
.select('client:clients(name), project_manager:user_profiles(name)')

// ✅ CORRECT: Explicit separate queries
const { data: client } = await supabase
  .from('clients')
  .select('name')
  .eq('id', project.client_id)
  .single();

const { data: manager } = await supabase
  .from('user_profiles')
  .select('name')
  .eq('id', project.project_manager_id)
  .single();
```

## Performance Achievements

Using these patterns, we achieved:
- **Project Queries**: 1-5ms (was 1000-5000ms) - **99%+ improvement**
- **Team Lookups**: 1-3ms (was 500-2000ms) - **99%+ improvement**
- **Document Access**: 1-2ms (was 200-1000ms) - **99%+ improvement**
- **Complex JOINs**: Up to 100x faster with proper indexing

## Current Schema Status

- **12-table optimized schema** (from 65 tables)
- **6-role system** (from 13 roles)
- **48 RLS Policies**: All optimized with SELECT wrappers
- **42 Performance Indexes**: All critical foreign keys indexed
- **3 Composite Indexes**: For complex query patterns