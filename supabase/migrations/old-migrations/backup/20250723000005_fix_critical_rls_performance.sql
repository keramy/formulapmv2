-- Fix Critical RLS Performance Issues
-- This migration addresses the most critical performance problems identified in the analysis

-- 1. Fix inefficient RLS policies by wrapping auth.uid() in SELECT statements
-- This prevents function re-evaluation for every row

-- Drop existing inefficient policies and recreate with optimized versions
-- Starting with the most critical tables that likely cause app slowdowns

-- clients table
DROP POLICY IF EXISTS "Users can view clients they have access to" ON public.clients;
CREATE POLICY "Users can view clients they have access to" ON public.clients
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      JOIN projects p ON p.id = pa.project_id
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND p.client_id = clients.id
    )
  );

-- project_assignments table  
DROP POLICY IF EXISTS "Users can view their project assignments" ON public.project_assignments;
CREATE POLICY "Users can view their project assignments" ON public.project_assignments
  FOR SELECT USING (user_id = (SELECT auth.uid()));

-- user_profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- documents table
DROP POLICY IF EXISTS "Users can view documents for their projects" ON public.documents;
CREATE POLICY "Users can view documents for their projects" ON public.documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = documents.project_id
    )
  );

-- tasks table
DROP POLICY IF EXISTS "Users can view tasks for their projects" ON public.tasks;
CREATE POLICY "Users can view tasks for their projects" ON public.tasks
  FOR SELECT USING (
    assigned_to = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = tasks.project_id
    )
  );

-- shop_drawings table
DROP POLICY IF EXISTS "Users can view shop drawings for their projects" ON public.shop_drawings;
CREATE POLICY "Users can view shop drawings for their projects" ON public.shop_drawings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = shop_drawings.project_id
    )
  );

-- invoices table
DROP POLICY IF EXISTS "Users can view invoices for their projects" ON public.invoices;
CREATE POLICY "Users can view invoices for their projects" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND pa.project_id = invoices.project_id
    )
  );

-- activity_logs table
DROP POLICY IF EXISTS "Users can view activity logs for their projects" ON public.activity_logs;
CREATE POLICY "Users can view activity logs for their projects" ON public.activity_logs
  FOR SELECT USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM project_assignments pa 
      WHERE pa.user_id = (SELECT auth.uid()) 
      AND (
        pa.project_id::text = activity_logs.entity_id OR
        pa.project_id IN (
          SELECT project_id FROM project_assignments 
          WHERE user_id::text = activity_logs.entity_id
        )
      )
    )
  );

-- Add performance indexes for the optimized queries
CREATE INDEX IF NOT EXISTS idx_project_assignments_user_project 
  ON public.project_assignments (user_id, project_id);
  
CREATE INDEX IF NOT EXISTS idx_projects_client_id 
  ON public.projects (client_id);

-- 2. Remove duplicate indexes
DROP INDEX IF EXISTS public.idx_audit_logs_user; -- Keep idx_audit_logs_user_id
DROP INDEX IF EXISTS public.idx_notifications_user; -- Keep idx_notifications_user_id

-- 3. Consolidate multiple permissive policies where identified
-- This will be done in subsequent targeted migrations for specific tables

-- Critical RLS performance fixes - Phase 1: Core table optimizations