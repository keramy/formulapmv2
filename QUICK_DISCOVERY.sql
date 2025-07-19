-- QUICK FUNCTION DISCOVERY
-- Run this first to see which functions actually exist and need fixing
-- Copy and paste this into Supabase SQL Editor

SELECT 
  'ALTER FUNCTION public.' || p.proname || '() SECURITY DEFINER SET search_path = '''';' as fix_statement,
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ NEEDS FIX'
    WHEN 'search_path=' = ANY(p.proconfig) THEN '✅ Already secure'
    ELSE '⚠️ Has custom search_path'
  END as current_status
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
AND (p.proconfig IS NULL OR NOT ('search_path=' = ANY(p.proconfig)))
ORDER BY p.proname;

-- Instructions:
-- 1. Run this query first
-- 2. Copy the ALTER FUNCTION statements from the 'fix_statement' column
-- 3. Paste and run those statements to fix the functions
-- 4. Only functions that actually exist and need fixing will be shown