-- ============================================================================
-- SCOPE ITEMS PRICING FIELDS - Add Missing Price and Cost Fields
-- Migration: 20250806000001_add_scope_pricing_fields.sql
-- Purpose: Add total_price, actual_cost fields required by scope overview API
-- ============================================================================

-- Add pricing columns to scope_items table
ALTER TABLE scope_items 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(12,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(12,2) DEFAULT 0.00;

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Index for price-based queries and aggregations
CREATE INDEX IF NOT EXISTS idx_scope_items_pricing 
ON scope_items(project_id, total_price, actual_cost) 
WHERE total_price > 0 OR actual_cost > 0;

-- Index for cost analysis queries
CREATE INDEX IF NOT EXISTS idx_scope_items_cost_analysis 
ON scope_items(status, category, total_price, actual_cost)
WHERE total_price > 0 OR actual_cost > 0;

-- ============================================================================
-- CONSTRAINTS AND VALIDATION
-- ============================================================================

-- Ensure prices are not negative
ALTER TABLE scope_items 
ADD CONSTRAINT IF NOT EXISTS chk_scope_items_total_price_positive 
CHECK (total_price IS NULL OR total_price >= 0);

ALTER TABLE scope_items 
ADD CONSTRAINT IF NOT EXISTS chk_scope_items_actual_cost_positive 
CHECK (actual_cost IS NULL OR actual_cost >= 0);

-- ============================================================================
-- UPDATE EXISTING RLS POLICIES FOR PRICING DATA
-- ============================================================================

-- Update existing RLS policy to ensure pricing data is accessible
DROP POLICY IF EXISTS "scope_items_select_policy" ON scope_items;

CREATE POLICY "scope_items_select_policy" ON scope_items
AS PERMISSIVE FOR SELECT
TO authenticated
USING (
  -- User can see items from their assigned projects
  project_id IN (
    SELECT id FROM projects 
    WHERE created_by = (SELECT auth.uid())
    OR id IN (
      SELECT project_id FROM project_assignments 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  -- OR user has management/admin role
  OR (
    (SELECT auth.jwt()) ->> 'role' IN ('admin', 'management', 'technical_lead')
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  column_count INTEGER;
  index_count INTEGER;
  constraint_count INTEGER;
BEGIN
  -- Check columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'scope_items' 
  AND column_name IN ('total_price', 'actual_cost');
  
  IF column_count = 2 THEN
    RAISE NOTICE '✅ Pricing columns added successfully';
  ELSE
    RAISE EXCEPTION '❌ Column addition failed. Expected 2 columns, found %', column_count;
  END IF;
  
  -- Check indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'scope_items' 
  AND indexname IN ('idx_scope_items_pricing', 'idx_scope_items_cost_analysis');
  
  IF index_count = 2 THEN
    RAISE NOTICE '✅ Pricing indexes created successfully';
  ELSE
    RAISE NOTICE '⚠️  Some indexes may already exist. Found % indexes', index_count;
  END IF;
  
  -- Check constraints  
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.check_constraints
  WHERE constraint_name LIKE 'chk_scope_items_%_positive';
  
  IF constraint_count >= 2 THEN
    RAISE NOTICE '✅ Price validation constraints created successfully';
  END IF;
  
  RAISE NOTICE '🎯 SCOPE PRICING FIELDS MIGRATION COMPLETE';
  RAISE NOTICE '💰 New fields: total_price, actual_cost';
  RAISE NOTICE '🔍 Optimized indexes for price analysis';
  RAISE NOTICE '🛡️  RLS policies updated for pricing data access';
END $$;