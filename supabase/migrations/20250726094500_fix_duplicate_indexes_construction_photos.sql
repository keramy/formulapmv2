-- =====================================================
-- Fix Duplicate Indexes in Construction Report Photos
-- Remove old indexes from table rename, keep new ones
-- =====================================================

-- Drop the old indexes from when the table was called report_line_photos
DROP INDEX IF EXISTS idx_report_line_photos_report_line_id;
DROP INDEX IF EXISTS idx_report_line_photos_uploaded_by;

-- Verify the new indexes exist (they should from the previous migration)
-- These are the ones we want to keep:
-- - idx_construction_report_photos_report_line_id
-- - idx_construction_report_photos_uploaded_by

-- =====================================================
-- Verification
-- =====================================================

DO $$
DECLARE
  index_count INTEGER;
  rec RECORD;
BEGIN
  RAISE NOTICE 'FIXING DUPLICATE INDEXES IN CONSTRUCTION_REPORT_PHOTOS';
  RAISE NOTICE '===============================================================';
  RAISE NOTICE '';
  
  -- Check for remaining indexes on construction_report_photos
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename = 'construction_report_photos' 
  AND schemaname = 'public';
  
  RAISE NOTICE 'CURRENT INDEXES ON construction_report_photos: %', index_count;
  
  -- List all indexes for verification
  FOR rec IN (
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'construction_report_photos' 
    AND schemaname = 'public'
    ORDER BY indexname
  ) LOOP
    RAISE NOTICE '  Index: %', rec.indexname;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'DUPLICATE INDEX CLEANUP: COMPLETE';
  RAISE NOTICE '  - Removed old report_line_photos indexes';
  RAISE NOTICE '  - Kept new construction_report_photos indexes';
  RAISE NOTICE '  - Performance warnings should be resolved';
END $$;