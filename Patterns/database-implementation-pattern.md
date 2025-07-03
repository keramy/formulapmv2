# Formula PM Database Implementation Pattern

## Overview
This pattern documents the complete database architecture implementation for Formula PM 2.0, serving as the foundation for all application features.

## Implementation Status
**Status**: ✅ COMPLETE
**Date**: 2025-07-02
**Migration Files**: 7 files (including sample data)

## Database Architecture

### Schema Organization
```
/supabase/migrations/
├── 20250702000000_migrations_table.sql      # Migration tracking
├── 20250702000001_initial_schema.sql        # Core tables
├── 20250702000002_row_level_security.sql    # RLS policies
├── 20250702000003_sample_data.sql           # Test data (dev only)
├── 20250702000004_audit_system.sql          # Audit & notifications
├── 20250702000005_financial_tender_system.sql # Financial management
└── 20250702000006_shop_drawings_mobile.sql  # Drawings & mobile
```

### Core Design Principles

#### 1. User Role Hierarchy
```sql
-- 13 distinct user roles with hierarchical permissions
CREATE TYPE user_role AS ENUM (
  'company_owner',        -- Ultimate authority
  'general_manager',      -- Executive operations
  'deputy_general_manager', -- Delegated authority
  'technical_director',   -- Technical oversight
  'admin',               -- System administration
  'project_manager',      -- Project authority
  'architect',           -- Design authority
  'technical_engineer',   -- Technical specialist
  'purchase_director',    -- Procurement head
  'purchase_specialist',  -- Procurement ops
  'field_worker',        -- Site execution
  'client',              -- External stakeholder
  'subcontractor'        -- External worker
);
```

#### 2. Row Level Security Pattern
```sql
-- Helper function pattern for role checking
CREATE OR REPLACE FUNCTION is_management_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 
                 'deputy_general_manager', 'technical_director', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy pattern
CREATE POLICY "Management full access" ON table_name
  FOR ALL USING (is_management_role());
```

#### 3. Cost Data Protection Pattern
```sql
-- Separate function for cost tracking access
CREATE OR REPLACE FUNCTION has_cost_tracking_access()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 
                 'technical_director', 'admin', 'technical_engineer', 
                 'purchase_director', 'purchase_specialist')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Table Design Patterns

#### 1. Audit Trail Pattern
```sql
-- Every significant table gets audit logging
CREATE TABLE entity_name (
  -- ... entity fields ...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update trigger
CREATE TRIGGER update_entity_updated_at 
  BEFORE UPDATE ON entity_name 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

#### 2. Auto-Numbering Pattern
```sql
-- Function to generate sequential numbers
CREATE OR REPLACE FUNCTION generate_entity_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.entity_number IS NULL THEN
    NEW.entity_number := 'PREFIX-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                        LPAD((SELECT COUNT(*) + 1 FROM entity_table 
                              WHERE created_at >= DATE_TRUNC('month', NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 3. Computed Fields Pattern
```sql
-- Use generated columns for calculations
CREATE TABLE scope_items (
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  markup_percentage DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(12,2) GENERATED ALWAYS AS (total_price * (1 + markup_percentage/100)) STORED
);
```

### Performance Optimization Patterns

#### 1. Index Strategy
```sql
-- Primary access patterns
CREATE INDEX idx_table_status ON table(status);
CREATE INDEX idx_table_user ON table(user_id);
CREATE INDEX idx_table_dates ON table(start_date, end_date);

-- Composite indexes for common queries
CREATE INDEX idx_table_project_status ON table(project_id, status);

-- Partial indexes for filtered queries
CREATE INDEX idx_table_active ON table(is_active) WHERE is_active = true;

-- GIN indexes for array/JSONB columns
CREATE INDEX idx_table_tags ON table USING gin(tags);
```

#### 2. View Pattern for Complex Queries
```sql
-- Materialized view for expensive aggregations
CREATE OR REPLACE VIEW project_financial_summary AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  COALESCE(SUM(pb.allocated_amount), 0) as allocated_budget,
  COALESCE(SUM(pb.spent_amount), 0) as total_spent
FROM projects p
LEFT JOIN project_budgets pb ON pb.project_id = p.id
GROUP BY p.id, p.name;
```

### Mobile Optimization Patterns

#### 1. Offline Queue Pattern
```sql
-- Queue for syncing offline actions
CREATE TABLE mobile_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT REFERENCES mobile_devices(device_id),
  action_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  sync_status sync_status DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0
);
```

#### 2. Geotagging Pattern
```sql
-- Store location data with photos/reports
CREATE TABLE field_photos (
  -- ... other fields ...
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_accuracy DECIMAL(6,2)
);
```

### Security Patterns

#### 1. Document Visibility Pattern
```sql
-- Control document access based on status and role
CREATE POLICY "Client document access" ON documents
  FOR SELECT USING (
    is_client_visible = true AND 
    is_client_with_project_access(project_id)
  );
```

#### 2. Financial Data Protection
```sql
-- Restrict financial fields at application layer
-- RLS provides base access, application filters sensitive columns
CREATE POLICY "Field worker scope access" ON scope_items
  FOR SELECT USING (
    has_project_access(project_id)
  );
-- Application layer removes: unit_price, total_price, initial_cost, actual_cost
```

## Usage in Application

### TypeScript Integration
```typescript
// Database types are generated from schema
import { Database } from '@/types/supabase'

type Project = Database['public']['Tables']['projects']['Row']
type ScopeItem = Database['public']['Tables']['scope_items']['Row']
```

### Supabase Client Pattern
```typescript
// Initialize with proper types
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabase = createClient<Database>(url, key)

// Type-safe queries
const { data, error } = await supabase
  .from('projects')
  .select('*, scope_items(*)')
  .eq('status', 'active')
```

## Migration Management

### Development Workflow
1. Create migration file with timestamp prefix
2. Test locally with `npx supabase db reset`
3. Apply to staging with `npx supabase db push`
4. Deploy to production after validation

### Rollback Strategy
- Each migration should include rollback commands
- Test rollbacks in development before production
- Maintain migration log in migrations table

## Monitoring & Maintenance

### Performance Monitoring
- Monitor slow queries via pg_stat_statements
- Review index usage with pg_stat_user_indexes
- Analyze table bloat periodically

### Backup Strategy
- Daily automated backups via Supabase
- Point-in-time recovery enabled
- Test restore procedures quarterly

## Future Considerations

### Scalability
- Partition large tables by date (audit_logs, activity_summary)
- Archive old data to cold storage
- Consider read replicas for reporting

### Extensions
- PostGIS for advanced location features
- pg_cron for scheduled maintenance
- Full-text search for document content