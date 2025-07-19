-- DISCOVER DATABASE SCHEMA FOR RLS OPTIMIZATION
-- Run this query in Supabase SQL Editor to see your actual table structure
-- This will help us create the correct RLS policies

-- First, let's see what tables actually exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
  'suppliers', 'documents', 'document_approvals', 'audit_logs', 
  'notifications', 'tasks', 'task_comments', 'field_reports', 
  'system_settings', 'invoices', 'invoice_items', 'payments',
  'project_budgets', 'mobile_devices', 'tenders', 'projects',
  'project_assignments', 'user_profiles', 'clients'
)
ORDER BY table_name;

-- Now let's see the columns for the key tables that are causing issues
-- TASKS table columns
SELECT 
  'tasks' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks'
ORDER BY ordinal_position;

-- DOCUMENTS table columns  
SELECT 
  'documents' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'documents'
ORDER BY ordinal_position;

-- PROJECT_ASSIGNMENTS table columns
SELECT 
  'project_assignments' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'project_assignments'
ORDER BY ordinal_position;

-- Let's also check what RLS policies currently exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;