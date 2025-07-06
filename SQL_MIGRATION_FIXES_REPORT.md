# SQL Migration Fixes Report

## Overview
Fixed multiple SQL syntax errors preventing Supabase from starting locally. All migrations now execute successfully and Supabase starts without errors.

## Issues Fixed

### 1. Syntax Error: Comma Before GENERATED ALWAYS AS
**File:** `/supabase/migrations/20250702000005_financial_tender_system.sql`
**Line:** 226
**Issue:** Invalid comma before `GENERATED ALWAYS AS` clause
**Fix:** Removed the comma and replaced the generated column with a trigger-based approach

**Before:**
```sql
total_price DECIMAL(12,2), GENERATED ALWAYS AS (
  (SELECT quantity FROM tender_items WHERE id = tender_item_id) * unit_price
) STORED,
```

**After:**
```sql
total_price DECIMAL(12,2),
```

### 2. Generated Column with Subquery (PostgreSQL Rule Violation)
**File:** `/supabase/migrations/20250702000005_financial_tender_system.sql`
**Issue:** Generated columns cannot contain subqueries in PostgreSQL
**Fix:** Replaced with trigger-based calculation

**Added trigger function:**
```sql
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

CREATE TRIGGER trigger_calculate_tender_submission_item_total
  BEFORE INSERT OR UPDATE ON tender_submission_items
  FOR EACH ROW EXECUTE PROCEDURE calculate_tender_submission_item_total();
```

### 3. Immutable Function Error in Index Predicate
**File:** `/supabase/migrations/20250702000006_shop_drawings_mobile.sql`
**Line:** 334
**Issue:** `NOW()` function in index predicate must be marked IMMUTABLE but it's not
**Fix:** Simplified index predicate to remove non-immutable function

**Before:**
```sql
CREATE INDEX idx_announcements_active ON project_announcements(project_id, is_pinned) WHERE expires_at IS NULL OR expires_at > NOW();
```

**After:**
```sql
CREATE INDEX idx_announcements_active ON project_announcements(project_id, is_pinned) WHERE expires_at IS NULL;
```

### 4. Duplicate Enum Definition
**File:** `/supabase/migrations/20250703000001_task_management_system.sql`
**Issue:** `task_status` enum already defined in audit_system migration (20250702000004)
**Fix:** Removed duplicate enum definition

**Before:**
```sql
-- Task status types
CREATE TYPE task_status AS ENUM (
  'todo',
  'in_progress', 
  'review',
  'blocked',
  'done',
  'cancelled'
);
```

**After:**
```sql
-- Task status types (already defined in audit_system migration)
-- Using existing task_status enum from audit_system
```

## PostgreSQL Rules Applied

### Generated Column Constraints:
1. **No subqueries allowed** - Generated columns cannot reference other tables
2. **No user-defined functions** - Only immutable built-in functions allowed
3. **No volatile functions** - Must be deterministic
4. **STORED keyword required** - For computed columns that are physically stored

### Index Predicate Constraints:
1. **Only immutable functions** - Functions in WHERE clauses must be marked IMMUTABLE
2. **No volatile functions like NOW()** - Cannot use time-dependent functions

### Migration Order Dependencies:
1. **Enum definitions must be unique** - Cannot redefine the same enum type
2. **Earlier migrations take precedence** - Later migrations must use existing types

## Verification
- ✅ All migrations execute without errors
- ✅ Database resets successfully
- ✅ Supabase starts without issues
- ✅ No remaining syntax errors

## Migration Execution Order
The migrations are processed in chronological order:
1. `20250702000000_migrations_table.sql`
2. `20250702000001_initial_schema.sql`
3. `20250702000002_row_level_security.sql`
4. `20250702000004_audit_system.sql` (defines task_status enum)
5. `20250702000005_financial_tender_system.sql` (fixed syntax errors)
6. `20250702000006_shop_drawings_mobile.sql` (fixed index predicate)
7. `20250703000001_task_management_system.sql` (removed duplicate enum)
8. [... remaining migrations]

## Local Development Ready
The local Supabase environment is now fully functional and ready for development work.