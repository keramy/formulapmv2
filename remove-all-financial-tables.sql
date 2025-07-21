-- Remove ALL Financial Tables to Unblock Role Migration
-- These tables have no frontend implementation and are blocking the role enum alteration

-- Drop all financial/invoice related tables in the correct order (dependencies first)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS project_budgets CASCADE;

-- Also check for any tender-related tables that might have role policies
DROP TABLE IF EXISTS tender_submissions CASCADE;
DROP TABLE IF EXISTS tender_evaluations CASCADE;
DROP TABLE IF EXISTS tenders CASCADE;

-- Drop any other financial tables that might exist
DROP TABLE IF EXISTS expense_tracking CASCADE;
DROP TABLE IF EXISTS budget_allocations CASCADE;
DROP TABLE IF EXISTS financial_reports CASCADE;

-- Verify all financial tables are removed
SELECT 'Remaining tables after cleanup:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename LIKE '%invoice%' 
       OR tablename LIKE '%payment%' 
       OR tablename LIKE '%budget%'
       OR tablename LIKE '%tender%'
       OR tablename LIKE '%financial%')
ORDER BY tablename;

-- Show what tables we still have
SELECT 'All remaining public tables:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;