-- Formula PM 2.0 Sample Data for Testing and Validation
-- Created: 2025-07-02
-- Purpose: Insert sample data to test all user roles, RLS policies, and database functionality

-- ============================================================================
-- IMPORTANT: This is test data for development and validation
-- DO NOT run this migration in production
-- ============================================================================

-- First, we need to create some auth users (this would normally be done through Supabase Auth)
-- For testing purposes, we'll insert directly into auth.users

-- Note: In real implementation, users would be created through Supabase Auth
-- This is just for testing the database schema and RLS policies

-- ============================================================================
-- USER PROFILES - All 13 User TYPES
-- ============================================================================

-- Insert sample user profiles (using generated UUIDs for testing)
--INSERT INTO user_profiles (id, role, first_name, last_name, email, phone, company, department, is_active) VALUES
-- Management Level (5 roles)
('11111111-1111-1111-1111-111111111111', 'company_owner', 'John', 'Smith', 'john.smith@formulapm.com', '+1-555-0101', 'Formula PM', 'Executive', true),
('22222222-2222-2222-2222-222222222222', 'general_manager', 'Sarah', 'Johnson', 'sarah.johnson@formulapm.com', '+1-555-0102', 'Formula PM', 'Management', true),
('33333333-3333-3333-3333-333333333333', 'deputy_general_manager', 'Michael', 'Brown', 'michael.brown@formulapm.com', '+1-555-0103', 'Formula PM', 'Management', true),
('44444444-4444-4444-4444-444444444444', 'technical_director', 'Lisa', 'Davis', 'lisa.davis@formulapm.com', '+1-555-0104', 'Formula PM', 'Technical', true),
('55555555-5555-5555-5555-555555555555', 'admin', 'Kerem', 'Admin', 'kerem@formulapm.com', '+1-555-0105', 'Formula PM', 'IT', true),

-- Project Level (3 roles)
('66666666-6666-6666-6666-666666666666', 'project_manager', 'David', 'Wilson', 'david.wilson@formulapm.com', '+1-555-0106', 'Formula PM', 'Projects', true),
('77777777-7777-7777-7777-777777777777', 'architect', 'Emily', 'Taylor', 'emily.taylor@formulapm.com', '+1-555-0107', 'Formula PM', 'Design', true),
('88888888-8888-8888-8888-888888888888', 'technical_engineer', 'James', 'Anderson', 'james.anderson@formulapm.com', '+1-555-0108', 'Formula PM', 'Engineering', true),

-- Operational Level (2 roles)
('99999999-9999-9999-9999-999999999999', 'purchase_director', 'Jennifer', 'Thomas', 'jennifer.thomas@formulapm.com', '+1-555-0109', 'Formula PM', 'Purchasing', true),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'purchase_specialist', 'Robert', 'Jackson', 'robert.jackson@formulapm.com', '+1-555-0110', 'Formula PM', 'Purchasing', true),

-- Field Level (1 role)
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'field_worker', 'Maria', 'Garcia', 'maria.garcia@formulapm.com', '+1-555-0111', 'Formula PM', 'Field Operations', true),

-- External Access (2 roles)
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'William', 'Miller', 'william.miller@acmecorp.com', '+1-555-0112', 'ACME Corporation', 'Facilities', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'subcontractor', 'Susan', 'Martinez', 'susan.martinez@buildright.com', '+1-555-0113', 'BuildRight Inc', 'Construction', true);

-- ============================================================================
-- CLIENTS
-- ============================================================================

INSERT INTO clients (id, user_id, company_name, contact_person, billing_address) VALUES
('client-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'ACME Corporation', 'William Miller', '123 Business Ave, City, ST 12345'),
('client-002', NULL, 'TechStart Inc', 'Alex Thompson', '456 Innovation Blvd, Tech City, ST 67890'),
('client-003', NULL, 'Global Manufacturing', 'Rachel Green', '789 Industrial Rd, Manufacturing City, ST 54321');

-- ============================================================================
-- SUPPLIERS
-- ============================================================================

INSERT INTO suppliers (name, contact_person, email, phone, address, specializations, performance_rating, is_approved, created_by) VALUES
('Premium Steel Supply', 'Tom Richards', 'tom@premiumsteel.com', '+1-555-2001', '100 Steel St, Industrial Zone', '{"steel", "metal fabrication"}', 4.8, true, '99999999-9999-9999-9999-999999999999'),
('Elite Millwork Co', 'Nancy White', 'nancy@elitemillwork.com', '+1-555-2002', '200 Wood Ave, Crafts District', '{"millwork", "custom carpentry"}', 4.9, true, '99999999-9999-9999-9999-999999999999'),
('PowerTech Electrical', 'Mark Johnson', 'mark@powertech.com', '+1-555-2003', '300 Electric Blvd, Tech Park', '{"electrical", "automation"}', 4.6, true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('HVAC Masters', 'Linda Brown', 'linda@hvacmasters.com', '+1-555-2004', '400 Climate St, Industrial Area', '{"HVAC", "mechanical systems"}', 4.7, false, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ============================================================================
-- PROJECTS
-- ============================================================================

INSERT INTO projects (id, name, description, client_id, project_manager_id, status, start_date, end_date, budget, location, project_type, priority) VALUES
('project-001', 'ACME Office Renovation', 'Complete office renovation including millwork and electrical systems', 'client-001', '66666666-6666-6666-6666-666666666666', 'active', '2025-01-15', '2025-06-30', 750000.00, 'Downtown Office Building', 'Commercial Renovation', 1),
('project-002', 'TechStart Headquarters', 'New headquarters construction with modern electrical and HVAC systems', 'client-002', '66666666-6666-6666-6666-666666666666', 'planning', '2025-03-01', '2025-12-15', 1200000.00, 'Tech Campus', 'New Construction', 1),
('project-003', 'Manufacturing Facility Upgrade', 'Electrical and mechanical systems upgrade for production facility', 'client-003', '66666666-6666-6666-6666-666666666666', 'bidding', '2025-04-01', '2025-10-31', 950000.00, 'Industrial District', 'Facility Upgrade', 2);

-- ============================================================================
-- PROJECT ASSIGNMENTS
-- ============================================================================

INSERT INTO project_assignments (project_id, user_id, role, responsibilities, assigned_by, is_active) VALUES
-- Project 1 assignments
('project-001', '77777777-7777-7777-7777-777777777777', 'Lead Architect', '{"Shop drawing creation", "Design coordination", "Client meetings"}', '66666666-6666-6666-6666-666666666666', true),
('project-001', '88888888-8888-8888-8888-888888888888', 'Technical Engineer', '{"BOQ preparation", "Cost analysis", "Technical specifications"}', '66666666-6666-6666-6666-666666666666', true),
('project-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Site Supervisor', '{"Progress monitoring", "Quality control", "Field reporting"}', '66666666-6666-6666-6666-666666666666', true),
('project-001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Millwork Specialist', '{"Millwork installation", "Quality assurance"}', '66666666-6666-6666-6666-666666666666', true),

-- Project 2 assignments
('project-002', '77777777-7777-7777-7777-777777777777', 'Design Lead', '{"Architectural design", "System integration", "Code compliance"}', '66666666-6666-6666-6666-666666666666', true),
('project-002', '88888888-8888-8888-8888-888888888888', 'Cost Engineer', '{"Budget analysis", "Procurement support", "Value engineering"}', '66666666-6666-6666-6666-666666666666', true);

-- ============================================================================
-- SCOPE ITEMS
-- ============================================================================

INSERT INTO scope_items (project_id, category, item_code, description, quantity, unit_price, initial_cost, specifications, unit_of_measure, markup_percentage, timeline_start, timeline_end, status, assigned_to, supplier_id, priority, created_by) VALUES
-- Project 1 scope items
('project-001', 'millwork', 'MW-001', 'Executive conference room millwork package including custom table and wall panels', 1, 45000.00, 35000.00, 'Premium hardwood veneer, integrated technology', 'each', 15.0, '2025-02-01', '2025-04-15', 'in_progress', '{"77777777-7777-7777-7777-777777777777", "dddddddd-dddd-dddd-dddd-dddddddddddd"}', (SELECT id FROM suppliers WHERE name = 'Elite Millwork Co'), 1, '88888888-8888-8888-8888-888888888888'),

('project-001', 'electrical', 'EL-001', 'Conference room electrical package including lighting control and AV power', 1, 12000.00, 9500.00, 'LED lighting with dimming control, dedicated AV circuits', 'each', 20.0, '2025-02-15', '2025-03-30', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'PowerTech Electrical'), 1, '88888888-8888-8888-8888-888888888888'),

('project-001', 'construction', 'CN-001', 'Structural modifications for conference room expansion', 1, 18000.00, 15000.00, 'Non-load bearing wall removal and reinforcement', 'each', 12.0, '2025-01-20', '2025-02-28', 'completed', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', NULL, 1, '66666666-6666-6666-6666-666666666666'),

-- Project 2 scope items
('project-002', 'electrical', 'EL-100', 'Main electrical distribution system', 1, 85000.00, 70000.00, 'Main panels, distribution boards, emergency power', 'each', 18.0, '2025-04-01', '2025-07-31', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'PowerTech Electrical'), 1, '88888888-8888-8888-8888-888888888888'),

('project-002', 'mechanical', 'MH-100', 'HVAC system for headquarters building', 1, 125000.00, 100000.00, 'Central air handling units, ductwork, controls', 'each', 22.0, '2025-05-01', '2025-09-30', 'not_started', '{}', NULL, 1, '88888888-8888-8888-8888-888888888888');

-- ============================================================================
-- SCOPE DEPENDENCIES
-- ============================================================================

INSERT INTO scope_dependencies (scope_item_id, depends_on_id, dependency_type) VALUES
-- Conference room millwork depends on construction completion
((SELECT id FROM scope_items WHERE item_code = 'MW-001'), (SELECT id FROM scope_items WHERE item_code = 'CN-001'), 'blocks'),
-- Electrical work depends on construction completion
((SELECT id FROM scope_items WHERE item_code = 'EL-001'), (SELECT id FROM scope_items WHERE item_code = 'CN-001'), 'blocks');

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

INSERT INTO documents (project_id, scope_item_id, document_type, title, description, file_path, file_size, mime_type, version, status, is_client_visible, uploaded_by) VALUES
-- Project 1 documents
('project-001', (SELECT id FROM scope_items WHERE item_code = 'MW-001'), 'shop_drawing', 'Conference Room Millwork - Shop Drawings Rev A', 'Detailed shop drawings for executive conference room millwork package', '/documents/project-001/millwork/shop-drawings-rev-a.pdf', 2456789, 'application/pdf', 1, 'review', true, '77777777-7777-7777-7777-777777777777'),

('project-001', NULL, 'report', 'Weekly Progress Report - Week 3', 'Construction progress report for week ending 2025-02-15', '/documents/project-001/reports/progress-week-3.pdf', 1234567, 'application/pdf', 1, 'approved', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

('project-001', (SELECT id FROM scope_items WHERE item_code = 'EL-001'), 'material_spec', 'Electrical Components Specification', 'Detailed specification for conference room electrical components', '/documents/project-001/electrical/material-spec.pdf', 987654, 'application/pdf', 1, 'draft', false, '88888888-8888-8888-8888-888888888888'),

-- Project 2 documents
('project-002', NULL, 'contract', 'Main Construction Contract', 'Primary construction contract for TechStart headquarters', '/documents/project-002/contracts/main-contract.pdf', 5678901, 'application/pdf', 1, 'approved', false, '66666666-6666-6666-6666-666666666666');

-- ============================================================================
-- DOCUMENT APPROVALS
-- ============================================================================

INSERT INTO document_approvals (document_id, approver_id, approver_type, status, comments, version) VALUES
-- Shop drawing approvals
((SELECT id FROM documents WHERE title = 'Conference Room Millwork - Shop Drawings Rev A'), '44444444-4444-4444-4444-444444444444', 'internal', 'approved', 'Technical review approved. Ready for client submission.', 1),
((SELECT id FROM documents WHERE title = 'Conference Room Millwork - Shop Drawings Rev A'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'pending', NULL, 1),

-- Progress report approval
((SELECT id FROM documents WHERE title = 'Weekly Progress Report - Week 3'), '66666666-6666-6666-6666-666666666666', 'internal', 'approved', 'Progress report reviewed and approved.', 1);

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- These queries can be used to validate the data insertion and RLS policies

-- Count records in each table
-- SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
-- UNION ALL
-- SELECT 'clients', COUNT(*) FROM clients
-- UNION ALL
-- SELECT 'suppliers', COUNT(*) FROM suppliers
-- UNION ALL
-- SELECT 'projects', COUNT(*) FROM projects
-- UNION ALL
-- SELECT 'project_assignments', COUNT(*) FROM project_assignments
-- UNION ALL
-- SELECT 'scope_items', COUNT(*) FROM scope_items
-- UNION ALL
-- SELECT 'scope_dependencies', COUNT(*) FROM scope_dependencies
-- UNION ALL
-- SELECT 'documents', COUNT(*) FROM documents
-- UNION ALL
-- SELECT 'document_approvals', COUNT(*) FROM document_approvals;

-- Verify computed fields work correctly
-- SELECT 
--   item_code,
--   quantity,
--   unit_price,
--   total_price,
--   markup_percentage,
--   final_price,
--   initial_cost,
--   actual_cost,
--   cost_variance
-- FROM scope_items;

-- Test RLS policies by setting different user contexts
-- This would be done in the application layer with SET LOCAL, not in the migration

-- Insert migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000003', 'sample_data', NOW())
ON CONFLICT (version) DO NOTHING;