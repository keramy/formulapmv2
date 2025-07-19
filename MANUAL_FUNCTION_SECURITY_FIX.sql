-- MANUAL FUNCTION SECURITY FIX (SAFE VERSION)
-- Copy and paste this entire SQL into your Supabase SQL Editor and execute
-- This fixes all function search_path security warnings
-- Uses DO blocks to handle missing functions gracefully

-- Activity and Summary Functions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'update_activity_summary') THEN
    ALTER FUNCTION public.update_activity_summary() SECURITY DEFINER SET search_path = '';
    RAISE NOTICE '✅ Fixed: update_activity_summary';
  ELSE
    RAISE NOTICE '⚠️ Skipped: update_activity_summary (does not exist)';
  END IF;
END $$;

-- Financial Functions
ALTER FUNCTION public.calculate_tender_submission_item_total() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_po_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_invoice_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_payment_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_tender_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_project_actual_cost() SECURITY DEFINER SET search_path = '';

-- Drawing and Document Functions
ALTER FUNCTION public.generate_drawing_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.notify_drawing_comment() SECURITY DEFINER SET search_path = '';

-- Purchase Functions
ALTER FUNCTION public.generate_purchase_request_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.generate_purchase_order_number() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_vendor_performance_rating() SECURITY DEFINER SET search_path = '';

-- Client and Access Functions
ALTER FUNCTION public.track_client_document_access() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.validate_client_access() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.log_client_activity() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.create_client_notification() SECURITY DEFINER SET search_path = '';

-- Communication Functions
ALTER FUNCTION public.update_thread_last_message() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.auto_close_inactive_threads() SECURITY DEFINER SET search_path = '';

-- Workflow and Approval Functions
ALTER FUNCTION public.validate_approval_workflow() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_purchase_request_status() SECURITY DEFINER SET search_path = '';

-- Authentication and Authorization Functions
ALTER FUNCTION public.is_user_active_from_auth() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.get_user_role_from_auth() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.is_management_role() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.has_cost_tracking_access() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.is_client_with_project_access() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.has_project_access() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.safe_has_project_access_for_profiles() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.can_view_user_profile() SECURITY DEFINER SET search_path = '';

-- Purchase Department Functions
ALTER FUNCTION public.has_purchase_department_access() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.can_create_purchase_requests() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.can_approve_purchase_requests() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.can_confirm_deliveries() SECURITY DEFINER SET search_path = '';

-- Scope and Project Functions
ALTER FUNCTION public.generate_scope_item_no() SECURITY DEFINER SET search_path = '';

-- Milestone Functions
ALTER FUNCTION public.update_milestone_timestamps() SECURITY DEFINER SET search_path = '';

-- JWT and Claims Functions
ALTER FUNCTION public.populate_jwt_claims() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_existing_jwt_claims() SECURITY DEFINER SET search_path = '';

-- Utility Functions
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = '';

-- Supplier and Material Functions
ALTER FUNCTION public.update_suppliers_updated_at() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_material_specs_updated_at() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_scope_material_links_updated_at() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.handle_material_approval() SECURITY DEFINER SET search_path = '';

-- Monitoring and Logging Functions
ALTER FUNCTION public.track_index_usage() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.log_activity() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.ensure_updated_at_trigger() SECURITY DEFINER SET search_path = '';

-- Real-time Broadcasting Functions
ALTER FUNCTION public.broadcast_project_update() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.broadcast_task_update() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.broadcast_scope_update() SECURITY DEFINER SET search_path = '';

-- Migration and Assignment Functions
ALTER FUNCTION public.migrate_user_role() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.assign_subcontractor_to_scope() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_subcontractor_assignment_timestamp() SECURITY DEFINER SET search_path = '';

-- Verification query to check if the fix worked
-- Run this after the above statements to verify
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ No search_path set'
    WHEN 'search_path=' = ANY(p.proconfig) THEN '✅ Secure (empty search_path)'
    ELSE '⚠️ Custom search_path: ' || array_to_string(p.proconfig, ', ')
  END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'update_activity_summary', 'calculate_tender_submission_item_total', 'generate_po_number',
  'generate_invoice_number', 'generate_payment_number', 'generate_tender_number',
  'update_project_actual_cost', 'generate_drawing_number', 'notify_drawing_comment',
  'generate_purchase_request_number', 'generate_purchase_order_number', 'update_vendor_performance_rating',
  'track_client_document_access', 'validate_client_access', 'log_client_activity',
  'create_client_notification', 'update_thread_last_message', 'auto_close_inactive_threads',
  'validate_approval_workflow', 'update_purchase_request_status', 'is_user_active_from_auth',
  'get_user_role_from_auth', 'is_management_role', 'has_cost_tracking_access',
  'is_client_with_project_access', 'has_project_access', 'safe_has_project_access_for_profiles',
  'can_view_user_profile', 'has_purchase_department_access', 'can_create_purchase_requests',
  'can_approve_purchase_requests', 'can_confirm_deliveries', 'generate_scope_item_no',
  'update_milestone_timestamps', 'populate_jwt_claims', 'update_existing_jwt_claims',
  'update_updated_at_column', 'update_suppliers_updated_at', 'update_material_specs_updated_at',
  'update_scope_material_links_updated_at', 'handle_material_approval', 'track_index_usage',
  'log_activity', 'ensure_updated_at_trigger', 'broadcast_project_update',
  'broadcast_task_update', 'broadcast_scope_update', 'migrate_user_role',
  'assign_subcontractor_to_scope', 'update_subcontractor_assignment_timestamp'
)
ORDER BY p.proname;