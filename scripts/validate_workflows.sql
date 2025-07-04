-- Formula PM 2.0 Workflow Validation Script
-- Purpose: Validate all workflow tables are properly populated

-- ============================================================================
-- TABLE RECORD COUNTS
-- ============================================================================

SELECT 'CORE TABLES' as category, '' as table_name, 0 as record_count, '' as notes
UNION ALL
SELECT '', 'user_profiles', COUNT(*), 'Foundation user data' FROM user_profiles
UNION ALL
SELECT '', 'clients', COUNT(*), 'Client companies' FROM clients
UNION ALL
SELECT '', 'projects', COUNT(*), 'Active projects' FROM projects
UNION ALL
SELECT '', 'project_assignments', COUNT(*), 'Project team assignments' FROM project_assignments
UNION ALL

SELECT 'SCOPE & PROCUREMENT' as category, '' as table_name, 0 as record_count, '' as notes
UNION ALL
SELECT '', 'scope_items', COUNT(*), 'Project scope breakdown' FROM scope_items
UNION ALL
SELECT '', 'scope_dependencies', COUNT(*), 'Task dependencies' FROM scope_dependencies
UNION ALL
SELECT '', 'vendors', COUNT(*), 'Vendor database' FROM vendors
UNION ALL
SELECT '', 'purchase_requests', COUNT(*), 'Purchase workflow' FROM purchase_requests
UNION ALL
SELECT '', 'purchase_orders', COUNT(*), 'Active purchase orders' FROM purchase_orders
UNION ALL
SELECT '', 'approval_workflows', COUNT(*), 'Approval chains' FROM approval_workflows
UNION ALL
SELECT '', 'delivery_confirmations', COUNT(*), 'Delivery tracking' FROM delivery_confirmations
UNION ALL
SELECT '', 'vendor_ratings', COUNT(*), 'Vendor performance' FROM vendor_ratings
UNION ALL

SELECT 'TASK MANAGEMENT' as category, '' as table_name, 0 as record_count, '' as notes
UNION ALL
SELECT '', 'tasks', COUNT(*), 'Project tasks' FROM tasks
UNION ALL
SELECT '', 'task_comments', COUNT(*), 'Task collaboration' FROM task_comments
UNION ALL
SELECT '', 'task_activities', COUNT(*), 'Task activity log' FROM task_activities
UNION ALL

SELECT 'DOCUMENTS' as category, '' as table_name, 0 as record_count, '' as notes
UNION ALL
SELECT '', 'documents', COUNT(*), 'Project documents' FROM documents
UNION ALL
SELECT '', 'document_approvals', COUNT(*), 'Document approvals' FROM document_approvals
UNION ALL

SELECT 'CLIENT PORTAL' as category, '' as table_name, 0 as record_count, '' as notes
UNION ALL
SELECT '', 'client_communication_threads', COUNT(*), 'Client communications' FROM client_communication_threads
UNION ALL
SELECT '', 'client_messages', COUNT(*), 'Client conversations' FROM client_messages
UNION ALL
SELECT '', 'client_notifications', COUNT(*), 'Client notifications' FROM client_notifications
UNION ALL

SELECT 'PROJECT TRACKING' as category, '' as table_name, 0 as record_count, '' as notes
UNION ALL
SELECT '', 'project_milestones', COUNT(*), 'Project milestones' FROM project_milestones

ORDER BY category, table_name;

-- ============================================================================
-- WORKFLOW VALIDATION QUERIES
-- ============================================================================

-- Projects with scope items
SELECT 
  'Projects with Scope Items' as validation_check,
  COUNT(DISTINCT p.id) as projects_with_scope,
  AVG(scope_count) as avg_scope_items_per_project
FROM projects p
JOIN (
  SELECT project_id, COUNT(*) as scope_count
  FROM scope_items
  GROUP BY project_id
) s ON p.id = s.project_id;

-- Purchase workflow completion
SELECT 
  'Purchase Workflow Status' as validation_check,
  status,
  COUNT(*) as count
FROM purchase_requests
GROUP BY status
ORDER BY status;

-- Task assignment coverage
SELECT 
  'Task Assignment Status' as validation_check,
  status,
  COUNT(*) as count
FROM tasks
GROUP BY status
ORDER BY status;

-- Client communication activity
SELECT 
  'Client Communication Status' as validation_check,
  status,
  COUNT(*) as count
FROM client_communication_threads
GROUP BY status
ORDER BY status;

-- Document approval status
SELECT 
  'Document Approval Status' as validation_check,
  da.status,
  da.approver_type,
  COUNT(*) as count
FROM document_approvals da
GROUP BY da.status, da.approver_type
ORDER BY da.approver_type, da.status;

-- Vendor performance summary
SELECT 
  'Vendor Performance Summary' as validation_check,
  v.company_name,
  v.performance_rating,
  COUNT(vr.id) as rating_count
FROM vendors v
LEFT JOIN vendor_ratings vr ON v.id = vr.vendor_id
GROUP BY v.id, v.company_name, v.performance_rating
ORDER BY v.performance_rating DESC;

-- Project milestone progress
SELECT 
  'Project Milestone Progress' as validation_check,
  p.name as project_name,
  COUNT(pm.id) as total_milestones,
  COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) as completed_milestones,
  ROUND(
    100.0 * COUNT(CASE WHEN pm.status = 'completed' THEN 1 END) / NULLIF(COUNT(pm.id), 0), 
    2
  ) as completion_percentage
FROM projects p
LEFT JOIN project_milestones pm ON p.id = pm.project_id
GROUP BY p.id, p.name
ORDER BY p.name;

-- ============================================================================
-- DATA QUALITY CHECKS
-- ============================================================================

-- Check for orphaned records
SELECT 'Orphaned Records Check' as validation_check;

-- Scope items without projects
SELECT 'Orphaned Scope Items' as check_type, COUNT(*) as count
FROM scope_items si
LEFT JOIN projects p ON si.project_id = p.id
WHERE p.id IS NULL;

-- Purchase requests without projects
SELECT 'Orphaned Purchase Requests' as check_type, COUNT(*) as count
FROM purchase_requests pr
LEFT JOIN projects p ON pr.project_id = p.id
WHERE p.id IS NULL;

-- Tasks without projects (excluding global tasks)
SELECT 'Tasks Without Projects' as check_type, COUNT(*) as count
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
WHERE p.id IS NULL AND t.project_id IS NOT NULL;

-- Documents without projects
SELECT 'Orphaned Documents' as check_type, COUNT(*) as count
FROM documents d
LEFT JOIN projects p ON d.project_id = p.id
WHERE p.id IS NULL;

-- ============================================================================
-- INTEGRATION CHECKS
-- ============================================================================

-- Check @mention references in tasks
SELECT 
  'Task @Mention Integration' as validation_check,
  COUNT(*) as tasks_with_mentions,
  COUNT(CASE WHEN array_length(mentioned_users, 1) > 0 THEN 1 END) as user_mentions,
  COUNT(CASE WHEN array_length(mentioned_projects, 1) > 0 THEN 1 END) as project_mentions,
  COUNT(CASE WHEN array_length(mentioned_scope_items, 1) > 0 THEN 1 END) as scope_mentions
FROM tasks
WHERE 
  array_length(mentioned_users, 1) > 0 OR
  array_length(mentioned_projects, 1) > 0 OR
  array_length(mentioned_scope_items, 1) > 0;

-- Check purchase order to delivery confirmation linkage
SELECT 
  'Purchase to Delivery Linkage' as validation_check,
  COUNT(DISTINCT po.id) as purchase_orders,
  COUNT(DISTINCT dc.purchase_order_id) as orders_with_deliveries,
  ROUND(
    100.0 * COUNT(DISTINCT dc.purchase_order_id) / NULLIF(COUNT(DISTINCT po.id), 0),
    2
  ) as delivery_coverage_percentage
FROM purchase_orders po
LEFT JOIN delivery_confirmations dc ON po.id = dc.purchase_order_id;

-- Check client communication response requirements
SELECT 
  'Client Response Requirements' as validation_check,
  COUNT(*) as total_threads,
  COUNT(CASE WHEN requires_response THEN 1 END) as requiring_response,
  COUNT(CASE WHEN requires_response AND status = 'pending_response' THEN 1 END) as pending_responses
FROM client_communication_threads;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

SELECT 'WORKFLOW SUMMARY STATISTICS' as summary_section;

-- Project value summary
SELECT 
  'Project Financial Summary' as metric,
  COUNT(*) as total_projects,
  SUM(budget) as total_budget,
  SUM(actual_cost) as total_actual_cost,
  ROUND(AVG(budget), 2) as avg_project_budget
FROM projects;

-- Scope item value summary
SELECT 
  'Scope Financial Summary' as metric,
  COUNT(*) as total_scope_items,
  SUM(final_price) as total_scope_value,
  ROUND(AVG(final_price), 2) as avg_scope_value
FROM scope_items;

-- Purchase order value summary
SELECT 
  'Purchase Order Summary' as metric,
  COUNT(*) as total_purchase_orders,
  SUM(total_amount) as total_po_value,
  ROUND(AVG(total_amount), 2) as avg_po_value
FROM purchase_orders;

-- Task completion summary
SELECT 
  'Task Completion Summary' as metric,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks,
  ROUND(
    100.0 * COUNT(CASE WHEN status = 'done' THEN 1 END) / NULLIF(COUNT(*), 0),
    2
  ) as completion_percentage
FROM tasks;