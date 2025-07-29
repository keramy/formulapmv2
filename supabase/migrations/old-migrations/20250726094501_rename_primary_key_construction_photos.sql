-- =====================================================
-- Rename Primary Key for construction_report_photos
-- Complete the table rename cleanup
-- =====================================================

-- The primary key still has the old name, rename it for consistency
ALTER INDEX report_line_photos_pkey RENAME TO construction_report_photos_pkey;

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'PRIMARY KEY RENAME COMPLETE';
  RAISE NOTICE '===============================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Renamed report_line_photos_pkey to construction_report_photos_pkey';
  RAISE NOTICE '✅ All duplicate index warnings should now be resolved';
  RAISE NOTICE '✅ Table rename cleanup is complete';
END $$;