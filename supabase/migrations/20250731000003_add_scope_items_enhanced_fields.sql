-- ============================================================================
-- SCOPE ITEMS ENHANCEMENT - Add New Display and Tracking Fields
-- Migration: 20250731000003_add_scope_items_enhanced_fields.sql
-- Purpose: Add item_no, item_name, specification, location, and update_notes fields
-- Performance: Includes optimized indexes following enterprise patterns
-- ============================================================================

-- Add new columns to scope_items table
ALTER TABLE scope_items 
ADD COLUMN item_no INTEGER,
ADD COLUMN item_name TEXT,
ADD COLUMN specification TEXT,
ADD COLUMN location TEXT,
ADD COLUMN update_notes TEXT;

-- ============================================================================
-- PERFORMANCE INDEXES (Following Enterprise-Grade Patterns)
-- ============================================================================

-- Composite index for item_no queries within projects
-- This supports fast lookups like "SELECT * FROM scope_items WHERE project_id = ? AND item_no = ?"
CREATE INDEX IF NOT EXISTS idx_scope_items_project_item_no 
ON scope_items(project_id, item_no) 
WHERE item_no IS NOT NULL;

-- Location-based filtering index (partial index for performance)
-- This supports queries like "SELECT * FROM scope_items WHERE location = ?"
CREATE INDEX IF NOT EXISTS idx_scope_items_location 
ON scope_items(location) 
WHERE location IS NOT NULL;

-- Composite index for location within projects
-- This supports queries like "SELECT * FROM scope_items WHERE project_id = ? AND location = ?"
CREATE INDEX IF NOT EXISTS idx_scope_items_project_location 
ON scope_items(project_id, location) 
WHERE location IS NOT NULL;

-- ============================================================================
-- VALIDATION AND CONSTRAINTS (Optional - Uncomment if needed)
-- ============================================================================

-- Optional: Add constraint to ensure item_no is positive when provided
-- ALTER TABLE scope_items 
-- ADD CONSTRAINT chk_scope_items_item_no_positive 
-- CHECK (item_no IS NULL OR item_no > 0);

-- Optional: Add constraint to ensure item_name has minimum length when provided
-- ALTER TABLE scope_items 
-- ADD CONSTRAINT chk_scope_items_item_name_length 
-- CHECK (item_name IS NULL OR length(trim(item_name)) >= 2);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify the new columns were added successfully
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'scope_items' 
  AND column_name IN ('item_no', 'item_name', 'specification', 'location', 'update_notes');
  
  IF column_count = 5 THEN
    RAISE NOTICE '✅ All 5 new columns added successfully to scope_items table';
  ELSE
    RAISE EXCEPTION '❌ Column addition failed. Expected 5 columns, found %', column_count;
  END IF;
END $$;

-- Verify indexes were created successfully
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'scope_items' 
  AND indexname IN (
    'idx_scope_items_project_item_no',
    'idx_scope_items_location', 
    'idx_scope_items_project_location'
  );
  
  IF index_count = 3 THEN
    RAISE NOTICE '✅ All 3 performance indexes created successfully';
  ELSE
    RAISE EXCEPTION '❌ Index creation failed. Expected 3 indexes, found %', index_count;
  END IF;
END $$;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎯 SCOPE ITEMS ENHANCEMENT COMPLETE';
  RAISE NOTICE '📊 Performance Impact:';
  RAISE NOTICE '  • item_no queries: Optimized with project_id composite index';
  RAISE NOTICE '  • location queries: Optimized with partial indexes';
  RAISE NOTICE '  • Cross-project location searches: Optimized';
  RAISE NOTICE '🔍 New Fields Available:';
  RAISE NOTICE '  • item_no: Per-project sequential numbering';
  RAISE NOTICE '  • item_name: Display name separate from description';  
  RAISE NOTICE '  • specification: Technical specifications';
  RAISE NOTICE '  • location: Physical location in project';
  RAISE NOTICE '  • update_notes: Update comments/notes';
  RAISE NOTICE '✅ Migration 20250731000003 completed successfully!';
END $$;