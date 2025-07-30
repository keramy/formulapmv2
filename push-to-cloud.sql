-- ============================================================================
-- PUSH LOCAL SCHEMA TO CLOUD DATABASE
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- First, let's clean up any existing incorrect tables
-- This will drop all existing tables and types to start fresh

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS task_comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_milestones CASCADE;
DROP TABLE IF EXISTS construction_photos CASCADE;
DROP TABLE IF EXISTS construction_reports CASCADE;
DROP TABLE IF EXISTS report_sections CASCADE;
DROP TABLE IF EXISTS report_templates CASCADE;
DROP TABLE IF EXISTS shop_drawing_comments CASCADE;
DROP TABLE IF EXISTS shop_drawing_versions CASCADE;
DROP TABLE IF EXISTS shop_drawings CASCADE;
DROP TABLE IF EXISTS material_spec_links CASCADE;
DROP TABLE IF EXISTS material_specs CASCADE;
DROP TABLE IF EXISTS scope_dependencies CASCADE;
DROP TABLE IF EXISTS scope_items CASCADE;
DROP TABLE IF EXISTS project_documents CASCADE;
DROP TABLE IF EXISTS project_assignments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activity_summary CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Drop all types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS scope_category CASCADE;
DROP TYPE IF EXISTS scope_status CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS document_status CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
DROP TYPE IF EXISTS seniority_level CASCADE;
DROP TYPE IF EXISTS shop_drawing_status CASCADE;
DROP TYPE IF EXISTS drawing_discipline CASCADE;
DROP TYPE IF EXISTS submission_type CASCADE;
DROP TYPE IF EXISTS milestone_status CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS is_management_role() CASCADE;
DROP FUNCTION IF EXISTS has_project_access(UUID) CASCADE;
DROP FUNCTION IF EXISTS populate_jwt_claims() CASCADE;
DROP FUNCTION IF EXISTS handle_auth_user_created() CASCADE;

-- Now you're ready to run the complete database setup migration
-- Copy the contents of: supabase/migrations/20250124000000_complete_database_setup.sql
-- And paste it below this line, then run the entire script