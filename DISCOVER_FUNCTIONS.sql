-- COMPREHENSIVE FUNCTION DISCOVERY
-- This will show ALL functions with their exact signatures and security status
-- Run this first to see exactly what exists in your database

SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as parameters,
  'ALTER FUNCTION public.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') SECURITY DEFINER SET search_path = '''';' as exact_fix_statement,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ NEEDS FIX'
    WHEN 'search_path=' = ANY(p.proconfig) THEN '✅ Already secure'
    ELSE '⚠️ Has custom search_path'
  END as current_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'assign_subcontractor_to_scope', 'auto_close_inactive_threads', 'broadcast_project_update',
  'broadcast_scope_update', 'broadcast_task_update', 'calculate_tender_submission_item_total',
  'can_approve_purchase_requests', 'can_confirm_deliveries', 'can_create_purchase_requests',
  'can_view_user_profile', 'create_client_notification', 'ensure_updated_at_trigger',
  'generate_drawing_number', 'generate_invoice_number', 'generate_payment_number',
  'generate_po_number', 'generate_purchase_order_number', 'generate_purchase_request_number',
  'generate_scope_item_no', 'generate_tender_number', 'get_user_role_from_auth',
  'handle_material_approval', 'has_cost_tracking_access', 'has_project_access',
  'has_purchase_department_access', 'is_client_with_project_access', 'is_management_role',
  'is_user_active_from_auth', 'log_activity', 'log_client_activity', 'migrate_user_role',
  'notify_drawing_comment', 'populate_jwt_claims', 'safe_has_project_access_for_profiles',
  'track_client_document_access', 'track_index_usage', 'update_activity_summary',
  'update_existing_jwt_claims', 'update_material_specs_updated_at', 'update_milestone_timestamps',
  'update_project_actual_cost', 'update_purchase_request_status', 'update_scope_material_links_updated_at',
  'update_subcontractor_assignment_timestamp', 'update_suppliers_updated_at', 'update_thread_last_message',
  'update_updated_at_column', 'update_vendor_performance_rating', 'validate_approval_workflow',
  'validate_client_access'
)
AND (p.proconfig IS NULL OR NOT ('search_path=' = ANY(p.proconfig)))
ORDER BY p.proname;

-- This query will show you:
-- 1. function_name: The name of the function
-- 2. parameters: The exact parameter signature
-- 3. exact_fix_statement: The correct ALTER FUNCTION statement with proper parameters
-- 4. current_status: Whether it needs fixing or not

-- Instructions:
-- 1. Run this query
-- 2. Copy the statements from the 'exact_fix_statement' column
-- 3. Run those statements to fix the functions