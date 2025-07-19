-- Fix Function Search Path Security Issues
-- This migration addresses the security warnings from Supabase Performance Advisor
-- by setting search_path to empty string for all functions to prevent search path manipulation attacks

-- Activity and Summary Functions
ALTER FUNCTION public.update_activity_summary() SECURITY DEFINER SET search_path = '';

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