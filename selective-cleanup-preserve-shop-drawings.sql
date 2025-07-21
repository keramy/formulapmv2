-- Selective Cleanup: Remove Only Tables with Role Policies, Keep Shop Drawings
-- Shop drawings are implemented in frontend and don't have role policies

-- First, let's see exactly which tables have role-dependent policies
SELECT 'Tables with role-dependent policies (these will be dropped):' as info;
SELECT DISTINCT tablename
FROM pg_policies 
WHERE qual LIKE '%role%' 
   OR qual LIKE '%auth.jwt%'
   OR qual LIKE '%user_role%'
ORDER BY tablename;

-- Remove only tables that have role-dependent policies blocking the migration
-- Financial Tables (not implemented in frontend)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS project_budgets CASCADE;

-- Tender Tables (not implemented in frontend)  
DROP TABLE IF EXISTS tender_submissions CASCADE;
DROP TABLE IF EXISTS tender_evaluations CASCADE;
DROP TABLE IF EXISTS tender_documents CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;

-- System Tables (can be recreated)
DROP TABLE IF EXISTS permission_templates CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;

-- PRESERVE these tables (they're implemented or don't have role policies):
-- ✅ shop_drawings (IMPLEMENTED in frontend)
-- ✅ shop_drawing_revisions (part of shop drawings)
-- ✅ shop_drawing_comments (part of shop drawings)  
-- ✅ shop_drawing_approvals (part of shop drawings)
-- ✅ user_profiles (core authentication)
-- ✅ projects (core business)
-- ✅ scope_items (core business)
-- ✅ material_specs (core business)
-- ✅ tasks (core business)
-- ✅ milestones (core business)
-- ✅ suppliers (core business)
-- ✅ clients (core business)

-- Verify shop drawings tables are preserved
SELECT 'Shop drawings tables (should be preserved):' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE '%shop%'
ORDER BY tablename;

-- Show all remaining tables
SELECT 'All remaining tables after selective cleanup:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;