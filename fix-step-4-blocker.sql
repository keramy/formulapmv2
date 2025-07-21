-- Fix Step 4 Blocker - Drop invoices table policy
-- Run this before Step 4

-- Disable RLS on invoices table and drop the blocking policy
ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance team invoice access" ON invoices;

-- Also check for any other potential invoice policies
DROP POLICY IF EXISTS "invoices_select_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON invoices;

-- Now you can run Step 4 from the previous script