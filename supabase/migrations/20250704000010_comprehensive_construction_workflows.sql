-- Formula PM 2.0 Comprehensive Construction Workflows Population
-- Created: 2025-07-04
-- Purpose: Populate all workflow tables with realistic construction data
-- This creates a complete construction workflow ecosystem

-- ============================================================================
-- VENDORS AND SUPPLIERS POPULATION
-- ============================================================================

-- Insert additional vendors for comprehensive coverage
INSERT INTO vendors (id, company_name, contact_person, email, phone, address, payment_terms, is_active, performance_rating, specializations, created_by) VALUES
('vendor-001', 'Superior Steel Works', 'Mike Richardson', 'mike@superiorsteel.com', '+1-555-3001', '1001 Industrial Ave, Steel City, TX 75201', 'Net 30', true, 4.8, '{"structural steel", "fabrication", "welding"}', '99999999-9999-9999-9999-999999999999'),
('vendor-002', 'Precision Millwork Solutions', 'Sarah Thompson', 'sarah@precisionmillwork.com', '+1-555-3002', '2500 Craftsman Blvd, Woodville, NC 28001', 'Net 30', true, 4.9, '{"custom millwork", "cabinetry", "architectural woodwork"}', '99999999-9999-9999-9999-999999999999'),
('vendor-003', 'Apex Electrical Systems', 'John Martinez', 'john@apexelectrical.com', '+1-555-3003', '3000 Power Dr, Electric City, CA 90210', 'Net 15', true, 4.7, '{"commercial electrical", "industrial controls", "lighting systems"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('vendor-004', 'Elite HVAC Services', 'Lisa Chen', 'lisa@elitehvac.com', '+1-555-3004', '4000 Climate Way, Comfort City, FL 33101', 'Net 30', true, 4.6, '{"commercial HVAC", "building automation", "energy systems"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('vendor-005', 'Universal Building Supply', 'Robert Davis', 'robert@universalbuilding.com', '+1-555-3005', '5000 Supply St, Materials City, IL 60601', 'Net 30', true, 4.5, '{"construction materials", "hardware", "fasteners"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('vendor-006', 'ProFinish Surfaces', 'Jennifer Wilson', 'jennifer@profinish.com', '+1-555-3006', '6000 Surface Rd, Finish Town, WA 98101', 'Net 30', true, 4.4, '{"flooring", "wall finishes", "paint systems"}', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ============================================================================
-- ADDITIONAL PROJECTS FOR COMPREHENSIVE SCOPE
-- ============================================================================

-- Add more projects to demonstrate full system capabilities
INSERT INTO projects (id, name, description, client_id, project_manager_id, status, start_date, end_date, budget, location, project_type, priority) VALUES
('project-004', 'Luxury Hotel Renovation', 'Complete renovation of 200-room luxury hotel including all trades', 'client-001', '66666666-6666-6666-6666-666666666666', 'active', '2025-02-01', '2025-11-30', 2500000.00, 'Downtown Hotel District', 'Hospitality Renovation', 1),
('project-005', 'Corporate Campus Phase 2', 'Second phase of corporate campus development', 'client-002', '66666666-6666-6666-6666-666666666666', 'planning', '2025-05-01', '2026-03-31', 1800000.00, 'Corporate Campus', 'Commercial Development', 2),
('project-006', 'Educational Facility Modernization', 'Modernization of K-12 educational facility', 'client-003', '66666666-6666-6666-6666-666666666666', 'active', '2025-01-15', '2025-08-31', 1350000.00, 'Education District', 'Educational Renovation', 1);

-- ============================================================================
-- COMPREHENSIVE SCOPE ITEMS WITH REAL CONSTRUCTION BREAKDOWN
-- ============================================================================

-- Project 1: ACME Office Renovation - Additional scope items
INSERT INTO scope_items (project_id, category, item_code, description, quantity, unit_price, initial_cost, specifications, unit_of_measure, markup_percentage, timeline_start, timeline_end, status, assigned_to, supplier_id, priority, created_by) VALUES
-- Additional millwork items
('project-001', 'millwork', 'MW-002', 'Reception desk with integrated technology', 1, 28000.00, 22000.00, 'Solid wood construction with cable management', 'each', 18.0, '2025-02-15', '2025-04-01', 'not_started', '{"77777777-7777-7777-7777-777777777777"}', 'vendor-002', 1, '88888888-8888-8888-8888-888888888888'),
('project-001', 'millwork', 'MW-003', 'Executive office built-in cabinetry', 8, 15000.00, 12000.00, 'Custom hardwood with soft-close hardware', 'each', 20.0, '2025-03-01', '2025-05-15', 'not_started', '{"77777777-7777-7777-7777-777777777777"}', 'vendor-002', 2, '88888888-8888-8888-8888-888888888888'),
('project-001', 'millwork', 'MW-004', 'Break room cabinetry and counters', 1, 12000.00, 9500.00, 'Laminate counters with wood cabinets', 'each', 15.0, '2025-03-15', '2025-04-30', 'not_started', '{"77777777-7777-7777-7777-777777777777"}', 'vendor-002', 3, '88888888-8888-8888-8888-888888888888'),

-- Additional electrical items
('project-001', 'electrical', 'EL-002', 'Power distribution panel upgrades', 3, 8500.00, 7000.00, '200A panels with surge protection', 'each', 18.0, '2025-02-01', '2025-03-15', 'not_started', '{}', 'vendor-003', 1, '88888888-8888-8888-8888-888888888888'),
('project-001', 'electrical', 'EL-003', 'Office lighting system LED retrofit', 150, 250.00, 200.00, '4000K LED fixtures with dimming', 'each', 20.0, '2025-03-01', '2025-04-15', 'not_started', '{}', 'vendor-003', 2, '88888888-8888-8888-8888-888888888888'),
('project-001', 'electrical', 'EL-004', 'Data and telecommunications rough-in', 200, 75.00, 60.00, 'Cat6A cable with fiber backbone', 'each', 22.0, '2025-02-15', '2025-04-01', 'not_started', '{}', 'vendor-003', 2, '88888888-8888-8888-8888-888888888888'),

-- Additional construction items
('project-001', 'construction', 'CN-002', 'Drywall installation and finishing', 5000, 4.50, 3.80, 'Level 4 finish with primer', 'sqft', 15.0, '2025-02-01', '2025-03-31', 'in_progress', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', 'vendor-005', 2, '66666666-6666-6666-6666-666666666666'),
('project-001', 'construction', 'CN-003', 'Flooring installation - carpet and tile', 3500, 8.00, 6.50, 'Commercial grade carpet and porcelain tile', 'sqft', 18.0, '2025-04-01', '2025-05-15', 'not_started', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', 'vendor-006', 2, '66666666-6666-6666-6666-666666666666'),
('project-001', 'construction', 'CN-004', 'Ceiling system installation', 2800, 12.00, 10.00, 'Suspended acoustic ceiling with grid', 'sqft', 16.0, '2025-03-15', '2025-04-30', 'not_started', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', 'vendor-005', 2, '66666666-6666-6666-6666-666666666666'),

-- HVAC items
('project-001', 'mechanical', 'MH-001', 'HVAC system modifications', 1, 35000.00, 28000.00, 'Ductwork modifications and zone controls', 'each', 20.0, '2025-02-15', '2025-04-15', 'not_started', '{}', 'vendor-004', 1, '88888888-8888-8888-8888-888888888888');

-- Project 2: TechStart Headquarters - Expanded scope
INSERT INTO scope_items (project_id, category, item_code, description, quantity, unit_price, initial_cost, specifications, unit_of_measure, markup_percentage, timeline_start, timeline_end, status, assigned_to, supplier_id, priority, created_by) VALUES
-- Structural steel package
('project-002', 'construction', 'ST-001', 'Structural steel frame', 150, 1200.00, 1000.00, 'Grade 50 structural steel with shop drawings', 'ton', 15.0, '2025-04-01', '2025-07-31', 'not_started', '{}', 'vendor-001', 1, '88888888-8888-8888-8888-888888888888'),
('project-002', 'construction', 'ST-002', 'Metal decking and concrete', 25000, 8.50, 7.00, 'Composite metal deck with concrete topping', 'sqft', 18.0, '2025-05-01', '2025-08-31', 'not_started', '{}', 'vendor-001', 1, '88888888-8888-8888-8888-888888888888'),

-- Millwork package
('project-002', 'millwork', 'MW-101', 'Corporate lobby millwork', 1, 85000.00, 70000.00, 'Premium hardwood with stone accents', 'each', 18.0, '2025-08-01', '2025-11-30', 'not_started', '{}', 'vendor-002', 1, '88888888-8888-8888-8888-888888888888'),
('project-002', 'millwork', 'MW-102', 'Executive boardroom table', 1, 35000.00, 28000.00, 'Conference table for 24 people with technology', 'each', 20.0, '2025-09-01', '2025-11-15', 'not_started', '{}', 'vendor-002', 2, '88888888-8888-8888-8888-888888888888'),

-- Expanded electrical
('project-002', 'electrical', 'EL-101', 'Building automation system', 1, 125000.00, 100000.00, 'Complete BAS with energy management', 'each', 22.0, '2025-06-01', '2025-10-31', 'not_started', '{}', 'vendor-003', 1, '88888888-8888-8888-8888-888888888888'),
('project-002', 'electrical', 'EL-102', 'Emergency power system', 1, 75000.00, 60000.00, 'Backup generator with transfer switch', 'each', 20.0, '2025-05-01', '2025-08-31', 'not_started', '{}', 'vendor-003', 1, '88888888-8888-8888-8888-888888888888');

-- Project 4: Luxury Hotel Renovation - Full scope breakdown
INSERT INTO scope_items (project_id, category, item_code, description, quantity, unit_price, initial_cost, specifications, unit_of_measure, markup_percentage, timeline_start, timeline_end, status, assigned_to, supplier_id, priority, created_by) VALUES
-- Hotel millwork packages
('project-004', 'millwork', 'MW-401', 'Guest room millwork package', 200, 8500.00, 7000.00, 'Custom headboards and nightstands', 'each', 18.0, '2025-05-01', '2025-09-30', 'not_started', '{}', 'vendor-002', 1, '88888888-8888-8888-8888-888888888888'),
('project-004', 'millwork', 'MW-402', 'Lobby and public area millwork', 1, 150000.00, 125000.00, 'Grand lobby with custom reception desk', 'each', 16.0, '2025-03-01', '2025-07-31', 'not_started', '{}', 'vendor-002', 1, '88888888-8888-8888-8888-888888888888'),
('project-004', 'millwork', 'MW-403', 'Restaurant and bar millwork', 1, 85000.00, 70000.00, 'Complete restaurant bar and seating', 'each', 18.0, '2025-06-01', '2025-10-15', 'not_started', '{}', 'vendor-002', 2, '88888888-8888-8888-8888-888888888888'),

-- Hotel electrical systems
('project-004', 'electrical', 'EL-401', 'Guest room electrical renovation', 200, 2800.00, 2300.00, 'Complete electrical renovation per room', 'each', 18.0, '2025-04-01', '2025-08-31', 'not_started', '{}', 'vendor-003', 1, '88888888-8888-8888-8888-888888888888'),
('project-004', 'electrical', 'EL-402', 'Hotel lighting control system', 1, 95000.00, 78000.00, 'Centralized lighting control with scenes', 'each', 20.0, '2025-03-15', '2025-06-30', 'not_started', '{}', 'vendor-003', 1, '88888888-8888-8888-8888-888888888888'),
('project-004', 'electrical', 'EL-403', 'Kitchen equipment electrical', 1, 45000.00, 38000.00, 'Commercial kitchen electrical systems', 'each', 15.0, '2025-05-01', '2025-07-31', 'not_started', '{}', 'vendor-003', 2, '88888888-8888-8888-8888-888888888888'),

-- Hotel HVAC systems
('project-004', 'mechanical', 'MH-401', 'Guest room HVAC renovation', 200, 3500.00, 2900.00, 'Individual room units with controls', 'each', 17.0, '2025-04-15', '2025-09-15', 'not_started', '{}', 'vendor-004', 1, '88888888-8888-8888-8888-888888888888'),
('project-004', 'mechanical', 'MH-402', 'Kitchen ventilation system', 1, 125000.00, 105000.00, 'Commercial kitchen exhaust and makeup air', 'each', 16.0, '2025-05-01', '2025-08-31', 'not_started', '{}', 'vendor-004', 1, '88888888-8888-8888-8888-888888888888'),

-- Hotel construction and finishes
('project-004', 'construction', 'CN-401', 'Guest room renovation package', 200, 15000.00, 12500.00, 'Complete room renovation including finishes', 'each', 16.0, '2025-04-01', '2025-10-31', 'not_started', '{}', 'vendor-006', 1, '88888888-8888-8888-8888-888888888888'),
('project-004', 'construction', 'CN-402', 'Lobby and public area renovation', 8500, 35.00, 28.00, 'High-end finishes and furnishings', 'sqft', 20.0, '2025-03-01', '2025-08-31', 'not_started', '{}', 'vendor-006', 1, '88888888-8888-8888-8888-888888888888');

-- ============================================================================
-- SCOPE DEPENDENCIES - REALISTIC CONSTRUCTION SEQUENCING
-- ============================================================================

INSERT INTO scope_dependencies (scope_item_id, depends_on_id, dependency_type) VALUES
-- Project 1 dependencies
((SELECT id FROM scope_items WHERE item_code = 'MW-002'), (SELECT id FROM scope_items WHERE item_code = 'CN-002'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'MW-003'), (SELECT id FROM scope_items WHERE item_code = 'CN-002'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'EL-002'), (SELECT id FROM scope_items WHERE item_code = 'CN-001'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'EL-003'), (SELECT id FROM scope_items WHERE item_code = 'CN-002'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'CN-003'), (SELECT id FROM scope_items WHERE item_code = 'EL-003'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'CN-004'), (SELECT id FROM scope_items WHERE item_code = 'MH-001'), 'blocks'),

-- Project 2 dependencies
((SELECT id FROM scope_items WHERE item_code = 'ST-002'), (SELECT id FROM scope_items WHERE item_code = 'ST-001'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'EL-100'), (SELECT id FROM scope_items WHERE item_code = 'ST-002'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'MH-100'), (SELECT id FROM scope_items WHERE item_code = 'ST-002'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'MW-101'), (SELECT id FROM scope_items WHERE item_code = 'EL-100'), 'blocks'),

-- Project 4 dependencies
((SELECT id FROM scope_items WHERE item_code = 'MW-401'), (SELECT id FROM scope_items WHERE item_code = 'CN-401'), 'blocks'),
((SELECT id FROM scope_items WHERE item_code = 'EL-401'), (SELECT id FROM scope_items WHERE item_code = 'CN-401'), 'requires'),
((SELECT id FROM scope_items WHERE item_code = 'MH-401'), (SELECT id FROM scope_items WHERE item_code = 'CN-401'), 'requires');

-- ============================================================================
-- COMPREHENSIVE PURCHASE REQUESTS
-- ============================================================================

INSERT INTO purchase_requests (id, project_id, requester_id, request_number, item_description, quantity, unit_of_measure, estimated_cost, required_date, urgency_level, justification, status, budget_code, cost_center, metadata) VALUES
-- Project 1 purchase requests
('pr-001', 'project-001', '88888888-8888-8888-8888-888888888888', 'PR-2025-001', 'Premium hardwood lumber for conference room millwork', 2500.00, 'board feet', 12500.00, '2025-02-15', 'normal', 'Required for executive conference room millwork package MW-001', 'approved', 'PROJ-001-MW', 'PROJECT-001', '{"scope_item": "MW-001", "vendor_quotes": 3}'),
('pr-002', 'project-001', '88888888-8888-8888-8888-888888888888', 'PR-2025-002', 'LED lighting fixtures for office renovation', 150.00, 'each', 37500.00, '2025-03-01', 'normal', 'Energy-efficient LED fixtures for office lighting system EL-003', 'approved', 'PROJ-001-EL', 'PROJECT-001', '{"scope_item": "EL-003", "energy_savings": "40%"}'),
('pr-003', 'project-001', '88888888-8888-8888-8888-888888888888', 'PR-2025-003', 'Electrical panels and distribution equipment', 3.00, 'each', 25500.00, '2025-02-01', 'high', 'Critical electrical infrastructure for power distribution panel upgrades EL-002', 'approved', 'PROJ-001-EL', 'PROJECT-001', '{"scope_item": "EL-002", "critical_path": true}'),
('pr-004', 'project-001', '66666666-6666-6666-6666-666666666666', 'PR-2025-004', 'Drywall materials and supplies', 5000.00, 'sqft', 22500.00, '2025-02-01', 'normal', 'Drywall installation for construction scope CN-002', 'approved', 'PROJ-001-CN', 'PROJECT-001', '{"scope_item": "CN-002", "delivery_schedule": "weekly"}'),
('pr-005', 'project-001', '88888888-8888-8888-8888-888888888888', 'PR-2025-005', 'HVAC ductwork and controls', 1.00, 'lot', 35000.00, '2025-02-15', 'normal', 'HVAC system modifications for mechanical scope MH-001', 'pending_approval', 'PROJ-001-MH', 'PROJECT-001', '{"scope_item": "MH-001", "energy_code_compliance": true}'),

-- Project 2 purchase requests
('pr-006', 'project-002', '88888888-8888-8888-8888-888888888888', 'PR-2025-006', 'Structural steel beams and columns', 150.00, 'ton', 180000.00, '2025-04-01', 'high', 'Critical structural steel for building frame ST-001', 'approved', 'PROJ-002-ST', 'PROJECT-002', '{"scope_item": "ST-001", "critical_path": true, "shop_drawings_required": true}'),
('pr-007', 'project-002', '88888888-8888-8888-8888-888888888888', 'PR-2025-007', 'Metal decking and concrete materials', 25000.00, 'sqft', 212500.00, '2025-05-01', 'normal', 'Composite metal deck with concrete topping for ST-002', 'approved', 'PROJ-002-ST', 'PROJECT-002', '{"scope_item": "ST-002", "concrete_strength": "4000_psi"}'),
('pr-008', 'project-002', '88888888-8888-8888-8888-888888888888', 'PR-2025-008', 'Building automation system components', 1.00, 'system', 125000.00, '2025-06-01', 'normal', 'Complete BAS with energy management for EL-101', 'draft', 'PROJ-002-EL', 'PROJECT-002', '{"scope_item": "EL-101", "integration_required": true}'),
('pr-009', 'project-002', '88888888-8888-8888-8888-888888888888', 'PR-2025-009', 'Emergency generator and transfer switch', 1.00, 'system', 75000.00, '2025-05-01', 'high', 'Backup power system for critical operations EL-102', 'pending_approval', 'PROJ-002-EL', 'PROJECT-002', '{"scope_item": "EL-102", "permit_required": true}'),

-- Project 4 purchase requests
('pr-010', 'project-004', '88888888-8888-8888-8888-888888888888', 'PR-2025-010', 'Guest room millwork materials', 200.00, 'room', 1700000.00, '2025-05-01', 'normal', 'Custom headboards and nightstands for all guest rooms MW-401', 'approved', 'PROJ-004-MW', 'PROJECT-004', '{"scope_item": "MW-401", "custom_design": true}'),
('pr-011', 'project-004', '88888888-8888-8888-8888-888888888888', 'PR-2025-011', 'Hotel lighting control system', 1.00, 'system', 95000.00, '2025-03-15', 'normal', 'Centralized lighting control with scene presets EL-402', 'approved', 'PROJ-004-EL', 'PROJECT-004', '{"scope_item": "EL-402", "integration_with_pms": true}'),
('pr-012', 'project-004', '88888888-8888-8888-8888-888888888888', 'PR-2025-012', 'Commercial kitchen equipment electrical', 1.00, 'package', 45000.00, '2025-05-01', 'normal', 'Electrical systems for commercial kitchen equipment EL-403', 'pending_approval', 'PROJ-004-EL', 'PROJECT-004', '{"scope_item": "EL-403", "health_department_approval": true}'),
('pr-013', 'project-004', '88888888-8888-8888-8888-888888888888', 'PR-2025-013', 'Guest room HVAC units', 200.00, 'unit', 700000.00, '2025-04-15', 'high', 'Individual room units with smart controls MH-401', 'approved', 'PROJ-004-MH', 'PROJECT-004', '{"scope_item": "MH-401", "energy_efficiency": "ENERGY_STAR"}'),
('pr-014', 'project-004', '66666666-6666-6666-6666-666666666666', 'PR-2025-014', 'Lobby renovation materials', 8500.00, 'sqft', 297500.00, '2025-03-01', 'normal', 'High-end finishes and furnishings for lobby CN-402', 'approved', 'PROJ-004-CN', 'PROJECT-004', '{"scope_item": "CN-402", "design_approval_required": true}');

-- ============================================================================
-- PURCHASE ORDERS
-- ============================================================================

INSERT INTO purchase_orders (id, purchase_request_id, po_number, vendor_id, total_amount, po_date, expected_delivery_date, status, terms_conditions, email_sent_at, phone_confirmed_at, phone_confirmed_by, created_by) VALUES
-- Approved purchase orders
('po-001', 'pr-001', 'PO-2025-001', 'vendor-002', 12500.00, '2025-01-20', '2025-02-15', 'sent', 'Net 30 days, FOB destination', '2025-01-20 14:30:00', '2025-01-20 15:45:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-002', 'pr-002', 'PO-2025-002', 'vendor-003', 37500.00, '2025-01-22', '2025-03-01', 'confirmed', 'Net 30 days, installation included', '2025-01-22 09:15:00', '2025-01-22 10:30:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-003', 'pr-003', 'PO-2025-003', 'vendor-003', 25500.00, '2025-01-18', '2025-02-01', 'delivered', 'Net 30 days, certified equipment', '2025-01-18 11:00:00', '2025-01-18 14:15:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-004', 'pr-004', 'PO-2025-004', 'vendor-005', 22500.00, '2025-01-25', '2025-02-01', 'delivered', 'Net 30 days, weekly delivery schedule', '2025-01-25 13:20:00', '2025-01-25 16:00:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-005', 'pr-006', 'PO-2025-005', 'vendor-001', 180000.00, '2025-01-30', '2025-04-01', 'confirmed', 'Net 30 days, shop drawings required', '2025-01-30 10:45:00', '2025-01-30 11:30:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-006', 'pr-007', 'PO-2025-006', 'vendor-001', 212500.00, '2025-02-05', '2025-05-01', 'sent', 'Net 30 days, coordinated delivery', '2025-02-05 08:30:00', NULL, NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-007', 'pr-010', 'PO-2025-007', 'vendor-002', 1700000.00, '2025-02-10', '2025-05-01', 'confirmed', 'Net 30 days, staged delivery', '2025-02-10 15:00:00', '2025-02-10 16:30:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-008', 'pr-011', 'PO-2025-008', 'vendor-003', 95000.00, '2025-02-12', '2025-03-15', 'sent', 'Net 30 days, programming included', '2025-02-12 11:15:00', NULL, NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-009', 'pr-013', 'PO-2025-009', 'vendor-004', 700000.00, '2025-02-15', '2025-04-15', 'confirmed', 'Net 30 days, installation support', '2025-02-15 09:45:00', '2025-02-15 13:20:00', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
('po-010', 'pr-014', 'PO-2025-010', 'vendor-006', 297500.00, '2025-02-18', '2025-03-01', 'sent', 'Net 30 days, design approval required', '2025-02-18 14:00:00', NULL, NULL, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- ============================================================================
-- APPROVAL WORKFLOWS
-- ============================================================================

INSERT INTO approval_workflows (purchase_request_id, approver_role, approver_id, approval_status, approval_date, comments, sequence_order) VALUES
-- PR-001 approvals
('pr-001', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-01-19 09:30:00', 'Technical specifications reviewed and approved', 1),
('pr-001', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-01-19 14:15:00', 'Budget approved, proceed with purchase order', 2),

-- PR-002 approvals
('pr-002', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-01-21 11:00:00', 'LED specifications meet energy efficiency requirements', 1),
('pr-002', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-01-21 16:30:00', 'Cost analysis approved, good value', 2),

-- PR-003 approvals
('pr-003', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-01-17 13:45:00', 'Electrical specifications verified', 1),
('pr-003', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-01-17 15:20:00', 'Approved - critical path item', 2),

-- PR-004 approvals
('pr-004', 'project_manager', '66666666-6666-6666-6666-666666666666', 'approved', '2025-01-24 10:15:00', 'Quantity and specifications verified', 1),
('pr-004', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-01-24 14:00:00', 'Budget approved for drywall materials', 2),

-- PR-005 approvals (pending)
('pr-005', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-01-25 09:00:00', 'HVAC specifications meet code requirements', 1),
('pr-005', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'pending', NULL, NULL, 2),

-- PR-006 approvals
('pr-006', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-01-29 11:30:00', 'Structural steel specifications approved', 1),
('pr-006', 'technical_director', '44444444-4444-4444-4444-444444444444', 'approved', '2025-01-29 15:45:00', 'Major purchase approved by technical director', 2),

-- PR-007 approvals
('pr-007', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-02-04 10:00:00', 'Concrete specifications meet structural requirements', 1),
('pr-007', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-02-04 14:30:00', 'Budget approved for deck and concrete', 2),

-- PR-008 approvals (draft - no approvals yet)

-- PR-009 approvals (pending)
('pr-009', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-02-08 09:15:00', 'Emergency power specifications approved', 1),
('pr-009', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'pending', NULL, NULL, 2),

-- PR-010 approvals
('pr-010', 'project_manager', '66666666-6666-6666-6666-666666666666', 'approved', '2025-02-09 13:00:00', 'Guest room millwork specifications approved', 1),
('pr-010', 'technical_director', '44444444-4444-4444-4444-444444444444', 'approved', '2025-02-09 16:20:00', 'Large millwork order approved', 2),

-- PR-011 approvals
('pr-011', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-02-11 10:30:00', 'Lighting control system specifications approved', 1),
('pr-011', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-02-11 15:00:00', 'Budget approved for lighting control', 2),

-- PR-012 approvals (pending)
('pr-012', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-02-14 11:00:00', 'Kitchen electrical specifications approved', 1),
('pr-012', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'pending', NULL, NULL, 2),

-- PR-013 approvals
('pr-013', 'technical_engineer', '88888888-8888-8888-8888-888888888888', 'approved', '2025-02-14 09:30:00', 'HVAC unit specifications meet efficiency requirements', 1),
('pr-013', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-02-14 13:45:00', 'Approved - energy efficient units', 2),

-- PR-014 approvals
('pr-014', 'project_manager', '66666666-6666-6666-6666-666666666666', 'approved', '2025-02-17 10:15:00', 'Lobby renovation specifications approved', 1),
('pr-014', 'purchase_director', '99999999-9999-9999-9999-999999999999', 'approved', '2025-02-17 14:20:00', 'Budget approved for lobby renovation', 2);

-- ============================================================================
-- DELIVERY CONFIRMATIONS
-- ============================================================================

INSERT INTO delivery_confirmations (purchase_order_id, confirmed_by, delivery_date, quantity_received, quantity_ordered, condition_notes, photos, status, quality_assessment, damage_reported, confirmed_by) VALUES
-- Completed deliveries
('po-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-02-01', 3.00, 3.00, 'All panels delivered in good condition. Installation scheduled for next week.', '{"photos/po-003/delivery-1.jpg", "photos/po-003/delivery-2.jpg"}', 'completed', 'Excellent condition, all equipment certified and properly packaged', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('po-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-02-01', 5000.00, 5000.00, 'First delivery of drywall materials. Weekly deliveries as scheduled.', '{"photos/po-004/delivery-1.jpg"}', 'completed', 'Good condition, materials properly stored in covered area', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('po-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-02-08', 5000.00, 5000.00, 'Second delivery of drywall materials. On schedule.', '{"photos/po-004/delivery-2.jpg"}', 'completed', 'Good condition, no damage reported', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- Partial deliveries
('po-001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-02-10', 1200.00, 2500.00, 'Partial delivery of premium hardwood. Remaining 1300 board feet expected next week.', '{"photos/po-001/partial-delivery.jpg"}', 'partial', 'Excellent quality hardwood, properly kiln-dried', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('po-007', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2025-02-28', 50.00, 200.00, 'First shipment of guest room millwork components. Remaining units in production.', '{"photos/po-007/first-shipment.jpg"}', 'partial', 'High quality millwork, well packaged and protected', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- ============================================================================
-- VENDOR RATINGS
-- ============================================================================

INSERT INTO vendor_ratings (vendor_id, project_id, purchase_order_id, rater_id, quality_score, delivery_score, communication_score, overall_score, comments) VALUES
-- Vendor ratings based on completed deliveries
('vendor-003', 'project-001', 'po-003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 5, 5, 4, 5, 'Excellent electrical panels, delivered on time and properly certified. Good communication throughout.'),
('vendor-005', 'project-001', 'po-004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, 5, 4, 4, 'Good quality drywall materials, excellent delivery schedule adherence. Consistent communication.'),
('vendor-002', 'project-001', 'po-001', '77777777-7777-7777-7777-777777777777', 5, 3, 4, 4, 'Excellent quality hardwood, but delivery was delayed. Good communication about delays.'),
('vendor-001', 'project-002', 'po-005', '88888888-8888-8888-8888-888888888888', 5, 4, 5, 5, 'High quality structural steel, good delivery coordination. Excellent communication and shop drawings.'),
('vendor-002', 'project-004', 'po-007', '66666666-6666-6666-6666-666666666666', 5, 4, 4, 4, 'Outstanding millwork quality, delivery on schedule. Good project communication.');

-- ============================================================================
-- COMPREHENSIVE TASK SYSTEM POPULATION
-- ============================================================================

INSERT INTO tasks (id, project_id, parent_task_id, title, description, status, priority, assigned_to, created_by, due_date, estimated_hours, mentioned_projects, mentioned_scope_items, mentioned_users, depends_on, tags) VALUES
-- Project 1 tasks
('task-001', 'project-001', NULL, 'Conference Room Millwork Production', 'Coordinate production of executive conference room millwork package @scope:MW-001. Ensure quality standards and delivery schedule.', 'in_progress', 'high', '{"77777777-7777-7777-7777-777777777777", "dddddddd-dddd-dddd-dddd-dddddddddddd"}', '66666666-6666-6666-6666-666666666666', '2025-04-10', 120.00, '{"project-001"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MW-001') || '"}', '{"77777777-7777-7777-7777-777777777777"}', '{}', '{"millwork", "critical-path", "client-facing"}'),

('task-002', 'project-001', NULL, 'Electrical Panel Installation', 'Install power distribution panels @scope:EL-002 in main electrical room. Coordinate with @user:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb for site access.', 'todo', 'high', '{"88888888-8888-8888-8888-888888888888"}', '66666666-6666-6666-6666-666666666666', '2025-03-10', 24.00, '{"project-001"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'EL-002') || '"}', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{}', '{"electrical", "critical-path", "safety"}'),

('task-003', 'project-001', NULL, 'Drywall Installation Progress Review', 'Review progress of drywall installation @scope:CN-002. Ensure quality standards and schedule adherence.', 'in_progress', 'medium', '{"66666666-6666-6666-6666-666666666666", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '66666666-6666-6666-6666-666666666666', '2025-03-15', 8.00, '{"project-001"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'CN-002') || '"}', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{}', '{"construction", "quality-control", "progress-review"}'),

('task-004', 'project-001', 'task-001', 'Millwork Shop Drawing Review', 'Review shop drawings for conference room millwork. Coordinate with @user:cccccccc-cccc-cccc-cccc-cccccccccccc for client approval.', 'done', 'high', '{"77777777-7777-7777-7777-777777777777"}', '66666666-6666-6666-6666-666666666666', '2025-02-05', 16.00, '{"project-001"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MW-001') || '"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', '{}', '{"shop-drawings", "client-approval", "millwork"}'),

('task-005', 'project-001', 'task-001', 'Millwork Material Procurement', 'Procure premium hardwood materials for millwork production. Track delivery of @purchase:pr-001.', 'done', 'medium', '{"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', '77777777-7777-7777-7777-777777777777', '2025-02-20', 12.00, '{"project-001"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MW-001') || '"}', '{"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', '{}', '{"procurement", "materials", "millwork"}'),

-- Project 2 tasks
('task-006', 'project-002', NULL, 'Structural Steel Coordination', 'Coordinate structural steel delivery and installation @scope:ST-001. Ensure crane availability and site access.', 'todo', 'high', '{"88888888-8888-8888-8888-888888888888", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '66666666-6666-6666-6666-666666666666', '2025-03-25', 80.00, '{"project-002"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'ST-001') || '"}', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{}', '{"structural", "critical-path", "coordination"}'),

('task-007', 'project-002', NULL, 'HVAC System Design Review', 'Review HVAC system design for headquarters building @scope:MH-100. Coordinate with mechanical engineer.', 'in_progress', 'medium', '{"88888888-8888-8888-8888-888888888888"}', '66666666-6666-6666-6666-666666666666', '2025-04-15', 40.00, '{"project-002"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MH-100') || '"}', '{"88888888-8888-8888-8888-888888888888"}', '{}', '{"hvac", "design-review", "mechanical"}'),

('task-008', 'project-002', 'task-006', 'Steel Shop Drawing Approval', 'Review and approve shop drawings for structural steel package. Critical for fabrication start.', 'todo', 'high', '{"77777777-7777-7777-7777-777777777777", "88888888-8888-8888-8888-888888888888"}', '66666666-6666-6666-6666-666666666666', '2025-03-20', 24.00, '{"project-002"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'ST-001') || '"}', '{"77777777-7777-7777-7777-777777777777"}', '{}', '{"shop-drawings", "structural", "critical-path"}'),

-- Project 4 tasks
('task-009', 'project-004', NULL, 'Hotel Room Millwork Coordination', 'Coordinate production and installation of guest room millwork @scope:MW-401 for all 200 rooms.', 'todo', 'high', '{"77777777-7777-7777-7777-777777777777"}', '66666666-6666-6666-6666-666666666666', '2025-09-15', 200.00, '{"project-004"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MW-401') || '"}', '{"77777777-7777-7777-7777-777777777777"}', '{}', '{"millwork", "hotel", "mass-production"}'),

('task-010', 'project-004', NULL, 'Lobby Renovation Project Management', 'Manage lobby renovation including millwork @scope:MW-402 and finishes @scope:CN-402.', 'in_progress', 'high', '{"66666666-6666-6666-6666-666666666666"}', '66666666-6666-6666-6666-666666666666', '2025-07-15', 160.00, '{"project-004"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MW-402') || '", "' || (SELECT id FROM scope_items WHERE item_code = 'CN-402') || '"}', '{"77777777-7777-7777-7777-777777777777"}', '{}', '{"renovation", "lobby", "coordination"}'),

-- Cross-project coordination tasks
('task-011', NULL, NULL, 'Vendor Performance Review', 'Quarterly review of vendor performance across all projects @project:project-001 @project:project-002 @project:project-004.', 'todo', 'medium', '{"99999999-9999-9999-9999-999999999999", "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', '99999999-9999-9999-9999-999999999999', '2025-03-31', 16.00, '{"project-001", "project-002", "project-004"}', '{}', '{"99999999-9999-9999-9999-999999999999"}', '{}', '{"vendor-management", "performance-review", "quarterly"}'),

('task-012', NULL, NULL, 'Safety Training Coordination', 'Coordinate safety training for all field workers across active projects. Ensure @user:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb compliance.', 'in_progress', 'high', '{"55555555-5555-5555-5555-555555555555"}', '22222222-2222-2222-2222-222222222222', '2025-02-28', 32.00, '{"project-001", "project-004"}', '{}', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{}', '{"safety", "training", "compliance"}');

-- ============================================================================
-- TASK COMMENTS AND COLLABORATION
-- ============================================================================

INSERT INTO task_comments (task_id, user_id, parent_comment_id, content, mentioned_users, mentioned_projects, mentioned_scope_items) VALUES
-- Comments on task-001 (Conference Room Millwork)
('task-001', '77777777-7777-7777-7777-777777777777', NULL, 'Started production planning for the conference room millwork. Shop drawings are approved and material procurement is complete. Estimated start date is February 25th.', '{}', '{"project-001"}', '{"' || (SELECT id FROM scope_items WHERE item_code = 'MW-001') || '"}'),
('task-001', '66666666-6666-6666-6666-666666666666', NULL, 'Great progress! Please keep @user:cccccccc-cccc-cccc-cccc-cccccccccccc updated on the production schedule. Client is eager for updates.', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', '{}', '{}'),
('task-001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', NULL, 'Workshop is ready for production. All tooling is set up and quality checkpoints are in place. Ready to begin fabrication.', '{}', '{}', '{}'),

-- Comments on task-002 (Electrical Panel Installation)
('task-002', '88888888-8888-8888-8888-888888888888', NULL, 'Electrical panels have been delivered and inspected. Installation can begin as soon as site access is confirmed with @user:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.', '{"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', '{}', '{}'),
('task-002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'Site access confirmed for March 5th. Electrical room is clear and ready for installation. Safety protocols are in place.', '{}', '{}', '{}'),

-- Comments on task-006 (Structural Steel Coordination)
('task-006', '88888888-8888-8888-8888-888888888888', NULL, 'Structural steel shop drawings are being reviewed. Need to coordinate crane rental and site logistics before delivery.', '{}', '{}', '{}'),
('task-006', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NULL, 'Crane availability confirmed for April 1st-15th. Site is prepared for steel delivery and installation.', '{}', '{}', '{}'),

-- Comments on task-010 (Lobby Renovation)
('task-010', '66666666-6666-6666-6666-666666666666', NULL, 'Lobby renovation is progressing well. Millwork production is on schedule and finish selections are approved.', '{}', '{}', '{}'),
('task-010', '77777777-7777-7777-7777-777777777777', NULL, 'Design coordination meeting scheduled for next week. Need to review millwork installation sequence with @user:dddddddd-dddd-dddd-dddd-dddddddddddd.', '{"dddddddd-dddd-dddd-dddd-dddddddddddd"}', '{}', '{}');

-- ============================================================================
-- TASK ACTIVITIES FOR TRACKING
-- ============================================================================

INSERT INTO task_activities (task_id, user_id, activity_type, details, mentioned_user_id) VALUES
-- Activities for task-001
('task-001', '66666666-6666-6666-6666-666666666666', 'created', '{"task_title": "Conference Room Millwork Production", "initial_status": "todo"}', NULL),
('task-001', '77777777-7777-7777-7777-777777777777', 'status_changed', '{"old_status": "todo", "new_status": "in_progress", "change_reason": "Started production planning"}', NULL),
('task-001', '77777777-7777-7777-7777-777777777777', 'commented', '{"comment_id": "comment-001", "is_reply": false}', NULL),
('task-001', '66666666-6666-6666-6666-666666666666', 'mentioned', '{"mentioned_in": "comment", "context": "Please keep client updated"}', 'cccccccc-cccc-cccc-cccc-cccccccccccc'),

-- Activities for task-002
('task-002', '66666666-6666-6666-6666-666666666666', 'created', '{"task_title": "Electrical Panel Installation", "initial_status": "todo"}', NULL),
('task-002', '88888888-8888-8888-8888-888888888888', 'commented', '{"comment_id": "comment-002", "is_reply": false}', NULL),
('task-002', '88888888-8888-8888-8888-888888888888', 'mentioned', '{"mentioned_in": "comment", "context": "Site access confirmation needed"}', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- Activities for task-004 (completed)
('task-004', '66666666-6666-6666-6666-666666666666', 'created', '{"task_title": "Millwork Shop Drawing Review", "initial_status": "todo"}', NULL),
('task-004', '77777777-7777-7777-7777-777777777777', 'status_changed', '{"old_status": "todo", "new_status": "in_progress", "change_reason": "Started review process"}', NULL),
('task-004', '77777777-7777-7777-7777-777777777777', 'status_changed', '{"old_status": "in_progress", "new_status": "done", "change_reason": "Shop drawings approved"}', NULL),
('task-004', '77777777-7777-7777-7777-777777777777', 'mentioned', '{"mentioned_in": "task", "context": "Client approval coordination"}', 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- ============================================================================
-- CLIENT COMMUNICATIONS
-- ============================================================================

INSERT INTO client_communication_threads (id, project_id, client_user_id, subject, thread_type, priority, status, internal_participants, client_participants, requires_response, response_deadline) VALUES
-- Project 1 communications
('thread-001', 'project-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Conference Room Millwork Shop Drawing Review', 'technical', 'high', 'open', '{"66666666-6666-6666-6666-666666666666", "77777777-7777-7777-7777-777777777777"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', true, '2025-02-20'),
('thread-002', 'project-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Project Progress Update - Week 6', 'general', 'medium', 'resolved', '{"66666666-6666-6666-6666-666666666666"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', false, NULL),
('thread-003', 'project-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Electrical Work Schedule Coordination', 'schedule', 'medium', 'open', '{"66666666-6666-6666-6666-666666666666", "88888888-8888-8888-8888-888888888888"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', true, '2025-03-01'),

-- Project 2 communications
('thread-004', 'project-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Structural Steel Shop Drawing Approval', 'technical', 'high', 'pending_response', '{"66666666-6666-6666-6666-666666666666", "77777777-7777-7777-7777-777777777777", "88888888-8888-8888-8888-888888888888"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', true, '2025-03-15'),
('thread-005', 'project-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'HVAC System Design Review', 'technical', 'medium', 'open', '{"66666666-6666-6666-6666-666666666666", "88888888-8888-8888-8888-888888888888"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', false, NULL),

-- Project 4 communications
('thread-006', 'project-004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Hotel Lobby Design Approval', 'commercial', 'high', 'open', '{"66666666-6666-6666-6666-666666666666", "77777777-7777-7777-7777-777777777777"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', true, '2025-03-10'),
('thread-007', 'project-004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Guest Room Millwork Specifications', 'technical', 'medium', 'resolved', '{"66666666-6666-6666-6666-666666666666", "77777777-7777-7777-7777-777777777777"}', '{"cccccccc-cccc-cccc-cccc-cccccccccccc"}', false, NULL);

-- ============================================================================
-- CLIENT MESSAGES
-- ============================================================================

INSERT INTO client_messages (thread_id, sender_id, message_body, message_type, is_read) VALUES
-- Messages for thread-001 (Conference Room Millwork)
('thread-001', '77777777-7777-7777-7777-777777777777', 'Good morning! I have completed the shop drawings for the executive conference room millwork package. The drawings include detailed specifications for the custom table, wall panels, and integrated technology components. Please review at your earliest convenience.', 'text', true),
('thread-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Thank you for the shop drawings. They look excellent! I have a few minor questions about the cable management system. Could you clarify the routing for the HDMI and power connections?', 'text', true),
('thread-001', '77777777-7777-7777-7777-777777777777', 'Absolutely! The cable management system uses integrated channels within the table base. All HDMI and power connections route through the central column with easy access panels. I will send a detail drawing showing the exact routing.', 'text', true),
('thread-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Perfect! Please proceed with fabrication. The drawings are approved as submitted.', 'text', false),

-- Messages for thread-002 (Progress Update)
('thread-002', '66666666-6666-6666-6666-666666666666', 'Weekly Progress Update - Week 6: Construction is proceeding on schedule. Structural modifications are complete, and drywall installation is 60% complete. Electrical rough-in will begin next week.', 'text', true),
('thread-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Excellent progress! Thank you for the regular updates. Looking forward to seeing the electrical work begin.', 'text', true),

-- Messages for thread-003 (Electrical Schedule)
('thread-003', '88888888-8888-8888-8888-888888888888', 'We need to coordinate the electrical work schedule to avoid conflicts with the ongoing drywall installation. Proposed schedule: Panel installation March 5-7, rough-in March 10-20, final connections April 1-5.', 'text', true),
('thread-003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'The proposed schedule works well from our operations perspective. Please confirm if this aligns with your overall project timeline.', 'text', false),

-- Messages for thread-004 (Structural Steel)
('thread-004', '88888888-8888-8888-8888-888888888888', 'The structural steel shop drawings are ready for your review. This is a critical path item, so we need approval by March 15th to maintain the construction schedule.', 'text', true),
('thread-004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'I understand the urgency. Our structural engineer is reviewing the drawings and will provide feedback by March 12th.', 'text', false),

-- Messages for thread-006 (Hotel Lobby)
('thread-006', '77777777-7777-7777-7777-777777777777', 'The hotel lobby design has been finalized based on our previous discussions. The millwork package includes a grand reception desk, seating areas, and decorative wall panels. Materials are premium hardwood with stone accents.', 'text', true),
('thread-006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'The design looks stunning! I have approval from our board to proceed. This will be a beautiful centerpiece for the hotel. Please move forward with production.', 'text', false);

-- ============================================================================
-- CLIENT NOTIFICATIONS
-- ============================================================================

INSERT INTO client_notifications (id, client_user_id, project_id, title, message, notification_type, priority, delivery_method, email_sent, is_read, scheduled_for) VALUES
-- Project-related notifications
('notif-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-001', 'Shop Drawing Submitted for Review', 'New shop drawing submitted for Conference Room Millwork package. Your review and approval is required.', 'approval_required', 'high', '{"email", "in_app"}', true, true, '2025-02-05 09:00:00'),
('notif-002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-001', 'Weekly Progress Report Available', 'Your weekly progress report for ACME Office Renovation is now available for review.', 'project_milestone', 'medium', '{"email", "in_app"}', true, true, '2025-02-15 17:00:00'),
('notif-003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-001', 'Electrical Work Schedule Update', 'The electrical work schedule has been updated. Please review the new timeline.', 'schedule_change', 'medium', '{"email", "in_app"}', true, false, '2025-02-20 14:30:00'),
('notif-004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-002', 'Structural Steel Approval Required', 'Structural steel shop drawings require your urgent approval to maintain project schedule.', 'approval_required', 'urgent', '{"email", "in_app", "sms"}', true, false, '2025-03-01 08:00:00'),
('notif-005', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-004', 'Hotel Lobby Design Approved', 'Your approval for the hotel lobby design has been received. Production will begin immediately.', 'approval_received', 'medium', '{"email", "in_app"}', true, true, '2025-03-02 11:15:00'),
('notif-006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-004', 'Guest Room Millwork Production Started', 'Production has begun for the guest room millwork package. Delivery is scheduled for May 1st.', 'project_milestone', 'medium', '{"email", "in_app"}', true, false, '2025-03-05 13:00:00'),
('notif-007', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'project-001', 'New Message in Communication Thread', 'You have a new message regarding the electrical work schedule coordination.', 'message_received', 'medium', '{"in_app"}', false, false, '2025-03-06 10:45:00');

-- ============================================================================
-- PROJECT MILESTONES
-- ============================================================================

INSERT INTO project_milestones (id, project_id, title, description, milestone_date, status, created_by, milestone_type, dependencies) VALUES
-- Project 1 milestones
('milestone-001', 'project-001', 'Structural Work Complete', 'All structural modifications and demolition work completed', '2025-02-28', 'completed', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"CN-001"}'),
('milestone-002', 'project-001', 'Electrical Rough-in Complete', 'All electrical rough-in work completed and inspected', '2025-03-31', 'in_progress', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"EL-001", "EL-002", "EL-003"}'),
('milestone-003', 'project-001', 'Millwork Installation Complete', 'All millwork packages installed and finished', '2025-04-30', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"MW-001", "MW-002", "MW-003"}'),
('milestone-004', 'project-001', 'Project Substantial Completion', 'Project ready for client occupancy', '2025-06-15', 'not_started', '66666666-6666-6666-6666-666666666666', 'major_milestone', '{"CN-003", "CN-004", "EL-003", "MW-003"}'),

-- Project 2 milestones
('milestone-005', 'project-002', 'Structural Steel Erection Complete', 'All structural steel erected and connections completed', '2025-08-31', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"ST-001", "ST-002"}'),
('milestone-006', 'project-002', 'Building Envelope Complete', 'Building weatherproofed and enclosed', '2025-10-31', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"ST-002"}'),
('milestone-007', 'project-002', 'MEP Rough-in Complete', 'All mechanical, electrical, and plumbing rough-in completed', '2025-11-30', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"EL-100", "EL-101", "MH-100"}'),
('milestone-008', 'project-002', 'Certificate of Occupancy', 'Building approved for occupancy', '2025-12-15', 'not_started', '66666666-6666-6666-6666-666666666666', 'major_milestone', '{"MW-101", "MW-102", "EL-101", "MH-100"}'),

-- Project 4 milestones
('milestone-009', 'project-004', 'Guest Room Renovation Phase 1', 'First 100 rooms renovated and ready for occupancy', '2025-07-31', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"CN-401", "EL-401", "MW-401"}'),
('milestone-010', 'project-004', 'Public Areas Complete', 'Lobby, restaurant, and public areas renovation complete', '2025-08-31', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"MW-402", "MW-403", "CN-402"}'),
('milestone-011', 'project-004', 'All Guest Rooms Complete', 'All 200 guest rooms renovated and ready', '2025-10-31', 'not_started', '66666666-6666-6666-6666-666666666666', 'phase_completion', '{"CN-401", "EL-401", "MW-401", "MH-401"}'),
('milestone-012', 'project-004', 'Hotel Grand Reopening', 'Hotel fully operational and ready for grand reopening', '2025-11-30', 'not_started', '66666666-6666-6666-6666-666666666666', 'major_milestone', '{"MW-402", "MW-403", "CN-402", "EL-402", "MH-402"}');

-- ============================================================================
-- COMPREHENSIVE DOCUMENTS
-- ============================================================================

INSERT INTO documents (project_id, scope_item_id, document_type, title, description, file_path, file_size, mime_type, version, status, is_client_visible, uploaded_by) VALUES
-- Project 1 additional documents
('project-001', (SELECT id FROM scope_items WHERE item_code = 'MW-002'), 'shop_drawing', 'Reception Desk Shop Drawings', 'Detailed shop drawings for reception desk with integrated technology', '/documents/project-001/millwork/reception-desk-shop-drawings.pdf', 1895432, 'application/pdf', 1, 'review', true, '77777777-7777-7777-7777-777777777777'),
('project-001', (SELECT id FROM scope_items WHERE item_code = 'EL-003'), 'material_spec', 'LED Lighting Specifications', 'Specification sheet for LED lighting fixtures', '/documents/project-001/electrical/led-lighting-specs.pdf', 756843, 'application/pdf', 1, 'approved', false, '88888888-8888-8888-8888-888888888888'),
('project-001', (SELECT id FROM scope_items WHERE item_code = 'CN-002'), 'report', 'Drywall Installation Progress Report', 'Progress report for drywall installation with quality photos', '/documents/project-001/construction/drywall-progress-report.pdf', 2145678, 'application/pdf', 1, 'approved', false, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
('project-001', NULL, 'photo', 'Site Progress Photos - Week 6', 'Weekly progress photos showing construction status', '/documents/project-001/photos/week-6-progress.jpg', 8943210, 'image/jpeg', 1, 'approved', true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),

-- Project 2 documents
('project-002', (SELECT id FROM scope_items WHERE item_code = 'ST-001'), 'shop_drawing', 'Structural Steel Shop Drawings', 'Complete structural steel shop drawings for headquarters building', '/documents/project-002/structural/steel-shop-drawings.pdf', 15678923, 'application/pdf', 1, 'review', true, '88888888-8888-8888-8888-888888888888'),
('project-002', (SELECT id FROM scope_items WHERE item_code = 'EL-101'), 'material_spec', 'Building Automation System Specifications', 'Detailed specifications for BAS components', '/documents/project-002/electrical/bas-specifications.pdf', 4567891, 'application/pdf', 1, 'draft', false, '88888888-8888-8888-8888-888888888888'),
('project-002', NULL, 'contract', 'MEP Subcontractor Agreement', 'Mechanical, electrical, and plumbing subcontractor agreement', '/documents/project-002/contracts/mep-subcontractor-agreement.pdf', 3456789, 'application/pdf', 1, 'approved', false, '66666666-6666-6666-6666-666666666666'),

-- Project 4 documents
('project-004', (SELECT id FROM scope_items WHERE item_code = 'MW-401'), 'shop_drawing', 'Guest Room Millwork Shop Drawings', 'Shop drawings for guest room millwork package - all 200 rooms', '/documents/project-004/millwork/guest-room-shop-drawings.pdf', 12345678, 'application/pdf', 1, 'approved', true, '77777777-7777-7777-7777-777777777777'),
('project-004', (SELECT id FROM scope_items WHERE item_code = 'MW-402'), 'shop_drawing', 'Lobby Millwork Shop Drawings', 'Grand lobby millwork shop drawings with stone accents', '/documents/project-004/millwork/lobby-shop-drawings.pdf', 9876543, 'application/pdf', 1, 'approved', true, '77777777-7777-7777-7777-777777777777'),
('project-004', (SELECT id FROM scope_items WHERE item_code = 'EL-402'), 'material_spec', 'Hotel Lighting Control System', 'Specifications for centralized lighting control system', '/documents/project-004/electrical/lighting-control-specs.pdf', 2468135, 'application/pdf', 1, 'review', false, '88888888-8888-8888-8888-888888888888'),
('project-004', NULL, 'report', 'Hotel Renovation Master Schedule', 'Complete project schedule for hotel renovation', '/documents/project-004/reports/master-schedule.pdf', 1357924, 'application/pdf', 2, 'approved', true, '66666666-6666-6666-6666-666666666666');

-- ============================================================================
-- DOCUMENT APPROVALS
-- ============================================================================

INSERT INTO document_approvals (document_id, approver_id, approver_type, status, comments, version) VALUES
-- Project 1 document approvals
((SELECT id FROM documents WHERE title = 'Reception Desk Shop Drawings'), '44444444-4444-4444-4444-444444444444', 'internal', 'approved', 'Technical review complete. Design meets requirements.', 1),
((SELECT id FROM documents WHERE title = 'Reception Desk Shop Drawings'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'pending', NULL, 1),
((SELECT id FROM documents WHERE title = 'LED Lighting Specifications'), '88888888-8888-8888-8888-888888888888', 'internal', 'approved', 'Energy efficiency requirements met.', 1),
((SELECT id FROM documents WHERE title = 'Drywall Installation Progress Report'), '66666666-6666-6666-6666-666666666666', 'internal', 'approved', 'Progress on schedule, quality acceptable.', 1),

-- Project 2 document approvals
((SELECT id FROM documents WHERE title = 'Structural Steel Shop Drawings'), '44444444-4444-4444-4444-444444444444', 'internal', 'approved', 'Structural review complete. Ready for client approval.', 1),
((SELECT id FROM documents WHERE title = 'Structural Steel Shop Drawings'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'pending', NULL, 1),
((SELECT id FROM documents WHERE title = 'MEP Subcontractor Agreement'), '22222222-2222-2222-2222-222222222222', 'internal', 'approved', 'Contract terms approved by management.', 1),

-- Project 4 document approvals
((SELECT id FROM documents WHERE title = 'Guest Room Millwork Shop Drawings'), '77777777-7777-7777-7777-777777777777', 'internal', 'approved', 'Design review complete for all room types.', 1),
((SELECT id FROM documents WHERE title = 'Guest Room Millwork Shop Drawings'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'approved', 'Approved for production. Excellent design work.', 1),
((SELECT id FROM documents WHERE title = 'Lobby Millwork Shop Drawings'), '77777777-7777-7777-7777-777777777777', 'internal', 'approved', 'Design approved. Stone integration details confirmed.', 1),
((SELECT id FROM documents WHERE title = 'Lobby Millwork Shop Drawings'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'approved', 'Beautiful design! Approved for fabrication.', 1),
((SELECT id FROM documents WHERE title = 'Hotel Renovation Master Schedule'), '66666666-6666-6666-6666-666666666666', 'internal', 'approved', 'Schedule reviewed and approved by project team.', 2),
((SELECT id FROM documents WHERE title = 'Hotel Renovation Master Schedule'), 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'client', 'approved', 'Schedule works with our operational needs.', 2);

-- ============================================================================
-- COMPLETE DATA VALIDATION
-- ============================================================================

-- Update project actual costs based on approved scope items
UPDATE projects SET actual_cost = (
  SELECT COALESCE(SUM(final_price), 0) 
  FROM scope_items 
  WHERE project_id = projects.id AND status IN ('completed', 'in_progress')
);

-- Update vendor performance ratings based on ratings
UPDATE vendors SET performance_rating = (
  SELECT COALESCE(AVG(overall_score), 0) 
  FROM vendor_ratings 
  WHERE vendor_id = vendors.id
);

-- Mark completed purchase orders
UPDATE purchase_orders SET status = 'completed' 
WHERE id IN (
  SELECT po.id FROM purchase_orders po
  JOIN delivery_confirmations dc ON po.id = dc.purchase_order_id
  WHERE dc.status = 'completed'
);

-- Migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250704000010', 'comprehensive_construction_workflows', NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- SUMMARY COMMENT
-- ============================================================================

/*
This migration populates the Formula PM 2.0 system with comprehensive construction workflows:

POPULATED TABLES:
✓ vendors (6 additional vendors)
✓ projects (3 additional projects)
✓ scope_items (25+ comprehensive scope items across all trades)
✓ scope_dependencies (realistic construction sequencing)
✓ purchase_requests (14 detailed purchase requests)
✓ purchase_orders (10 purchase orders with communication tracking)
✓ approval_workflows (complete approval chains)
✓ delivery_confirmations (delivery tracking with photos)
✓ vendor_ratings (performance ratings)
✓ tasks (12 project tasks with @mentions and dependencies)
✓ task_comments (collaborative comments)
✓ task_activities (activity tracking)
✓ client_communication_threads (7 communication threads)
✓ client_messages (detailed conversations)
✓ client_notifications (7 notifications)
✓ project_milestones (12 construction milestones)
✓ documents (11 additional documents)
✓ document_approvals (comprehensive approval tracking)

CONSTRUCTION WORKFLOW COVERAGE:
- Complete millwork packages (conference rooms, reception desks, guest rooms)
- Electrical systems (panels, lighting, automation, emergency power)
- Structural components (steel, concrete, construction)
- HVAC systems (commercial, hotel, building automation)
- Purchase department workflows (requests, orders, approvals, deliveries)
- Task management with @mentions and dependencies
- Client communications and approvals
- Project milestones and progress tracking
- Document management and approval workflows

This creates a realistic construction environment with all workflow tables populated.
*/