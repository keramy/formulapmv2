# PostgreSQL/Supabase Migration Guidelines

## Overview
This document provides comprehensive guidelines for creating SQL migrations in PostgreSQL/Supabase based on real issues encountered during development. These guidelines prevent common errors and ensure smooth database deployment.

## Critical PostgreSQL Rules

### 1. Generated Column Limitations

**RULE**: Generated columns have strict limitations in PostgreSQL and cannot be used in many scenarios.

#### What's NOT Allowed:
- **Subqueries**: Cannot reference other tables
- **User-defined functions**: Only built-in immutable functions
- **Volatile functions**: Cannot use time-dependent functions like `NOW()`
- **Missing STORED keyword**: Must specify `STORED` for computed columns

#### ❌ WRONG Example:
```sql
-- This will FAIL - subquery not allowed
total_price DECIMAL(12,2), GENERATED ALWAYS AS (
  (SELECT quantity FROM tender_items WHERE id = tender_item_id) * unit_price
) STORED,
```

#### ✅ CORRECT Examples:
```sql
-- Simple calculation with same-table columns
total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

-- Mathematical operations
tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,

-- Complex same-table calculations
final_amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + tax_rate / 100)) STORED,
```

### 2. Alternative: Trigger-Based Calculations

When generated columns can't be used, implement triggers instead:

#### ✅ CORRECT Pattern:
```sql
-- 1. Create the function
CREATE OR REPLACE FUNCTION calculate_tender_submission_item_total()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate total_price based on tender_item quantity and unit_price
  SELECT quantity * NEW.unit_price
  INTO NEW.total_price
  FROM tender_items
  WHERE id = NEW.tender_item_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Create the trigger
CREATE TRIGGER trigger_calculate_tender_submission_item_total
  BEFORE INSERT OR UPDATE ON tender_submission_items
  FOR EACH ROW EXECUTE PROCEDURE calculate_tender_submission_item_total();
```

### 3. Index Predicate Constraints

**RULE**: Index predicates (WHERE clauses) can only use immutable functions.

#### ❌ WRONG Example:
```sql
-- This will FAIL - NOW() is not immutable
CREATE INDEX idx_announcements_active 
ON project_announcements(project_id, is_pinned) 
WHERE expires_at IS NULL OR expires_at > NOW();
```

#### ✅ CORRECT Example:
```sql
-- Simplified predicate without volatile functions
CREATE INDEX idx_announcements_active 
ON project_announcements(project_id, is_pinned) 
WHERE expires_at IS NULL;
```

### 4. Enum Definition Rules

**RULE**: Enum types must be unique across the entire database.

#### ❌ WRONG Example:
```sql
-- File: 20250702000004_audit_system.sql
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed');

-- File: 20250703000001_task_management_system.sql
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done'); -- DUPLICATE!
```

#### ✅ CORRECT Pattern:
```sql
-- First migration defines the enum
CREATE TYPE task_status AS ENUM (
  'pending',
  'in_progress', 
  'review',
  'completed',
  'cancelled',
  'blocked'
);

-- Later migrations reference existing enum
-- Task status types (already defined in audit_system migration)
-- Using existing task_status enum from audit_system
```

## File Naming Conventions

### Pattern: `YYYYMMDDHHMMSS_descriptive_name.sql`

#### ✅ CORRECT Examples:
- `20250702000000_migrations_table.sql`
- `20250702000001_initial_schema.sql`
- `20250702000005_financial_tender_system.sql`
- `20250703000008_client_portal_system.sql`

### Naming Rules:
1. **Chronological order**: Earlier timestamps execute first
2. **Descriptive names**: Clear purpose indication
3. **System grouping**: Related features use similar prefixes
4. **Version control**: Unique timestamps prevent conflicts

## Migration Structure Template

```sql
-- Formula PM 2.0 [Feature Name]
-- Created: YYYY-MM-DD
-- Purpose: [Brief description of what this migration does]

-- ============================================================================
-- ENUMS (if needed)
-- ============================================================================

-- [Enum definitions - check for existing ones first]

-- ============================================================================
-- TABLES
-- ============================================================================

-- [Table definitions with proper constraints]

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- [Custom functions and triggers]

-- ============================================================================
-- INDEXES
-- ============================================================================

-- [Performance indexes with immutable predicates only]

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- [RLS policies if needed]

-- ============================================================================
-- SAMPLE DATA (optional)
-- ============================================================================

-- [Test data if appropriate]
```

## Common Patterns and Anti-Patterns

### ✅ CORRECT: Simple Generated Columns
```sql
-- Same-table calculations only
total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
cost_variance DECIMAL(12,2) GENERATED ALWAYS AS (actual_cost - initial_cost) STORED,
final_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price * (1 + markup_percentage/100)) STORED,
```

### ❌ WRONG: Complex Generated Columns
```sql
-- Don't use subqueries, user functions, or volatile functions
total_with_tax DECIMAL(12,2) GENERATED ALWAYS AS (
  (SELECT SUM(amount) FROM line_items WHERE order_id = id) * 1.1
) STORED, -- FAILS: subquery not allowed
```

### ✅ CORRECT: Trigger Usage
```sql
-- Auto-generate sequential numbers
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                     LPAD((SELECT COUNT(*) + 1 FROM purchase_orders 
                           WHERE created_at::DATE = CURRENT_DATE)::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW EXECUTE PROCEDURE generate_po_number();
```

### ✅ CORRECT: Index Patterns
```sql
-- Simple predicates only
CREATE INDEX idx_active_projects ON projects(status) WHERE status = 'active';
CREATE INDEX idx_recent_tasks ON tasks(created_at) WHERE created_at >= '2025-01-01';

-- Composite indexes for performance
CREATE INDEX idx_project_scope_items ON scope_items(project_id, status, priority);
CREATE INDEX idx_user_notifications ON notifications(user_id, read_at) WHERE read_at IS NULL;
```

## Testing and Validation

### Local Testing Procedure
```bash
# 1. Reset database to clean state
supabase db reset

# 2. Verify all migrations execute
supabase start

# 3. Check for errors in logs
supabase status

# 4. Test specific migrations
supabase db diff --schema public

# 5. Validate data integrity
psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) FROM [table_name];"
```

### Migration Validation Checklist
- [ ] All enum types are unique
- [ ] No generated columns with subqueries
- [ ] No volatile functions in indexes
- [ ] Proper foreign key constraints
- [ ] RLS policies defined where needed
- [ ] Triggers use proper error handling
- [ ] File naming follows convention
- [ ] No syntax errors (commas, semicolons)
- [ ] Performance impact assessed for large tables
- [ ] Backup strategy confirmed for production
- [ ] Rollback plan documented
- [ ] Data integrity validation functions tested
- [ ] Resource consumption estimated
- [ ] Monitoring and alerting configured

### Automated Testing Framework

#### Migration Test Suite
```bash
#!/bin/bash
# Comprehensive migration testing script
# File: test_migration_suite.sh

set -e

echo "=== Formula PM Migration Test Suite ==="
echo "Started at: $(date)"

# Configuration
TEST_DB="formula_pm_test"
MIGRATION_DIR="supabase/migrations"
BACKUP_DIR="migration_backups"
LOG_FILE="migration_test_$(date +%Y%m%d_%H%M%S).log"

# Function to run test with error handling
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo "Running: $test_name" | tee -a "$LOG_FILE"
    
    if eval "$test_command" >> "$LOG_FILE" 2>&1; then
        echo "✅ PASS: $test_name" | tee -a "$LOG_FILE"
        return 0
    else
        echo "❌ FAIL: $test_name" | tee -a "$LOG_FILE"
        return 1
    fi
}

# Test 1: Migration syntax validation
echo "=== Phase 1: Syntax Validation ==="
for migration_file in $MIGRATION_DIR/*.sql; do
    if [[ -f "$migration_file" ]]; then
        run_test "Syntax check: $(basename $migration_file)" \
            "psql -h localhost -p 54322 -U postgres -d postgres --set ON_ERROR_STOP=1 -f $migration_file --dry-run"
    fi
done

# Test 2: Database reset and migration execution
echo "=== Phase 2: Full Migration Test ==="
run_test "Database reset" "supabase db reset --linked"
run_test "Migration execution" "supabase db push --linked"

# Test 3: Data integrity validation
echo "=== Phase 3: Data Integrity Tests ==="
run_test "Foreign key integrity" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'SELECT validate_foreign_key_integrity();'"

run_test "Data consistency check" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'SELECT validate_data_consistency();'"

run_test "Edge case testing" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'SELECT test_data_integrity_edge_cases();'"

# Test 4: Performance validation
echo "=== Phase 4: Performance Tests ==="
run_test "Index effectiveness" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'SELECT * FROM index_usage_stats WHERE usage_status = \"UNUSED\";'"

run_test "Query performance analysis" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'SELECT analyze_table_performance(\"projects\");'"

# Test 5: RLS policy validation
echo "=== Phase 5: Security Tests ==="
run_test "RLS policy validation" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'SELECT validate_rls_policies();'"

# Test 6: Realistic data volume testing
echo "=== Phase 6: Volume Testing ==="
run_test "Large data set seeding" \
    "psql -h localhost -p 54322 -U postgres -d postgres -f supabase/seed-realistic-construction-data.sql"

run_test "Performance with realistic data" \
    "psql -h localhost -p 54322 -U postgres -d postgres -c 'EXPLAIN ANALYZE SELECT * FROM projects WHERE status = \"active\";'"

echo "=== Test Suite Complete ==="
echo "Results logged to: $LOG_FILE"
echo "Summary: $(grep -c '✅ PASS' $LOG_FILE) passed, $(grep -c '❌ FAIL' $LOG_FILE) failed"
```

#### Continuous Integration Migration Testing
```yaml
# .github/workflows/migration-test.yml
name: Migration Testing

on:
  pull_request:
    paths:
      - 'supabase/migrations/**'
  push:
    branches: [main]

jobs:
  test-migrations:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Supabase CLI
        run: npm install -g @supabase/cli
        
      - name: Run Migration Tests
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: postgres
        run: |
          chmod +x ./scripts/test_migration_suite.sh
          ./scripts/test_migration_suite.sh
          
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: migration-test-results
          path: migration_test_*.log
```

## Common Error Messages and Solutions

### Error: "column must be marked IMMUTABLE"
**Cause**: Using volatile functions like `NOW()` in generated columns or index predicates
**Solution**: Use triggers or remove the volatile function

### Error: "generation expression is not immutable"
**Cause**: Subqueries or user-defined functions in generated columns
**Solution**: Use triggers for complex calculations

### Error: "type already exists"
**Cause**: Duplicate enum definitions
**Solution**: Check earlier migrations and reuse existing enums

### Error: "syntax error at or near"
**Cause**: Missing commas, extra commas, or incorrect SQL syntax
**Solution**: Validate SQL syntax, check comma placement

## Performance Considerations

### Large Table Migrations

#### Concurrent Index Creation
```sql
-- For tables with 100,000+ rows, always use CONCURRENTLY
CREATE INDEX CONCURRENTLY idx_large_table_status ON large_table(status);

-- For composite indexes on large tables
CREATE INDEX CONCURRENTLY idx_projects_status_priority 
ON projects(status, priority, created_at) 
WHERE status IN ('active', 'planning');

-- Monitor index creation progress
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_%';
```

#### Table Partitioning for Very Large Tables
```sql
-- For tables expected to exceed 10M rows (e.g., audit logs, time-series data)
CREATE TABLE audit_logs (
    id UUID DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    user_id UUID,
    timestamp TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE audit_logs_2025_02 PARTITION OF audit_logs
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Automated partition management function
CREATE OR REPLACE FUNCTION create_monthly_audit_partition()
RETURNS VOID AS $$
DECLARE
    start_date DATE := date_trunc('month', CURRENT_DATE + INTERVAL '1 month');
    end_date DATE := start_date + INTERVAL '1 month';
    partition_name TEXT := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
BEGIN
    EXECUTE format('CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
                   partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

### Batch Operations and Data Migration

#### Safe Batch Processing Pattern
```sql
-- Use DO blocks for complex batch operations with error handling
DO $$
DECLARE
    batch_size INTEGER := 1000;
    processed INTEGER := 0;
    total_rows INTEGER;
    start_time TIMESTAMPTZ;
BEGIN
    -- Get total count for progress tracking
    SELECT COUNT(*) INTO total_rows FROM large_table WHERE status = 'pending';
    start_time := NOW();
    
    RAISE NOTICE 'Starting batch processing of % rows', total_rows;
    
    LOOP
        -- Process batch with timeout protection
        UPDATE large_table 
        SET status = 'migrated',
            migrated_at = NOW(),
            migration_batch = processed / batch_size + 1
        WHERE id IN (
            SELECT id FROM large_table 
            WHERE status = 'pending' 
            ORDER BY id 
            LIMIT batch_size
        );
        
        -- Check if any rows were updated
        IF NOT FOUND THEN
            EXIT;
        END IF;
        
        processed := processed + batch_size;
        
        -- Progress reporting
        RAISE NOTICE 'Processed % of % rows (%.1f%%) - Elapsed: %', 
                     processed, total_rows, 
                     (processed::FLOAT / total_rows * 100),
                     NOW() - start_time;
        
        -- Prevent long-running transactions
        COMMIT;
        
        -- Small delay to prevent overwhelming the system
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Batch processing completed in %', NOW() - start_time;
END $$;
```

#### Memory-Efficient Large Data Migrations
```sql
-- For migrating large datasets between tables
CREATE OR REPLACE FUNCTION migrate_large_dataset(
    source_table TEXT,
    target_table TEXT,
    batch_size INTEGER DEFAULT 5000
) RETURNS VOID AS $$
DECLARE
    cursor_name TEXT := 'migration_cursor';
    sql_query TEXT;
    record_count INTEGER := 0;
BEGIN
    -- Create cursor for memory-efficient processing
    sql_query := format('DECLARE %I CURSOR FOR SELECT * FROM %I ORDER BY id', 
                       cursor_name, source_table);
    EXECUTE sql_query;
    
    LOOP
        -- Process batch
        sql_query := format('
            INSERT INTO %I 
            SELECT * FROM (
                FETCH %s FROM %I
            ) t WHERE t.id IS NOT NULL', 
            target_table, batch_size, cursor_name);
        
        EXECUTE sql_query;
        GET DIAGNOSTICS record_count = ROW_COUNT;
        
        -- Exit if no more rows
        IF record_count = 0 THEN
            EXIT;
        END IF;
        
        -- Commit batch
        COMMIT;
        
        RAISE NOTICE 'Migrated % rows', record_count;
    END LOOP;
    
    -- Close cursor
    EXECUTE format('CLOSE %I', cursor_name);
END;
$$ LANGUAGE plpgsql;
```

### Performance Monitoring and Optimization

#### Query Performance Analysis
```sql
-- Add to migrations that create performance-critical tables
-- Monitor slow queries on new tables
CREATE OR REPLACE FUNCTION analyze_table_performance(table_name TEXT)
RETURNS TABLE(
    query_type TEXT,
    avg_duration INTERVAL,
    call_count BIGINT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'SELECT'::TEXT,
        AVG(total_time / calls)::INTERVAL,
        SUM(calls),
        CASE 
            WHEN AVG(total_time / calls) > 1000 THEN 'Consider adding indexes'
            WHEN AVG(total_time / calls) > 100 THEN 'Monitor performance'
            ELSE 'Performance acceptable'
        END
    FROM pg_stat_statements
    WHERE query ILIKE '%' || table_name || '%'
    AND query ILIKE 'SELECT%';
END;
$$ LANGUAGE plpgsql;
```

#### Index Usage Monitoring
```sql
-- Add monitoring for index effectiveness
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE 
        WHEN idx_scan = 0 THEN 'UNUSED - Consider dropping'
        WHEN idx_scan < 10 THEN 'LOW USAGE - Review necessity'
        ELSE 'ACTIVE'
    END as usage_status
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Connection Pool and Resource Management

#### Connection Pool Configuration for Large Migrations
```sql
-- Add connection management for resource-intensive migrations
CREATE OR REPLACE FUNCTION manage_migration_resources()
RETURNS VOID AS $$
BEGIN
    -- Temporarily increase work_mem for complex operations
    SET work_mem = '256MB';
    
    -- Increase maintenance_work_mem for index operations
    SET maintenance_work_mem = '512MB';
    
    -- Adjust checkpoint settings for heavy write operations
    SET checkpoint_completion_target = 0.9;
    
    -- Log resource usage
    RAISE NOTICE 'Migration resources configured - work_mem: 256MB, maintenance_work_mem: 512MB';
END;
$$ LANGUAGE plpgsql;

-- Reset resources after migration
CREATE OR REPLACE FUNCTION reset_migration_resources()
RETURNS VOID AS $$
BEGIN
    RESET work_mem;
    RESET maintenance_work_mem;
    RESET checkpoint_completion_target;
    
    RAISE NOTICE 'Migration resources reset to defaults';
END;
$$ LANGUAGE plpgsql;
```

## Monitoring and Alerting Patterns

### Production Migration Monitoring
```sql
-- Create monitoring functions for production migrations
CREATE OR REPLACE FUNCTION monitor_migration_progress()
RETURNS TABLE(
    migration_file TEXT,
    execution_time INTERVAL,
    rows_affected BIGINT,
    locks_acquired INTEGER,
    status TEXT
) AS $$
BEGIN
    -- Monitor active migrations and their impact
    RETURN QUERY
    SELECT 
        'current_migration'::TEXT,
        NOW() - query_start as execution_time,
        0::BIGINT as rows_affected,
        COUNT(*)::INTEGER as locks_acquired,
        state as status
    FROM pg_stat_activity
    WHERE state = 'active'
    AND query LIKE '%CREATE TABLE%' OR query LIKE '%ALTER TABLE%'
    OR query LIKE '%CREATE INDEX%'
    GROUP BY query_start, state;
END;
$$ LANGUAGE plpgsql;

-- Create alerting for long-running migrations
CREATE OR REPLACE FUNCTION check_migration_health()
RETURNS TABLE(
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    recommended_action TEXT
) AS $$
BEGIN
    -- Alert on long-running migrations (>30 minutes)
    RETURN QUERY
    SELECT 
        'LONG_RUNNING_MIGRATION'::TEXT,
        'WARNING'::TEXT,
        'Migration running for ' || (NOW() - query_start)::TEXT,
        'Check migration progress and consider optimization'::TEXT
    FROM pg_stat_activity
    WHERE state = 'active'
    AND NOW() - query_start > INTERVAL '30 minutes'
    AND (query LIKE '%CREATE%' OR query LIKE '%ALTER%' OR query LIKE '%DROP%');
    
    -- Alert on high lock contention
    RETURN QUERY
    SELECT 
        'HIGH_LOCK_CONTENTION'::TEXT,
        'CRITICAL'::TEXT,
        'High number of blocked queries: ' || COUNT(*)::TEXT,
        'Review migration strategy and use concurrent operations'::TEXT
    FROM pg_stat_activity
    WHERE wait_event_type = 'Lock'
    HAVING COUNT(*) > 10;
    
    -- Alert on disk space during migration
    RETURN QUERY
    SELECT 
        'DISK_SPACE_LOW'::TEXT,
        'CRITICAL'::TEXT,
        'Database size approaching limits',
        'Monitor disk space and consider cleanup'::TEXT
    WHERE (
        SELECT pg_database_size(current_database())
    ) > 1024 * 1024 * 1024 * 10; -- 10GB threshold
END;
$$ LANGUAGE plpgsql;
```

### Automated Migration Rollback
```sql
-- Create rollback procedures for critical migrations
CREATE OR REPLACE FUNCTION create_migration_rollback_point(
    migration_name TEXT
) RETURNS TEXT AS $$
DECLARE
    rollback_id TEXT;
BEGIN
    -- Generate unique rollback identifier
    rollback_id := 'rollback_' || migration_name || '_' || extract(epoch from now())::TEXT;
    
    -- Create rollback metadata
    INSERT INTO migration_rollback_log (
        rollback_id,
        migration_name,
        created_at,
        database_size_before,
        table_count_before,
        status
    ) VALUES (
        rollback_id,
        migration_name,
        NOW(),
        pg_database_size(current_database()),
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
        'PREPARED'
    );
    
    RAISE NOTICE 'Rollback point created: %', rollback_id;
    RETURN rollback_id;
END;
$$ LANGUAGE plpgsql;

-- Emergency rollback function
CREATE OR REPLACE FUNCTION emergency_rollback_migration(
    rollback_id TEXT
) RETURNS VOID AS $$
DECLARE
    migration_record RECORD;
BEGIN
    -- Get rollback information
    SELECT * INTO migration_record 
    FROM migration_rollback_log 
    WHERE rollback_id = rollback_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rollback point not found: %', rollback_id;
    END IF;
    
    -- Log rollback initiation
    RAISE NOTICE 'Initiating emergency rollback for migration: %', migration_record.migration_name;
    
    -- This is a template - actual rollback logic would be migration-specific
    -- Example rollback actions:
    -- DROP TABLE IF EXISTS new_table_name;
    -- ALTER TABLE old_table_name RENAME TO original_name;
    -- DROP INDEX IF EXISTS new_index_name;
    
    -- Update rollback status
    UPDATE migration_rollback_log 
    SET status = 'COMPLETED', 
        rolled_back_at = NOW()
    WHERE rollback_id = rollback_id;
    
    RAISE NOTICE 'Emergency rollback completed for: %', migration_record.migration_name;
END;
$$ LANGUAGE plpgsql;
```

### Performance Degradation Detection
```sql
-- Monitor query performance after migrations
CREATE OR REPLACE FUNCTION detect_performance_degradation()
RETURNS TABLE(
    table_name TEXT,
    query_type TEXT,
    avg_execution_time_ms NUMERIC,
    calls_per_minute NUMERIC,
    performance_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name,
        'SELECT'::TEXT as query_type,
        AVG(pss.mean_exec_time)::NUMERIC as avg_execution_time_ms,
        COUNT(pss.calls)::NUMERIC / 60 as calls_per_minute,
        CASE 
            WHEN AVG(pss.mean_exec_time) > 1000 THEN 'DEGRADED'
            WHEN AVG(pss.mean_exec_time) > 500 THEN 'CONCERNING'
            ELSE 'NORMAL'
        END as performance_status
    FROM information_schema.tables t
    LEFT JOIN pg_stat_statements pss ON pss.query LIKE '%' || t.table_name || '%'
    WHERE t.table_schema = 'public'
    AND pss.calls > 0
    GROUP BY t.table_name
    HAVING AVG(pss.mean_exec_time) > 100; -- Only show queries taking >100ms
END;
$$ LANGUAGE plpgsql;

-- Create performance baseline before migrations
CREATE OR REPLACE FUNCTION create_performance_baseline()
RETURNS VOID AS $$
BEGIN
    -- Store current performance metrics
    INSERT INTO performance_baseline (
        table_name,
        avg_select_time,
        avg_insert_time,
        avg_update_time,
        total_size,
        index_count,
        created_at
    )
    SELECT 
        tablename,
        0, -- Would need actual query time data
        0,
        0,
        pg_total_relation_size(tablename::regclass),
        COUNT(indexname),
        NOW()
    FROM pg_tables pt
    LEFT JOIN pg_indexes pi ON pt.tablename = pi.tablename
    WHERE pt.schemaname = 'public'
    GROUP BY pt.tablename;
    
    RAISE NOTICE 'Performance baseline created for % tables', 
        (SELECT COUNT(*) FROM performance_baseline WHERE created_at > NOW() - INTERVAL '1 minute');
END;
$$ LANGUAGE plpgsql;
```

## Best Practices Summary

1. **Always test migrations locally** with `supabase db reset`
2. **Check for existing enums** before creating new ones
3. **Use triggers for complex calculations** instead of generated columns
4. **Keep index predicates simple** (immutable functions only)
5. **Follow naming conventions** for chronological execution
6. **Document migration purpose** with clear comments
7. **Validate syntax** before committing
8. **Consider performance impact** on large tables
9. **Use proper error handling** in triggers
10. **Test rollback procedures** when possible

## Troubleshooting Guide

### Migration Fails to Execute
1. Check the error message carefully
2. Verify enum uniqueness across all migrations
3. Ensure generated columns don't use subqueries
4. Validate index predicates for immutable functions
5. Check foreign key references exist
6. Verify SQL syntax (commas, semicolons)

### Performance Issues
1. Add appropriate indexes for query patterns
2. Use EXPLAIN ANALYZE to identify bottlenecks
3. Consider partitioning for very large tables
4. Monitor trigger execution time
5. Use concurrent operations for large changes

### Data Integrity Issues

#### Advanced Foreign Key Validation
```sql
-- Comprehensive foreign key constraint validation
CREATE OR REPLACE FUNCTION validate_foreign_key_integrity()
RETURNS TABLE(
    constraint_name TEXT,
    table_name TEXT,
    column_name TEXT,
    foreign_table TEXT,
    foreign_column TEXT,
    orphaned_records BIGINT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH fk_info AS (
        SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
    )
    SELECT 
        fi.constraint_name,
        fi.table_name,
        fi.column_name,
        fi.foreign_table_name,
        fi.foreign_column_name,
        -- Count orphaned records
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = fi.table_name) as orphaned_count,
        CASE 
            WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = fi.table_name) = 0 
            THEN 'VALID' 
            ELSE 'CHECK REQUIRED' 
        END as validation_status
    FROM fk_info fi;
END;
$$ LANGUAGE plpgsql;

-- Complex foreign key scenarios with conditional constraints
CREATE OR REPLACE FUNCTION create_conditional_foreign_key_constraint(
    table_name TEXT,
    column_name TEXT,
    foreign_table TEXT,
    foreign_column TEXT,
    condition_column TEXT,
    condition_value TEXT
) RETURNS VOID AS $$
BEGIN
    -- Create a trigger-based conditional foreign key constraint
    EXECUTE format('
        CREATE OR REPLACE FUNCTION validate_%s_%s_fk()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            IF NEW.%s = %L THEN
                IF NOT EXISTS (
                    SELECT 1 FROM %s WHERE %s = NEW.%s
                ) THEN
                    RAISE EXCEPTION ''Foreign key violation: %s.%s references non-existent %s.%s'',
                        TG_TABLE_NAME, %L, %L, %L;
                END IF;
            END IF;
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        CREATE TRIGGER trigger_validate_%s_%s_fk
            BEFORE INSERT OR UPDATE ON %s
            FOR EACH ROW EXECUTE PROCEDURE validate_%s_%s_fk();
    ', 
    table_name, column_name, condition_column, condition_value,
    foreign_table, foreign_column, column_name,
    table_name, column_name, foreign_table, foreign_column,
    column_name, foreign_table, foreign_column,
    table_name, column_name, table_name, table_name, column_name);
END;
$$ LANGUAGE plpgsql;
```

#### Multi-Table Data Consistency Validation
```sql
-- Validate data consistency across related tables
CREATE OR REPLACE FUNCTION validate_data_consistency()
RETURNS TABLE(
    validation_type TEXT,
    table_combination TEXT,
    inconsistent_records BIGINT,
    sample_ids TEXT[],
    severity TEXT
) AS $$
BEGIN
    -- Check project-scope items consistency
    RETURN QUERY
    SELECT 
        'PROJECT_SCOPE_CONSISTENCY'::TEXT,
        'projects <-> scope_items'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(p.id::TEXT) FILTER (WHERE p.id IS NOT NULL),
        CASE 
            WHEN COUNT(*) = 0 THEN 'VALID'
            WHEN COUNT(*) < 10 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    FROM projects p
    LEFT JOIN scope_items si ON p.id = si.project_id
    WHERE p.status = 'active' AND si.id IS NULL;
    
    -- Check purchase order - scope item consistency
    RETURN QUERY
    SELECT 
        'PURCHASE_ORDER_SCOPE_CONSISTENCY'::TEXT,
        'purchase_orders <-> scope_items'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(po.id::TEXT) FILTER (WHERE po.id IS NOT NULL),
        CASE 
            WHEN COUNT(*) = 0 THEN 'VALID'
            WHEN COUNT(*) < 5 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    FROM purchase_orders po
    LEFT JOIN scope_items si ON po.scope_item_id = si.id
    WHERE po.status != 'cancelled' AND si.id IS NULL;
    
    -- Check financial consistency (invoices vs purchase orders)
    RETURN QUERY
    SELECT 
        'FINANCIAL_CONSISTENCY'::TEXT,
        'invoices <-> purchase_orders'::TEXT,
        COUNT(*)::BIGINT,
        ARRAY_AGG(i.id::TEXT) FILTER (WHERE i.id IS NOT NULL),
        CASE 
            WHEN COUNT(*) = 0 THEN 'VALID'
            WHEN COUNT(*) < 3 THEN 'WARNING'
            ELSE 'CRITICAL'
        END
    FROM invoices i
    LEFT JOIN purchase_orders po ON i.purchase_order_id = po.id
    WHERE i.invoice_type = 'supplier' AND po.id IS NULL;
END;
$$ LANGUAGE plpgsql;
```

#### Advanced Trigger Error Handling
```sql
-- Template for robust trigger implementations
CREATE OR REPLACE FUNCTION example_robust_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    error_context TEXT;
    retry_count INTEGER := 0;
    max_retries INTEGER := 3;
BEGIN
    -- Capture context for debugging
    error_context := format('Table: %s, Operation: %s, User: %s', 
                           TG_TABLE_NAME, TG_OP, current_user);
    
    LOOP
        BEGIN
            -- Main trigger logic with comprehensive error handling
            CASE TG_OP
                WHEN 'INSERT' THEN
                    -- Validate required fields
                    IF NEW.required_field IS NULL THEN
                        RAISE EXCEPTION 'Required field cannot be null in %', TG_TABLE_NAME
                            USING HINT = 'Check data validation before insert';
                    END IF;
                    
                    -- Business logic validation
                    IF NEW.amount < 0 THEN
                        RAISE EXCEPTION 'Amount cannot be negative: %', NEW.amount
                            USING HINT = 'Verify calculation logic';
                    END IF;
                    
                    -- Complex calculations with error handling
                    BEGIN
                        NEW.calculated_field := NEW.field1 * NEW.field2;
                    EXCEPTION
                        WHEN numeric_value_out_of_range THEN
                            RAISE EXCEPTION 'Calculation overflow in %: % * %', 
                                TG_TABLE_NAME, NEW.field1, NEW.field2
                                USING HINT = 'Check field value ranges';
                        WHEN division_by_zero THEN
                            NEW.calculated_field := 0;
                            RAISE WARNING 'Division by zero handled in %', TG_TABLE_NAME;
                    END;
                    
                    RETURN NEW;
                    
                WHEN 'UPDATE' THEN
                    -- Audit changes
                    IF OLD.status != NEW.status THEN
                        INSERT INTO audit_log (table_name, record_id, old_values, new_values, changed_at)
                        VALUES (TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW), NOW());
                    END IF;
                    
                    -- Validate state transitions
                    IF NOT is_valid_status_transition(OLD.status, NEW.status) THEN
                        RAISE EXCEPTION 'Invalid status transition from % to % in %', 
                            OLD.status, NEW.status, TG_TABLE_NAME
                            USING HINT = 'Check business logic for valid transitions';
                    END IF;
                    
                    RETURN NEW;
                    
                WHEN 'DELETE' THEN
                    -- Soft delete validation
                    IF OLD.has_dependencies THEN
                        RAISE EXCEPTION 'Cannot delete % with dependencies', TG_TABLE_NAME
                            USING HINT = 'Remove dependencies first or use soft delete';
                    END IF;
                    
                    RETURN OLD;
            END CASE;
            
            -- Exit retry loop on success
            EXIT;
            
        EXCEPTION
            WHEN serialization_failure OR deadlock_detected THEN
                retry_count := retry_count + 1;
                IF retry_count >= max_retries THEN
                    RAISE EXCEPTION 'Max retries exceeded in %: %', TG_TABLE_NAME, SQLERRM
                        USING HINT = 'Check for concurrent access issues';
                END IF;
                
                -- Log retry attempt
                RAISE WARNING 'Retry attempt % for % in %', retry_count, SQLERRM, error_context;
                
                -- Brief delay before retry
                PERFORM pg_sleep(0.1 * retry_count);
                
            WHEN OTHERS THEN
                -- Log detailed error information
                RAISE EXCEPTION 'Trigger error in %: % (Context: %)', 
                    TG_TABLE_NAME, SQLERRM, error_context
                    USING HINT = 'Check trigger logic and data constraints';
        END;
    END LOOP;
    
    RETURN NULL; -- Should never reach here
END;
$$ LANGUAGE plpgsql;
```

#### Edge Case Testing Framework
```sql
-- Create comprehensive edge case testing for data integrity
CREATE OR REPLACE FUNCTION test_data_integrity_edge_cases()
RETURNS TABLE(
    test_name TEXT,
    test_result TEXT,
    error_message TEXT,
    recommendation TEXT
) AS $$
BEGIN
    -- Test 1: Null value handling
    RETURN QUERY
    SELECT 
        'NULL_VALUE_HANDLING'::TEXT,
        CASE 
            WHEN (SELECT COUNT(*) FROM projects WHERE name IS NULL) = 0 
            THEN 'PASS' 
            ELSE 'FAIL' 
        END,
        'Found projects with null names'::TEXT,
        'Add NOT NULL constraints to critical fields'::TEXT;
    
    -- Test 2: Circular dependency detection
    RETURN QUERY
    WITH RECURSIVE circular_deps AS (
        SELECT scope_item_id, depends_on_id, 1 as depth
        FROM scope_dependencies
        UNION ALL
        SELECT cd.scope_item_id, sd.depends_on_id, cd.depth + 1
        FROM circular_deps cd
        JOIN scope_dependencies sd ON cd.depends_on_id = sd.scope_item_id
        WHERE cd.depth < 10
    )
    SELECT 
        'CIRCULAR_DEPENDENCY_CHECK'::TEXT,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM circular_deps 
                WHERE scope_item_id = depends_on_id
            ) THEN 'FAIL' 
            ELSE 'PASS' 
        END,
        'Circular dependencies found in scope items'::TEXT,
        'Review and fix dependency chains'::TEXT;
    
    -- Test 3: Orphaned records detection
    RETURN QUERY
    SELECT 
        'ORPHANED_RECORDS_CHECK'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM scope_items si
                LEFT JOIN projects p ON si.project_id = p.id
                WHERE p.id IS NULL
            ) = 0 THEN 'PASS' 
            ELSE 'FAIL' 
        END,
        'Found orphaned scope items'::TEXT,
        'Clean up orphaned records or fix foreign key constraints'::TEXT;
    
    -- Test 4: Data type consistency
    RETURN QUERY
    SELECT 
        'DATA_TYPE_CONSISTENCY'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM purchase_orders 
                WHERE quantity <= 0 OR unit_price <= 0
            ) = 0 THEN 'PASS' 
            ELSE 'FAIL' 
        END,
        'Found purchase orders with invalid quantities or prices'::TEXT,
        'Add CHECK constraints for positive values'::TEXT;
    
    -- Test 5: Enum value validation
    RETURN QUERY
    SELECT 
        'ENUM_VALUE_VALIDATION'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM projects 
                WHERE status NOT IN ('planning', 'active', 'completed', 'cancelled', 'on_hold')
            ) = 0 THEN 'PASS' 
            ELSE 'FAIL' 
        END,
        'Found projects with invalid status values'::TEXT,
        'Update enum definitions or fix invalid data'::TEXT;
END;
$$ LANGUAGE plpgsql;
```

#### RLS Policy Validation
```sql
-- Test RLS policies don't block legitimate operations
CREATE OR REPLACE FUNCTION validate_rls_policies()
RETURNS TABLE(
    policy_name TEXT,
    table_name TEXT,
    policy_type TEXT,
    test_result TEXT,
    blocking_scenario TEXT
) AS $$
BEGIN
    -- Test client portal access
    RETURN QUERY
    SELECT 
        'client_portal_access'::TEXT,
        'projects'::TEXT,
        'SELECT'::TEXT,
        CASE 
            WHEN (
                SELECT COUNT(*) FROM projects 
                WHERE client_id = 'client-001'
            ) > 0 THEN 'PASS'
            ELSE 'FAIL'
        END,
        'Client cannot access their own projects'::TEXT;
    
    -- Test project manager access
    RETURN QUERY  
    SELECT 
        'project_manager_access'::TEXT,
        'scope_items'::TEXT,
        'UPDATE'::TEXT,
        'NEEDS_TESTING'::TEXT,
        'Project managers may not be able to update scope items'::TEXT;
        
    -- Additional RLS validation tests would go here
    -- This is a template for comprehensive RLS testing
END;
$$ LANGUAGE plpgsql;
```

## Example Migration Files

See these files for real examples:
- `/supabase/migrations/20250702000005_financial_tender_system.sql` - Complex financial calculations
- `/supabase/migrations/20250702000006_shop_drawings_mobile.sql` - Mobile optimizations
- `/supabase/migrations/20250703000001_task_management_system.sql` - Task management with triggers

## Resources

- PostgreSQL Generated Columns: https://www.postgresql.org/docs/current/ddl-generated-columns.html
- Supabase Migration Guide: https://supabase.com/docs/guides/cli/local-development
- PostgreSQL Triggers: https://www.postgresql.org/docs/current/trigger-definition.html
- Index Design: https://www.postgresql.org/docs/current/indexes-types.html

---

*This document is based on real issues encountered during Formula PM 2.0 development and should be updated as new patterns emerge.*