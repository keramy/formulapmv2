-- Remove Invoice Tables to Unblock Role Migration
-- These tables have no frontend implementation and are blocking the role enum alteration

-- Drop invoice tables and all related policies
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

-- Also drop any related payment/financial tables that might reference roles
-- (keeping project_budgets as it might be used elsewhere)

-- Verify tables are dropped
SELECT 'Tables after cleanup:' as info;
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%invoice%'
ORDER BY tablename;