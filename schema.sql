

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."approval_status" AS ENUM (
    'pending',
    'approved',
    'rejected',
    'delegated'
);


ALTER TYPE "public"."approval_status" OWNER TO "postgres";


CREATE TYPE "public"."audit_action" AS ENUM (
    'create',
    'update',
    'delete',
    'view',
    'approve',
    'reject',
    'upload',
    'download',
    'login',
    'logout',
    'permission_change',
    'bulk_operation'
);


ALTER TYPE "public"."audit_action" OWNER TO "postgres";


CREATE TYPE "public"."audit_entity" AS ENUM (
    'user',
    'project',
    'scope_item',
    'document',
    'supplier',
    'client',
    'assignment',
    'approval',
    'report',
    'system'
);


ALTER TYPE "public"."audit_entity" OWNER TO "postgres";


CREATE TYPE "public"."client_access_level" AS ENUM (
    'view_only',
    'reviewer',
    'approver',
    'project_owner'
);


ALTER TYPE "public"."client_access_level" OWNER TO "postgres";


CREATE TYPE "public"."client_activity_type" AS ENUM (
    'login',
    'logout',
    'document_view',
    'document_download',
    'document_approve',
    'comment_add',
    'message_send',
    'project_access',
    'profile_update'
);


ALTER TYPE "public"."client_activity_type" OWNER TO "postgres";


CREATE TYPE "public"."client_approval_decision" AS ENUM (
    'approved',
    'approved_with_conditions',
    'rejected',
    'requires_revision'
);


ALTER TYPE "public"."client_approval_decision" OWNER TO "postgres";


CREATE TYPE "public"."client_comment_status" AS ENUM (
    'open',
    'addressed',
    'resolved',
    'closed'
);


ALTER TYPE "public"."client_comment_status" OWNER TO "postgres";


CREATE TYPE "public"."client_comment_type" AS ENUM (
    'general',
    'revision_request',
    'question',
    'approval_condition',
    'concern'
);


ALTER TYPE "public"."client_comment_type" OWNER TO "postgres";


CREATE TYPE "public"."client_company_type" AS ENUM (
    'individual',
    'corporation',
    'partnership',
    'government',
    'non_profit'
);


ALTER TYPE "public"."client_company_type" OWNER TO "postgres";


CREATE TYPE "public"."client_delivery_method" AS ENUM (
    'in_app',
    'email',
    'sms',
    'push'
);


ALTER TYPE "public"."client_delivery_method" OWNER TO "postgres";


CREATE TYPE "public"."client_document_access_type" AS ENUM (
    'view',
    'download',
    'comment',
    'approve'
);


ALTER TYPE "public"."client_document_access_type" OWNER TO "postgres";


CREATE TYPE "public"."client_message_type" AS ENUM (
    'text',
    'file',
    'image',
    'system'
);


ALTER TYPE "public"."client_message_type" OWNER TO "postgres";


CREATE TYPE "public"."client_notification_type" AS ENUM (
    'document_submitted',
    'approval_required',
    'approval_received',
    'project_milestone',
    'schedule_change',
    'budget_update',
    'quality_issue',
    'delivery_notification',
    'message_received',
    'system_announcement'
);


ALTER TYPE "public"."client_notification_type" OWNER TO "postgres";


CREATE TYPE "public"."client_permission_type" AS ENUM (
    'document_access',
    'project_access',
    'communication',
    'reporting',
    'financial'
);


ALTER TYPE "public"."client_permission_type" OWNER TO "postgres";


CREATE TYPE "public"."client_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."client_priority" OWNER TO "postgres";


CREATE TYPE "public"."client_project_access_level" AS ENUM (
    'viewer',
    'reviewer',
    'approver',
    'stakeholder'
);


ALTER TYPE "public"."client_project_access_level" OWNER TO "postgres";


CREATE TYPE "public"."client_thread_status" AS ENUM (
    'open',
    'pending_response',
    'resolved',
    'closed'
);


ALTER TYPE "public"."client_thread_status" OWNER TO "postgres";


CREATE TYPE "public"."client_thread_type" AS ENUM (
    'general',
    'technical',
    'commercial',
    'quality',
    'schedule',
    'support'
);


ALTER TYPE "public"."client_thread_type" OWNER TO "postgres";


CREATE TYPE "public"."comment_type" AS ENUM (
    'general',
    'dimension',
    'material',
    'specification',
    'code_compliance',
    'coordination',
    'revision_required',
    'clarification'
);


ALTER TYPE "public"."comment_type" OWNER TO "postgres";


CREATE TYPE "public"."delivery_status" AS ENUM (
    'pending',
    'partial',
    'completed',
    'damaged',
    'rejected'
);


ALTER TYPE "public"."delivery_status" OWNER TO "postgres";


CREATE TYPE "public"."document_status" AS ENUM (
    'draft',
    'review',
    'approved',
    'rejected',
    'revision_required'
);


ALTER TYPE "public"."document_status" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'shop_drawing',
    'material_spec',
    'contract',
    'report',
    'photo',
    'other'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE TYPE "public"."drawing_discipline" AS ENUM (
    'architectural',
    'structural',
    'mechanical',
    'electrical',
    'plumbing',
    'millwork',
    'landscape',
    'interior_design',
    'other'
);


ALTER TYPE "public"."drawing_discipline" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'viewed',
    'approved',
    'paid',
    'overdue',
    'disputed',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."material_status" AS ENUM (
    'pending_approval',
    'approved',
    'rejected',
    'revision_required',
    'discontinued',
    'substitution_required'
);


ALTER TYPE "public"."material_status" OWNER TO "postgres";


CREATE TYPE "public"."milestone_status" AS ENUM (
    'not_started',
    'in_progress',
    'completed',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."milestone_status" OWNER TO "postgres";


CREATE TYPE "public"."milestone_type" AS ENUM (
    'phase_completion',
    'major_milestone',
    'client_approval',
    'permit_milestone',
    'inspection_milestone'
);


ALTER TYPE "public"."milestone_type" OWNER TO "postgres";


CREATE TYPE "public"."notification_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."notification_priority" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'task_assigned',
    'document_approval_required',
    'document_approved',
    'document_rejected',
    'project_update',
    'deadline_reminder',
    'scope_change',
    'mention',
    'system_alert'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'bank_transfer',
    'check',
    'cash',
    'credit_card',
    'letter_of_credit',
    'other'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'pending',
    'approved',
    'processing',
    'completed',
    'cancelled',
    'overdue'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."po_status" AS ENUM (
    'draft',
    'sent',
    'confirmed',
    'delivered',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."po_status" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."project_status" AS ENUM (
    'planning',
    'bidding',
    'active',
    'on_hold',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."project_status" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'submitted',
    'reviewed',
    'approved'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."report_type" AS ENUM (
    'daily',
    'weekly',
    'incident',
    'quality',
    'safety',
    'progress',
    'inspection'
);


ALTER TYPE "public"."report_type" OWNER TO "postgres";


CREATE TYPE "public"."request_status" AS ENUM (
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'cancelled'
);


ALTER TYPE "public"."request_status" OWNER TO "postgres";


CREATE TYPE "public"."scope_category" AS ENUM (
    'construction',
    'millwork',
    'electrical',
    'mechanical'
);


ALTER TYPE "public"."scope_category" OWNER TO "postgres";


CREATE TYPE "public"."scope_status" AS ENUM (
    'not_started',
    'in_progress',
    'review',
    'completed',
    'blocked',
    'cancelled'
);


ALTER TYPE "public"."scope_status" OWNER TO "postgres";


CREATE TYPE "public"."shop_drawing_status" AS ENUM (
    'draft',
    'internal_review',
    'internal_approved',
    'submitted_to_client',
    'client_review',
    'approved',
    'approved_with_comments',
    'rejected',
    'revision_required',
    'superseded'
);


ALTER TYPE "public"."shop_drawing_status" OWNER TO "postgres";


CREATE TYPE "public"."sync_status" AS ENUM (
    'pending',
    'syncing',
    'synced',
    'conflict',
    'failed'
);


ALTER TYPE "public"."sync_status" OWNER TO "postgres";


CREATE TYPE "public"."task_priority" AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


ALTER TYPE "public"."task_priority" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'pending',
    'in_progress',
    'review',
    'completed',
    'cancelled',
    'blocked'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."tender_status" AS ENUM (
    'preparation',
    'published',
    'bidding_open',
    'bidding_closed',
    'evaluation',
    'awarded',
    'cancelled',
    'completed'
);


ALTER TYPE "public"."tender_status" OWNER TO "postgres";


CREATE TYPE "public"."urgency_level" AS ENUM (
    'low',
    'normal',
    'high',
    'emergency'
);


ALTER TYPE "public"."urgency_level" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'management',
    'purchase_manager',
    'technical_lead',
    'project_manager',
    'client',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE TYPE "public"."user_role_old" AS ENUM (
    'company_owner',
    'general_manager',
    'deputy_general_manager',
    'technical_director',
    'admin',
    'project_manager',
    'architect',
    'technical_engineer',
    'purchase_director',
    'purchase_specialist',
    'field_worker',
    'client',
    'subcontractor'
);


ALTER TYPE "public"."user_role_old" OWNER TO "postgres";


CREATE TYPE "public"."user_role_optimized" AS ENUM (
    'management',
    'purchase_manager',
    'technical_lead',
    'project_manager',
    'client'
);


ALTER TYPE "public"."user_role_optimized" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."analyze_table_performance"() RETURNS TABLE("table_name" "text", "total_size" "text", "table_size" "text", "index_size" "text", "row_count" bigint, "seq_scans" bigint, "index_scans" bigint, "index_usage_ratio" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    n_tup_ins + n_tup_upd + n_tup_del as row_count,
    seq_scan as seq_scans,
    COALESCE(idx_scan, 0) as index_scans,
    CASE 
      WHEN seq_scan + COALESCE(idx_scan, 0) = 0 THEN 0
      ELSE ROUND(COALESCE(idx_scan, 0)::NUMERIC / (seq_scan + COALESCE(idx_scan, 0))::NUMERIC * 100, 2)
    END as index_usage_ratio
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;


ALTER FUNCTION "public"."analyze_table_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_subcontractor_to_scope"("p_subcontractor_id" "uuid", "p_scope_item_id" "uuid", "p_assigned_by" "uuid", "p_agreed_rate" numeric DEFAULT NULL::numeric, "p_estimated_hours" integer DEFAULT NULL::integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    assignment_id UUID;
    project_id UUID;
BEGIN
    -- Get project ID from scope item
    SELECT si.project_id INTO project_id 
    FROM scope_items si 
    WHERE si.id = p_scope_item_id;
    
    -- Create assignment
    INSERT INTO subcontractor_assignments (
        subcontractor_id,
        scope_item_id,
        project_id,
        assigned_by,
        agreed_rate,
        estimated_hours,
        estimated_cost
    ) VALUES (
        p_subcontractor_id,
        p_scope_item_id,
        project_id,
        p_assigned_by,
        p_agreed_rate,
        p_estimated_hours,
        COALESCE(p_agreed_rate * p_estimated_hours, 0)
    ) RETURNING id INTO assignment_id;
    
    -- Update subcontractor assignment count
    UPDATE subcontractors 
    SET total_assignments = total_assignments + 1,
        updated_at = NOW()
    WHERE id = p_subcontractor_id;
    
    RETURN assignment_id;
END;
$$;


ALTER FUNCTION "public"."assign_subcontractor_to_scope"("p_subcontractor_id" "uuid", "p_scope_item_id" "uuid", "p_assigned_by" "uuid", "p_agreed_rate" numeric, "p_estimated_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_close_inactive_threads"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE client_communication_threads 
  SET 
    status = 'closed',
    closed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'open' 
    AND auto_close_after_days IS NOT NULL
    AND last_message_at < NOW() - INTERVAL '1 day' * auto_close_after_days;
END;
$$;


ALTER FUNCTION "public"."auto_close_inactive_threads"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."broadcast_project_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Broadcast to project-specific channel
  PERFORM pg_notify(
    'project_' || NEW.id,
    json_build_object(
      'type', 'project_update',
      'project_id', NEW.id,
      'operation', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."broadcast_project_update"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."broadcast_project_update"() IS 'Broadcasts project updates for real-time collaboration - OPTIMIZATION PHASE 1.3';



CREATE OR REPLACE FUNCTION "public"."broadcast_scope_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Broadcast to project-specific channel
  PERFORM pg_notify(
    'project_scope_' || NEW.project_id,
    json_build_object(
      'type', 'scope_update',
      'project_id', NEW.project_id,
      'scope_id', NEW.id,
      'operation', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."broadcast_scope_update"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."broadcast_scope_update"() IS 'Broadcasts scope updates for real-time collaboration - OPTIMIZATION PHASE 1.3';



CREATE OR REPLACE FUNCTION "public"."broadcast_task_update"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Broadcast to project-specific channel
  PERFORM pg_notify(
    'project_tasks_' || NEW.project_id,
    json_build_object(
      'type', 'task_update',
      'project_id', NEW.project_id,
      'task_id', NEW.id,
      'operation', TG_OP,
      'data', row_to_json(NEW)
    )::text
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."broadcast_task_update"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."broadcast_task_update"() IS 'Broadcasts task updates for real-time collaboration - OPTIMIZATION PHASE 1.3';



CREATE OR REPLACE FUNCTION "public"."calculate_tender_submission_item_total"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Calculate total_price based on tender_item quantity and unit_price
  SELECT quantity * NEW.unit_price
  INTO NEW.total_price
  FROM tender_items
  WHERE id = NEW.tender_item_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_tender_submission_item_total"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_approve_purchase_requests"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director')
  );
END;
$$;


ALTER FUNCTION "public"."can_approve_purchase_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_confirm_deliveries"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer', 'architect', 'field_worker')
  );
END;
$$;


ALTER FUNCTION "public"."can_confirm_deliveries"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_create_purchase_requests"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer', 'architect')
  );
END;
$$;


ALTER FUNCTION "public"."can_create_purchase_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."can_view_user_profile"("target_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  viewer_role TEXT;
BEGIN
  -- Get viewer's role
  viewer_role := get_user_role_from_auth();
  
  -- Management can see all
  IF viewer_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Users can see their own profile
  IF target_user_id = auth.uid() THEN
    RETURN TRUE;
  END IF;
  
  -- For other cases, return false and handle in application layer
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."can_view_user_profile"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_performance_alerts"() RETURNS TABLE("alert_type" "text", "severity" "text", "message" "text", "current_value" numeric, "threshold" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check connection utilization
  RETURN QUERY
  SELECT 
    'CONNECTION_UTILIZATION' as alert_type,
    CASE 
      WHEN cs.connection_utilization > 80 THEN 'CRITICAL'
      WHEN cs.connection_utilization > 60 THEN 'WARNING'
      ELSE 'OK'
    END as severity,
    'Connection utilization is ' || cs.connection_utilization || '%' as message,
    cs.connection_utilization as current_value,
    80.0 as threshold
  FROM get_connection_stats() cs
  WHERE cs.connection_utilization > 60;
  
  -- Check cache hit ratios
  RETURN QUERY
  SELECT 
    'CACHE_HIT_RATIO' as alert_type,
    CASE 
      WHEN chr.buffer_cache_hit_ratio < 90 THEN 'WARNING'
      WHEN chr.buffer_cache_hit_ratio < 80 THEN 'CRITICAL'
      ELSE 'OK'
    END as severity,
    'Buffer cache hit ratio is ' || chr.buffer_cache_hit_ratio || '%' as message,
    chr.buffer_cache_hit_ratio as current_value,
    90.0 as threshold
  FROM get_cache_hit_ratio() chr
  WHERE chr.buffer_cache_hit_ratio < 90;
END;
$$;


ALTER FUNCTION "public"."check_performance_alerts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_logs"("days_to_keep" integer DEFAULT 30) RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  deleted_count INTEGER;
  result TEXT;
BEGIN
  -- Clean up old migration logs
  DELETE FROM public.migration_log 
  WHERE created_at < NOW() - INTERVAL '1 day' * days_to_keep
    AND migration_name LIKE 'maintenance_%';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  result := 'Cleaned up ' || deleted_count || ' old maintenance log entries.';
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_logs"("days_to_keep" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_client_notification"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_title" character varying, "p_message" "text", "p_notification_type" "public"."client_notification_type", "p_priority" "public"."client_priority" DEFAULT 'medium'::"public"."client_priority", "p_delivery_methods" "public"."client_delivery_method"[] DEFAULT ARRAY['in_app'::"public"."client_delivery_method"]) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO client_notifications (
    client_user_id, project_id, title, message, notification_type, 
    priority, delivery_method
  ) VALUES (
    p_client_user_id, p_project_id, p_title, p_message, p_notification_type,
    p_priority, p_delivery_methods
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_client_notification"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_title" character varying, "p_message" "text", "p_notification_type" "public"."client_notification_type", "p_priority" "public"."client_priority", "p_delivery_methods" "public"."client_delivery_method"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_updated_at_trigger"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS %I_updated_at_trigger ON %I;
    CREATE TRIGGER %I_updated_at_trigger
      BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  ', table_name, table_name, table_name, table_name);
END;
$$;


ALTER FUNCTION "public"."ensure_updated_at_trigger"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_drawing_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.drawing_number IS NULL THEN
    NEW.drawing_number := 
      CASE NEW.discipline
        WHEN 'architectural' THEN 'A-'
        WHEN 'structural' THEN 'S-'
        WHEN 'mechanical' THEN 'M-'
        WHEN 'electrical' THEN 'E-'
        WHEN 'plumbing' THEN 'P-'
        WHEN 'millwork' THEN 'MW-'
        ELSE 'D-'
      END || 
      LPAD((SELECT COUNT(*) + 1 FROM shop_drawings 
            WHERE project_id = NEW.project_id 
            AND discipline = NEW.discipline)::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_drawing_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_invoice_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := CASE 
      WHEN NEW.invoice_type = 'client' THEN 'INV-C-'
      ELSE 'INV-S-'
    END || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
    LPAD((SELECT COUNT(*) + 1 FROM invoices 
          WHERE created_at >= DATE_TRUNC('month', NOW())
          AND invoice_type = NEW.invoice_type)::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_invoice_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_payment_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.payment_number IS NULL THEN
    NEW.payment_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                          LPAD((SELECT COUNT(*) + 1 FROM payments 
                                WHERE created_at >= DATE_TRUNC('month', NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_payment_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_po_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- PO number generation moved to purchase_department_workflow migration
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_po_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_purchase_order_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number = 'PO-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                    LPAD(NEXTVAL('purchase_order_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_purchase_order_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_purchase_request_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number = 'PR-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                         LPAD(NEXTVAL('purchase_request_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_purchase_request_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_scope_item_no"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.item_no IS NULL THEN
    SELECT COALESCE(MAX(item_no), 0) + 1 
    INTO NEW.item_no 
    FROM scope_items 
    WHERE project_id = NEW.project_id;
  END IF;
  
  -- Auto-populate title from description if not provided
  IF NEW.title IS NULL OR NEW.title = '' THEN
    NEW.title = NEW.description;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_scope_item_no"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_tender_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.tender_number IS NULL THEN
    NEW.tender_number := 'TND-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                         LPAD((SELECT COUNT(*) + 1 FROM tenders 
                               WHERE created_at >= DATE_TRUNC('year', NOW()))::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_tender_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_cache_hit_ratio"() RETURNS TABLE("buffer_cache_hit_ratio" numeric, "index_cache_hit_ratio" numeric, "table_cache_hit_ratio" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(
      (SELECT sum(heap_blks_hit) FROM pg_statio_user_tables) / 
      NULLIF((SELECT sum(heap_blks_hit + heap_blks_read) FROM pg_statio_user_tables), 0) * 100, 
      2
    ) as buffer_cache_hit_ratio,
    ROUND(
      (SELECT sum(idx_blks_hit) FROM pg_statio_user_indexes) / 
      NULLIF((SELECT sum(idx_blks_hit + idx_blks_read) FROM pg_statio_user_indexes), 0) * 100, 
      2
    ) as index_cache_hit_ratio,
    ROUND(
      (SELECT sum(heap_blks_hit) FROM pg_statio_user_tables) / 
      NULLIF((SELECT sum(heap_blks_hit + heap_blks_read) FROM pg_statio_user_tables), 0) * 100, 
      2
    ) as table_cache_hit_ratio;
END;
$$;


ALTER FUNCTION "public"."get_cache_hit_ratio"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_connection_stats"() RETURNS TABLE("total_connections" integer, "active_connections" integer, "idle_connections" integer, "max_connections" integer, "connection_utilization" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as total_connections,
    (SELECT count(*)::INTEGER FROM pg_stat_activity WHERE state = 'active') as active_connections,
    (SELECT count(*)::INTEGER FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
    (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections') as max_connections,
    ROUND(
      (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC / 
      (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')::NUMERIC * 100, 
      2
    ) as connection_utilization;
END;
$$;


ALTER FUNCTION "public"."get_connection_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role_from_auth"() RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Try to get role from JWT claims first
  user_role := auth.jwt() ->> 'user_role';
  
  -- If not found in JWT, get from auth.users metadata
  IF user_role IS NULL THEN
    SELECT raw_app_meta_data ->> 'user_role' INTO user_role
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN user_role;
END;
$$;


ALTER FUNCTION "public"."get_user_role_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_material_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Set approval timestamp and user when status changes to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.approved_by = auth.uid();
        NEW.approved_at = NOW();
        NEW.rejected_by = NULL;
        NEW.rejected_at = NULL;
        NEW.rejection_reason = NULL;
    END IF;
    
    -- Set rejection timestamp and user when status changes to rejected
    IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
        NEW.rejected_by = auth.uid();
        NEW.rejected_at = NOW();
        NEW.approved_by = NULL;
        NEW.approved_at = NULL;
    END IF;
    
    -- Clear approval/rejection data for other statuses
    IF NEW.status NOT IN ('approved', 'rejected') THEN
        NEW.approved_by = NULL;
        NEW.approved_at = NULL;
        NEW.rejected_by = NULL;
        NEW.rejected_at = NULL;
        NEW.rejection_reason = NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_material_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_cost_access"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') IN ('management', 'technical_lead', 'purchase_manager');
END;
$$;


ALTER FUNCTION "public"."has_cost_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_cost_tracking_access"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has cost tracking access
  RETURN user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'technical_engineer', 'purchase_director', 'purchase_specialist');
END;
$$;


ALTER FUNCTION "public"."has_cost_tracking_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_project_access"("project_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- Management has access to all projects
  IF user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is project manager for this project
  IF EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND project_manager_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- For non-management users, we need to be careful about project_assignments queries
  -- This function should only be used in contexts where it won't cause recursion
  -- For now, return false to avoid recursion, and handle project access differently
  RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."has_project_access"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_purchase_department_access"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director', 'purchase_specialist')
  );
END;
$$;


ALTER FUNCTION "public"."has_purchase_department_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."invalidate_rls_cache"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- This would integrate with your Redis cache invalidation
  PERFORM pg_notify('rls_policy_updated', TG_TABLE_NAME);
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."invalidate_rls_cache"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_client"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') = 'client';
END;
$$;


ALTER FUNCTION "public"."is_client"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_client_with_project_access"("project_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- If not a client, return false
  IF user_role != 'client' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if client has access to this project
  RETURN EXISTS (
    SELECT 1 FROM clients c
    JOIN projects p ON p.client_id = c.id
    WHERE c.user_id = auth.uid() 
    AND p.id = project_uuid
  );
END;
$$;


ALTER FUNCTION "public"."is_client_with_project_access"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_management"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') = 'management';
END;
$$;


ALTER FUNCTION "public"."is_management"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_management_role"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- If no role found, return false
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has management role
  RETURN user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin');
END;
$$;


ALTER FUNCTION "public"."is_management_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_project_manager"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') = 'project_manager';
END;
$$;


ALTER FUNCTION "public"."is_project_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_purchase_manager"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') = 'purchase_manager';
END;
$$;


ALTER FUNCTION "public"."is_purchase_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_technical_lead"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role') = 'technical_lead';
END;
$$;


ALTER FUNCTION "public"."is_technical_lead"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_active_from_auth"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  -- Try to get active status from JWT claims first
  is_active := (auth.jwt() ->> 'is_active')::boolean;
  
  -- If not found in JWT, get from auth.users metadata
  IF is_active IS NULL THEN
    SELECT (raw_app_meta_data ->> 'is_active')::boolean INTO is_active
    FROM auth.users
    WHERE id = auth.uid();
  END IF;
  
  RETURN COALESCE(is_active, false);
END;
$$;


ALTER FUNCTION "public"."is_user_active_from_auth"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only log for specific tables and operations
  IF TG_TABLE_NAME IN ('projects', 'tasks', 'scope_items', 'milestones', 'material_specs') THEN
    INSERT INTO activity_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      COALESCE(NEW.updated_by, NEW.created_by, auth.uid()),
      CASE 
        WHEN TG_OP = 'INSERT' THEN 'created'
        WHEN TG_OP = 'UPDATE' THEN 'updated'
        WHEN TG_OP = 'DELETE' THEN 'deleted'
        ELSE 'modified'
      END,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'operation', TG_OP,
        'table', TG_TABLE_NAME,
        'old_data', CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        'new_data', CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
      ),
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_activity"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_activity"() IS 'Logs user activity for real-time feeds - OPTIMIZATION PHASE 1.3';



CREATE OR REPLACE FUNCTION "public"."log_client_activity"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_activity_type" "public"."client_activity_type", "p_resource_type" character varying, "p_resource_id" "uuid", "p_action_taken" character varying, "p_description" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb", "p_ip_address" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text", "p_session_id" character varying DEFAULT NULL::character varying) RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO client_activity_log (
    client_user_id, project_id, activity_type, resource_type, resource_id,
    action_taken, description, metadata, ip_address, user_agent, session_id
  ) VALUES (
    p_client_user_id, p_project_id, p_activity_type, p_resource_type, p_resource_id,
    p_action_taken, p_description, p_metadata, p_ip_address, p_user_agent, p_session_id
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;


ALTER FUNCTION "public"."log_client_activity"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_activity_type" "public"."client_activity_type", "p_resource_type" character varying, "p_resource_id" "uuid", "p_action_taken" character varying, "p_description" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."migrate_user_role"("user_id" "uuid", "new_role" "public"."user_role_optimized", "new_seniority_level" "text" DEFAULT 'regular'::"text", "new_approval_limits" "jsonb" DEFAULT '{}'::"jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Store previous role for audit
    UPDATE user_profiles 
    SET 
        previous_role = role,
        role_migrated_at = NOW(),
        seniority_level = new_seniority_level,
        approval_limits = new_approval_limits
    WHERE id = user_id;
    
    -- Note: Actual role column update will happen in next migration
    -- after new enum is properly set up
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."migrate_user_role"("user_id" "uuid", "new_role" "public"."user_role_optimized", "new_seniority_level" "text", "new_approval_limits" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_drawing_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Notify the architect assigned to the drawing
  INSERT INTO notifications (user_id, type, priority, title, message, entity_type, entity_id)
  SELECT 
    sd.assigned_architect,
    'mention'::notification_type,
    'medium'::notification_priority,
    'New comment on shop drawing',
    'New ' || NEW.comment_type || ' comment on drawing ' || sd.drawing_number,
    'document'::audit_entity,
    NEW.shop_drawing_id
  FROM shop_drawings sd
  WHERE sd.id = NEW.shop_drawing_id
  AND sd.assigned_architect IS NOT NULL
  AND sd.assigned_architect != NEW.created_by;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_drawing_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."populate_jwt_claims"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Update the user's JWT claims with their role information
  -- This is called when a user profile is created or updated
  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'user_role', NEW.role,
    'user_id', NEW.id,
    'is_active', NEW.is_active,
    'updated_at', NOW()
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."populate_jwt_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."run_maintenance_tasks"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result TEXT := '';
BEGIN
  -- Update table statistics
  ANALYZE;
  result := result || 'ANALYZE completed. ';
  
  -- Note: VACUUM cannot be run in a transaction, so we skip it here
  result := result || 'VACUUM skipped (transaction context). ';
  
  -- Log maintenance completion
  INSERT INTO public.migration_log (migration_name, status, completed_at) 
  VALUES ('maintenance_' || to_char(NOW(), 'YYYY-MM-DD_HH24-MI-SS'), 'completed', NOW());
  
  result := result || 'Maintenance logged.';
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."run_maintenance_tasks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."safe_has_project_access_for_profiles"("project_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from auth metadata to avoid recursion
  user_role := get_user_role_from_auth();
  
  -- Management has access to all projects
  IF user_role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is project manager for this project
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_uuid
    AND project_manager_id = auth.uid()
  );
END;
$$;


ALTER FUNCTION "public"."safe_has_project_access_for_profiles"("project_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."suggest_missing_indexes"() RETURNS TABLE("table_name" "text", "column_name" "text", "seq_scans" bigint, "suggestion" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    'Multiple columns' as column_name,
    seq_scan as seq_scans,
    'Consider adding indexes - high sequential scan count' as suggestion
  FROM pg_stat_user_tables
  WHERE seq_scan > 1000 
    AND schemaname = 'public'
  ORDER BY seq_scan DESC;
END;
$$;


ALTER FUNCTION "public"."suggest_missing_indexes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_policy_performance"() RETURNS TABLE("table_name" "text", "policy_count" integer, "avg_query_time_ms" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user_profiles'::TEXT,
        (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles')::INTEGER,
        0.0::NUMERIC; -- Placeholder for actual timing
    
    -- Add more tables as needed
END;
$$;


ALTER FUNCTION "public"."test_policy_performance"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_client_document_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update access tracking on document access
  UPDATE client_document_access 
  SET 
    view_count = view_count + 1,
    last_accessed = NOW(),
    first_accessed = COALESCE(first_accessed, NOW())
  WHERE client_user_id = NEW.client_user_id 
    AND document_id = NEW.document_id;
  
  -- Log the activity
  INSERT INTO client_activity_log (
    client_user_id, project_id, activity_type, resource_type, 
    resource_id, action_taken, description, ip_address, user_agent, session_id
  ) VALUES (
    NEW.client_user_id, 
    (SELECT project_id FROM documents WHERE id = NEW.document_id),
    'document_view', 'document', NEW.document_id, 
    'Document viewed', 'Client viewed document', 
    NEW.ip_address, NEW.user_agent, NEW.session_id
  );
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."track_client_document_access"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."track_index_usage"() RETURNS TABLE("schemaname" "text", "tablename" "text", "indexname" "text", "idx_scans" bigint, "idx_tup_read" bigint, "idx_tup_fetch" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan as idx_scans,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    WHERE s.indexname LIKE 'idx_%'
    ORDER BY s.idx_scan DESC, s.idx_tup_read DESC;
END;
$$;


ALTER FUNCTION "public"."track_index_usage"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_activity_summary"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Update or insert activity summary
  INSERT INTO activity_summary (user_id, project_id, activity_date, actions_count)
  VALUES (NEW.user_id, 
          CASE 
            WHEN NEW.entity_type = 'project' THEN NEW.entity_id::UUID
            WHEN NEW.entity_type = 'scope_item' THEN (SELECT project_id FROM scope_items WHERE id = NEW.entity_id::UUID)
            WHEN NEW.entity_type = 'document' THEN (SELECT project_id FROM documents WHERE id = NEW.entity_id::UUID)
            ELSE NULL
          END,
          DATE(NEW.created_at),
          1)
  ON CONFLICT (user_id, project_id, activity_date)
  DO UPDATE SET 
    actions_count = activity_summary.actions_count + 1,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_activity_summary"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_approval_request_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Add to approval history
    IF OLD.status != NEW.status THEN
        NEW.approval_history = COALESCE(OLD.approval_history, '[]'::jsonb) || 
            jsonb_build_object(
                'timestamp', NOW(),
                'action', 'status_change',
                'old_status', OLD.status,
                'new_status', NEW.status,
                'changed_by', NEW.current_approver
            );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_approval_request_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_existing_jwt_claims"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  profile_record record;
BEGIN
  -- Update JWT claims for all existing users
  FOR profile_record IN 
    SELECT id, role, is_active FROM user_profiles 
  LOOP
    -- Update auth.users table with JWT claims
    UPDATE auth.users 
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
      'user_role', profile_record.role,
      'user_id', profile_record.id,
      'is_active', profile_record.is_active,
      'updated_at', NOW()
    )
    WHERE id = profile_record.id;
  END LOOP;
  
  RAISE NOTICE 'JWT claims updated for existing users';
END;
$$;


ALTER FUNCTION "public"."update_existing_jwt_claims"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_material_specs_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_material_specs_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_milestone_timestamps"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  
  -- Set actual completion date when status changes to completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.actual_completion_date = CURRENT_DATE;
    NEW.completion_percentage = 100.00;
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.actual_completion_date = NULL;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_milestone_timestamps"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_project_actual_cost"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.invoice_id IS NOT NULL THEN
    UPDATE projects p
    SET actual_cost = actual_cost + NEW.amount
    FROM invoices i
    WHERE i.id = NEW.invoice_id
    AND i.invoice_type = 'supplier'
    AND p.id = i.project_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_project_actual_cost"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_purchase_request_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  total_approvals INTEGER;
  approved_count INTEGER;
  rejected_count INTEGER;
BEGIN
  -- Count approvals for this purchase request
  SELECT 
    COUNT(*),
    COUNT(CASE WHEN approval_status = 'approved' THEN 1 END),
    COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END)
  INTO total_approvals, approved_count, rejected_count
  FROM approval_workflows
  WHERE purchase_request_id = NEW.purchase_request_id;
  
  -- Update purchase request status
  IF rejected_count > 0 THEN
    UPDATE purchase_requests 
    SET status = 'rejected' 
    WHERE id = NEW.purchase_request_id;
  ELSIF approved_count = total_approvals THEN
    UPDATE purchase_requests 
    SET status = 'approved' 
    WHERE id = NEW.purchase_request_id;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_purchase_request_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_scope_material_links_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_scope_material_links_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_subcontractor_assignment_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_subcontractor_assignment_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_suppliers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_suppliers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_thread_last_message"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE client_communication_threads 
  SET 
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.thread_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_thread_last_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vendor_performance_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  UPDATE vendors 
  SET performance_rating = (
    SELECT AVG(overall_score) 
    FROM vendor_ratings 
    WHERE vendor_id = NEW.vendor_id
  )
  WHERE id = NEW.vendor_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vendor_performance_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_approval_workflow"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if approver has the correct role
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = NEW.approver_id 
    AND role = NEW.approver_role
  ) THEN
    RAISE EXCEPTION 'Approver does not have the required role: %', NEW.approver_role;
  END IF;
  
  -- Set approval date when status is approved
  IF NEW.approval_status = 'approved' AND NEW.approval_date IS NULL THEN
    NEW.approval_date = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_approval_workflow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_client_access"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if client has valid access to the project
  IF NOT EXISTS (
    SELECT 1 FROM client_project_access cpa
    JOIN client_users cu ON cu.id = cpa.client_user_id
    WHERE cpa.client_user_id = NEW.client_user_id
      AND cpa.project_id = (SELECT project_id FROM documents WHERE id = NEW.document_id)
      AND cu.portal_access_enabled = true
      AND (cpa.access_start_date IS NULL OR cpa.access_start_date <= CURRENT_DATE)
      AND (cpa.access_end_date IS NULL OR cpa.access_end_date >= CURRENT_DATE)
  ) THEN
    RAISE EXCEPTION 'Client does not have valid access to this project';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_client_access"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "text" NOT NULL,
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_summary" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "project_id" "uuid",
    "activity_date" "date" NOT NULL,
    "actions_count" integer DEFAULT 0,
    "documents_uploaded" integer DEFAULT 0,
    "tasks_completed" integer DEFAULT 0,
    "approvals_given" integer DEFAULT 0,
    "hours_logged" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."activity_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "request_type" "text" NOT NULL,
    "project_id" "uuid",
    "scope_item_id" "uuid",
    "requested_by" "uuid" NOT NULL,
    "request_title" "text" NOT NULL,
    "request_description" "text",
    "request_data" "jsonb" DEFAULT '{}'::"jsonb",
    "requested_amount" numeric(12,2),
    "current_approver" "uuid",
    "approval_chain" "jsonb" DEFAULT '[]'::"jsonb",
    "approval_level" integer DEFAULT 1,
    "status" "text" DEFAULT 'pending'::"text",
    "priority" "text" DEFAULT 'normal'::"text",
    "due_date" timestamp without time zone,
    "approved_by" "uuid",
    "approved_at" timestamp without time zone,
    "approval_notes" "text",
    "rejection_reason" "text",
    "escalation_reason" "text",
    "approval_history" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "public"."approval_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."approval_workflows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid" NOT NULL,
    "approver_role" "public"."user_role_old" NOT NULL,
    "approver_id" "uuid",
    "approval_status" "public"."approval_status" DEFAULT 'pending'::"public"."approval_status" NOT NULL,
    "approval_date" timestamp with time zone,
    "comments" "text",
    "sequence_order" integer DEFAULT 1 NOT NULL,
    "delegated_to" "uuid",
    "delegated_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "approval_date_when_approved" CHECK (((("approval_status" = 'approved'::"public"."approval_status") AND ("approval_date" IS NOT NULL)) OR ("approval_status" <> 'approved'::"public"."approval_status")))
);


ALTER TABLE "public"."approval_workflows" OWNER TO "postgres";


COMMENT ON TABLE "public"."approval_workflows" IS 'Multi-step approval workflow for purchase requests';



COMMENT ON COLUMN "public"."approval_workflows"."sequence_order" IS 'Order of approval in workflow chain';



CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" "public"."audit_action" NOT NULL,
    "entity_type" "public"."audit_entity" NOT NULL,
    "entity_id" "uuid",
    "entity_name" "text",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_activity_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "activity_type" "public"."client_activity_type" NOT NULL,
    "resource_type" character varying(50),
    "resource_id" "uuid",
    "action_taken" character varying(100) NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "non_empty_action" CHECK (("length"(TRIM(BOTH FROM "action_taken")) > 0))
);


ALTER TABLE "public"."client_activity_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_activity_log" IS 'Comprehensive audit trail for all client portal activities';



COMMENT ON COLUMN "public"."client_activity_log"."metadata" IS 'Additional context data for activity logging';



CREATE TABLE IF NOT EXISTS "public"."client_communication_threads" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "subject" character varying(300) NOT NULL,
    "thread_type" "public"."client_thread_type" DEFAULT 'general'::"public"."client_thread_type",
    "priority" "public"."client_priority" DEFAULT 'medium'::"public"."client_priority",
    "status" "public"."client_thread_status" DEFAULT 'open'::"public"."client_thread_status",
    "internal_participants" "uuid"[] DEFAULT '{}'::"uuid"[],
    "client_participants" "uuid"[] DEFAULT '{}'::"uuid"[],
    "auto_close_after_days" integer,
    "requires_response" boolean DEFAULT false,
    "response_deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_message_at" timestamp with time zone DEFAULT "now"(),
    "closed_at" timestamp with time zone,
    "closed_by" "uuid",
    CONSTRAINT "non_empty_subject" CHECK (("length"(TRIM(BOTH FROM "subject")) > 0)),
    CONSTRAINT "positive_auto_close" CHECK ((("auto_close_after_days" > 0) OR ("auto_close_after_days" IS NULL))),
    CONSTRAINT "valid_response_deadline" CHECK ((("requires_response" = false) OR (("requires_response" = true) AND ("response_deadline" > "created_at"))))
);


ALTER TABLE "public"."client_communication_threads" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_communication_threads" IS 'Communication threads between clients and internal teams';



COMMENT ON COLUMN "public"."client_communication_threads"."internal_participants" IS 'Array of internal user IDs participating in thread';



COMMENT ON COLUMN "public"."client_communication_threads"."client_participants" IS 'Array of client user IDs participating in thread';



CREATE TABLE IF NOT EXISTS "public"."client_companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" character varying(200) NOT NULL,
    "company_type" "public"."client_company_type" NOT NULL,
    "contact_person" character varying(100),
    "primary_email" character varying(100),
    "primary_phone" character varying(20),
    "address" "text",
    "billing_address" "text",
    "tax_id" character varying(50),
    "is_active" boolean DEFAULT true,
    "logo_url" "text",
    "brand_colors" "jsonb",
    "custom_domain" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_email_format" CHECK (((("primary_email")::"text" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text") OR ("primary_email" IS NULL)))
);


ALTER TABLE "public"."client_companies" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_companies" IS 'Client companies with branding and configuration for portal access';



CREATE TABLE IF NOT EXISTS "public"."client_document_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "access_type" "public"."client_document_access_type" DEFAULT 'view'::"public"."client_document_access_type" NOT NULL,
    "can_download" boolean DEFAULT true,
    "can_comment" boolean DEFAULT true,
    "can_approve" boolean DEFAULT false,
    "watermarked" boolean DEFAULT false,
    "first_accessed" timestamp with time zone,
    "last_accessed" timestamp with time zone,
    "view_count" integer DEFAULT 0,
    "download_count" integer DEFAULT 0,
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "non_negative_counts" CHECK ((("view_count" >= 0) AND ("download_count" >= 0)))
);


ALTER TABLE "public"."client_document_access" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_document_access" IS 'Document-specific access control with tracking capabilities';



COMMENT ON COLUMN "public"."client_document_access"."watermarked" IS 'Whether documents should be watermarked for this client';



CREATE TABLE IF NOT EXISTS "public"."client_document_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "approval_decision" "public"."client_approval_decision" NOT NULL,
    "approval_date" timestamp with time zone DEFAULT "now"(),
    "approval_comments" "text",
    "approval_conditions" "text"[],
    "digital_signature" "jsonb",
    "document_version" integer NOT NULL,
    "revision_letter" character varying(5),
    "is_final" boolean DEFAULT true,
    "superseded_by" "uuid",
    "ip_address" "inet",
    "user_agent" "text",
    "session_id" character varying(100),
    CONSTRAINT "no_self_supersede" CHECK ((("superseded_by" <> "id") OR ("superseded_by" IS NULL))),
    CONSTRAINT "positive_version" CHECK (("document_version" > 0))
);


ALTER TABLE "public"."client_document_approvals" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_document_approvals" IS 'Client approval decisions with digital signatures and audit trail';



COMMENT ON COLUMN "public"."client_document_approvals"."digital_signature" IS 'JSON data for digital signature verification';



CREATE TABLE IF NOT EXISTS "public"."client_document_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "comment_text" "text" NOT NULL,
    "comment_type" "public"."client_comment_type" DEFAULT 'general'::"public"."client_comment_type" NOT NULL,
    "priority" "public"."client_priority" DEFAULT 'medium'::"public"."client_priority",
    "page_number" integer,
    "x_coordinate" numeric(10,3),
    "y_coordinate" numeric(10,3),
    "markup_data" "jsonb",
    "status" "public"."client_comment_status" DEFAULT 'open'::"public"."client_comment_status",
    "parent_comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    CONSTRAINT "no_self_parent" CHECK ((("parent_comment_id" <> "id") OR ("parent_comment_id" IS NULL))),
    CONSTRAINT "non_empty_comment" CHECK (("length"(TRIM(BOTH FROM "comment_text")) > 0)),
    CONSTRAINT "positive_page" CHECK ((("page_number" > 0) OR ("page_number" IS NULL))),
    CONSTRAINT "valid_coordinates" CHECK (((("x_coordinate" IS NULL) AND ("y_coordinate" IS NULL)) OR (("x_coordinate" IS NOT NULL) AND ("y_coordinate" IS NOT NULL) AND ("x_coordinate" >= (0)::numeric) AND ("y_coordinate" >= (0)::numeric))))
);


ALTER TABLE "public"."client_document_comments" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_document_comments" IS 'Client comments and markups on documents with positioning data';



COMMENT ON COLUMN "public"."client_document_comments"."markup_data" IS 'JSON data for document markup and annotations';



CREATE TABLE IF NOT EXISTS "public"."client_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "message_body" "text" NOT NULL,
    "message_type" "public"."client_message_type" DEFAULT 'text'::"public"."client_message_type",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    CONSTRAINT "non_empty_message" CHECK (("length"(TRIM(BOTH FROM "message_body")) > 0))
);


ALTER TABLE "public"."client_messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_messages" IS 'Individual messages within communication threads';



CREATE TABLE IF NOT EXISTS "public"."client_notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "project_id" "uuid",
    "title" character varying(200) NOT NULL,
    "message" "text" NOT NULL,
    "notification_type" "public"."client_notification_type" NOT NULL,
    "priority" "public"."client_priority" DEFAULT 'medium'::"public"."client_priority",
    "delivery_method" "public"."client_delivery_method"[] DEFAULT ARRAY['in_app'::"public"."client_delivery_method"],
    "email_sent" boolean DEFAULT false,
    "sms_sent" boolean DEFAULT false,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "dismissed" boolean DEFAULT false,
    "dismissed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "scheduled_for" timestamp with time zone DEFAULT "now"(),
    "sent_at" timestamp with time zone,
    CONSTRAINT "non_empty_message" CHECK (("length"(TRIM(BOTH FROM "message")) > 0)),
    CONSTRAINT "non_empty_title" CHECK (("length"(TRIM(BOTH FROM "title")) > 0)),
    CONSTRAINT "valid_delivery_array" CHECK (("array_length"("delivery_method", 1) > 0))
);


ALTER TABLE "public"."client_notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_notifications" IS 'Multi-channel notification system for client communications';



COMMENT ON COLUMN "public"."client_notifications"."delivery_method" IS 'Array of delivery methods (in_app, email, sms, push)';



CREATE TABLE IF NOT EXISTS "public"."client_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "permission_type" "public"."client_permission_type" NOT NULL,
    "resource_type" character varying(50) NOT NULL,
    "resource_id" "uuid",
    "project_specific" boolean DEFAULT true,
    "allowed_actions" "text"[] NOT NULL,
    "conditions" "jsonb" DEFAULT '{}'::"jsonb",
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "non_empty_actions" CHECK (("array_length"("allowed_actions", 1) > 0))
);


ALTER TABLE "public"."client_permissions" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_permissions" IS 'Granular permissions system for client portal features';



CREATE TABLE IF NOT EXISTS "public"."client_project_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "access_level" "public"."client_project_access_level" DEFAULT 'viewer'::"public"."client_project_access_level" NOT NULL,
    "can_view_financials" boolean DEFAULT false,
    "can_approve_documents" boolean DEFAULT false,
    "can_view_schedules" boolean DEFAULT true,
    "can_access_reports" boolean DEFAULT true,
    "restricted_areas" "text"[],
    "access_start_date" "date",
    "access_end_date" "date",
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed" timestamp with time zone,
    CONSTRAINT "valid_access_dates" CHECK (((("access_start_date" IS NULL) AND ("access_end_date" IS NULL)) OR (("access_start_date" IS NOT NULL) AND ("access_end_date" IS NOT NULL) AND ("access_end_date" >= "access_start_date"))))
);


ALTER TABLE "public"."client_project_access" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_project_access" IS 'Project-specific access control for client users';



COMMENT ON COLUMN "public"."client_project_access"."restricted_areas" IS 'Array of project areas client cannot access';



CREATE TABLE IF NOT EXISTS "public"."client_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "client_company_id" "uuid" NOT NULL,
    "access_level" "public"."client_access_level" DEFAULT 'view_only'::"public"."client_access_level" NOT NULL,
    "portal_access_enabled" boolean DEFAULT true,
    "last_login" timestamp with time zone,
    "login_attempts" integer DEFAULT 0,
    "account_locked" boolean DEFAULT false,
    "password_reset_required" boolean DEFAULT false,
    "two_factor_enabled" boolean DEFAULT false,
    "notification_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "language" character varying(10) DEFAULT 'en'::character varying,
    "timezone" character varying(50) DEFAULT 'UTC'::character varying,
    "theme" character varying(20) DEFAULT 'light'::character varying,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_activity" timestamp with time zone,
    CONSTRAINT "valid_language" CHECK ((("language")::"text" ~ '^[a-z]{2}$'::"text")),
    CONSTRAINT "valid_login_attempts" CHECK (("login_attempts" >= 0))
);


ALTER TABLE "public"."client_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."client_users" IS 'External client users with separate authentication and security controls';



COMMENT ON COLUMN "public"."client_users"."user_profile_id" IS 'References auth.users for external client authentication';



COMMENT ON COLUMN "public"."client_users"."portal_access_enabled" IS 'Master switch for client portal access';



COMMENT ON COLUMN "public"."client_users"."two_factor_enabled" IS 'Enhanced security for external client access';



CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "company_name" "text" NOT NULL,
    "contact_person" "text" NOT NULL,
    "billing_address" "text",
    "project_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


COMMENT ON TABLE "public"."clients" IS 'Client company information and project preferences';



CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "client_id" "uuid",
    "project_manager_id" "uuid",
    "status" "public"."project_status" DEFAULT 'planning'::"public"."project_status",
    "start_date" "date",
    "end_date" "date",
    "budget" numeric(12,2),
    "actual_cost" numeric(12,2) DEFAULT 0.00,
    "location" "text",
    "project_type" "text",
    "priority" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


COMMENT ON TABLE "public"."projects" IS 'Main project management table with budget tracking and timeline management';



CREATE TABLE IF NOT EXISTS "public"."scope_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "category" "public"."scope_category" NOT NULL,
    "item_no" integer NOT NULL,
    "item_code" "text",
    "description" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(12,2) GENERATED ALWAYS AS (("quantity" * "unit_price")) STORED,
    "initial_cost" numeric(12,2),
    "actual_cost" numeric(12,2),
    "cost_variance" numeric(12,2) GENERATED ALWAYS AS (("actual_cost" - "initial_cost")) STORED,
    "title" "text",
    "specifications" "text",
    "unit_of_measure" "text",
    "markup_percentage" numeric(5,2) DEFAULT 0,
    "final_price" numeric(12,2) GENERATED ALWAYS AS ((("quantity" * "unit_price") * ((1)::numeric + ("markup_percentage" / (100)::numeric)))) STORED,
    "timeline_start" "date",
    "timeline_end" "date",
    "duration_days" integer,
    "progress_percentage" integer DEFAULT 0,
    "status" "public"."scope_status" DEFAULT 'not_started'::"public"."scope_status",
    "assigned_to" "uuid"[] DEFAULT '{}'::"uuid"[],
    "supplier_id" "uuid",
    "dependencies" "uuid"[] DEFAULT '{}'::"uuid"[],
    "priority" integer DEFAULT 1,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "positive_quantity" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "positive_unit_price" CHECK (("unit_price" >= (0)::numeric)),
    CONSTRAINT "scope_items_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100)))
);


ALTER TABLE "public"."scope_items" OWNER TO "postgres";


COMMENT ON TABLE "public"."scope_items" IS 'Detailed scope items with cost tracking and business logic requirements';



COMMENT ON COLUMN "public"."scope_items"."item_no" IS 'Auto-generated sequential number per project for item identification';



COMMENT ON COLUMN "public"."scope_items"."item_code" IS 'Client-provided code for external system integration (nullable)';



COMMENT ON COLUMN "public"."scope_items"."description" IS 'Required detailed description of the scope item';



COMMENT ON COLUMN "public"."scope_items"."initial_cost" IS 'Original estimated cost - restricted access to technical office and purchasing';



COMMENT ON COLUMN "public"."scope_items"."actual_cost" IS 'Real incurred cost - restricted access to technical office and purchasing';



COMMENT ON COLUMN "public"."scope_items"."cost_variance" IS 'Computed variance between actual and initial cost';



COMMENT ON COLUMN "public"."scope_items"."assigned_to" IS 'Array of user IDs assigned to work on this scope item';



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "role" "public"."user_role_old" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "phone" "text",
    "company" "text",
    "department" "text",
    "hire_date" "date",
    "is_active" boolean DEFAULT true,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "seniority_level" "text" DEFAULT 'regular'::"text",
    "approval_limits" "jsonb" DEFAULT '{}'::"jsonb",
    "dashboard_preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "previous_role" "public"."user_role_old",
    "role_migrated_at" timestamp without time zone
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_profiles" IS 'Extended user profile information for all 13 user types with role-based permissions';



CREATE OR REPLACE VIEW "public"."company_project_overview" AS
 SELECT "p"."id",
    "p"."name",
    "p"."status",
    "p"."budget",
    "p"."actual_cost",
    "p"."start_date",
    "p"."end_date",
    (("pm"."first_name" || ' '::"text") || "pm"."last_name") AS "project_manager_name",
    "pm"."seniority_level" AS "pm_seniority",
    "c"."company_name" AS "client_name",
    "avg"("si"."progress_percentage") AS "overall_progress",
    "count"(DISTINCT "si"."id") AS "total_scope_items",
    "count"(DISTINCT
        CASE
            WHEN ("si"."status" = 'completed'::"public"."scope_status") THEN "si"."id"
            ELSE NULL::"uuid"
        END) AS "completed_scope_items",
    (("p"."actual_cost" / NULLIF("p"."budget", (0)::numeric)) * (100)::numeric) AS "budget_utilization_percentage",
        CASE
            WHEN (("p"."end_date" < CURRENT_DATE) AND ("p"."status" <> 'completed'::"public"."project_status")) THEN 'overdue'::"text"
            WHEN (("p"."end_date" - CURRENT_DATE) <= 7) THEN 'due_soon'::"text"
            ELSE 'on_track'::"text"
        END AS "timeline_status",
        CASE
            WHEN (("p"."actual_cost" / NULLIF("p"."budget", (0)::numeric)) > 1.1) THEN 'budget_risk'::"text"
            WHEN (("avg"("si"."progress_percentage") < (50)::numeric) AND (("p"."end_date" - CURRENT_DATE) <= 30)) THEN 'timeline_risk'::"text"
            ELSE 'normal'::"text"
        END AS "risk_level",
    "p"."updated_at"
   FROM ((("public"."projects" "p"
     LEFT JOIN "public"."user_profiles" "pm" ON (("p"."project_manager_id" = "pm"."id")))
     LEFT JOIN "public"."clients" "c" ON (("p"."client_id" = "c"."id")))
     LEFT JOIN "public"."scope_items" "si" ON (("p"."id" = "si"."project_id")))
  GROUP BY "p"."id", "p"."name", "p"."status", "p"."budget", "p"."actual_cost", "p"."start_date", "p"."end_date", "pm"."first_name", "pm"."last_name", "pm"."seniority_level", "c"."company_name", "p"."updated_at";


ALTER VIEW "public"."company_project_overview" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_widgets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."user_role_old" NOT NULL,
    "widget_name" "text" NOT NULL,
    "widget_type" "text" NOT NULL,
    "position" integer NOT NULL,
    "size" "text" DEFAULT 'medium'::"text",
    "config" "jsonb" DEFAULT '{}'::"jsonb",
    "is_default" boolean DEFAULT true,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."dashboard_widgets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."delivery_confirmations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_order_id" "uuid" NOT NULL,
    "confirmed_by" "uuid" NOT NULL,
    "delivery_date" "date" NOT NULL,
    "quantity_received" numeric(10,2) NOT NULL,
    "quantity_ordered" numeric(10,2) NOT NULL,
    "condition_notes" "text",
    "photos" "text"[],
    "status" "public"."delivery_status" DEFAULT 'pending'::"public"."delivery_status" NOT NULL,
    "quality_assessment" "text",
    "damage_reported" boolean DEFAULT false,
    "rejection_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "delivery_confirmations_quantity_ordered_check" CHECK (("quantity_ordered" > (0)::numeric)),
    CONSTRAINT "delivery_confirmations_quantity_received_check" CHECK (("quantity_received" >= (0)::numeric)),
    CONSTRAINT "delivery_date_not_future" CHECK (("delivery_date" <= CURRENT_DATE)),
    CONSTRAINT "positive_quantities" CHECK ((("quantity_received" >= (0)::numeric) AND ("quantity_ordered" > (0)::numeric))),
    CONSTRAINT "rejection_reason_when_rejected" CHECK (((("status" = 'rejected'::"public"."delivery_status") AND ("rejection_reason" IS NOT NULL)) OR ("status" <> 'rejected'::"public"."delivery_status")))
);


ALTER TABLE "public"."delivery_confirmations" OWNER TO "postgres";


COMMENT ON TABLE "public"."delivery_confirmations" IS 'Delivery confirmation with photo documentation';



COMMENT ON COLUMN "public"."delivery_confirmations"."photos" IS 'Array of photo URLs for delivery documentation';



CREATE TABLE IF NOT EXISTS "public"."document_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid",
    "approver_id" "uuid",
    "approver_type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "comments" "text",
    "approved_at" timestamp with time zone,
    "version" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_approvals" OWNER TO "postgres";


COMMENT ON TABLE "public"."document_approvals" IS 'Approval workflow for documents with internal and client approval tracking';



CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "scope_item_id" "uuid",
    "document_type" "public"."document_type" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "file_path" "text",
    "file_size" integer,
    "mime_type" "text",
    "version" integer DEFAULT 1,
    "status" "public"."document_status" DEFAULT 'draft'::"public"."document_status",
    "is_client_visible" boolean DEFAULT false,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


COMMENT ON TABLE "public"."documents" IS 'Document management with version control and client visibility settings';



CREATE TABLE IF NOT EXISTS "public"."drawing_sets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "set_name" "text" NOT NULL,
    "description" "text",
    "purpose" "text",
    "drawing_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "is_locked" boolean DEFAULT false,
    "submitted_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."drawing_sets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "scope_item_id" "uuid",
    "field_report_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "file_path" "text" NOT NULL,
    "thumbnail_path" "text",
    "file_size" integer,
    "width" integer,
    "height" integer,
    "location_lat" numeric(10,8),
    "location_lng" numeric(11,8),
    "location_accuracy" numeric(6,2),
    "device_id" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "is_annotated" boolean DEFAULT false,
    "annotation_data" "jsonb",
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."field_photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."field_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "report_type" "public"."report_type" NOT NULL,
    "report_date" "date" NOT NULL,
    "submitted_by" "uuid",
    "weather_conditions" "text",
    "workers_present" integer,
    "work_performed" "text" NOT NULL,
    "issues_encountered" "text",
    "materials_used" "jsonb" DEFAULT '[]'::"jsonb",
    "equipment_used" "jsonb" DEFAULT '[]'::"jsonb",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "safety_incidents" integer DEFAULT 0,
    "incident_details" "text",
    "next_steps" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."field_reports" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."index_performance_stats" AS
 SELECT "schemaname",
    "tablename",
    "indexname",
    "idx_scans",
    "idx_tup_read",
    "idx_tup_fetch",
        CASE
            WHEN ("idx_scans" = 0) THEN (0)::numeric
            ELSE "round"((("idx_tup_read")::numeric / ("idx_scans")::numeric), 2)
        END AS "avg_tuples_per_scan"
   FROM "public"."track_index_usage"() "track_index_usage"("schemaname", "tablename", "indexname", "idx_scans", "idx_tup_read", "idx_tup_fetch")
  WHERE ("idx_scans" > 0);


ALTER VIEW "public"."index_performance_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."material_specs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "supplier_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "subcategory" "text",
    "brand" "text",
    "model" "text",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "unit_of_measure" "text" NOT NULL,
    "estimated_cost" numeric(15,2),
    "actual_cost" numeric(15,2),
    "quantity_required" integer DEFAULT 1,
    "quantity_available" integer DEFAULT 0,
    "minimum_stock_level" integer DEFAULT 0,
    "status" "public"."material_status" DEFAULT 'pending_approval'::"public"."material_status",
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level",
    "approval_notes" "text",
    "approved_by" "uuid",
    "approved_at" timestamp with time zone,
    "rejected_by" "uuid",
    "rejected_at" timestamp with time zone,
    "rejection_reason" "text",
    "substitution_notes" "text",
    "lead_time_days" integer DEFAULT 0,
    "delivery_date" "date",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_material_approval_consistency" CHECK (((("status" = 'approved'::"public"."material_status") AND ("approved_by" IS NOT NULL) AND ("approved_at" IS NOT NULL)) OR (("status" <> 'approved'::"public"."material_status") AND (("approved_by" IS NULL) OR ("approved_at" IS NULL))))),
    CONSTRAINT "ck_material_lead_time" CHECK (("lead_time_days" >= 0)),
    CONSTRAINT "ck_material_positive_costs" CHECK (((("estimated_cost" IS NULL) OR ("estimated_cost" >= (0)::numeric)) AND (("actual_cost" IS NULL) OR ("actual_cost" >= (0)::numeric)))),
    CONSTRAINT "ck_material_positive_quantities" CHECK ((("quantity_required" >= 0) AND ("quantity_available" >= 0) AND ("minimum_stock_level" >= 0))),
    CONSTRAINT "ck_material_rejection_consistency" CHECK (((("status" = 'rejected'::"public"."material_status") AND ("rejected_by" IS NOT NULL) AND ("rejected_at" IS NOT NULL)) OR (("status" <> 'rejected'::"public"."material_status") AND (("rejected_by" IS NULL) OR ("rejected_at" IS NULL)))))
);


ALTER TABLE "public"."material_specs" OWNER TO "postgres";


COMMENT ON TABLE "public"."material_specs" IS 'Material specifications with approval workflow for project materials';



COMMENT ON COLUMN "public"."material_specs"."id" IS 'Unique identifier for the material specification';



COMMENT ON COLUMN "public"."material_specs"."project_id" IS 'Reference to the associated project';



COMMENT ON COLUMN "public"."material_specs"."supplier_id" IS 'Reference to the supplier of this material';



COMMENT ON COLUMN "public"."material_specs"."name" IS 'Name of the material (e.g., "Rebar #4", "Concrete Mix")';



COMMENT ON COLUMN "public"."material_specs"."description" IS 'Detailed description of the material';



COMMENT ON COLUMN "public"."material_specs"."category" IS 'Material category (e.g., "Steel", "Concrete", "Electrical")';



COMMENT ON COLUMN "public"."material_specs"."subcategory" IS 'Material subcategory for more specific classification';



COMMENT ON COLUMN "public"."material_specs"."brand" IS 'Brand name of the material';



COMMENT ON COLUMN "public"."material_specs"."model" IS 'Model number or specification code';



COMMENT ON COLUMN "public"."material_specs"."specifications" IS 'Technical specifications stored as JSON';



COMMENT ON COLUMN "public"."material_specs"."unit_of_measure" IS 'Unit of measurement (e.g., "kg", "m", "pieces")';



COMMENT ON COLUMN "public"."material_specs"."estimated_cost" IS 'Estimated cost per unit';



COMMENT ON COLUMN "public"."material_specs"."actual_cost" IS 'Actual cost per unit after procurement';



COMMENT ON COLUMN "public"."material_specs"."quantity_required" IS 'Total quantity required for the project';



COMMENT ON COLUMN "public"."material_specs"."quantity_available" IS 'Quantity currently available in stock';



COMMENT ON COLUMN "public"."material_specs"."minimum_stock_level" IS 'Minimum stock level to maintain';



COMMENT ON COLUMN "public"."material_specs"."status" IS 'Approval status of the material specification';



COMMENT ON COLUMN "public"."material_specs"."priority" IS 'Priority level for approval and procurement';



COMMENT ON COLUMN "public"."material_specs"."approval_notes" IS 'Notes added during approval process';



COMMENT ON COLUMN "public"."material_specs"."approved_by" IS 'User who approved the material specification';



COMMENT ON COLUMN "public"."material_specs"."approved_at" IS 'Timestamp when material was approved';



COMMENT ON COLUMN "public"."material_specs"."rejected_by" IS 'User who rejected the material specification';



COMMENT ON COLUMN "public"."material_specs"."rejected_at" IS 'Timestamp when material was rejected';



COMMENT ON COLUMN "public"."material_specs"."rejection_reason" IS 'Reason for rejection';



COMMENT ON COLUMN "public"."material_specs"."substitution_notes" IS 'Notes about material substitution requirements';



COMMENT ON COLUMN "public"."material_specs"."lead_time_days" IS 'Expected lead time in days for delivery';



COMMENT ON COLUMN "public"."material_specs"."delivery_date" IS 'Expected or actual delivery date';



COMMENT ON COLUMN "public"."material_specs"."created_by" IS 'User who created the material specification';



COMMENT ON COLUMN "public"."material_specs"."created_at" IS 'Timestamp when material specification was created';



COMMENT ON COLUMN "public"."material_specs"."updated_at" IS 'Timestamp when material specification was last updated';



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "sender_id" "uuid",
    "recipient_id" "uuid",
    "subject" "text",
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "parent_message_id" "uuid",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migration_log" (
    "id" integer NOT NULL,
    "migration_name" character varying(255) NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."migration_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."migration_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."migration_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."migration_log_id_seq" OWNED BY "public"."migration_log"."id";



CREATE TABLE IF NOT EXISTS "public"."role_migration_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "old_role" "text",
    "new_role" "text",
    "seniority_level" "text",
    "conversion_type" "text",
    "migrated_at" timestamp without time zone DEFAULT "now"(),
    "migration_notes" "text"
);


ALTER TABLE "public"."role_migration_log" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."migration_summary" AS
 SELECT "old_role",
    "new_role",
    "count"(*) AS "user_count",
    "min"("migrated_at") AS "first_migration",
    "max"("migrated_at") AS "last_migration"
   FROM "public"."role_migration_log"
  GROUP BY "old_role", "new_role"
  ORDER BY "old_role";


ALTER VIEW "public"."migration_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."migrations" (
    "version" "text" NOT NULL,
    "name" "text" NOT NULL,
    "executed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."migrations" OWNER TO "postgres";


COMMENT ON TABLE "public"."migrations" IS 'Tracks database migration execution for version control';



CREATE TABLE IF NOT EXISTS "public"."mobile_devices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "device_id" "text" NOT NULL,
    "device_type" "text" NOT NULL,
    "device_model" "text",
    "app_version" "text",
    "push_token" "text",
    "last_sync_at" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mobile_devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_form_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_id" "uuid",
    "project_id" "uuid",
    "scope_item_id" "uuid",
    "submitted_by" "uuid",
    "device_id" "text",
    "form_data" "jsonb" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "location_lat" numeric(10,8),
    "location_lng" numeric(11,8),
    "offline_created_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mobile_form_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_forms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "form_type" "text" NOT NULL,
    "template_name" "text" NOT NULL,
    "fields" "jsonb" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mobile_forms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."mobile_sync_queue" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "device_id" "text",
    "user_id" "uuid",
    "action_type" "text" NOT NULL,
    "entity_type" "text" NOT NULL,
    "entity_id" "uuid",
    "payload" "jsonb" NOT NULL,
    "sync_status" "public"."sync_status" DEFAULT 'pending'::"public"."sync_status",
    "retry_count" integer DEFAULT 0,
    "error_message" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "synced_at" timestamp with time zone
);


ALTER TABLE "public"."mobile_sync_queue" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "public"."notification_type" NOT NULL,
    "priority" "public"."notification_priority" DEFAULT 'medium'::"public"."notification_priority",
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "entity_type" "public"."audit_entity",
    "entity_id" "uuid",
    "action_url" "text",
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."performance_dashboard" AS
 SELECT 'Connection Stats'::"text" AS "metric_type",
    "json_build_object"('total_connections', "cs"."total_connections", 'active_connections', "cs"."active_connections", 'idle_connections', "cs"."idle_connections", 'utilization_percent', "cs"."connection_utilization") AS "metrics",
    "now"() AS "measured_at"
   FROM "public"."get_connection_stats"() "cs"("total_connections", "active_connections", "idle_connections", "max_connections", "connection_utilization")
UNION ALL
 SELECT 'Cache Hit Ratios'::"text" AS "metric_type",
    "json_build_object"('buffer_cache_hit_ratio', "chr"."buffer_cache_hit_ratio", 'index_cache_hit_ratio', "chr"."index_cache_hit_ratio", 'table_cache_hit_ratio', "chr"."table_cache_hit_ratio") AS "metrics",
    "now"() AS "measured_at"
   FROM "public"."get_cache_hit_ratio"() "chr"("buffer_cache_hit_ratio", "index_cache_hit_ratio", "table_cache_hit_ratio");


ALTER VIEW "public"."performance_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permission_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "role" "public"."user_role_old" NOT NULL,
    "permissions" "jsonb" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permission_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "user_id" "uuid",
    "role" "text" NOT NULL,
    "responsibilities" "text"[],
    "assigned_by" "uuid",
    "assigned_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "assignment_type" "text" DEFAULT 'regular_pm'::"text",
    "can_approve_others" boolean DEFAULT false,
    "approval_scope" "jsonb" DEFAULT '{}'::"jsonb",
    "reporting_to" "uuid"
);


ALTER TABLE "public"."project_assignments" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_assignments" IS 'Team member assignments to projects with role-based responsibilities';



CREATE OR REPLACE VIEW "public"."pm_workload_overview" AS
 SELECT "up"."id" AS "pm_id",
    (("up"."first_name" || ' '::"text") || "up"."last_name") AS "pm_name",
    "up"."seniority_level",
    "up"."approval_limits",
    "count"(DISTINCT "pa"."project_id") AS "total_assigned_projects",
    "count"(DISTINCT
        CASE
            WHEN ("p"."status" = 'active'::"public"."project_status") THEN "pa"."project_id"
            ELSE NULL::"uuid"
        END) AS "active_projects",
    "count"(DISTINCT
        CASE
            WHEN ("p"."status" = 'planning'::"public"."project_status") THEN "pa"."project_id"
            ELSE NULL::"uuid"
        END) AS "planning_projects",
    "avg"(
        CASE
            WHEN ("p"."status" = 'completed'::"public"."project_status") THEN
            CASE
                WHEN ("p"."end_date" >= CURRENT_DATE) THEN 100
                ELSE GREATEST(0, (100 - ((CURRENT_DATE - "p"."end_date") * 2)))
            END
            ELSE NULL::integer
        END) AS "timeline_performance_score",
    "avg"(
        CASE
            WHEN ("p"."budget" > (0)::numeric) THEN GREATEST((0)::numeric, ((100)::numeric - "abs"(((("p"."actual_cost" - "p"."budget") / "p"."budget") * (100)::numeric))))
            ELSE NULL::numeric
        END) AS "budget_performance_score",
    "sum"("p"."budget") AS "total_budget_managed",
    "sum"("p"."actual_cost") AS "total_actual_cost",
    "count"(DISTINCT "ar"."id") AS "pending_approvals",
    "max"("p"."updated_at") AS "last_project_update",
    "count"(DISTINCT
        CASE
            WHEN ("ar"."created_at" > ("now"() - '7 days'::interval)) THEN "ar"."id"
            ELSE NULL::"uuid"
        END) AS "approvals_this_week"
   FROM ((("public"."user_profiles" "up"
     LEFT JOIN "public"."project_assignments" "pa" ON ((("up"."id" = "pa"."user_id") AND ("pa"."is_active" = true))))
     LEFT JOIN "public"."projects" "p" ON (("pa"."project_id" = "p"."id")))
     LEFT JOIN "public"."approval_requests" "ar" ON ((("up"."id" = "ar"."current_approver") AND ("ar"."status" = 'pending'::"text"))))
  WHERE ("up"."role" = 'project_manager'::"public"."user_role_old")
  GROUP BY "up"."id", "up"."first_name", "up"."last_name", "up"."seniority_level", "up"."approval_limits";


ALTER VIEW "public"."pm_workload_overview" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."policy_count_validation" AS
 SELECT "tablename",
    "count"(*) AS "policy_count"
   FROM "pg_policies"
  WHERE (("schemaname" = 'public'::"name") AND ("tablename" = ANY (ARRAY['user_profiles'::"name", 'projects'::"name", 'project_assignments'::"name", 'scope_items'::"name", 'clients'::"name", 'subcontractors'::"name", 'subcontractor_assignments'::"name", 'approval_requests'::"name"])))
  GROUP BY "tablename"
  ORDER BY "tablename";


ALTER VIEW "public"."policy_count_validation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "priority" "public"."notification_priority" DEFAULT 'medium'::"public"."notification_priority",
    "target_roles" "public"."user_role_old"[] DEFAULT '{}'::"public"."user_role_old"[],
    "is_pinned" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."project_announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."project_milestones" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "title" character varying(200) NOT NULL,
    "description" "text",
    "milestone_date" "date" NOT NULL,
    "status" "public"."milestone_status" DEFAULT 'not_started'::"public"."milestone_status" NOT NULL,
    "created_by" "uuid",
    "milestone_type" "public"."milestone_type" DEFAULT 'phase_completion'::"public"."milestone_type" NOT NULL,
    "dependencies" "text"[],
    "completion_percentage" numeric(5,2) DEFAULT 0.00,
    "actual_completion_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "completion_date_logic" CHECK (((("status" = 'completed'::"public"."milestone_status") AND ("actual_completion_date" IS NOT NULL)) OR ("status" <> 'completed'::"public"."milestone_status"))),
    CONSTRAINT "valid_completion_percentage" CHECK ((("completion_percentage" >= (0)::numeric) AND ("completion_percentage" <= (100)::numeric)))
);


ALTER TABLE "public"."project_milestones" OWNER TO "postgres";


COMMENT ON TABLE "public"."project_milestones" IS 'Project milestones for tracking major phases and deliverables';



COMMENT ON COLUMN "public"."project_milestones"."milestone_type" IS 'Type of milestone for categorization and filtering';



COMMENT ON COLUMN "public"."project_milestones"."dependencies" IS 'Array of scope item codes or milestone IDs that must be completed before this milestone';



CREATE SEQUENCE IF NOT EXISTS "public"."purchase_order_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchase_order_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "purchase_request_id" "uuid" NOT NULL,
    "po_number" character varying(50) NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "po_date" "date" NOT NULL,
    "expected_delivery_date" "date",
    "status" "public"."po_status" DEFAULT 'draft'::"public"."po_status" NOT NULL,
    "terms_conditions" "text",
    "email_sent_at" timestamp with time zone,
    "phone_confirmed_at" timestamp with time zone,
    "phone_confirmed_by" "uuid",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "future_delivery_date" CHECK ((("expected_delivery_date" >= "po_date") OR ("expected_delivery_date" IS NULL))),
    CONSTRAINT "positive_total_amount" CHECK (("total_amount" >= (0)::numeric)),
    CONSTRAINT "purchase_orders_total_amount_check" CHECK (("total_amount" >= (0)::numeric))
);


ALTER TABLE "public"."purchase_orders" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_orders" IS 'Purchase orders with vendor communication tracking';



COMMENT ON COLUMN "public"."purchase_orders"."po_number" IS 'Auto-generated unique purchase order number (PO-YYYY-NNNNN)';



CREATE SEQUENCE IF NOT EXISTS "public"."purchase_request_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."purchase_request_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."purchase_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "requester_id" "uuid" NOT NULL,
    "request_number" character varying(50) NOT NULL,
    "item_description" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_of_measure" character varying(20) NOT NULL,
    "estimated_cost" numeric(10,2),
    "required_date" "date" NOT NULL,
    "urgency_level" "public"."urgency_level" DEFAULT 'normal'::"public"."urgency_level" NOT NULL,
    "justification" "text",
    "status" "public"."request_status" DEFAULT 'draft'::"public"."request_status" NOT NULL,
    "budget_code" character varying(50),
    "cost_center" character varying(50),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "future_required_date" CHECK (("required_date" >= CURRENT_DATE)),
    CONSTRAINT "positive_estimated_cost" CHECK ((("estimated_cost" >= (0)::numeric) OR ("estimated_cost" IS NULL))),
    CONSTRAINT "positive_quantity" CHECK (("quantity" > (0)::numeric)),
    CONSTRAINT "purchase_requests_quantity_check" CHECK (("quantity" > (0)::numeric))
);


ALTER TABLE "public"."purchase_requests" OWNER TO "postgres";


COMMENT ON TABLE "public"."purchase_requests" IS 'Purchase requests with approval workflow and budget tracking';



COMMENT ON COLUMN "public"."purchase_requests"."request_number" IS 'Auto-generated unique request number (PR-YYYY-NNNNN)';



COMMENT ON COLUMN "public"."purchase_requests"."urgency_level" IS 'Request urgency affecting approval workflow';



CREATE TABLE IF NOT EXISTS "public"."scope_dependencies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scope_item_id" "uuid",
    "depends_on_id" "uuid",
    "dependency_type" "text" DEFAULT 'blocks'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."scope_dependencies" OWNER TO "postgres";


COMMENT ON TABLE "public"."scope_dependencies" IS 'Dependency relationships between scope items for timeline management';



CREATE OR REPLACE VIEW "public"."scope_items_no_cost" AS
 SELECT "id",
    "project_id",
    "category",
    "item_no",
    "item_code",
    "description",
    "quantity",
    "title",
    "specifications",
    "unit_of_measure",
    "timeline_start",
    "timeline_end",
    "duration_days",
    "progress_percentage",
    "status",
    "assigned_to",
    "dependencies",
    "priority",
    "metadata",
    "created_by",
    "created_at",
    "updated_at",
        CASE
            WHEN "public"."has_cost_access"() THEN "unit_price"
            ELSE NULL::numeric
        END AS "unit_price",
        CASE
            WHEN "public"."has_cost_access"() THEN "total_price"
            ELSE NULL::numeric
        END AS "total_price",
        CASE
            WHEN "public"."has_cost_access"() THEN "initial_cost"
            ELSE NULL::numeric
        END AS "initial_cost",
        CASE
            WHEN "public"."has_cost_access"() THEN "actual_cost"
            ELSE NULL::numeric
        END AS "actual_cost",
        CASE
            WHEN "public"."has_cost_access"() THEN "cost_variance"
            ELSE NULL::numeric
        END AS "cost_variance",
        CASE
            WHEN "public"."has_cost_access"() THEN "markup_percentage"
            ELSE NULL::numeric
        END AS "markup_percentage",
        CASE
            WHEN "public"."has_cost_access"() THEN "final_price"
            ELSE NULL::numeric
        END AS "final_price"
   FROM "public"."scope_items";


ALTER VIEW "public"."scope_items_no_cost" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scope_material_links" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "scope_item_id" "uuid",
    "material_spec_id" "uuid",
    "quantity_needed" integer DEFAULT 1 NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "ck_scope_material_quantity" CHECK (("quantity_needed" > 0))
);


ALTER TABLE "public"."scope_material_links" OWNER TO "postgres";


COMMENT ON TABLE "public"."scope_material_links" IS 'Links between scope items and material specifications';



COMMENT ON COLUMN "public"."scope_material_links"."id" IS 'Unique identifier for the link';



COMMENT ON COLUMN "public"."scope_material_links"."scope_item_id" IS 'Reference to the scope item';



COMMENT ON COLUMN "public"."scope_material_links"."material_spec_id" IS 'Reference to the material specification';



COMMENT ON COLUMN "public"."scope_material_links"."quantity_needed" IS 'Quantity of this material needed for the scope item';



COMMENT ON COLUMN "public"."scope_material_links"."notes" IS 'Additional notes about the material usage for this scope item';



COMMENT ON COLUMN "public"."scope_material_links"."created_at" IS 'Timestamp when link was created';



COMMENT ON COLUMN "public"."scope_material_links"."updated_at" IS 'Timestamp when link was last updated';



CREATE TABLE IF NOT EXISTS "public"."shop_drawing_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_drawing_id" "uuid",
    "approval_level" "text" NOT NULL,
    "approver_id" "uuid",
    "status" "text" NOT NULL,
    "comments" "text",
    "conditions" "text",
    "approved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shop_drawing_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_drawing_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_drawing_id" "uuid",
    "comment_type" "public"."comment_type" NOT NULL,
    "comment" "text" NOT NULL,
    "x_coordinate" numeric(6,2),
    "y_coordinate" numeric(6,2),
    "page_number" integer DEFAULT 1,
    "markup_data" "jsonb",
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "is_resolved" boolean DEFAULT false,
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shop_drawing_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_drawing_revisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shop_drawing_id" "uuid",
    "revision" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "file_path" "text" NOT NULL,
    "file_size" integer,
    "changes_summary" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shop_drawing_revisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shop_drawings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "scope_item_id" "uuid",
    "drawing_number" "text" NOT NULL,
    "title" "text" NOT NULL,
    "discipline" "public"."drawing_discipline" NOT NULL,
    "description" "text",
    "revision" "text" DEFAULT 'A'::"text",
    "status" "public"."shop_drawing_status" DEFAULT 'draft'::"public"."shop_drawing_status",
    "scale" "text",
    "size" "text",
    "original_file_path" "text",
    "current_file_path" "text",
    "file_size" integer,
    "thumbnail_path" "text",
    "created_by" "uuid",
    "assigned_architect" "uuid",
    "internal_approved_by" "uuid",
    "internal_approved_at" timestamp with time zone,
    "submitted_to_client_at" timestamp with time zone,
    "client_approved_by" "uuid",
    "client_approved_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shop_drawings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcontractor_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subcontractor_id" "uuid",
    "scope_item_id" "uuid",
    "project_id" "uuid",
    "assigned_by" "uuid",
    "assignment_type" "text" DEFAULT 'task'::"text",
    "agreed_rate" numeric(10,2),
    "rate_type" "text" DEFAULT 'hourly'::"text",
    "estimated_hours" integer,
    "actual_hours" integer DEFAULT 0,
    "estimated_cost" numeric(10,2),
    "actual_cost" numeric(10,2) DEFAULT 0.00,
    "start_date" "date",
    "end_date" "date",
    "actual_start_date" "date",
    "actual_end_date" "date",
    "status" "text" DEFAULT 'assigned'::"text",
    "progress_percentage" integer DEFAULT 0,
    "quality_rating" numeric(3,2),
    "work_description" "text",
    "completion_notes" "text",
    "issues_encountered" "text",
    "photos" "jsonb" DEFAULT '[]'::"jsonb",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "work_approved_by" "uuid",
    "work_approved_at" timestamp without time zone,
    "payment_approved_by" "uuid",
    "payment_approved_at" timestamp without time zone,
    "payment_status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subcontractor_assignments_progress_percentage_check" CHECK ((("progress_percentage" >= 0) AND ("progress_percentage" <= 100))),
    CONSTRAINT "subcontractor_assignments_quality_rating_check" CHECK ((("quality_rating" >= (0)::numeric) AND ("quality_rating" <= (5)::numeric)))
);


ALTER TABLE "public"."subcontractor_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subcontractor_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subcontractor_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "report_date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "photos" "text"[],
    "status" "public"."report_status" DEFAULT 'submitted'::"public"."report_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subcontractor_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."subcontractor_reports" IS 'Simple site reports submitted by subcontractors';



COMMENT ON COLUMN "public"."subcontractor_reports"."report_date" IS 'Date of the site report';



COMMENT ON COLUMN "public"."subcontractor_reports"."description" IS 'Report description and notes';



COMMENT ON COLUMN "public"."subcontractor_reports"."photos" IS 'Array of photo URLs attached to the report';



CREATE TABLE IF NOT EXISTS "public"."subcontractor_scope_access" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "subcontractor_id" "uuid" NOT NULL,
    "scope_item_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "can_download" boolean DEFAULT true,
    "granted_by" "uuid" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed" timestamp with time zone
);


ALTER TABLE "public"."subcontractor_scope_access" OWNER TO "postgres";


COMMENT ON TABLE "public"."subcontractor_scope_access" IS 'Document access permissions for subcontractors';



COMMENT ON COLUMN "public"."subcontractor_scope_access"."can_download" IS 'Whether the subcontractor can download the document';



COMMENT ON COLUMN "public"."subcontractor_scope_access"."last_accessed" IS 'Last time the document was accessed';



CREATE TABLE IF NOT EXISTS "public"."subcontractor_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_profile_id" "uuid" NOT NULL,
    "company_name" character varying(200) NOT NULL,
    "contact_person" character varying(100) NOT NULL,
    "phone" character varying(20),
    "email" character varying(100) NOT NULL,
    "is_active" boolean DEFAULT true,
    "last_login" timestamp with time zone,
    "login_attempts" integer DEFAULT 0,
    "account_locked" boolean DEFAULT false,
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subcontractor_users" OWNER TO "postgres";


COMMENT ON TABLE "public"."subcontractor_users" IS 'Minimal subcontractor user profiles for external access';



COMMENT ON COLUMN "public"."subcontractor_users"."company_name" IS 'Subcontractor company name';



COMMENT ON COLUMN "public"."subcontractor_users"."contact_person" IS 'Primary contact person';



COMMENT ON COLUMN "public"."subcontractor_users"."is_active" IS 'Whether the subcontractor account is active';



CREATE TABLE IF NOT EXISTS "public"."subcontractors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "company" "text",
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "specialties" "text"[],
    "hourly_rate" numeric(10,2),
    "daily_rate" numeric(10,2),
    "contract_terms" "text",
    "performance_rating" numeric(3,2) DEFAULT 0.00,
    "total_assignments" integer DEFAULT 0,
    "completed_assignments" integer DEFAULT 0,
    "total_payments" numeric(12,2) DEFAULT 0.00,
    "availability_status" "text" DEFAULT 'available'::"text",
    "preferred_project_types" "text"[],
    "certifications" "text"[],
    "insurance_info" "jsonb" DEFAULT '{}'::"jsonb",
    "emergency_contact" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "subcontractors_performance_rating_check" CHECK ((("performance_rating" >= (0)::numeric) AND ("performance_rating" <= (5)::numeric)))
);


ALTER TABLE "public"."subcontractors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text",
    "specialties" "text"[],
    "rating" numeric(3,2) DEFAULT 0.00,
    "is_approved" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" character varying(20) DEFAULT 'active'::character varying,
    "description" "text",
    "total_projects" integer DEFAULT 0,
    "total_payments" numeric(15,2) DEFAULT 0.0,
    CONSTRAINT "suppliers_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::"text"[])))
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


COMMENT ON TABLE "public"."suppliers" IS 'Supplier database for purchase department with performance tracking';



CREATE TABLE IF NOT EXISTS "public"."system_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "is_public" boolean DEFAULT false,
    "updated_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "user_id" "uuid",
    "comment" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."task_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid",
    "scope_item_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "status" "public"."task_status" DEFAULT 'pending'::"public"."task_status",
    "priority" "public"."task_priority" DEFAULT 'medium'::"public"."task_priority",
    "assigned_to" "uuid",
    "assigned_by" "uuid",
    "due_date" "date",
    "completed_at" timestamp with time zone,
    "estimated_hours" numeric(5,2),
    "actual_hours" numeric(5,2),
    "dependencies" "uuid"[] DEFAULT '{}'::"uuid"[],
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tender_evaluations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tender_id" "uuid",
    "submission_id" "uuid",
    "evaluator_id" "uuid",
    "technical_score" numeric(5,2),
    "commercial_score" numeric(5,2),
    "compliance_score" numeric(5,2),
    "overall_score" numeric(5,2),
    "recommendation" "text",
    "notes" "text",
    "evaluated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tender_evaluations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tender_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tender_id" "uuid",
    "item_no" integer NOT NULL,
    "description" "text" NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "unit_of_measure" "text" NOT NULL,
    "specifications" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tender_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tender_submission_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "submission_id" "uuid",
    "tender_item_id" "uuid",
    "unit_price" numeric(10,2) NOT NULL,
    "total_price" numeric(12,2),
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tender_submission_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tender_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tender_id" "uuid",
    "supplier_id" "uuid",
    "submission_date" timestamp with time zone DEFAULT "now"(),
    "total_amount" numeric(12,2) NOT NULL,
    "validity_period" integer,
    "delivery_period" integer,
    "payment_terms" "text",
    "technical_proposal" "text",
    "commercial_proposal" "text",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "evaluation_score" numeric(5,2),
    "evaluation_notes" "text",
    "is_qualified" boolean,
    "is_selected" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tender_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tender_number" "text" NOT NULL,
    "project_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "scope_of_work" "text" NOT NULL,
    "estimated_value" numeric(12,2),
    "submission_deadline" timestamp with time zone NOT NULL,
    "opening_date" timestamp with time zone,
    "evaluation_criteria" "jsonb" DEFAULT '{}'::"jsonb",
    "required_documents" "jsonb" DEFAULT '[]'::"jsonb",
    "terms_conditions" "text",
    "status" "public"."tender_status" DEFAULT 'preparation'::"public"."tender_status",
    "is_public" boolean DEFAULT false,
    "created_by" "uuid",
    "published_at" timestamp with time zone,
    "awarded_to" "uuid",
    "awarded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tenders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_dashboard_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "widget_id" "uuid",
    "is_visible" boolean DEFAULT true,
    "position_override" integer,
    "size_override" "text",
    "config_override" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_dashboard_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vendor_ratings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vendor_id" "uuid" NOT NULL,
    "project_id" "uuid" NOT NULL,
    "purchase_order_id" "uuid",
    "rater_id" "uuid" NOT NULL,
    "quality_score" integer NOT NULL,
    "delivery_score" integer NOT NULL,
    "communication_score" integer NOT NULL,
    "overall_score" integer NOT NULL,
    "comments" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_scores" CHECK (((("quality_score" >= 1) AND ("quality_score" <= 5)) AND (("delivery_score" >= 1) AND ("delivery_score" <= 5)) AND (("communication_score" >= 1) AND ("communication_score" <= 5)) AND (("overall_score" >= 1) AND ("overall_score" <= 5)))),
    CONSTRAINT "vendor_ratings_communication_score_check" CHECK ((("communication_score" >= 1) AND ("communication_score" <= 5))),
    CONSTRAINT "vendor_ratings_delivery_score_check" CHECK ((("delivery_score" >= 1) AND ("delivery_score" <= 5))),
    CONSTRAINT "vendor_ratings_overall_score_check" CHECK ((("overall_score" >= 1) AND ("overall_score" <= 5))),
    CONSTRAINT "vendor_ratings_quality_score_check" CHECK ((("quality_score" >= 1) AND ("quality_score" <= 5)))
);


ALTER TABLE "public"."vendor_ratings" OWNER TO "postgres";


COMMENT ON TABLE "public"."vendor_ratings" IS 'Vendor performance ratings by project managers';



COMMENT ON COLUMN "public"."vendor_ratings"."overall_score" IS 'Overall vendor performance score (1-5)';



CREATE TABLE IF NOT EXISTS "public"."vendors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "company_name" character varying(200) NOT NULL,
    "contact_person" character varying(100),
    "email" character varying(100),
    "phone" character varying(20),
    "address" "text",
    "payment_terms" character varying(50),
    "is_active" boolean DEFAULT true,
    "performance_rating" numeric(3,2) DEFAULT 0.00,
    "specializations" "text"[],
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vendors" OWNER TO "postgres";


COMMENT ON TABLE "public"."vendors" IS 'Vendor database with performance tracking and specializations';



ALTER TABLE ONLY "public"."migration_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."migration_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_summary"
    ADD CONSTRAINT "activity_summary_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_summary"
    ADD CONSTRAINT "activity_summary_user_id_project_id_activity_date_key" UNIQUE ("user_id", "project_id", "activity_date");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_workflows"
    ADD CONSTRAINT "approval_workflows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."approval_workflows"
    ADD CONSTRAINT "approval_workflows_purchase_request_id_approver_role_sequen_key" UNIQUE ("purchase_request_id", "approver_role", "sequence_order");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_activity_log"
    ADD CONSTRAINT "client_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_communication_threads"
    ADD CONSTRAINT "client_communication_threads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_companies"
    ADD CONSTRAINT "client_companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_document_access"
    ADD CONSTRAINT "client_document_access_client_user_id_document_id_key" UNIQUE ("client_user_id", "document_id");



ALTER TABLE ONLY "public"."client_document_access"
    ADD CONSTRAINT "client_document_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_document_approvals"
    ADD CONSTRAINT "client_document_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_document_comments"
    ADD CONSTRAINT "client_document_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_messages"
    ADD CONSTRAINT "client_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_notifications"
    ADD CONSTRAINT "client_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_permissions"
    ADD CONSTRAINT "client_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_project_access"
    ADD CONSTRAINT "client_project_access_client_user_id_project_id_key" UNIQUE ("client_user_id", "project_id");



ALTER TABLE ONLY "public"."client_project_access"
    ADD CONSTRAINT "client_project_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widgets"
    ADD CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_widgets"
    ADD CONSTRAINT "dashboard_widgets_role_widget_name_key" UNIQUE ("role", "widget_name");



ALTER TABLE ONLY "public"."delivery_confirmations"
    ADD CONSTRAINT "delivery_confirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drawing_sets"
    ADD CONSTRAINT "drawing_sets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_photos"
    ADD CONSTRAINT "field_photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."material_specs"
    ADD CONSTRAINT "material_specs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migration_log"
    ADD CONSTRAINT "migration_log_migration_name_key" UNIQUE ("migration_name");



ALTER TABLE ONLY "public"."migration_log"
    ADD CONSTRAINT "migration_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "public"."mobile_devices"
    ADD CONSTRAINT "mobile_devices_device_id_key" UNIQUE ("device_id");



ALTER TABLE ONLY "public"."mobile_devices"
    ADD CONSTRAINT "mobile_devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_form_submissions"
    ADD CONSTRAINT "mobile_form_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_forms"
    ADD CONSTRAINT "mobile_forms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mobile_sync_queue"
    ADD CONSTRAINT "mobile_sync_queue_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permission_templates"
    ADD CONSTRAINT "permission_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permission_templates"
    ADD CONSTRAINT "permission_templates_role_key" UNIQUE ("role");



ALTER TABLE ONLY "public"."project_announcements"
    ADD CONSTRAINT "project_announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_project_id_user_id_role_key" UNIQUE ("project_id", "user_id", "role");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_po_number_key" UNIQUE ("po_number");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_request_number_key" UNIQUE ("request_number");



ALTER TABLE ONLY "public"."role_migration_log"
    ADD CONSTRAINT "role_migration_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scope_dependencies"
    ADD CONSTRAINT "scope_dependencies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scope_dependencies"
    ADD CONSTRAINT "scope_dependencies_scope_item_id_depends_on_id_key" UNIQUE ("scope_item_id", "depends_on_id");



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scope_material_links"
    ADD CONSTRAINT "scope_material_links_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_drawing_approvals"
    ADD CONSTRAINT "shop_drawing_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_drawing_comments"
    ADD CONSTRAINT "shop_drawing_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_drawing_revisions"
    ADD CONSTRAINT "shop_drawing_revisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_project_id_drawing_number_revision_key" UNIQUE ("project_id", "drawing_number", "revision");



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_subcontractor_id_scope_item_id_key" UNIQUE ("subcontractor_id", "scope_item_id");



ALTER TABLE ONLY "public"."subcontractor_reports"
    ADD CONSTRAINT "subcontractor_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcontractor_scope_access"
    ADD CONSTRAINT "subcontractor_scope_access_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcontractor_scope_access"
    ADD CONSTRAINT "subcontractor_scope_access_subcontractor_id_document_id_key" UNIQUE ("subcontractor_id", "document_id");



ALTER TABLE ONLY "public"."subcontractor_users"
    ADD CONSTRAINT "subcontractor_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subcontractors"
    ADD CONSTRAINT "subcontractors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tender_evaluations"
    ADD CONSTRAINT "tender_evaluations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tender_evaluations"
    ADD CONSTRAINT "tender_evaluations_submission_id_evaluator_id_key" UNIQUE ("submission_id", "evaluator_id");



ALTER TABLE ONLY "public"."tender_items"
    ADD CONSTRAINT "tender_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tender_items"
    ADD CONSTRAINT "tender_items_tender_id_item_no_key" UNIQUE ("tender_id", "item_no");



ALTER TABLE ONLY "public"."tender_submission_items"
    ADD CONSTRAINT "tender_submission_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tender_submissions"
    ADD CONSTRAINT "tender_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tender_submissions"
    ADD CONSTRAINT "tender_submissions_tender_id_supplier_id_key" UNIQUE ("tender_id", "supplier_id");



ALTER TABLE ONLY "public"."tenders"
    ADD CONSTRAINT "tenders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenders"
    ADD CONSTRAINT "tenders_tender_number_key" UNIQUE ("tender_number");



ALTER TABLE ONLY "public"."client_companies"
    ADD CONSTRAINT "unique_custom_domain" UNIQUE ("custom_domain");



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "unique_item_no_per_project" UNIQUE ("project_id", "item_no");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "unique_user_profile_client" UNIQUE ("user_profile_id", "client_company_id");



ALTER TABLE ONLY "public"."scope_material_links"
    ADD CONSTRAINT "uq_scope_material_link" UNIQUE ("scope_item_id", "material_spec_id");



ALTER TABLE ONLY "public"."user_dashboard_settings"
    ADD CONSTRAINT "user_dashboard_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_dashboard_settings"
    ADD CONSTRAINT "user_dashboard_settings_user_id_widget_id_key" UNIQUE ("user_id", "widget_id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_vendor_id_project_id_purchase_order_id_key" UNIQUE ("vendor_id", "project_id", "purchase_order_id");



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activity_logs_created_at" ON "public"."activity_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_activity_logs_entity_id" ON "public"."activity_logs" USING "btree" ("entity_id");



CREATE INDEX "idx_activity_logs_entity_id_created_at" ON "public"."activity_logs" USING "btree" ("entity_id", "created_at" DESC);



CREATE INDEX "idx_activity_logs_entity_type" ON "public"."activity_logs" USING "btree" ("entity_type");



CREATE INDEX "idx_activity_logs_entity_type_created_at" ON "public"."activity_logs" USING "btree" ("entity_type", "created_at" DESC);



CREATE INDEX "idx_activity_logs_user_id" ON "public"."activity_logs" USING "btree" ("user_id");



CREATE INDEX "idx_activity_logs_user_id_created_at" ON "public"."activity_logs" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_activity_summary_date" ON "public"."activity_summary" USING "btree" ("activity_date");



CREATE INDEX "idx_activity_summary_project" ON "public"."activity_summary" USING "btree" ("project_id");



CREATE INDEX "idx_activity_summary_user" ON "public"."activity_summary" USING "btree" ("user_id");



CREATE INDEX "idx_announcements_active" ON "public"."project_announcements" USING "btree" ("project_id", "is_pinned") WHERE ("expires_at" IS NULL);



CREATE INDEX "idx_announcements_project" ON "public"."project_announcements" USING "btree" ("project_id");



CREATE INDEX "idx_approval_requests_approver_status" ON "public"."approval_requests" USING "btree" ("current_approver", "status");



CREATE INDEX "idx_approval_requests_current_approver" ON "public"."approval_requests" USING "btree" ("current_approver", "status");



CREATE INDEX "idx_approval_requests_project" ON "public"."approval_requests" USING "btree" ("project_id", "status");



CREATE INDEX "idx_approval_workflows_approver" ON "public"."approval_workflows" USING "btree" ("approver_id");



CREATE INDEX "idx_approval_workflows_request" ON "public"."approval_workflows" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_approval_workflows_role" ON "public"."approval_workflows" USING "btree" ("approver_role");



CREATE INDEX "idx_approval_workflows_sequence" ON "public"."approval_workflows" USING "btree" ("purchase_request_id", "sequence_order");



CREATE INDEX "idx_approval_workflows_status" ON "public"."approval_workflows" USING "btree" ("approval_status");



CREATE INDEX "idx_assignments_active" ON "public"."project_assignments" USING "btree" ("is_active");



CREATE INDEX "idx_assignments_project" ON "public"."project_assignments" USING "btree" ("project_id");



CREATE INDEX "idx_assignments_user" ON "public"."project_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_audit_logs_action" ON "public"."audit_logs" USING "btree" ("action");



CREATE INDEX "idx_audit_logs_created" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_audit_logs_user" ON "public"."audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_client_activity_log_client" ON "public"."client_activity_log" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_activity_log_client_time" ON "public"."client_activity_log" USING "btree" ("client_user_id", "created_at");



CREATE INDEX "idx_client_activity_log_created_at" ON "public"."client_activity_log" USING "btree" ("created_at");



CREATE INDEX "idx_client_activity_log_project" ON "public"."client_activity_log" USING "btree" ("project_id");



CREATE INDEX "idx_client_activity_log_resource" ON "public"."client_activity_log" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_client_activity_log_type" ON "public"."client_activity_log" USING "btree" ("activity_type");



CREATE INDEX "idx_client_communication_threads_client" ON "public"."client_communication_threads" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_communication_threads_last_message" ON "public"."client_communication_threads" USING "btree" ("last_message_at");



CREATE INDEX "idx_client_communication_threads_priority" ON "public"."client_communication_threads" USING "btree" ("priority");



CREATE INDEX "idx_client_communication_threads_project" ON "public"."client_communication_threads" USING "btree" ("project_id");



CREATE INDEX "idx_client_communication_threads_status" ON "public"."client_communication_threads" USING "btree" ("status");



CREATE INDEX "idx_client_communication_threads_type" ON "public"."client_communication_threads" USING "btree" ("thread_type");



CREATE INDEX "idx_client_companies_active" ON "public"."client_companies" USING "btree" ("is_active");



CREATE INDEX "idx_client_companies_name" ON "public"."client_companies" USING "btree" ("company_name");



CREATE INDEX "idx_client_companies_type" ON "public"."client_companies" USING "btree" ("company_type");



CREATE INDEX "idx_client_document_access_client" ON "public"."client_document_access" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_document_access_document" ON "public"."client_document_access" USING "btree" ("document_id");



CREATE INDEX "idx_client_document_access_granted_by" ON "public"."client_document_access" USING "btree" ("granted_by");



CREATE INDEX "idx_client_document_access_type" ON "public"."client_document_access" USING "btree" ("access_type");



CREATE INDEX "idx_client_document_approvals_client" ON "public"."client_document_approvals" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_document_approvals_date" ON "public"."client_document_approvals" USING "btree" ("approval_date");



CREATE INDEX "idx_client_document_approvals_decision" ON "public"."client_document_approvals" USING "btree" ("approval_decision");



CREATE INDEX "idx_client_document_approvals_document" ON "public"."client_document_approvals" USING "btree" ("document_id");



CREATE INDEX "idx_client_document_approvals_version" ON "public"."client_document_approvals" USING "btree" ("document_id", "document_version");



CREATE INDEX "idx_client_document_comments_client" ON "public"."client_document_comments" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_document_comments_created_at" ON "public"."client_document_comments" USING "btree" ("created_at");



CREATE INDEX "idx_client_document_comments_document" ON "public"."client_document_comments" USING "btree" ("document_id");



CREATE INDEX "idx_client_document_comments_parent" ON "public"."client_document_comments" USING "btree" ("parent_comment_id");



CREATE INDEX "idx_client_document_comments_status" ON "public"."client_document_comments" USING "btree" ("status");



CREATE INDEX "idx_client_document_comments_type" ON "public"."client_document_comments" USING "btree" ("comment_type");



CREATE INDEX "idx_client_messages_created_at" ON "public"."client_messages" USING "btree" ("created_at");



CREATE INDEX "idx_client_messages_read" ON "public"."client_messages" USING "btree" ("is_read");



CREATE INDEX "idx_client_messages_sender" ON "public"."client_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_client_messages_thread" ON "public"."client_messages" USING "btree" ("thread_id");



CREATE INDEX "idx_client_messages_thread_time" ON "public"."client_messages" USING "btree" ("thread_id", "created_at");



CREATE INDEX "idx_client_messages_type" ON "public"."client_messages" USING "btree" ("message_type");



CREATE INDEX "idx_client_notifications_client" ON "public"."client_notifications" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_notifications_priority" ON "public"."client_notifications" USING "btree" ("priority");



CREATE INDEX "idx_client_notifications_project" ON "public"."client_notifications" USING "btree" ("project_id");



CREATE INDEX "idx_client_notifications_scheduled" ON "public"."client_notifications" USING "btree" ("scheduled_for");



CREATE INDEX "idx_client_notifications_type" ON "public"."client_notifications" USING "btree" ("notification_type");



CREATE INDEX "idx_client_notifications_unread" ON "public"."client_notifications" USING "btree" ("client_user_id", "is_read");



CREATE INDEX "idx_client_permissions_active" ON "public"."client_permissions" USING "btree" ("is_active");



CREATE INDEX "idx_client_permissions_expires" ON "public"."client_permissions" USING "btree" ("expires_at");



CREATE INDEX "idx_client_permissions_resource" ON "public"."client_permissions" USING "btree" ("resource_type", "resource_id");



CREATE INDEX "idx_client_permissions_type" ON "public"."client_permissions" USING "btree" ("permission_type");



CREATE INDEX "idx_client_permissions_user" ON "public"."client_permissions" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_project_access_client" ON "public"."client_project_access" USING "btree" ("client_user_id");



CREATE INDEX "idx_client_project_access_dates" ON "public"."client_project_access" USING "btree" ("access_start_date", "access_end_date");



CREATE INDEX "idx_client_project_access_granted_by" ON "public"."client_project_access" USING "btree" ("granted_by");



CREATE INDEX "idx_client_project_access_level" ON "public"."client_project_access" USING "btree" ("access_level");



CREATE INDEX "idx_client_project_access_project" ON "public"."client_project_access" USING "btree" ("project_id");



CREATE INDEX "idx_client_users_access_level" ON "public"."client_users" USING "btree" ("access_level");



CREATE INDEX "idx_client_users_company" ON "public"."client_users" USING "btree" ("client_company_id");



CREATE INDEX "idx_client_users_created_by" ON "public"."client_users" USING "btree" ("created_by");



CREATE INDEX "idx_client_users_last_activity" ON "public"."client_users" USING "btree" ("last_activity");



CREATE INDEX "idx_client_users_portal_enabled" ON "public"."client_users" USING "btree" ("portal_access_enabled");



CREATE INDEX "idx_clients_company" ON "public"."clients" USING "btree" ("company_name");



CREATE INDEX "idx_clients_user" ON "public"."clients" USING "btree" ("user_id");



CREATE INDEX "idx_delivery_confirmations_confirmed_by" ON "public"."delivery_confirmations" USING "btree" ("confirmed_by");



CREATE INDEX "idx_delivery_confirmations_delivery_date" ON "public"."delivery_confirmations" USING "btree" ("delivery_date");



CREATE INDEX "idx_delivery_confirmations_order" ON "public"."delivery_confirmations" USING "btree" ("purchase_order_id");



CREATE INDEX "idx_delivery_confirmations_status" ON "public"."delivery_confirmations" USING "btree" ("status");



CREATE INDEX "idx_doc_approvals_approver" ON "public"."document_approvals" USING "btree" ("approver_id");



CREATE INDEX "idx_doc_approvals_document" ON "public"."document_approvals" USING "btree" ("document_id");



CREATE INDEX "idx_doc_approvals_status" ON "public"."document_approvals" USING "btree" ("status");



CREATE INDEX "idx_documents_client_visible" ON "public"."documents" USING "btree" ("is_client_visible");



CREATE INDEX "idx_documents_project" ON "public"."documents" USING "btree" ("project_id");



CREATE INDEX "idx_documents_scope" ON "public"."documents" USING "btree" ("scope_item_id");



CREATE INDEX "idx_documents_status" ON "public"."documents" USING "btree" ("status");



CREATE INDEX "idx_documents_type" ON "public"."documents" USING "btree" ("document_type");



CREATE INDEX "idx_documents_uploaded_by" ON "public"."documents" USING "btree" ("uploaded_by");



CREATE INDEX "idx_drawing_comments_creator" ON "public"."shop_drawing_comments" USING "btree" ("created_by");



CREATE INDEX "idx_drawing_comments_drawing" ON "public"."shop_drawing_comments" USING "btree" ("shop_drawing_id");



CREATE INDEX "idx_drawing_comments_unresolved" ON "public"."shop_drawing_comments" USING "btree" ("shop_drawing_id", "is_resolved") WHERE ("is_resolved" = false);



CREATE INDEX "idx_field_photos_project" ON "public"."field_photos" USING "btree" ("project_id");



CREATE INDEX "idx_field_photos_report" ON "public"."field_photos" USING "btree" ("field_report_id");



CREATE INDEX "idx_field_reports_date" ON "public"."field_reports" USING "btree" ("report_date");



CREATE INDEX "idx_field_reports_project" ON "public"."field_reports" USING "btree" ("project_id");



CREATE INDEX "idx_field_reports_submitted_by" ON "public"."field_reports" USING "btree" ("submitted_by");



CREATE INDEX "idx_field_reports_type" ON "public"."field_reports" USING "btree" ("report_type");



CREATE INDEX "idx_material_specs_category" ON "public"."material_specs" USING "btree" ("category");



CREATE INDEX "idx_material_specs_delivery_date" ON "public"."material_specs" USING "btree" ("delivery_date");



CREATE INDEX "idx_material_specs_priority" ON "public"."material_specs" USING "btree" ("priority");



CREATE INDEX "idx_material_specs_project_category" ON "public"."material_specs" USING "btree" ("project_id", "category");



CREATE INDEX "idx_material_specs_project_id" ON "public"."material_specs" USING "btree" ("project_id");



CREATE INDEX "idx_material_specs_project_status" ON "public"."material_specs" USING "btree" ("project_id", "status");



CREATE INDEX "idx_material_specs_status" ON "public"."material_specs" USING "btree" ("status");



CREATE INDEX "idx_material_specs_status_priority" ON "public"."material_specs" USING "btree" ("status", "priority");



CREATE INDEX "idx_material_specs_supplier_id" ON "public"."material_specs" USING "btree" ("supplier_id");



CREATE INDEX "idx_messages_recipient" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_messages_unread" ON "public"."messages" USING "btree" ("recipient_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_migration_log_created_at" ON "public"."migration_log" USING "btree" ("created_at");



CREATE INDEX "idx_migration_log_name" ON "public"."migration_log" USING "btree" ("migration_name");



CREATE INDEX "idx_migration_log_status" ON "public"."migration_log" USING "btree" ("status");



CREATE INDEX "idx_migrations_executed_at" ON "public"."migrations" USING "btree" ("executed_at");



CREATE INDEX "idx_mobile_devices_user" ON "public"."mobile_devices" USING "btree" ("user_id");



CREATE INDEX "idx_mobile_sync_queue_device" ON "public"."mobile_sync_queue" USING "btree" ("device_id");



CREATE INDEX "idx_mobile_sync_queue_status" ON "public"."mobile_sync_queue" USING "btree" ("sync_status");



CREATE INDEX "idx_notifications_created" ON "public"."notifications" USING "btree" ("created_at");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_project_assignments_access" ON "public"."project_assignments" USING "btree" ("user_id", "project_id", "is_active") WHERE ("is_active" = true);



COMMENT ON INDEX "public"."idx_project_assignments_access" IS 'Critical: Optimizes role-based access control checks - Essential for security performance';



CREATE INDEX "idx_project_assignments_is_active" ON "public"."project_assignments" USING "btree" ("is_active");



CREATE INDEX "idx_project_assignments_project_id" ON "public"."project_assignments" USING "btree" ("project_id");



CREATE INDEX "idx_project_assignments_project_user" ON "public"."project_assignments" USING "btree" ("project_id", "user_id", "is_active");



CREATE INDEX "idx_project_assignments_team" ON "public"."project_assignments" USING "btree" ("project_id", "is_active", "role") WHERE ("is_active" = true);



CREATE INDEX "idx_project_assignments_user_id" ON "public"."project_assignments" USING "btree" ("user_id");



CREATE INDEX "idx_project_assignments_user_project_active" ON "public"."project_assignments" USING "btree" ("user_id", "project_id", "is_active");



CREATE INDEX "idx_project_milestones_created_by" ON "public"."project_milestones" USING "btree" ("created_by");



CREATE INDEX "idx_project_milestones_date" ON "public"."project_milestones" USING "btree" ("milestone_date");



CREATE INDEX "idx_project_milestones_project" ON "public"."project_milestones" USING "btree" ("project_id");



CREATE INDEX "idx_project_milestones_status" ON "public"."project_milestones" USING "btree" ("status");



CREATE INDEX "idx_project_milestones_type" ON "public"."project_milestones" USING "btree" ("milestone_type");



CREATE INDEX "idx_projects_budget_analysis" ON "public"."projects" USING "btree" ("status", "budget", "actual_cost") WHERE ("status" = ANY (ARRAY['active'::"public"."project_status", 'planning'::"public"."project_status", 'bidding'::"public"."project_status"]));



COMMENT ON INDEX "public"."idx_projects_budget_analysis" IS 'High Priority: Optimizes management dashboard budget calculations - Expected 50% improvement';



CREATE INDEX "idx_projects_client" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_projects_client_id" ON "public"."projects" USING "btree" ("client_id");



CREATE INDEX "idx_projects_created" ON "public"."projects" USING "btree" ("created_at");



CREATE INDEX "idx_projects_dates" ON "public"."projects" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_projects_management_dashboard" ON "public"."projects" USING "btree" ("status", "end_date", "actual_cost", "budget") WHERE ("status" = 'active'::"public"."project_status");



CREATE INDEX "idx_projects_manager_client" ON "public"."projects" USING "btree" ("project_manager_id", "client_id");



CREATE INDEX "idx_projects_manager_status_date" ON "public"."projects" USING "btree" ("project_manager_id", "status", "created_at" DESC);



CREATE INDEX "idx_projects_name_search" ON "public"."projects" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_projects_pm" ON "public"."projects" USING "btree" ("project_manager_id");



CREATE INDEX "idx_projects_project_manager_id" ON "public"."projects" USING "btree" ("project_manager_id");



CREATE INDEX "idx_projects_search_text" ON "public"."projects" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("name" || ' '::"text") || COALESCE("description", ''::"text")) || ' '::"text") || COALESCE("location", ''::"text"))));



COMMENT ON INDEX "public"."idx_projects_search_text" IS 'Search Optimization: Enables full-text search on projects - Required for project search';



CREATE INDEX "idx_projects_status" ON "public"."projects" USING "btree" ("status");



CREATE INDEX "idx_projects_status_created_at" ON "public"."projects" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_projects_type_status" ON "public"."projects" USING "btree" ("project_type", "status");



CREATE INDEX "idx_purchase_orders_created_by" ON "public"."purchase_orders" USING "btree" ("created_by");



CREATE INDEX "idx_purchase_orders_delivery_date" ON "public"."purchase_orders" USING "btree" ("expected_delivery_date");



CREATE INDEX "idx_purchase_orders_number" ON "public"."purchase_orders" USING "btree" ("po_number");



CREATE INDEX "idx_purchase_orders_po_date" ON "public"."purchase_orders" USING "btree" ("po_date");



CREATE INDEX "idx_purchase_orders_request" ON "public"."purchase_orders" USING "btree" ("purchase_request_id");



CREATE INDEX "idx_purchase_orders_status" ON "public"."purchase_orders" USING "btree" ("status");



CREATE INDEX "idx_purchase_orders_vendor" ON "public"."purchase_orders" USING "btree" ("vendor_id");



CREATE INDEX "idx_purchase_requests_created_at" ON "public"."purchase_requests" USING "btree" ("created_at");



CREATE INDEX "idx_purchase_requests_number" ON "public"."purchase_requests" USING "btree" ("request_number");



CREATE INDEX "idx_purchase_requests_project" ON "public"."purchase_requests" USING "btree" ("project_id");



CREATE INDEX "idx_purchase_requests_requester" ON "public"."purchase_requests" USING "btree" ("requester_id");



CREATE INDEX "idx_purchase_requests_required_date" ON "public"."purchase_requests" USING "btree" ("required_date");



CREATE INDEX "idx_purchase_requests_status" ON "public"."purchase_requests" USING "btree" ("status");



CREATE INDEX "idx_purchase_requests_urgency" ON "public"."purchase_requests" USING "btree" ("urgency_level");



CREATE INDEX "idx_scope_assigned" ON "public"."scope_items" USING "gin" ("assigned_to");



CREATE INDEX "idx_scope_assigned_to" ON "public"."scope_items" USING "gin" ("assigned_to");



CREATE INDEX "idx_scope_category" ON "public"."scope_items" USING "btree" ("category");



CREATE INDEX "idx_scope_category_status" ON "public"."scope_items" USING "btree" ("category", "status");



CREATE INDEX "idx_scope_costs" ON "public"."scope_items" USING "btree" ("initial_cost", "actual_cost") WHERE (("initial_cost" IS NOT NULL) OR ("actual_cost" IS NOT NULL));



CREATE INDEX "idx_scope_created_at" ON "public"."scope_items" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_scope_created_by" ON "public"."scope_items" USING "btree" ("created_by");



CREATE INDEX "idx_scope_deps_depends" ON "public"."scope_dependencies" USING "btree" ("depends_on_id");



CREATE INDEX "idx_scope_deps_item" ON "public"."scope_dependencies" USING "btree" ("scope_item_id");



CREATE INDEX "idx_scope_description_search" ON "public"."scope_items" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_scope_item_code" ON "public"."scope_items" USING "btree" ("item_code") WHERE ("item_code" IS NOT NULL);



CREATE INDEX "idx_scope_item_no" ON "public"."scope_items" USING "btree" ("project_id", "item_no");



CREATE INDEX "idx_scope_items_cost_variance" ON "public"."scope_items" USING "btree" ("project_id", "initial_cost", "actual_cost") WHERE (("initial_cost" IS NOT NULL) AND ("actual_cost" IS NOT NULL));



CREATE INDEX "idx_scope_items_listing" ON "public"."scope_items" USING "btree" ("project_id", "category", "status", "timeline_start", "timeline_end");



COMMENT ON INDEX "public"."idx_scope_items_listing" IS 'Critical: Optimizes scope item filtering by project, category, status, and timeline - Expected 70% performance improvement';



CREATE INDEX "idx_scope_items_priority" ON "public"."scope_items" USING "btree" ("project_id", "priority", "status");



CREATE INDEX "idx_scope_items_progress" ON "public"."scope_items" USING "btree" ("project_id", "progress_percentage", "status") WHERE ("progress_percentage" IS NOT NULL);



CREATE INDEX "idx_scope_items_project_assigned" ON "public"."scope_items" USING "btree" ("project_id", "assigned_to");



CREATE INDEX "idx_scope_items_search" ON "public"."scope_items" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("title" || ' '::"text") || "description") || ' '::"text") || COALESCE("item_code", ''::"text"))));



COMMENT ON INDEX "public"."idx_scope_items_search" IS 'Search Optimization: Enables full-text search on scope items - Required for search functionality';



CREATE INDEX "idx_scope_items_timeline_analysis" ON "public"."scope_items" USING "btree" ("timeline_end", "status") WHERE (("timeline_end" IS NOT NULL) AND ("status" <> ALL (ARRAY['completed'::"public"."scope_status", 'cancelled'::"public"."scope_status"])));



CREATE INDEX "idx_scope_material_links_material_spec" ON "public"."scope_material_links" USING "btree" ("material_spec_id");



CREATE INDEX "idx_scope_material_links_scope_item" ON "public"."scope_material_links" USING "btree" ("scope_item_id");



CREATE INDEX "idx_scope_project" ON "public"."scope_items" USING "btree" ("project_id");



CREATE INDEX "idx_scope_project_category_status" ON "public"."scope_items" USING "btree" ("project_id", "category", "status");



CREATE INDEX "idx_scope_project_id_status" ON "public"."scope_items" USING "btree" ("project_id", "status");



CREATE INDEX "idx_scope_status" ON "public"."scope_items" USING "btree" ("status");



CREATE INDEX "idx_scope_supplier" ON "public"."scope_items" USING "btree" ("supplier_id");



CREATE INDEX "idx_scope_timeline" ON "public"."scope_items" USING "btree" ("timeline_start", "timeline_end");



CREATE INDEX "idx_shop_drawings_architect" ON "public"."shop_drawings" USING "btree" ("assigned_architect");



CREATE INDEX "idx_shop_drawings_discipline" ON "public"."shop_drawings" USING "btree" ("discipline");



CREATE INDEX "idx_shop_drawings_number" ON "public"."shop_drawings" USING "btree" ("drawing_number");



CREATE INDEX "idx_shop_drawings_project" ON "public"."shop_drawings" USING "btree" ("project_id");



CREATE INDEX "idx_shop_drawings_scope" ON "public"."shop_drawings" USING "btree" ("scope_item_id");



CREATE INDEX "idx_shop_drawings_status" ON "public"."shop_drawings" USING "btree" ("status");



CREATE INDEX "idx_subcontractor_assignments_project_subcontractor" ON "public"."subcontractor_assignments" USING "btree" ("project_id", "subcontractor_id");



CREATE INDEX "idx_subcontractor_assignments_status" ON "public"."subcontractor_assignments" USING "btree" ("status", "project_id");



CREATE INDEX "idx_subcontractor_reports_project" ON "public"."subcontractor_reports" USING "btree" ("project_id", "report_date");



CREATE INDEX "idx_subcontractor_reports_subcontractor" ON "public"."subcontractor_reports" USING "btree" ("subcontractor_id");



CREATE INDEX "idx_subcontractor_scope_access_document" ON "public"."subcontractor_scope_access" USING "btree" ("document_id");



CREATE INDEX "idx_subcontractor_scope_access_subcontractor" ON "public"."subcontractor_scope_access" USING "btree" ("subcontractor_id");



CREATE INDEX "idx_subcontractor_users_active" ON "public"."subcontractor_users" USING "btree" ("is_active");



CREATE INDEX "idx_subcontractor_users_email" ON "public"."subcontractor_users" USING "btree" ("email");



CREATE INDEX "idx_subcontractors_availability" ON "public"."subcontractors" USING "btree" ("availability_status", "is_active");



CREATE INDEX "idx_suppliers_approved" ON "public"."suppliers" USING "btree" ("is_approved");



CREATE INDEX "idx_suppliers_created_at" ON "public"."suppliers" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_suppliers_created_by" ON "public"."suppliers" USING "btree" ("created_by");



CREATE INDEX "idx_suppliers_name" ON "public"."suppliers" USING "btree" ("name");



CREATE INDEX "idx_suppliers_name_search" ON "public"."suppliers" USING "gin" ("to_tsvector"('"english"'::"regconfig", "name"));



CREATE INDEX "idx_suppliers_rating" ON "public"."suppliers" USING "btree" ("rating");



CREATE INDEX "idx_suppliers_specialties" ON "public"."suppliers" USING "gin" ("specialties");



CREATE INDEX "idx_suppliers_status" ON "public"."suppliers" USING "btree" ("status");



CREATE INDEX "idx_task_comments_task" ON "public"."task_comments" USING "btree" ("task_id");



CREATE INDEX "idx_task_comments_user" ON "public"."task_comments" USING "btree" ("user_id");



CREATE INDEX "idx_tasks_assigned_priority_date" ON "public"."tasks" USING "btree" ("assigned_to", "priority", "due_date");



CREATE INDEX "idx_tasks_assigned_to" ON "public"."tasks" USING "btree" ("assigned_to");



CREATE INDEX "idx_tasks_assigned_to_status" ON "public"."tasks" USING "btree" ("assigned_to", "status");



CREATE INDEX "idx_tasks_created_at" ON "public"."tasks" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date");



CREATE INDEX "idx_tasks_overdue" ON "public"."tasks" USING "btree" ("due_date", "status") WHERE (("due_date" IS NOT NULL) AND ("status" <> ALL (ARRAY['completed'::"public"."task_status", 'cancelled'::"public"."task_status"])));



CREATE INDEX "idx_tasks_priority_status" ON "public"."tasks" USING "btree" ("priority", "status");



CREATE INDEX "idx_tasks_project" ON "public"."tasks" USING "btree" ("project_id");



CREATE INDEX "idx_tasks_project_id_status" ON "public"."tasks" USING "btree" ("project_id", "status");



CREATE INDEX "idx_tasks_project_status_assigned" ON "public"."tasks" USING "btree" ("project_id", "status", "assigned_to");



CREATE INDEX "idx_tasks_scope_item" ON "public"."tasks" USING "btree" ("scope_item_id");



CREATE INDEX "idx_tasks_statistics" ON "public"."tasks" USING "btree" ("project_id", "status", "priority", "assigned_to");



CREATE INDEX "idx_tasks_status" ON "public"."tasks" USING "btree" ("status");



CREATE INDEX "idx_tasks_title_search" ON "public"."tasks" USING "gin" ("to_tsvector"('"english"'::"regconfig", "title"));



CREATE INDEX "idx_tasks_user_assignment" ON "public"."tasks" USING "btree" ("assigned_to", "status", "due_date") WHERE ("assigned_to" IS NOT NULL);



COMMENT ON INDEX "public"."idx_tasks_user_assignment" IS 'High Priority: Optimizes user task dashboard queries - Expected 60% improvement';



CREATE INDEX "idx_tender_submissions_supplier" ON "public"."tender_submissions" USING "btree" ("supplier_id");



CREATE INDEX "idx_tender_submissions_tender" ON "public"."tender_submissions" USING "btree" ("tender_id");



CREATE INDEX "idx_tenders_deadline" ON "public"."tenders" USING "btree" ("submission_deadline");



CREATE INDEX "idx_tenders_number" ON "public"."tenders" USING "btree" ("tender_number");



CREATE INDEX "idx_tenders_project" ON "public"."tenders" USING "btree" ("project_id");



CREATE INDEX "idx_tenders_status" ON "public"."tenders" USING "btree" ("status");



CREATE INDEX "idx_user_profiles_active" ON "public"."user_profiles" USING "btree" ("is_active");



CREATE INDEX "idx_user_profiles_department" ON "public"."user_profiles" USING "btree" ("department", "role") WHERE ("department" IS NOT NULL);



CREATE INDEX "idx_user_profiles_email" ON "public"."user_profiles" USING "btree" ("email");



CREATE INDEX "idx_user_profiles_is_active" ON "public"."user_profiles" USING "btree" ("is_active");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE INDEX "idx_user_profiles_role_active" ON "public"."user_profiles" USING "btree" ("role", "is_active", "created_at");



CREATE INDEX "idx_user_profiles_role_seniority" ON "public"."user_profiles" USING "btree" ("role", "seniority_level");



CREATE INDEX "idx_user_profiles_search" ON "public"."user_profiles" USING "gin" ("to_tsvector"('"english"'::"regconfig", (((("first_name" || ' '::"text") || "last_name") || ' '::"text") || "email")));



CREATE INDEX "idx_vendor_ratings_overall_score" ON "public"."vendor_ratings" USING "btree" ("overall_score");



CREATE INDEX "idx_vendor_ratings_project" ON "public"."vendor_ratings" USING "btree" ("project_id");



CREATE INDEX "idx_vendor_ratings_rater" ON "public"."vendor_ratings" USING "btree" ("rater_id");



CREATE INDEX "idx_vendor_ratings_vendor" ON "public"."vendor_ratings" USING "btree" ("vendor_id");



CREATE INDEX "idx_vendors_active" ON "public"."vendors" USING "btree" ("is_active");



CREATE INDEX "idx_vendors_created_by" ON "public"."vendors" USING "btree" ("created_by");



CREATE INDEX "idx_vendors_rating" ON "public"."vendors" USING "btree" ("performance_rating");



CREATE INDEX "idx_vendors_specializations" ON "public"."vendors" USING "gin" ("specializations");



CREATE OR REPLACE TRIGGER "auto_generate_drawing_number" BEFORE INSERT ON "public"."shop_drawings" FOR EACH ROW EXECUTE FUNCTION "public"."generate_drawing_number"();



CREATE OR REPLACE TRIGGER "auto_generate_purchase_order_number" BEFORE INSERT ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."generate_purchase_order_number"();



CREATE OR REPLACE TRIGGER "auto_generate_purchase_request_number" BEFORE INSERT ON "public"."purchase_requests" FOR EACH ROW EXECUTE FUNCTION "public"."generate_purchase_request_number"();



CREATE OR REPLACE TRIGGER "auto_generate_scope_item_no" BEFORE INSERT ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."generate_scope_item_no"();



CREATE OR REPLACE TRIGGER "auto_generate_tender_number" BEFORE INSERT ON "public"."tenders" FOR EACH ROW EXECUTE FUNCTION "public"."generate_tender_number"();



CREATE OR REPLACE TRIGGER "material_specs_activity_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."material_specs" FOR EACH ROW EXECUTE FUNCTION "public"."log_activity"();



CREATE OR REPLACE TRIGGER "material_specs_updated_at_trigger" BEFORE UPDATE ON "public"."material_specs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "project_assignments_updated_at_trigger" BEFORE UPDATE ON "public"."project_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "project_broadcast_trigger" AFTER INSERT OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."broadcast_project_update"();



CREATE OR REPLACE TRIGGER "projects_activity_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."log_activity"();



CREATE OR REPLACE TRIGGER "projects_cache_invalidation" AFTER INSERT OR DELETE OR UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."invalidate_rls_cache"();



CREATE OR REPLACE TRIGGER "projects_updated_at_trigger" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "scope_broadcast_trigger" AFTER INSERT OR UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."broadcast_scope_update"();



CREATE OR REPLACE TRIGGER "scope_items_activity_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."log_activity"();



CREATE OR REPLACE TRIGGER "scope_items_cache_invalidation" AFTER INSERT OR DELETE OR UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."invalidate_rls_cache"();



CREATE OR REPLACE TRIGGER "scope_items_updated_at_trigger" BEFORE UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "suppliers_updated_at_trigger" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_suppliers_updated_at"();



CREATE OR REPLACE TRIGGER "task_broadcast_trigger" AFTER INSERT OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."broadcast_task_update"();



CREATE OR REPLACE TRIGGER "tasks_activity_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."log_activity"();



CREATE OR REPLACE TRIGGER "tasks_cache_invalidation" AFTER INSERT OR DELETE OR UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."invalidate_rls_cache"();



CREATE OR REPLACE TRIGGER "tasks_updated_at_trigger" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_approval_requests_updated_at" BEFORE UPDATE ON "public"."approval_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_approval_request_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_calculate_tender_submission_item_total" BEFORE INSERT OR UPDATE ON "public"."tender_submission_items" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_tender_submission_item_total"();



CREATE OR REPLACE TRIGGER "trigger_handle_material_approval" BEFORE UPDATE ON "public"."material_specs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_material_approval"();



CREATE OR REPLACE TRIGGER "trigger_notify_drawing_comment" AFTER INSERT ON "public"."shop_drawing_comments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_drawing_comment"();



CREATE OR REPLACE TRIGGER "trigger_subcontractor_assignments_updated_at" BEFORE UPDATE ON "public"."subcontractor_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_subcontractor_assignment_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_activity_summary" AFTER INSERT ON "public"."audit_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_activity_summary"();



CREATE OR REPLACE TRIGGER "trigger_update_material_specs_updated_at" BEFORE UPDATE ON "public"."material_specs" FOR EACH ROW EXECUTE FUNCTION "public"."update_material_specs_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_scope_material_links_updated_at" BEFORE UPDATE ON "public"."scope_material_links" FOR EACH ROW EXECUTE FUNCTION "public"."update_scope_material_links_updated_at"();



CREATE OR REPLACE TRIGGER "update_activity_summary_updated_at" BEFORE UPDATE ON "public"."activity_summary" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_communication_threads_updated_at" BEFORE UPDATE ON "public"."client_communication_threads" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_companies_updated_at" BEFORE UPDATE ON "public"."client_companies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_document_comments_updated_at" BEFORE UPDATE ON "public"."client_document_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_messages_updated_at" BEFORE UPDATE ON "public"."client_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_users_updated_at" BEFORE UPDATE ON "public"."client_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_drawing_sets_updated_at" BEFORE UPDATE ON "public"."drawing_sets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_field_reports_updated_at" BEFORE UPDATE ON "public"."field_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_jwt_claims_trigger" BEFORE INSERT OR UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."populate_jwt_claims"();



CREATE OR REPLACE TRIGGER "update_milestone_timestamps_trigger" BEFORE UPDATE ON "public"."project_milestones" FOR EACH ROW EXECUTE FUNCTION "public"."update_milestone_timestamps"();



CREATE OR REPLACE TRIGGER "update_mobile_devices_updated_at" BEFORE UPDATE ON "public"."mobile_devices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_mobile_forms_updated_at" BEFORE UPDATE ON "public"."mobile_forms" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_permission_templates_updated_at" BEFORE UPDATE ON "public"."permission_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_project_announcements_updated_at" BEFORE UPDATE ON "public"."project_announcements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_projects_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchase_orders_updated_at" BEFORE UPDATE ON "public"."purchase_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_purchase_request_status_trigger" AFTER INSERT OR UPDATE ON "public"."approval_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."update_purchase_request_status"();



CREATE OR REPLACE TRIGGER "update_purchase_requests_updated_at" BEFORE UPDATE ON "public"."purchase_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scope_items_updated_at" BEFORE UPDATE ON "public"."scope_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shop_drawing_comments_updated_at" BEFORE UPDATE ON "public"."shop_drawing_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_shop_drawings_updated_at" BEFORE UPDATE ON "public"."shop_drawings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subcontractor_reports_updated_at" BEFORE UPDATE ON "public"."subcontractor_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subcontractor_users_updated_at" BEFORE UPDATE ON "public"."subcontractor_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_suppliers_updated_at" BEFORE UPDATE ON "public"."suppliers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_system_settings_updated_at" BEFORE UPDATE ON "public"."system_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_task_comments_updated_at" BEFORE UPDATE ON "public"."task_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tasks_updated_at" BEFORE UPDATE ON "public"."tasks" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tender_submissions_updated_at" BEFORE UPDATE ON "public"."tender_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tenders_updated_at" BEFORE UPDATE ON "public"."tenders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_thread_last_message_trigger" AFTER INSERT ON "public"."client_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_thread_last_message"();



CREATE OR REPLACE TRIGGER "update_user_dashboard_settings_updated_at" BEFORE UPDATE ON "public"."user_dashboard_settings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vendor_rating_trigger" AFTER INSERT ON "public"."vendor_ratings" FOR EACH ROW EXECUTE FUNCTION "public"."update_vendor_performance_rating"();



CREATE OR REPLACE TRIGGER "update_vendors_updated_at" BEFORE UPDATE ON "public"."vendors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "user_profiles_updated_at_trigger" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "validate_approval_workflow_trigger" BEFORE INSERT OR UPDATE ON "public"."approval_workflows" FOR EACH ROW EXECUTE FUNCTION "public"."validate_approval_workflow"();



CREATE OR REPLACE TRIGGER "validate_client_document_access_trigger" BEFORE INSERT ON "public"."client_document_access" FOR EACH ROW EXECUTE FUNCTION "public"."validate_client_access"();



ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."activity_summary"
    ADD CONSTRAINT "activity_summary_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."activity_summary"
    ADD CONSTRAINT "activity_summary_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_current_approver_fkey" FOREIGN KEY ("current_approver") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."approval_requests"
    ADD CONSTRAINT "approval_requests_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."approval_workflows"
    ADD CONSTRAINT "approval_workflows_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."approval_workflows"
    ADD CONSTRAINT "approval_workflows_delegated_to_fkey" FOREIGN KEY ("delegated_to") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."approval_workflows"
    ADD CONSTRAINT "approval_workflows_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_activity_log"
    ADD CONSTRAINT "client_activity_log_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_activity_log"
    ADD CONSTRAINT "client_activity_log_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_communication_threads"
    ADD CONSTRAINT "client_communication_threads_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_communication_threads"
    ADD CONSTRAINT "client_communication_threads_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_communication_threads"
    ADD CONSTRAINT "client_communication_threads_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_access"
    ADD CONSTRAINT "client_document_access_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_access"
    ADD CONSTRAINT "client_document_access_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_access"
    ADD CONSTRAINT "client_document_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_document_approvals"
    ADD CONSTRAINT "client_document_approvals_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_approvals"
    ADD CONSTRAINT "client_document_approvals_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_approvals"
    ADD CONSTRAINT "client_document_approvals_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."client_document_approvals"("id");



ALTER TABLE ONLY "public"."client_document_comments"
    ADD CONSTRAINT "client_document_comments_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_comments"
    ADD CONSTRAINT "client_document_comments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_document_comments"
    ADD CONSTRAINT "client_document_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."client_document_comments"("id");



ALTER TABLE ONLY "public"."client_document_comments"
    ADD CONSTRAINT "client_document_comments_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_messages"
    ADD CONSTRAINT "client_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_messages"
    ADD CONSTRAINT "client_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "public"."client_communication_threads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_notifications"
    ADD CONSTRAINT "client_notifications_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_notifications"
    ADD CONSTRAINT "client_notifications_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_permissions"
    ADD CONSTRAINT "client_permissions_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_permissions"
    ADD CONSTRAINT "client_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_project_access"
    ADD CONSTRAINT "client_project_access_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_project_access"
    ADD CONSTRAINT "client_project_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_project_access"
    ADD CONSTRAINT "client_project_access_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_client_company_id_fkey" FOREIGN KEY ("client_company_id") REFERENCES "public"."client_companies"("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."delivery_confirmations"
    ADD CONSTRAINT "delivery_confirmations_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."delivery_confirmations"
    ADD CONSTRAINT "delivery_confirmations_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."document_approvals"
    ADD CONSTRAINT "document_approvals_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."drawing_sets"
    ADD CONSTRAINT "drawing_sets_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."drawing_sets"
    ADD CONSTRAINT "drawing_sets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_photos"
    ADD CONSTRAINT "field_photos_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."mobile_devices"("device_id");



ALTER TABLE ONLY "public"."field_photos"
    ADD CONSTRAINT "field_photos_field_report_id_fkey" FOREIGN KEY ("field_report_id") REFERENCES "public"."field_reports"("id");



ALTER TABLE ONLY "public"."field_photos"
    ADD CONSTRAINT "field_photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_photos"
    ADD CONSTRAINT "field_photos_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."field_photos"
    ADD CONSTRAINT "field_photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."field_reports"
    ADD CONSTRAINT "field_reports_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."material_specs"
    ADD CONSTRAINT "material_specs_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."material_specs"
    ADD CONSTRAINT "material_specs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."material_specs"
    ADD CONSTRAINT "material_specs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."material_specs"
    ADD CONSTRAINT "material_specs_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."material_specs"
    ADD CONSTRAINT "material_specs_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."mobile_devices"
    ADD CONSTRAINT "mobile_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mobile_form_submissions"
    ADD CONSTRAINT "mobile_form_submissions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."mobile_devices"("device_id");



ALTER TABLE ONLY "public"."mobile_form_submissions"
    ADD CONSTRAINT "mobile_form_submissions_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "public"."mobile_forms"("id");



ALTER TABLE ONLY "public"."mobile_form_submissions"
    ADD CONSTRAINT "mobile_form_submissions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."mobile_form_submissions"
    ADD CONSTRAINT "mobile_form_submissions_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."mobile_form_submissions"
    ADD CONSTRAINT "mobile_form_submissions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."mobile_forms"
    ADD CONSTRAINT "mobile_forms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."mobile_sync_queue"
    ADD CONSTRAINT "mobile_sync_queue_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."mobile_devices"("device_id");



ALTER TABLE ONLY "public"."mobile_sync_queue"
    ADD CONSTRAINT "mobile_sync_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."project_announcements"
    ADD CONSTRAINT "project_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."project_announcements"
    ADD CONSTRAINT "project_announcements_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_reporting_to_fkey" FOREIGN KEY ("reporting_to") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."project_assignments"
    ADD CONSTRAINT "project_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."project_milestones"
    ADD CONSTRAINT "project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_project_manager_id_fkey" FOREIGN KEY ("project_manager_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_phone_confirmed_by_fkey" FOREIGN KEY ("phone_confirmed_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_purchase_request_id_fkey" FOREIGN KEY ("purchase_request_id") REFERENCES "public"."purchase_requests"("id");



ALTER TABLE ONLY "public"."purchase_orders"
    ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id");



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."purchase_requests"
    ADD CONSTRAINT "purchase_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."scope_dependencies"
    ADD CONSTRAINT "scope_dependencies_depends_on_id_fkey" FOREIGN KEY ("depends_on_id") REFERENCES "public"."scope_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scope_dependencies"
    ADD CONSTRAINT "scope_dependencies_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scope_items"
    ADD CONSTRAINT "scope_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."scope_material_links"
    ADD CONSTRAINT "scope_material_links_material_spec_id_fkey" FOREIGN KEY ("material_spec_id") REFERENCES "public"."material_specs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scope_material_links"
    ADD CONSTRAINT "scope_material_links_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_drawing_approvals"
    ADD CONSTRAINT "shop_drawing_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawing_approvals"
    ADD CONSTRAINT "shop_drawing_approvals_shop_drawing_id_fkey" FOREIGN KEY ("shop_drawing_id") REFERENCES "public"."shop_drawings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_drawing_comments"
    ADD CONSTRAINT "shop_drawing_comments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawing_comments"
    ADD CONSTRAINT "shop_drawing_comments_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawing_comments"
    ADD CONSTRAINT "shop_drawing_comments_shop_drawing_id_fkey" FOREIGN KEY ("shop_drawing_id") REFERENCES "public"."shop_drawings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_drawing_revisions"
    ADD CONSTRAINT "shop_drawing_revisions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawing_revisions"
    ADD CONSTRAINT "shop_drawing_revisions_shop_drawing_id_fkey" FOREIGN KEY ("shop_drawing_id") REFERENCES "public"."shop_drawings"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_assigned_architect_fkey" FOREIGN KEY ("assigned_architect") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_client_approved_by_fkey" FOREIGN KEY ("client_approved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_internal_approved_by_fkey" FOREIGN KEY ("internal_approved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shop_drawings"
    ADD CONSTRAINT "shop_drawings_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_payment_approved_by_fkey" FOREIGN KEY ("payment_approved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subcontractor_assignments"
    ADD CONSTRAINT "subcontractor_assignments_work_approved_by_fkey" FOREIGN KEY ("work_approved_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."subcontractor_reports"
    ADD CONSTRAINT "subcontractor_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."subcontractor_reports"
    ADD CONSTRAINT "subcontractor_reports_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractor_users"("id");



ALTER TABLE ONLY "public"."subcontractor_scope_access"
    ADD CONSTRAINT "subcontractor_scope_access_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."subcontractor_scope_access"
    ADD CONSTRAINT "subcontractor_scope_access_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."subcontractor_scope_access"
    ADD CONSTRAINT "subcontractor_scope_access_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."subcontractor_scope_access"
    ADD CONSTRAINT "subcontractor_scope_access_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "public"."subcontractor_users"("id");



ALTER TABLE ONLY "public"."subcontractor_users"
    ADD CONSTRAINT "subcontractor_users_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."subcontractor_users"
    ADD CONSTRAINT "subcontractor_users_user_profile_id_fkey" FOREIGN KEY ("user_profile_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."subcontractors"
    ADD CONSTRAINT "subcontractors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_comments"
    ADD CONSTRAINT "task_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_scope_item_id_fkey" FOREIGN KEY ("scope_item_id") REFERENCES "public"."scope_items"("id");



ALTER TABLE ONLY "public"."tender_evaluations"
    ADD CONSTRAINT "tender_evaluations_evaluator_id_fkey" FOREIGN KEY ("evaluator_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."tender_evaluations"
    ADD CONSTRAINT "tender_evaluations_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."tender_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tender_evaluations"
    ADD CONSTRAINT "tender_evaluations_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tender_items"
    ADD CONSTRAINT "tender_items_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tender_submission_items"
    ADD CONSTRAINT "tender_submission_items_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "public"."tender_submissions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tender_submission_items"
    ADD CONSTRAINT "tender_submission_items_tender_item_id_fkey" FOREIGN KEY ("tender_item_id") REFERENCES "public"."tender_items"("id");



ALTER TABLE ONLY "public"."tender_submissions"
    ADD CONSTRAINT "tender_submissions_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."tender_submissions"
    ADD CONSTRAINT "tender_submissions_tender_id_fkey" FOREIGN KEY ("tender_id") REFERENCES "public"."tenders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tenders"
    ADD CONSTRAINT "tenders_awarded_to_fkey" FOREIGN KEY ("awarded_to") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."tenders"
    ADD CONSTRAINT "tenders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."tenders"
    ADD CONSTRAINT "tenders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id");



ALTER TABLE ONLY "public"."user_dashboard_settings"
    ADD CONSTRAINT "user_dashboard_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_dashboard_settings"
    ADD CONSTRAINT "user_dashboard_settings_widget_id_fkey" FOREIGN KEY ("widget_id") REFERENCES "public"."dashboard_widgets"("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id");



ALTER TABLE ONLY "public"."vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "public"."user_profiles"("id");



ALTER TABLE ONLY "public"."vendor_ratings"
    ADD CONSTRAINT "vendor_ratings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vendors"
    ADD CONSTRAINT "vendors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."user_profiles"("id");



CREATE POLICY "Admin manage all devices" ON "public"."mobile_devices" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = 'admin'::"public"."user_role_old")))));



CREATE POLICY "Admins can insert subcontractor profiles" ON "public"."subcontractor_users" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role_old", 'project_manager'::"public"."user_role_old", 'technical_director'::"public"."user_role_old"]))))));



CREATE POLICY "Admins can update subcontractor profiles" ON "public"."subcontractor_users" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role_old", 'project_manager'::"public"."user_role_old", 'technical_director'::"public"."user_role_old"]))))));



CREATE POLICY "Announcement project access" ON "public"."project_announcements" FOR SELECT USING (("public"."is_management_role"() OR "public"."has_project_access"("project_id") OR "public"."is_client_with_project_access"("project_id")));



CREATE POLICY "Approval request access" ON "public"."approval_requests" USING (("public"."is_management"() OR ("requested_by" = "auth"."uid"()) OR ("current_approver" = "auth"."uid"()) OR ("public"."is_project_manager"() AND (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."project_id" = "approval_requests"."project_id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true)))))));



CREATE POLICY "Approver workflow access" ON "public"."approval_workflows" USING ((("approver_id" = "auth"."uid"()) OR ("delegated_to" = "auth"."uid"())));



CREATE POLICY "Architect shop drawing management" ON "public"."shop_drawings" USING ((("assigned_architect" = "auth"."uid"()) OR ("created_by" = "auth"."uid"())));



CREATE POLICY "Assigned user task access" ON "public"."tasks" USING ((("assigned_to" = "auth"."uid"()) OR ("assigned_by" = "auth"."uid"())));



CREATE POLICY "Assignment management" ON "public"."project_assignments" USING (("public"."is_management"() OR ("public"."is_project_manager"() AND (("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_assignments"."project_id") AND ("p"."project_manager_id" = "auth"."uid"()))))))));



CREATE POLICY "Client approval access" ON "public"."document_approvals" USING ((("approver_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "document_approvals"."document_id") AND "public"."is_client_with_project_access"("d"."project_id") AND ("document_approvals"."approver_type" = 'client'::"text"))))));



CREATE POLICY "Client data access" ON "public"."clients" USING (("public"."is_management"() OR ("public"."is_project_manager"() AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."client_id" = "clients"."id") AND (("p"."project_manager_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_assignments" "pa"
          WHERE (("pa"."project_id" = "p"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true))))))))) OR ("public"."is_client"() AND ("id" = "auth"."uid"()))));



CREATE POLICY "Client document access" ON "public"."documents" FOR SELECT USING ((("is_client_visible" = true) AND "public"."is_client_with_project_access"("project_id")));



CREATE POLICY "Client project access" ON "public"."projects" FOR SELECT USING (("public"."is_client"() AND ("client_id" = "auth"."uid"())));



CREATE POLICY "Client scope access" ON "public"."scope_items" FOR SELECT USING (("public"."is_client"() AND (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "scope_items"."project_id") AND ("p"."client_id" = "auth"."uid"()))))));



CREATE POLICY "Client shop drawing view" ON "public"."shop_drawings" FOR SELECT USING ((("status" = ANY (ARRAY['submitted_to_client'::"public"."shop_drawing_status", 'client_review'::"public"."shop_drawing_status", 'approved'::"public"."shop_drawing_status", 'approved_with_comments'::"public"."shop_drawing_status"])) AND "public"."is_client_with_project_access"("project_id")));



CREATE POLICY "Delivery confirmation creation" ON "public"."delivery_confirmations" FOR INSERT WITH CHECK (("public"."can_confirm_deliveries"() AND (EXISTS ( SELECT 1
   FROM ("public"."purchase_orders" "po"
     JOIN "public"."purchase_requests" "pr" ON (("pr"."id" = "po"."purchase_request_id")))
  WHERE (("po"."id" = "delivery_confirmations"."purchase_order_id") AND "public"."has_project_access"("pr"."project_id"))))));



CREATE POLICY "Drawing comment access" ON "public"."shop_drawing_comments" USING ((EXISTS ( SELECT 1
   FROM "public"."shop_drawings" "sd"
  WHERE (("sd"."id" = "shop_drawing_comments"."shop_drawing_id") AND ("public"."is_management_role"() OR "public"."has_project_access"("sd"."project_id") OR (("sd"."status" = ANY (ARRAY['submitted_to_client'::"public"."shop_drawing_status", 'client_review'::"public"."shop_drawing_status"])) AND "public"."is_client_with_project_access"("sd"."project_id")))))));



CREATE POLICY "Drawing revision access follows drawing" ON "public"."shop_drawing_revisions" USING ((EXISTS ( SELECT 1
   FROM "public"."shop_drawings" "sd"
  WHERE (("sd"."id" = "shop_drawing_revisions"."shop_drawing_id") AND ("public"."is_management_role"() OR "public"."has_project_access"("sd"."project_id") OR ("sd"."assigned_architect" = "auth"."uid"()))))));



CREATE POLICY "Field photo project access" ON "public"."field_photos" USING (("public"."is_management_role"() OR "public"."has_project_access"("project_id") OR ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "Field worker delivery confirmation" ON "public"."delivery_confirmations" USING ((("confirmed_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ((("public"."user_profiles" "up"
     JOIN "public"."purchase_orders" "po" ON (("po"."id" = "delivery_confirmations"."purchase_order_id")))
     JOIN "public"."purchase_requests" "pr" ON (("pr"."id" = "po"."purchase_request_id")))
     JOIN "public"."project_assignments" "pa" ON (("pa"."project_id" = "pr"."project_id")))
  WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'field_worker'::"public"."user_role_old") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true))))));



CREATE POLICY "Field worker document create" ON "public"."documents" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'user_role'::"text") = 'field_worker'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."user_id" = "auth"."uid"()) AND ("pa"."project_id" = "documents"."project_id") AND ("pa"."is_active" = true) AND ("documents"."document_type" = ANY (ARRAY['report'::"public"."document_type", 'photo'::"public"."document_type"])))))));



CREATE POLICY "Field worker own documents" ON "public"."documents" USING ((("uploaded_by" = "auth"."uid"()) AND (("auth"."jwt"() ->> 'user_role'::"text") = 'field_worker'::"text")));



CREATE POLICY "Field worker own reports" ON "public"."field_reports" USING (("submitted_by" = "auth"."uid"()));



CREATE POLICY "Field worker purchase request read" ON "public"."purchase_requests" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."user_profiles" "up"
     JOIN "public"."project_assignments" "pa" ON (("pa"."user_id" = "up"."id")))
  WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'field_worker'::"public"."user_role_old") AND ("pa"."project_id" = "purchase_requests"."project_id") AND ("pa"."is_active" = true)))));



CREATE POLICY "Internal users can view subcontractor profiles" ON "public"."subcontractor_users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role_old", 'project_manager'::"public"."user_role_old", 'technical_director'::"public"."user_role_old"]))))));



CREATE POLICY "Management and purchase vendor access" ON "public"."vendors" USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "Management approval access" ON "public"."document_approvals" USING (("public"."is_management_role"() OR (EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "document_approvals"."document_id") AND "public"."has_project_access"("d"."project_id"))))));



CREATE POLICY "Management approval workflow access" ON "public"."approval_workflows" USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "Management can view all activity" ON "public"."activity_summary" FOR SELECT USING ("public"."is_management_role"());



CREATE POLICY "Management can view all audit logs" ON "public"."audit_logs" FOR SELECT USING ("public"."is_management_role"());



CREATE POLICY "Management create announcements" ON "public"."project_announcements" FOR INSERT WITH CHECK (("public"."is_management_role"() OR (EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "project_announcements"."project_id") AND ("p"."project_manager_id" = "auth"."uid"()))))));



CREATE POLICY "Management delivery confirmation access" ON "public"."delivery_confirmations" USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "Management document access" ON "public"."documents" USING ("public"."is_management_role"());



CREATE POLICY "Management field report access" ON "public"."field_reports" USING ("public"."is_management_role"());



CREATE POLICY "Management full user access" ON "public"."user_profiles" USING ("public"."is_management"());



CREATE POLICY "Management project access" ON "public"."projects" USING ("public"."is_management"());



CREATE POLICY "Management purchase order access" ON "public"."purchase_orders" USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "Management purchase request access" ON "public"."purchase_requests" USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "Management scope access" ON "public"."scope_items" USING (("public"."is_management"() OR "public"."is_technical_lead"()));



CREATE POLICY "Management submission access" ON "public"."tender_submissions" USING ("public"."is_management_role"());



CREATE POLICY "Management supplier access" ON "public"."suppliers" USING (("public"."is_management_role"() OR (("auth"."jwt"() ->> 'user_role'::"text") = ANY (ARRAY['purchase_director'::"text", 'purchase_specialist'::"text"]))));



CREATE POLICY "Management task access" ON "public"."tasks" USING ("public"."is_management_role"());



CREATE POLICY "Management tender access" ON "public"."tenders" USING ("public"."is_management_role"());



CREATE POLICY "Management vendor rating access" ON "public"."vendor_ratings" USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "PM can view project activity" ON "public"."activity_summary" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "activity_summary"."project_id") AND ("p"."project_manager_id" = "auth"."uid"())))));



CREATE POLICY "PM project access" ON "public"."projects" USING (("public"."is_project_manager"() AND (("project_manager_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."project_id" = "projects"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true)))))));



CREATE POLICY "PM scope access" ON "public"."scope_items" USING (("public"."is_project_manager"() AND (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."project_id" = "scope_items"."project_id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true))))));



CREATE POLICY "PM subcontractor access" ON "public"."subcontractors" FOR SELECT USING (("public"."is_project_manager"() AND (EXISTS ( SELECT 1
   FROM ("public"."subcontractor_assignments" "sa"
     JOIN "public"."project_assignments" "pa" ON (("sa"."project_id" = "pa"."project_id")))
  WHERE (("sa"."subcontractor_id" = "subcontractors"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true))))));



CREATE POLICY "Project manager vendor rating" ON "public"."vendor_ratings" USING ((EXISTS ( SELECT 1
   FROM ("public"."user_profiles" "up"
     JOIN "public"."projects" "p" ON (("p"."project_manager_id" = "up"."id")))
  WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'project_manager'::"public"."user_role_old") AND ("p"."id" = "vendor_ratings"."project_id")))));



CREATE POLICY "Project managers can create scope material links" ON "public"."scope_material_links" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."scope_items" "si"
     JOIN "public"."projects" "p" ON (("si"."project_id" = "p"."id")))
  WHERE (("si"."id" = "scope_material_links"."scope_item_id") AND (("p"."project_manager_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_assignments" "pa"
          WHERE (("pa"."project_id" = "p"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."role" = ANY (ARRAY['project_manager'::"text", 'owner'::"text"])) AND ("pa"."is_active" = true)))) OR (EXISTS ( SELECT 1
           FROM "public"."user_profiles" "up"
          WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'admin'::"public"."user_role_old")))))))));



CREATE POLICY "Project managers can manage scope access" ON "public"."subcontractor_scope_access" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role_old", 'project_manager'::"public"."user_role_old", 'technical_director'::"public"."user_role_old"]))))));



CREATE POLICY "Project managers can manage suppliers" ON "public"."suppliers" USING (("auth"."uid"() IN ( SELECT "user_profiles"."id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."role" = ANY (ARRAY['company_owner'::"public"."user_role_old", 'general_manager'::"public"."user_role_old", 'deputy_general_manager'::"public"."user_role_old", 'project_manager'::"public"."user_role_old"])))));



CREATE POLICY "Project managers can update scope material links" ON "public"."scope_material_links" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."scope_items" "si"
     JOIN "public"."projects" "p" ON (("si"."project_id" = "p"."id")))
  WHERE (("si"."id" = "scope_material_links"."scope_item_id") AND (("p"."project_manager_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_assignments" "pa"
          WHERE (("pa"."project_id" = "p"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."role" = ANY (ARRAY['project_manager'::"text", 'owner'::"text"])) AND ("pa"."is_active" = true)))) OR (EXISTS ( SELECT 1
           FROM "public"."user_profiles" "up"
          WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'admin'::"public"."user_role_old")))))))));



CREATE POLICY "Project managers can view project reports" ON "public"."subcontractor_reports" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['admin'::"public"."user_role_old", 'project_manager'::"public"."user_role_old", 'technical_director'::"public"."user_role_old"]))))));



CREATE POLICY "Project owners can delete scope material links" ON "public"."scope_material_links" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."scope_items" "si"
     JOIN "public"."projects" "p" ON (("si"."project_id" = "p"."id")))
  WHERE (("si"."id" = "scope_material_links"."scope_item_id") AND (("p"."project_manager_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_assignments" "pa"
          WHERE (("pa"."project_id" = "p"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."role" = 'owner'::"text") AND ("pa"."is_active" = true)))) OR (EXISTS ( SELECT 1
           FROM "public"."user_profiles" "up"
          WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'admin'::"public"."user_role_old")))))))));



CREATE POLICY "Project team delivery confirmation read" ON "public"."delivery_confirmations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."purchase_orders" "po"
     JOIN "public"."purchase_requests" "pr" ON (("pr"."id" = "po"."purchase_request_id")))
  WHERE (("po"."id" = "delivery_confirmations"."purchase_order_id") AND "public"."has_project_access"("pr"."project_id")))));



CREATE POLICY "Project team dependencies access" ON "public"."scope_dependencies" USING (("public"."is_management_role"() OR (EXISTS ( SELECT 1
   FROM "public"."scope_items" "si"
  WHERE (("si"."id" = "scope_dependencies"."scope_item_id") AND "public"."has_project_access"("si"."project_id"))))));



CREATE POLICY "Project team document access" ON "public"."documents" USING ("public"."has_project_access"("project_id"));



CREATE POLICY "Project team field report access" ON "public"."field_reports" USING ("public"."has_project_access"("project_id"));



CREATE POLICY "Project team purchase order read" ON "public"."purchase_orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_requests" "pr"
  WHERE (("pr"."id" = "purchase_orders"."purchase_request_id") AND "public"."has_project_access"("pr"."project_id") AND (EXISTS ( SELECT 1
           FROM "public"."user_profiles"
          WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['project_manager'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old", 'architect'::"public"."user_role_old"])))))))));



CREATE POLICY "Project team purchase request create" ON "public"."purchase_requests" FOR INSERT WITH CHECK (("public"."can_create_purchase_requests"() AND "public"."has_project_access"("project_id")));



CREATE POLICY "Project team purchase request read" ON "public"."purchase_requests" FOR SELECT USING (("public"."has_project_access"("project_id") AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['project_manager'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old", 'architect'::"public"."user_role_old"])))))));



CREATE POLICY "Project team shop drawing access" ON "public"."shop_drawings" USING (("public"."is_management_role"() OR "public"."has_project_access"("project_id")));



CREATE POLICY "Project team supplier read" ON "public"."suppliers" FOR SELECT USING ((("auth"."jwt"() ->> 'user_role'::"text") = ANY (ARRAY['project_manager'::"text", 'technical_engineer'::"text", 'architect'::"text"])));



CREATE POLICY "Project team task access" ON "public"."tasks" USING ("public"."has_project_access"("project_id"));



CREATE POLICY "Project team vendor read access" ON "public"."vendors" FOR SELECT USING ((("is_active" = true) AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['project_manager'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old", 'architect'::"public"."user_role_old"])))))));



CREATE POLICY "Public settings read access" ON "public"."system_settings" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public tender read" ON "public"."tenders" FOR SELECT USING ((("is_public" = true) AND ("status" = ANY (ARRAY['published'::"public"."tender_status", 'bidding_open'::"public"."tender_status"]))));



CREATE POLICY "Public widget configurations" ON "public"."dashboard_widgets" FOR SELECT USING (("is_default" = true));



CREATE POLICY "Purchase order creator access" ON "public"."purchase_orders" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Purchase order modification protection" ON "public"."purchase_orders" FOR UPDATE USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"() OR ("created_by" = "auth"."uid"()))) WITH CHECK (((("status" = 'draft'::"public"."po_status") AND ("created_by" = "auth"."uid"())) OR "public"."has_purchase_department_access"()));



CREATE POLICY "Purchase request deletion restriction" ON "public"."purchase_requests" FOR DELETE USING ((("public"."is_management_role"() OR ("requester_id" = "auth"."uid"())) AND ("status" = 'draft'::"public"."request_status") AND (NOT (EXISTS ( SELECT 1
   FROM "public"."purchase_orders" "po"
  WHERE ("po"."purchase_request_id" = "purchase_requests"."id"))))));



CREATE POLICY "Purchase request status protection" ON "public"."purchase_requests" FOR UPDATE USING (("public"."is_management_role"() OR "public"."has_purchase_department_access"() OR (("requester_id" = "auth"."uid"()) AND ("status" = 'draft'::"public"."request_status")))) WITH CHECK (((("status" = 'draft'::"public"."request_status") AND ("requester_id" = "auth"."uid"())) OR (("status" = 'pending_approval'::"public"."request_status") AND "public"."can_create_purchase_requests"()) OR (("status" = ANY (ARRAY['approved'::"public"."request_status", 'rejected'::"public"."request_status", 'cancelled'::"public"."request_status"])) AND "public"."has_purchase_department_access"())));



CREATE POLICY "Purchase request workflow visibility" ON "public"."approval_workflows" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."purchase_requests" "pr"
  WHERE (("pr"."id" = "approval_workflows"."purchase_request_id") AND (("pr"."requester_id" = "auth"."uid"()) OR "public"."has_project_access"("pr"."project_id"))))));



CREATE POLICY "Rater own vendor rating access" ON "public"."vendor_ratings" USING (("rater_id" = "auth"."uid"()));



CREATE POLICY "Requester own purchase request access" ON "public"."purchase_requests" USING ((("requester_id" = "auth"."uid"()) AND (("status" = 'draft'::"public"."request_status") OR (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['project_manager'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old", 'architect'::"public"."user_role_old"]))))))));



CREATE POLICY "Subcontractor assignment access" ON "public"."subcontractor_assignments" USING (("public"."is_management"() OR "public"."is_technical_lead"() OR ("public"."is_project_manager"() AND (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."project_id" = "subcontractor_assignments"."project_id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true)))))));



CREATE POLICY "Subcontractor document access" ON "public"."documents" FOR SELECT USING ((((("auth"."jwt"() ->> 'user_role'::"text") = 'subcontractor'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."project_assignments" "pa"
  WHERE (("pa"."user_id" = "auth"."uid"()) AND ("pa"."project_id" = "documents"."project_id") AND ("pa"."is_active" = true))))) OR ("uploaded_by" = "auth"."uid"())));



CREATE POLICY "Subcontractor management" ON "public"."subcontractors" USING (("public"."is_management"() OR "public"."is_technical_lead"()));



CREATE POLICY "Subcontractors can insert own reports" ON "public"."subcontractor_reports" FOR INSERT WITH CHECK (("subcontractor_id" IN ( SELECT "subcontractor_users"."id"
   FROM "public"."subcontractor_users"
  WHERE ("subcontractor_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "Subcontractors can view assigned documents" ON "public"."subcontractor_scope_access" FOR SELECT USING (("subcontractor_id" IN ( SELECT "subcontractor_users"."id"
   FROM "public"."subcontractor_users"
  WHERE ("subcontractor_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "Subcontractors can view own profile" ON "public"."subcontractor_users" FOR SELECT USING (("user_profile_id" = "auth"."uid"()));



CREATE POLICY "Subcontractors can view own reports" ON "public"."subcontractor_reports" FOR SELECT USING (("subcontractor_id" IN ( SELECT "subcontractor_users"."id"
   FROM "public"."subcontractor_users"
  WHERE ("subcontractor_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "Supplier own submission" ON "public"."tender_submissions" USING ((EXISTS ( SELECT 1
   FROM "public"."suppliers" "s"
  WHERE (("s"."id" = "tender_submissions"."supplier_id") AND ("s"."created_by" = "auth"."uid"())))));



CREATE POLICY "System approval workflow creation" ON "public"."approval_workflows" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."purchase_requests" "pr"
  WHERE (("pr"."id" = "approval_workflows"."purchase_request_id") AND ("pr"."status" = 'pending_approval'::"public"."request_status")))));



CREATE POLICY "Task comment access follows task access" ON "public"."task_comments" USING ((EXISTS ( SELECT 1
   FROM "public"."tasks" "t"
  WHERE (("t"."id" = "task_comments"."task_id") AND ("public"."is_management_role"() OR "public"."has_project_access"("t"."project_id") OR ("t"."assigned_to" = "auth"."uid"()) OR ("t"."assigned_by" = "auth"."uid"()))))));



CREATE POLICY "Team member vendor rating read" ON "public"."vendor_ratings" FOR SELECT USING (("public"."has_project_access"("project_id") AND (EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['project_manager'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old", 'architect'::"public"."user_role_old"])))))));



CREATE POLICY "Technical submission access" ON "public"."tender_submissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['technical_director'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old"]))))));



CREATE POLICY "Technical tender access" ON "public"."tenders" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['technical_director'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old"]))))));



CREATE POLICY "Tender items access follows tender" ON "public"."tender_items" USING ((EXISTS ( SELECT 1
   FROM "public"."tenders" "t"
  WHERE (("t"."id" = "tender_items"."tender_id") AND ("public"."is_management_role"() OR (EXISTS ( SELECT 1
           FROM "public"."user_profiles"
          WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" = ANY (ARRAY['technical_director'::"public"."user_role_old", 'technical_engineer'::"public"."user_role_old"]))))) OR (("t"."is_public" = true) AND ("t"."status" = ANY (ARRAY['published'::"public"."tender_status", 'bidding_open'::"public"."tender_status"]))))))));



CREATE POLICY "User assignment access" ON "public"."project_assignments" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "User dashboard settings" ON "public"."user_dashboard_settings" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "User profile access" ON "public"."user_profiles" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM ("public"."project_assignments" "pa1"
     JOIN "public"."project_assignments" "pa2" ON (("pa1"."project_id" = "pa2"."project_id")))
  WHERE (("pa1"."user_id" = "auth"."uid"()) AND ("pa2"."user_id" = "user_profiles"."id") AND ("pa1"."is_active" = true) AND ("pa2"."is_active" = true))))));



CREATE POLICY "Users access own messages" ON "public"."messages" USING ((("sender_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "Users can view active suppliers" ON "public"."suppliers" FOR SELECT USING ((("status")::"text" = 'active'::"text"));



CREATE POLICY "Users can view activity logs they have access to" ON "public"."activity_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own activity" ON "public"."activity_summary" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own audit logs" ON "public"."audit_logs" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view scope material links" ON "public"."scope_material_links" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."scope_items" "si"
     JOIN "public"."projects" "p" ON (("si"."project_id" = "p"."id")))
  WHERE (("si"."id" = "scope_material_links"."scope_item_id") AND (("p"."project_manager_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."project_assignments" "pa"
          WHERE (("pa"."project_id" = "p"."id") AND ("pa"."user_id" = "auth"."uid"()) AND ("pa"."is_active" = true)))) OR (EXISTS ( SELECT 1
           FROM "public"."user_profiles" "up"
          WHERE (("up"."id" = "auth"."uid"()) AND ("up"."role" = 'admin'::"public"."user_role_old")))))))));



CREATE POLICY "Users manage own devices" ON "public"."mobile_devices" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own notifications" ON "public"."notifications" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users manage own sync queue" ON "public"."mobile_sync_queue" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Vendor creator access" ON "public"."vendors" USING (("created_by" = "auth"."uid"()));



CREATE POLICY "Vendor deactivation restriction" ON "public"."vendors" FOR UPDATE USING (("public"."is_management_role"() OR ("public"."has_purchase_department_access"() AND ("created_by" = "auth"."uid"())))) WITH CHECK ((("is_active" = ( SELECT "vendors_1"."is_active"
   FROM "public"."vendors" "vendors_1"
  WHERE ("vendors_1"."id" = "vendors_1"."id"))) OR "public"."is_management_role"() OR "public"."has_purchase_department_access"()));



CREATE POLICY "Vendor deletion restriction" ON "public"."vendors" FOR DELETE USING (("public"."is_management_role"() AND (NOT (EXISTS ( SELECT 1
   FROM "public"."purchase_orders"
  WHERE ("purchase_orders"."vendor_id" = "vendors"."id"))))));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_summary" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."approval_workflows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."client_activity_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_activity_log_internal_view" ON "public"."client_activity_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_activity_log_own_access" ON "public"."client_activity_log" FOR SELECT TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "client_activity_log_system_create" ON "public"."client_activity_log" FOR INSERT TO "authenticated" WITH CHECK (true);



ALTER TABLE "public"."client_communication_threads" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_communication_threads_client_create" ON "public"."client_communication_threads" FOR INSERT TO "authenticated" WITH CHECK (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "client_communication_threads_internal_manage" ON "public"."client_communication_threads" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_communication_threads_participant_access" ON "public"."client_communication_threads" FOR SELECT TO "authenticated" USING ((("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))) OR ("auth"."uid"() = ANY ("client_participants"))));



ALTER TABLE "public"."client_companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_companies_client_access" ON "public"."client_companies" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "client_users"."client_company_id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "client_companies_internal_access" ON "public"."client_companies" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



ALTER TABLE "public"."client_document_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_document_access_internal_manage" ON "public"."client_document_access" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_document_access_own_access" ON "public"."client_document_access" FOR SELECT TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."client_document_approvals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_document_approvals_internal_view" ON "public"."client_document_approvals" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_document_approvals_own_access" ON "public"."client_document_approvals" FOR SELECT TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "client_document_approvals_own_create" ON "public"."client_document_approvals" FOR INSERT TO "authenticated" WITH CHECK (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."client_document_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_document_comments_internal_view" ON "public"."client_document_comments" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_document_comments_own_access" ON "public"."client_document_comments" FOR SELECT TO "authenticated" USING ((("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))) OR ("document_id" IN ( SELECT "cda"."document_id"
   FROM ("public"."client_document_access" "cda"
     JOIN "public"."client_users" "cu" ON (("cu"."id" = "cda"."client_user_id")))
  WHERE ("cu"."user_profile_id" = "auth"."uid"())))));



CREATE POLICY "client_document_comments_own_create" ON "public"."client_document_comments" FOR INSERT TO "authenticated" WITH CHECK (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."client_messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_messages_participant_access" ON "public"."client_messages" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."client_communication_threads" "cct"
  WHERE (("cct"."id" = "client_messages"."thread_id") AND (("cct"."client_user_id" IN ( SELECT "client_users"."id"
           FROM "public"."client_users"
          WHERE ("client_users"."user_profile_id" = "auth"."uid"()))) OR ("auth"."uid"() = ANY ("cct"."client_participants")) OR ("auth"."uid"() = ANY ("cct"."internal_participants")))))));



CREATE POLICY "client_messages_participant_create" ON "public"."client_messages" FOR INSERT TO "authenticated" WITH CHECK ((("sender_id" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."client_communication_threads" "cct"
  WHERE (("cct"."id" = "client_messages"."thread_id") AND (("cct"."client_user_id" IN ( SELECT "client_users"."id"
           FROM "public"."client_users"
          WHERE ("client_users"."user_profile_id" = "auth"."uid"()))) OR ("auth"."uid"() = ANY ("cct"."client_participants")) OR ("auth"."uid"() = ANY ("cct"."internal_participants"))))))));



ALTER TABLE "public"."client_notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_notifications_internal_manage" ON "public"."client_notifications" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_notifications_own_access" ON "public"."client_notifications" FOR SELECT TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



CREATE POLICY "client_notifications_own_update" ON "public"."client_notifications" FOR UPDATE TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."client_permissions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_permissions_internal_manage" ON "public"."client_permissions" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_permissions_own_access" ON "public"."client_permissions" FOR SELECT TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."client_project_access" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_project_access_internal_manage" ON "public"."client_project_access" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_project_access_own_access" ON "public"."client_project_access" FOR SELECT TO "authenticated" USING (("client_user_id" IN ( SELECT "client_users"."id"
   FROM "public"."client_users"
  WHERE ("client_users"."user_profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."client_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_users_internal_access" ON "public"."client_users" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."role" <> ALL (ARRAY['client'::"public"."user_role_old", 'subcontractor'::"public"."user_role_old"]))))));



CREATE POLICY "client_users_own_access" ON "public"."client_users" FOR SELECT TO "authenticated" USING (("user_profile_id" = "auth"."uid"()));



ALTER TABLE "public"."clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."dashboard_widgets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."delivery_confirmations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."drawing_sets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."field_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."material_specs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mobile_devices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mobile_form_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mobile_forms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mobile_sync_queue" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_announcements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."project_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "projects_delete_optimized" ON "public"."projects" FOR DELETE USING ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text"])));



CREATE POLICY "projects_insert_optimized" ON "public"."projects" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text", 'project_manager'::"text"])));



CREATE POLICY "projects_select_optimized" ON "public"."projects" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("project_manager_id" = "auth"."uid"()) OR ("id" IN ( SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "projects_update_optimized" ON "public"."projects" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("project_manager_id" = "auth"."uid"()) OR ("id" IN ( SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



ALTER TABLE "public"."purchase_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."purchase_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scope_dependencies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scope_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "scope_items_delete_optimized" ON "public"."scope_items" FOR DELETE USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."project_manager_id" = "auth"."uid"())
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "scope_items_insert_optimized" ON "public"."scope_items" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text", 'project_manager'::"text", 'technical_lead'::"text"])) AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."project_manager_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])))
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "scope_items_select_optimized" ON "public"."scope_items" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."project_manager_id" = "auth"."uid"())
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))
UNION
 SELECT DISTINCT "tasks"."project_id"
   FROM "public"."tasks"
  WHERE ("tasks"."assigned_to" = "auth"."uid"()))) OR ("auth"."uid"() = ANY ("assigned_to"))));



CREATE POLICY "scope_items_update_optimized" ON "public"."scope_items" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("auth"."uid"() = ANY ("assigned_to")) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."project_manager_id" = "auth"."uid"())
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



ALTER TABLE "public"."scope_material_links" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_drawing_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_drawing_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_drawing_revisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shop_drawings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcontractor_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcontractor_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcontractor_scope_access" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcontractor_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subcontractors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."task_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tasks_delete_optimized" ON "public"."tasks" FOR DELETE USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."project_manager_id" = "auth"."uid"())
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "tasks_insert_optimized" ON "public"."tasks" FOR INSERT WITH CHECK (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text", 'project_manager'::"text", 'technical_lead'::"text"])) AND ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE (("projects"."project_manager_id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])))
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "tasks_select_optimized" ON "public"."tasks" FOR SELECT USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("assigned_to" = "auth"."uid"()) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."project_manager_id" = "auth"."uid"())
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "tasks_update_optimized" ON "public"."tasks" FOR UPDATE USING (((("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("assigned_to" = "auth"."uid"()) OR ("project_id" IN ( SELECT "projects"."id"
   FROM "public"."projects"
  WHERE ("projects"."project_manager_id" = "auth"."uid"())
UNION
 SELECT DISTINCT "project_assignments"."project_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."user_id" = "auth"."uid"()) AND ("project_assignments"."is_active" = true))))));



ALTER TABLE "public"."tender_evaluations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tender_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tender_submission_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tender_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tenders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_dashboard_settings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_profiles_select_optimized" ON "public"."user_profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text", 'management'::"text"])) OR ("id" IN ( SELECT DISTINCT "tasks"."assigned_to"
   FROM "public"."tasks"
  WHERE ("tasks"."project_id" IN ( SELECT "projects"."id"
           FROM "public"."projects"
          WHERE ("projects"."project_manager_id" = "auth"."uid"())))
UNION
 SELECT DISTINCT "project_assignments"."user_id"
   FROM "public"."project_assignments"
  WHERE (("project_assignments"."project_id" IN ( SELECT "projects"."id"
           FROM "public"."projects"
          WHERE ("projects"."project_manager_id" = "auth"."uid"()))) AND ("project_assignments"."is_active" = true))))));



CREATE POLICY "user_profiles_update_optimized" ON "public"."user_profiles" FOR UPDATE USING ((("id" = "auth"."uid"()) OR (("auth"."jwt"() ->> 'role'::"text") = ANY (ARRAY['company_owner'::"text", 'general_manager'::"text", 'deputy_general_manager'::"text", 'admin'::"text"]))));



ALTER TABLE "public"."vendor_ratings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vendors" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."activity_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."material_specs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."project_assignments";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."projects";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."scope_items";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."tasks";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."user_profiles";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."analyze_table_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."analyze_table_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."analyze_table_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_subcontractor_to_scope"("p_subcontractor_id" "uuid", "p_scope_item_id" "uuid", "p_assigned_by" "uuid", "p_agreed_rate" numeric, "p_estimated_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_subcontractor_to_scope"("p_subcontractor_id" "uuid", "p_scope_item_id" "uuid", "p_assigned_by" "uuid", "p_agreed_rate" numeric, "p_estimated_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_subcontractor_to_scope"("p_subcontractor_id" "uuid", "p_scope_item_id" "uuid", "p_assigned_by" "uuid", "p_agreed_rate" numeric, "p_estimated_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_close_inactive_threads"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_close_inactive_threads"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_close_inactive_threads"() TO "service_role";



GRANT ALL ON FUNCTION "public"."broadcast_project_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."broadcast_project_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."broadcast_project_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."broadcast_scope_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."broadcast_scope_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."broadcast_scope_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."broadcast_task_update"() TO "anon";
GRANT ALL ON FUNCTION "public"."broadcast_task_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."broadcast_task_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_tender_submission_item_total"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_tender_submission_item_total"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_tender_submission_item_total"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_approve_purchase_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_approve_purchase_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_approve_purchase_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_confirm_deliveries"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_confirm_deliveries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_confirm_deliveries"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_create_purchase_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."can_create_purchase_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_create_purchase_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."can_view_user_profile"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."can_view_user_profile"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."can_view_user_profile"("target_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_performance_alerts"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_performance_alerts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_performance_alerts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_logs"("days_to_keep" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_logs"("days_to_keep" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_logs"("days_to_keep" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_client_notification"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_title" character varying, "p_message" "text", "p_notification_type" "public"."client_notification_type", "p_priority" "public"."client_priority", "p_delivery_methods" "public"."client_delivery_method"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."create_client_notification"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_title" character varying, "p_message" "text", "p_notification_type" "public"."client_notification_type", "p_priority" "public"."client_priority", "p_delivery_methods" "public"."client_delivery_method"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_client_notification"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_title" character varying, "p_message" "text", "p_notification_type" "public"."client_notification_type", "p_priority" "public"."client_priority", "p_delivery_methods" "public"."client_delivery_method"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_updated_at_trigger"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_updated_at_trigger"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_updated_at_trigger"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_drawing_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_drawing_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_drawing_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_invoice_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_payment_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_payment_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_payment_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_po_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_purchase_order_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_purchase_order_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_purchase_order_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_purchase_request_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_purchase_request_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_purchase_request_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_scope_item_no"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_scope_item_no"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_scope_item_no"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_tender_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_tender_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_tender_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_cache_hit_ratio"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_cache_hit_ratio"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_cache_hit_ratio"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_connection_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_connection_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_connection_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_material_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_material_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_material_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_cost_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_cost_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_cost_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_cost_tracking_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_cost_tracking_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_cost_tracking_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_project_access"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."has_project_access"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_project_access"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_purchase_department_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."has_purchase_department_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_purchase_department_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."invalidate_rls_cache"() TO "anon";
GRANT ALL ON FUNCTION "public"."invalidate_rls_cache"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."invalidate_rls_cache"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_client"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_client"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_client"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_client_with_project_access"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_client_with_project_access"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_client_with_project_access"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_management"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_management"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_management"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_management_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_management_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_management_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_project_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_project_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_project_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_purchase_manager"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_purchase_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_purchase_manager"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_technical_lead"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_technical_lead"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_technical_lead"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_active_from_auth"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_active_from_auth"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_active_from_auth"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_client_activity"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_activity_type" "public"."client_activity_type", "p_resource_type" character varying, "p_resource_id" "uuid", "p_action_taken" character varying, "p_description" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."log_client_activity"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_activity_type" "public"."client_activity_type", "p_resource_type" character varying, "p_resource_id" "uuid", "p_action_taken" character varying, "p_description" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_client_activity"("p_client_user_id" "uuid", "p_project_id" "uuid", "p_activity_type" "public"."client_activity_type", "p_resource_type" character varying, "p_resource_id" "uuid", "p_action_taken" character varying, "p_description" "text", "p_metadata" "jsonb", "p_ip_address" "inet", "p_user_agent" "text", "p_session_id" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."migrate_user_role"("user_id" "uuid", "new_role" "public"."user_role_optimized", "new_seniority_level" "text", "new_approval_limits" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."migrate_user_role"("user_id" "uuid", "new_role" "public"."user_role_optimized", "new_seniority_level" "text", "new_approval_limits" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."migrate_user_role"("user_id" "uuid", "new_role" "public"."user_role_optimized", "new_seniority_level" "text", "new_approval_limits" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_drawing_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_drawing_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_drawing_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."populate_jwt_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."populate_jwt_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."populate_jwt_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."run_maintenance_tasks"() TO "anon";
GRANT ALL ON FUNCTION "public"."run_maintenance_tasks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."run_maintenance_tasks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."safe_has_project_access_for_profiles"("project_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."safe_has_project_access_for_profiles"("project_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."safe_has_project_access_for_profiles"("project_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."suggest_missing_indexes"() TO "anon";
GRANT ALL ON FUNCTION "public"."suggest_missing_indexes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."suggest_missing_indexes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_policy_performance"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_policy_performance"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_policy_performance"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_client_document_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_client_document_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_client_document_access"() TO "service_role";



GRANT ALL ON FUNCTION "public"."track_index_usage"() TO "anon";
GRANT ALL ON FUNCTION "public"."track_index_usage"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."track_index_usage"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_activity_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_activity_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_activity_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_approval_request_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_approval_request_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_approval_request_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_existing_jwt_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_existing_jwt_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_existing_jwt_claims"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_material_specs_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_material_specs_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_material_specs_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_milestone_timestamps"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_milestone_timestamps"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_milestone_timestamps"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_project_actual_cost"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_project_actual_cost"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_project_actual_cost"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_purchase_request_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_purchase_request_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_purchase_request_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_scope_material_links_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_scope_material_links_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_scope_material_links_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_subcontractor_assignment_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_subcontractor_assignment_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_subcontractor_assignment_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_suppliers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_suppliers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_suppliers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_thread_last_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_thread_last_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_thread_last_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vendor_performance_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vendor_performance_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vendor_performance_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_approval_workflow"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_approval_workflow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_approval_workflow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_client_access"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_client_access"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_client_access"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."activity_summary" TO "anon";
GRANT ALL ON TABLE "public"."activity_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_summary" TO "service_role";



GRANT ALL ON TABLE "public"."approval_requests" TO "anon";
GRANT ALL ON TABLE "public"."approval_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_requests" TO "service_role";



GRANT ALL ON TABLE "public"."approval_workflows" TO "anon";
GRANT ALL ON TABLE "public"."approval_workflows" TO "authenticated";
GRANT ALL ON TABLE "public"."approval_workflows" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."client_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."client_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."client_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."client_communication_threads" TO "anon";
GRANT ALL ON TABLE "public"."client_communication_threads" TO "authenticated";
GRANT ALL ON TABLE "public"."client_communication_threads" TO "service_role";



GRANT ALL ON TABLE "public"."client_companies" TO "anon";
GRANT ALL ON TABLE "public"."client_companies" TO "authenticated";
GRANT ALL ON TABLE "public"."client_companies" TO "service_role";



GRANT ALL ON TABLE "public"."client_document_access" TO "anon";
GRANT ALL ON TABLE "public"."client_document_access" TO "authenticated";
GRANT ALL ON TABLE "public"."client_document_access" TO "service_role";



GRANT ALL ON TABLE "public"."client_document_approvals" TO "anon";
GRANT ALL ON TABLE "public"."client_document_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."client_document_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."client_document_comments" TO "anon";
GRANT ALL ON TABLE "public"."client_document_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."client_document_comments" TO "service_role";



GRANT ALL ON TABLE "public"."client_messages" TO "anon";
GRANT ALL ON TABLE "public"."client_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."client_messages" TO "service_role";



GRANT ALL ON TABLE "public"."client_notifications" TO "anon";
GRANT ALL ON TABLE "public"."client_notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."client_notifications" TO "service_role";



GRANT ALL ON TABLE "public"."client_permissions" TO "anon";
GRANT ALL ON TABLE "public"."client_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."client_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."client_project_access" TO "anon";
GRANT ALL ON TABLE "public"."client_project_access" TO "authenticated";
GRANT ALL ON TABLE "public"."client_project_access" TO "service_role";



GRANT ALL ON TABLE "public"."client_users" TO "anon";
GRANT ALL ON TABLE "public"."client_users" TO "authenticated";
GRANT ALL ON TABLE "public"."client_users" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."scope_items" TO "anon";
GRANT ALL ON TABLE "public"."scope_items" TO "authenticated";
GRANT ALL ON TABLE "public"."scope_items" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."company_project_overview" TO "anon";
GRANT ALL ON TABLE "public"."company_project_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."company_project_overview" TO "service_role";



GRANT ALL ON TABLE "public"."dashboard_widgets" TO "anon";
GRANT ALL ON TABLE "public"."dashboard_widgets" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_widgets" TO "service_role";



GRANT ALL ON TABLE "public"."delivery_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."delivery_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."delivery_confirmations" TO "service_role";



GRANT ALL ON TABLE "public"."document_approvals" TO "anon";
GRANT ALL ON TABLE "public"."document_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."document_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."drawing_sets" TO "anon";
GRANT ALL ON TABLE "public"."drawing_sets" TO "authenticated";
GRANT ALL ON TABLE "public"."drawing_sets" TO "service_role";



GRANT ALL ON TABLE "public"."field_photos" TO "anon";
GRANT ALL ON TABLE "public"."field_photos" TO "authenticated";
GRANT ALL ON TABLE "public"."field_photos" TO "service_role";



GRANT ALL ON TABLE "public"."field_reports" TO "anon";
GRANT ALL ON TABLE "public"."field_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."field_reports" TO "service_role";



GRANT ALL ON TABLE "public"."index_performance_stats" TO "anon";
GRANT ALL ON TABLE "public"."index_performance_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."index_performance_stats" TO "service_role";



GRANT ALL ON TABLE "public"."material_specs" TO "anon";
GRANT ALL ON TABLE "public"."material_specs" TO "authenticated";
GRANT ALL ON TABLE "public"."material_specs" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."migration_log" TO "anon";
GRANT ALL ON TABLE "public"."migration_log" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."migration_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."migration_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."migration_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."role_migration_log" TO "anon";
GRANT ALL ON TABLE "public"."role_migration_log" TO "authenticated";
GRANT ALL ON TABLE "public"."role_migration_log" TO "service_role";



GRANT ALL ON TABLE "public"."migration_summary" TO "anon";
GRANT ALL ON TABLE "public"."migration_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."migration_summary" TO "service_role";



GRANT ALL ON TABLE "public"."migrations" TO "anon";
GRANT ALL ON TABLE "public"."migrations" TO "authenticated";
GRANT ALL ON TABLE "public"."migrations" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_devices" TO "anon";
GRANT ALL ON TABLE "public"."mobile_devices" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_devices" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_form_submissions" TO "anon";
GRANT ALL ON TABLE "public"."mobile_form_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_form_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_forms" TO "anon";
GRANT ALL ON TABLE "public"."mobile_forms" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_forms" TO "service_role";



GRANT ALL ON TABLE "public"."mobile_sync_queue" TO "anon";
GRANT ALL ON TABLE "public"."mobile_sync_queue" TO "authenticated";
GRANT ALL ON TABLE "public"."mobile_sync_queue" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."performance_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."performance_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."permission_templates" TO "anon";
GRANT ALL ON TABLE "public"."permission_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."permission_templates" TO "service_role";



GRANT ALL ON TABLE "public"."project_assignments" TO "anon";
GRANT ALL ON TABLE "public"."project_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."project_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."pm_workload_overview" TO "anon";
GRANT ALL ON TABLE "public"."pm_workload_overview" TO "authenticated";
GRANT ALL ON TABLE "public"."pm_workload_overview" TO "service_role";



GRANT ALL ON TABLE "public"."policy_count_validation" TO "anon";
GRANT ALL ON TABLE "public"."policy_count_validation" TO "authenticated";
GRANT ALL ON TABLE "public"."policy_count_validation" TO "service_role";



GRANT ALL ON TABLE "public"."project_announcements" TO "anon";
GRANT ALL ON TABLE "public"."project_announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."project_announcements" TO "service_role";



GRANT ALL ON TABLE "public"."project_milestones" TO "anon";
GRANT ALL ON TABLE "public"."project_milestones" TO "authenticated";
GRANT ALL ON TABLE "public"."project_milestones" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_order_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_order_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_order_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_orders" TO "anon";
GRANT ALL ON TABLE "public"."purchase_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_orders" TO "service_role";



GRANT ALL ON SEQUENCE "public"."purchase_request_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."purchase_request_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."purchase_request_seq" TO "service_role";



GRANT ALL ON TABLE "public"."purchase_requests" TO "anon";
GRANT ALL ON TABLE "public"."purchase_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."purchase_requests" TO "service_role";



GRANT ALL ON TABLE "public"."scope_dependencies" TO "anon";
GRANT ALL ON TABLE "public"."scope_dependencies" TO "authenticated";
GRANT ALL ON TABLE "public"."scope_dependencies" TO "service_role";



GRANT ALL ON TABLE "public"."scope_items_no_cost" TO "anon";
GRANT ALL ON TABLE "public"."scope_items_no_cost" TO "authenticated";
GRANT ALL ON TABLE "public"."scope_items_no_cost" TO "service_role";



GRANT ALL ON TABLE "public"."scope_material_links" TO "anon";
GRANT ALL ON TABLE "public"."scope_material_links" TO "authenticated";
GRANT ALL ON TABLE "public"."scope_material_links" TO "service_role";



GRANT ALL ON TABLE "public"."shop_drawing_approvals" TO "anon";
GRANT ALL ON TABLE "public"."shop_drawing_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_drawing_approvals" TO "service_role";



GRANT ALL ON TABLE "public"."shop_drawing_comments" TO "anon";
GRANT ALL ON TABLE "public"."shop_drawing_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_drawing_comments" TO "service_role";



GRANT ALL ON TABLE "public"."shop_drawing_revisions" TO "anon";
GRANT ALL ON TABLE "public"."shop_drawing_revisions" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_drawing_revisions" TO "service_role";



GRANT ALL ON TABLE "public"."shop_drawings" TO "anon";
GRANT ALL ON TABLE "public"."shop_drawings" TO "authenticated";
GRANT ALL ON TABLE "public"."shop_drawings" TO "service_role";



GRANT ALL ON TABLE "public"."subcontractor_assignments" TO "anon";
GRANT ALL ON TABLE "public"."subcontractor_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."subcontractor_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."subcontractor_reports" TO "anon";
GRANT ALL ON TABLE "public"."subcontractor_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."subcontractor_reports" TO "service_role";



GRANT ALL ON TABLE "public"."subcontractor_scope_access" TO "anon";
GRANT ALL ON TABLE "public"."subcontractor_scope_access" TO "authenticated";
GRANT ALL ON TABLE "public"."subcontractor_scope_access" TO "service_role";



GRANT ALL ON TABLE "public"."subcontractor_users" TO "anon";
GRANT ALL ON TABLE "public"."subcontractor_users" TO "authenticated";
GRANT ALL ON TABLE "public"."subcontractor_users" TO "service_role";



GRANT ALL ON TABLE "public"."subcontractors" TO "anon";
GRANT ALL ON TABLE "public"."subcontractors" TO "authenticated";
GRANT ALL ON TABLE "public"."subcontractors" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";



GRANT ALL ON TABLE "public"."task_comments" TO "anon";
GRANT ALL ON TABLE "public"."task_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."task_comments" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON TABLE "public"."tender_evaluations" TO "anon";
GRANT ALL ON TABLE "public"."tender_evaluations" TO "authenticated";
GRANT ALL ON TABLE "public"."tender_evaluations" TO "service_role";



GRANT ALL ON TABLE "public"."tender_items" TO "anon";
GRANT ALL ON TABLE "public"."tender_items" TO "authenticated";
GRANT ALL ON TABLE "public"."tender_items" TO "service_role";



GRANT ALL ON TABLE "public"."tender_submission_items" TO "anon";
GRANT ALL ON TABLE "public"."tender_submission_items" TO "authenticated";
GRANT ALL ON TABLE "public"."tender_submission_items" TO "service_role";



GRANT ALL ON TABLE "public"."tender_submissions" TO "anon";
GRANT ALL ON TABLE "public"."tender_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."tender_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."tenders" TO "anon";
GRANT ALL ON TABLE "public"."tenders" TO "authenticated";
GRANT ALL ON TABLE "public"."tenders" TO "service_role";



GRANT ALL ON TABLE "public"."user_dashboard_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_dashboard_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_dashboard_settings" TO "service_role";



GRANT ALL ON TABLE "public"."vendor_ratings" TO "anon";
GRANT ALL ON TABLE "public"."vendor_ratings" TO "authenticated";
GRANT ALL ON TABLE "public"."vendor_ratings" TO "service_role";



GRANT ALL ON TABLE "public"."vendors" TO "anon";
GRANT ALL ON TABLE "public"."vendors" TO "authenticated";
GRANT ALL ON TABLE "public"."vendors" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
