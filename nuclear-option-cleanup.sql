-- NUCLEAR OPTION: Remove ALL tables with role-dependent policies
-- This removes all unused business logic tables to complete the role migration

-- First, let's see what we're dealing with
SELECT 'Tables with role-dependent policies:' as info;
SELECT DISTINCT tablename
FROM pg_policies 
WHERE qual LIKE '%role%' 
   OR qual LIKE '%auth.jwt%'
   OR qual LIKE '%user_role%'
ORDER BY tablename;

-- Drop ALL tables that have role-dependent policies (except core ones we need)
-- Financial/Business Logic Tables (not implemented in frontend)
DROP TABLE IF EXISTS tender_submissions CASCADE;
DROP TABLE IF EXISTS tender_evaluations CASCADE; 
DROP TABLE IF EXISTS tender_documents CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS project_budgets CASCADE;
DROP TABLE IF EXISTS expense_tracking CASCADE;
DROP TABLE IF EXISTS financial_reports CASCADE;

-- System/Permission Tables (may not be actively used)
DROP TABLE IF EXISTS permission_templates CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Activity/Audit Tables (can be recreated)
DROP TABLE IF EXISTS activity_logs CASCADE;

-- Keep only essential tables:
-- - user_profiles (core authentication)
-- - projects (core business)
-- - scope_items (core business) 
-- - material_specs (core business)
-- - tasks (core business)
-- - milestones (core business)
-- - suppliers (core business)
-- - clients (core business)

-- Verify what's left
SELECT 'Remaining tables after cleanup:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;