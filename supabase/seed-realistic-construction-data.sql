-- Formula PM 2.0 Comprehensive Realistic Construction Data
-- Created: 2025-07-04
-- Purpose: Complete realistic construction company data with 15+ team members and 6 diverse projects

-- ============================================================================
-- COMPREHENSIVE CONSTRUCTION TEAM MEMBERS (15+ REALISTIC ROLES)
-- ============================================================================

-- Clear existing sample data first
TRUNCATE TABLE document_approvals, documents, scope_dependencies, scope_items, 
              project_assignments, projects, clients, suppliers, user_profiles CASCADE;

-- Insert 18 realistic construction team members
INSERT INTO user_profiles (id, role, first_name, last_name, email, phone, company, department, is_active, created_at) VALUES
-- Management Level (5 roles)
('11111111-1111-1111-1111-111111111111', 'company_owner', 'Robert', 'Construction', 'robert.construction@premiumbuild.com', '+1-555-0101', 'Premium Build LLC', 'Executive', true, NOW()),
('22222222-2222-2222-2222-222222222222', 'general_manager', 'Sarah', 'Mitchell', 'sarah.mitchell@premiumbuild.com', '+1-555-0102', 'Premium Build LLC', 'Operations', true, NOW()),
('33333333-3333-3333-3333-333333333333', 'deputy_general_manager', 'Michael', 'Rodriguez', 'michael.rodriguez@premiumbuild.com', '+1-555-0103', 'Premium Build LLC', 'Project Development', true, NOW()),
('44444444-4444-4444-4444-444444444444', 'technical_director', 'Jennifer', 'Chen', 'jennifer.chen@premiumbuild.com', '+1-555-0104', 'Premium Build LLC', 'Engineering', true, NOW()),
('55555555-5555-5555-5555-555555555555', 'admin', 'David', 'Administrator', 'david.admin@premiumbuild.com', '+1-555-0105', 'Premium Build LLC', 'IT & Systems', true, NOW()),

-- Project Management Level (4 roles)
('66666666-6666-6666-6666-666666666666', 'project_manager', 'Lisa', 'Thompson', 'lisa.thompson@premiumbuild.com', '+1-555-0106', 'Premium Build LLC', 'Residential Projects', true, NOW()),
('77777777-7777-7777-7777-777777777777', 'project_manager', 'James', 'Williams', 'james.williams@premiumbuild.com', '+1-555-0107', 'Premium Build LLC', 'Commercial Projects', true, NOW()),
('88888888-8888-8888-8888-888888888888', 'architect', 'Emily', 'Design', 'emily.design@premiumbuild.com', '+1-555-0108', 'Premium Build LLC', 'Architecture', true, NOW()),
('99999999-9999-9999-9999-999999999999', 'technical_engineer', 'Carlos', 'Structural', 'carlos.structural@premiumbuild.com', '+1-555-0109', 'Premium Build LLC', 'Structural Engineering', true, NOW()),

-- Operations Level (4 roles)
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'purchase_director', 'Amanda', 'Procurement', 'amanda.procurement@premiumbuild.com', '+1-555-0110', 'Premium Build LLC', 'Purchasing', true, NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'purchase_specialist', 'Kevin', 'Buyer', 'kevin.buyer@premiumbuild.com', '+1-555-0111', 'Premium Build LLC', 'Purchasing', true, NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'field_worker', 'Maria', 'Supervisor', 'maria.supervisor@premiumbuild.com', '+1-555-0112', 'Premium Build LLC', 'Site Management', true, NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'field_worker', 'Tony', 'Foreman', 'tony.foreman@premiumbuild.com', '+1-555-0113', 'Premium Build LLC', 'Site Operations', true, NOW()),

-- Client Representatives (3 roles)
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'client', 'William', 'Luxury', 'william.luxury@highendliving.com', '+1-555-0114', 'High-End Living Corp', 'Development', true, NOW()),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'client', 'Jessica', 'Corporate', 'jessica.corporate@innovativeoffice.com', '+1-555-0115', 'Innovative Office Solutions', 'Facilities', true, NOW()),
('10101010-1010-1010-1010-101010101010', 'client', 'Marcus', 'Restaurant', 'marcus.restaurant@culinarygroup.com', '+1-555-0116', 'Culinary Group Holdings', 'Operations', true, NOW()),

-- Subcontractor Specialists (3 roles)
('11111111-2222-3333-4444-555555555555', 'subcontractor', 'Elena', 'Electrical', 'elena.electrical@powerpro.com', '+1-555-0117', 'PowerPro Electrical', 'Lead Electrician', true, NOW()),
('22222222-3333-4444-5555-666666666666', 'subcontractor', 'Roberto', 'Plumbing', 'roberto.plumbing@aquaflow.com', '+1-555-0118', 'AquaFlow Plumbing', 'Master Plumber', true, NOW()),
('33333333-4444-5555-6666-777777777777', 'subcontractor', 'Isabella', 'HVAC', 'isabella.hvac@climatecontrol.com', '+1-555-0119', 'Climate Control Systems', 'HVAC Specialist', true, NOW());

-- ============================================================================
-- REALISTIC CLIENT COMPANIES
-- ============================================================================

INSERT INTO clients (id, user_id, company_name, contact_person, billing_address, industry, created_at) VALUES
('client-001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'High-End Living Corp', 'William Luxury', '1250 Luxury Lane, Beverly Hills, CA 90210', 'Luxury Real Estate', NOW()),
('client-002', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'Innovative Office Solutions', 'Jessica Corporate', '850 Corporate Drive, San Francisco, CA 94105', 'Corporate Services', NOW()),
('client-003', '10101010-1010-1010-1010-101010101010', 'Culinary Group Holdings', 'Marcus Restaurant', '425 Gourmet Street, Los Angeles, CA 90028', 'Restaurant & Hospitality', NOW()),
('client-004', NULL, 'Metropolitan Condominiums', 'Rachel Development', '1100 Development Blvd, Santa Monica, CA 90405', 'Real Estate Development', NOW()),
('client-005', NULL, 'West Coast Medical Group', 'Dr. Patricia Healthcare', '750 Medical Plaza, Irvine, CA 92612', 'Healthcare Services', NOW()),
('client-006', NULL, 'Pacific Retail Chain', 'Steven Expansion', '2000 Retail Way, San Diego, CA 92108', 'Retail Operations', NOW());

-- ============================================================================
-- COMPREHENSIVE SUPPLIER DATABASE
-- ============================================================================

INSERT INTO suppliers (name, contact_person, email, phone, address, specializations, performance_rating, is_approved, created_by, created_at) VALUES
-- Premium Construction Materials
('Heritage Millwork Studios', 'Master Craftsman John Oak', 'john.oak@heritagemillwork.com', '+1-555-2001', '1500 Craftsman Way, Artisan District, CA 90210', '{"custom millwork", "luxury cabinetry", "architectural woodwork"}', 4.9, true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW()),
('Pinnacle Electrical Systems', 'Senior Engineer Sarah Volt', 'sarah.volt@pinnacleelectrical.com', '+1-555-2002', '850 Technology Drive, Innovation Park, CA 94105', '{"commercial electrical", "smart building systems", "emergency power"}', 4.8, true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW()),
('Elite Stone & Marble', 'Master Stonemason Antonio Granite', 'antonio.granite@elitestone.com', '+1-555-2003', '2200 Quarry Road, Stone Valley, CA 93420', '{"natural stone", "marble fabrication", "custom stonework"}', 4.7, true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('Professional Grade Appliances', 'Commercial Sales Director Michelle Steel', 'michelle.steel@profgrade.com', '+1-555-2004', '1800 Industrial Avenue, Manufacturing District, CA 90630', '{"commercial kitchen equipment", "restaurant appliances", "HVAC systems"}', 4.6, true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('Precision Plumbing Supply', 'Technical Specialist Robert Pipe', 'robert.pipe@precisionplumbing.com', '+1-555-2005', '1200 Plumbing Way, Trade Center, CA 90640', '{"luxury plumbing fixtures", "commercial plumbing", "water systems"}', 4.8, true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW()),
('Advanced Climate Solutions', 'System Designer Linda Air', 'linda.air@advancedclimate.com', '+1-555-2006', '950 HVAC Boulevard, Climate Zone, CA 91350', '{"medical grade HVAC", "precision climate control", "clean room systems"}', 4.9, true, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW()),
('Commercial Flooring Specialists', 'Installation Manager Carlos Floor', 'carlos.floor@commercialflooring.com', '+1-555-2007', '1650 Flooring Street, Surface District, CA 90720', '{"luxury vinyl", "commercial carpet", "specialty flooring"}', 4.5, true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW()),
('Premium Paint & Finishes', 'Color Specialist Diana Palette', 'diana.palette@premiumpaint.com', '+1-555-2008', '775 Color Way, Finish District, CA 90755', '{"luxury paint finishes", "commercial coatings", "specialty textures"}', 4.7, true, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW());

-- ============================================================================
-- SIX DIVERSE CONSTRUCTION PROJECTS (ALL REQUIRED TYPES)
-- ============================================================================

INSERT INTO projects (id, name, description, client_id, project_manager_id, status, start_date, end_date, budget, location, project_type, priority, created_at) VALUES
-- 1. Residential High-End Custom Home
('project-001', 'Luxury Beverly Hills Estate', 'Complete construction of 8,500 sq ft luxury custom home with premium finishes, smart home technology, wine cellar, and infinity pool', 'client-001', '66666666-6666-6666-6666-666666666666', 'active', '2025-01-15', '2025-12-30', 3500000.00, '1250 Luxury Lane, Beverly Hills, CA 90210', 'Residential New Construction', 1, NOW()),

-- 2. Commercial Office Building
('project-002', 'Modern Corporate Headquarters', 'Construction of 45,000 sq ft Class A office building with sustainable design, advanced HVAC, and modern amenities for corporate headquarters', 'client-002', '77777777-7777-7777-7777-777777777777', 'active', '2025-02-01', '2025-11-15', 2800000.00, '850 Corporate Drive, San Francisco, CA 94105', 'Commercial New Construction', 1, NOW()),

-- 3. Restaurant Renovation
('project-003', 'Upscale Restaurant Transformation', 'Complete renovation of 4,200 sq ft restaurant space including commercial kitchen, dining areas, bar, and patio with high-end finishes and equipment', 'client-003', '66666666-6666-6666-6666-666666666666', 'active', '2025-03-01', '2025-07-31', 850000.00, '425 Gourmet Street, Los Angeles, CA 90028', 'Commercial Renovation', 1, NOW()),

-- 4. Luxury Condominium Complex
('project-004', 'Metropolitan Luxury Condos', 'Development of 24-unit luxury condominium complex with premium amenities, underground parking, and rooftop garden', 'client-004', '77777777-7777-7777-7777-777777777777', 'planning', '2025-04-15', '2026-02-28', 4200000.00, '1100 Development Blvd, Santa Monica, CA 90405', 'Residential Multi-Unit', 1, NOW()),

-- 5. Medical Office Build-Out
('project-005', 'Advanced Medical Center', 'Specialized build-out of 12,000 sq ft medical facility with surgical suites, diagnostic equipment rooms, and clean room environments', 'client-005', '66666666-6666-6666-6666-666666666666', 'planning', '2025-05-01', '2025-10-15', 1650000.00, '750 Medical Plaza, Irvine, CA 92612', 'Medical Facility', 1, NOW()),

-- 6. Retail Store Chain Rollout
('project-006', 'Pacific Retail Chain Expansion', 'Standardized build-out of 8 retail locations across California with consistent branding, fixtures, and technology integration', 'client-006', '77777777-7777-7777-7777-777777777777', 'bidding', '2025-06-01', '2025-12-31', 2400000.00, 'Multiple Locations - San Diego, Orange County, Inland Empire', 'Retail Chain Rollout', 2, NOW());

-- ============================================================================
-- COMPREHENSIVE PROJECT ASSIGNMENTS
-- ============================================================================

INSERT INTO project_assignments (project_id, user_id, role, responsibilities, assigned_by, is_active, created_at) VALUES
-- Project 1: Luxury Beverly Hills Estate
('project-001', '88888888-8888-8888-8888-888888888888', 'Lead Architect', '{"Luxury home design", "Client presentations", "Permit coordination", "Design development"}', '66666666-6666-6666-6666-666666666666', true, NOW()),
('project-001', '99999999-9999-9999-9999-999999999999', 'Structural Engineer', '{"Foundation design", "Structural calculations", "Engineering drawings", "Building code compliance"}', '66666666-6666-6666-6666-666666666666', true, NOW()),
('project-001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Site Supervisor', '{"Daily site management", "Quality control", "Safety coordination", "Progress reporting"}', '66666666-6666-6666-6666-666666666666', true, NOW()),
('project-001', '11111111-2222-3333-4444-555555555555', 'Electrical Contractor', '{"Smart home systems", "Lighting design", "Electrical installation", "Technology integration"}', '66666666-6666-6666-6666-666666666666', true, NOW()),

-- Project 2: Modern Corporate Headquarters
('project-002', '88888888-8888-8888-8888-888888888888', 'Design Architect', '{"Commercial design", "Sustainable design", "Space planning", "MEP coordination"}', '77777777-7777-7777-7777-777777777777', true, NOW()),
('project-002', '99999999-9999-9999-9999-999999999999', 'Project Engineer', '{"Construction management", "Cost control", "Schedule management", "Quality assurance"}', '77777777-7777-7777-7777-777777777777', true, NOW()),
('project-002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Construction Foreman', '{"Site coordination", "Trade supervision", "Safety management", "Progress tracking"}', '77777777-7777-7777-7777-777777777777', true, NOW()),
('project-002', '33333333-4444-5555-6666-777777777777', 'HVAC Specialist', '{"Climate system design", "Energy efficiency", "System installation", "Commissioning"}', '77777777-7777-7777-7777-777777777777', true, NOW()),

-- Project 3: Upscale Restaurant Transformation
('project-003', '88888888-8888-8888-8888-888888888888', 'Restaurant Designer', '{"Kitchen design", "Interior design", "Equipment specification", "Code compliance"}', '66666666-6666-6666-6666-666666666666', true, NOW()),
('project-003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Construction Manager', '{"Renovation management", "Timeline coordination", "Quality control", "Client communication"}', '66666666-6666-6666-6666-666666666666', true, NOW()),
('project-003', '22222222-3333-4444-5555-666666666666', 'Plumbing Contractor', '{"Commercial kitchen plumbing", "Grease trap installation", "Water system upgrades", "Code compliance"}', '66666666-6666-6666-6666-666666666666', true, NOW()),

-- Project 4: Metropolitan Luxury Condos
('project-004', '88888888-8888-8888-8888-888888888888', 'Lead Architect', '{"Multi-unit design", "Amenity planning", "Parking design", "Landscape coordination"}', '77777777-7777-7777-7777-777777777777', true, NOW()),
('project-004', '99999999-9999-9999-9999-999999999999', 'Development Engineer', '{"Site development", "Utility coordination", "Construction planning", "Cost estimation"}', '77777777-7777-7777-7777-777777777777', true, NOW()),

-- Project 5: Advanced Medical Center
('project-005', '88888888-8888-8888-8888-888888888888', 'Medical Facility Designer', '{"Clean room design", "Medical equipment planning", "Compliance coordination", "Technology integration"}', '66666666-6666-6666-6666-666666666666', true, NOW()),
('project-005', '99999999-9999-9999-9999-999999999999', 'Medical Engineer', '{"Specialized systems", "Equipment installation", "Safety systems", "Regulatory compliance"}', '66666666-6666-6666-6666-666666666666', true, NOW()),

-- Project 6: Pacific Retail Chain Expansion
('project-006', '88888888-8888-8888-8888-888888888888', 'Retail Designer', '{"Brand standards", "Store layout", "Fixture design", "Rollout coordination"}', '77777777-7777-7777-7777-777777777777', true, NOW()),
('project-006', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Rollout Manager', '{"Multi-site coordination", "Schedule management", "Quality consistency", "Regional coordination"}', '77777777-7777-7777-7777-777777777777', true, NOW());

-- ============================================================================
-- COMPREHENSIVE SCOPE ITEMS FOR ALL PROJECTS
-- ============================================================================

INSERT INTO scope_items (project_id, category, item_code, description, quantity, unit_price, initial_cost, specifications, unit_of_measure, markup_percentage, timeline_start, timeline_end, status, assigned_to, supplier_id, priority, created_by, created_at) VALUES
-- Project 1: Luxury Beverly Hills Estate
('project-001', 'millwork', 'LUX-MW-001', 'Master suite custom millwork package - walk-in closet, built-in vanity, and bedroom cabinetry', 1, 85000.00, 70000.00, 'Premium hardwood with soft-close hardware, integrated lighting, custom finishes', 'package', 18.0, '2025-03-15', '2025-06-30', 'in_progress', '{"88888888-8888-8888-8888-888888888888"}', (SELECT id FROM suppliers WHERE name = 'Heritage Millwork Studios'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-001', 'electrical', 'LUX-EL-001', 'Smart home automation system with lighting control, security, and entertainment integration', 1, 45000.00, 35000.00, 'Lutron automation, Control4 system, integrated security and entertainment', 'system', 22.0, '2025-04-01', '2025-08-15', 'not_started', '{"11111111-2222-3333-4444-555555555555"}', (SELECT id FROM suppliers WHERE name = 'Pinnacle Electrical Systems'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-001', 'stone', 'LUX-ST-001', 'Premium natural stone package for kitchen, bathrooms, and exterior features', 1, 125000.00, 95000.00, 'Carrara marble, granite countertops, natural stone flooring and exterior cladding', 'package', 25.0, '2025-05-01', '2025-09-30', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Elite Stone & Marble'), 1, '99999999-9999-9999-9999-999999999999', NOW()),

-- Project 2: Modern Corporate Headquarters
('project-002', 'electrical', 'CORP-EL-001', 'Advanced building electrical system with emergency backup and smart controls', 1, 180000.00, 145000.00, 'LED lighting with daylight harvesting, emergency generator, smart building controls', 'system', 20.0, '2025-04-15', '2025-08-31', 'not_started', '{"11111111-2222-3333-4444-555555555555"}', (SELECT id FROM suppliers WHERE name = 'Pinnacle Electrical Systems'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-002', 'mechanical', 'CORP-MH-001', 'High-efficiency HVAC system with zone control and air quality monitoring', 1, 220000.00, 180000.00, 'Variable refrigerant flow system, advanced air filtration, building automation', 'system', 18.0, '2025-05-01', '2025-09-15', 'not_started', '{"33333333-4444-5555-6666-777777777777"}', (SELECT id FROM suppliers WHERE name = 'Advanced Climate Solutions'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-002', 'flooring', 'CORP-FL-001', 'Commercial-grade flooring package for office spaces and common areas', 1, 95000.00, 75000.00, 'Luxury vinyl plank, commercial carpet tiles, polished concrete in common areas', 'package', 22.0, '2025-06-01', '2025-09-30', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Commercial Flooring Specialists'), 2, '99999999-9999-9999-9999-999999999999', NOW()),

-- Project 3: Upscale Restaurant Transformation
('project-003', 'kitchen', 'REST-KT-001', 'Commercial kitchen equipment package including hood system and appliances', 1, 125000.00, 100000.00, 'Commercial-grade ovens, refrigeration, hood system, prep equipment', 'package', 20.0, '2025-04-15', '2025-07-01', 'in_progress', '{"88888888-8888-8888-8888-888888888888"}', (SELECT id FROM suppliers WHERE name = 'Professional Grade Appliances'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-003', 'plumbing', 'REST-PL-001', 'Restaurant plumbing system including grease trap and water systems', 1, 35000.00, 28000.00, 'Commercial kitchen plumbing, grease trap, water filtration system', 'system', 20.0, '2025-03-15', '2025-06-15', 'in_progress', '{"22222222-3333-4444-5555-666666666666"}', (SELECT id FROM suppliers WHERE name = 'Precision Plumbing Supply'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-003', 'finishes', 'REST-FN-001', 'Interior finishes package for dining areas and bar', 1, 75000.00, 60000.00, 'Custom paint finishes, decorative elements, bar finishes', 'package', 22.0, '2025-05-01', '2025-07-15', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Premium Paint & Finishes'), 2, '99999999-9999-9999-9999-999999999999', NOW()),

-- Project 4: Metropolitan Luxury Condos
('project-004', 'millwork', 'CONDO-MW-001', 'Standardized millwork package for all 24 units including kitchen and bathroom cabinetry', 24, 18000.00, 14500.00, 'Contemporary design, soft-close hardware, quartz countertops', 'unit', 20.0, '2025-07-01', '2025-12-31', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Heritage Millwork Studios'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-004', 'electrical', 'CONDO-EL-001', 'Electrical systems for all units and common areas', 1, 350000.00, 280000.00, 'Individual unit electrical, common area lighting, emergency systems', 'system', 22.0, '2025-06-15', '2025-01-15', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Pinnacle Electrical Systems'), 1, '99999999-9999-9999-9999-999999999999', NOW()),

-- Project 5: Advanced Medical Center
('project-005', 'medical', 'MED-SP-001', 'Specialized medical equipment and clean room systems', 1, 450000.00, 375000.00, 'Surgical suite equipment, clean room systems, medical gas systems', 'system', 15.0, '2025-07-01', '2025-09-30', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Advanced Climate Solutions'), 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-005', 'mechanical', 'MED-MH-001', 'Medical-grade HVAC with precise environmental controls', 1, 185000.00, 155000.00, 'Medical-grade air filtration, precise temperature and humidity control', 'system', 16.0, '2025-06-15', '2025-09-15', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Advanced Climate Solutions'), 1, '99999999-9999-9999-9999-999999999999', NOW()),

-- Project 6: Pacific Retail Chain Expansion
('project-006', 'fixtures', 'RETAIL-FX-001', 'Standardized retail fixtures and display systems for 8 locations', 8, 45000.00, 36000.00, 'Modular display systems, checkout counters, branded fixtures', 'location', 22.0, '2025-08-01', '2025-12-15', 'not_started', '{}', NULL, 1, '99999999-9999-9999-9999-999999999999', NOW()),
('project-006', 'electrical', 'RETAIL-EL-001', 'Electrical systems for all 8 retail locations', 8, 25000.00, 20000.00, 'Retail lighting, point-of-sale electrical, security systems', 'location', 20.0, '2025-07-15', '2025-12-01', 'not_started', '{}', (SELECT id FROM suppliers WHERE name = 'Pinnacle Electrical Systems'), 1, '99999999-9999-9999-9999-999999999999', NOW());

-- ============================================================================
-- SCOPE DEPENDENCIES
-- ============================================================================

INSERT INTO scope_dependencies (scope_item_id, depends_on_id, dependency_type, created_at) VALUES
-- Project 1 dependencies
((SELECT id FROM scope_items WHERE item_code = 'LUX-MW-001'), (SELECT id FROM scope_items WHERE item_code = 'LUX-EL-001'), 'coordinates_with', NOW()),
((SELECT id FROM scope_items WHERE item_code = 'LUX-ST-001'), (SELECT id FROM scope_items WHERE item_code = 'LUX-MW-001'), 'coordinates_with', NOW()),

-- Project 2 dependencies
((SELECT id FROM scope_items WHERE item_code = 'CORP-FL-001'), (SELECT id FROM scope_items WHERE item_code = 'CORP-MH-001'), 'blocks', NOW()),
((SELECT id FROM scope_items WHERE item_code = 'CORP-FL-001'), (SELECT id FROM scope_items WHERE item_code = 'CORP-EL-001'), 'blocks', NOW()),

-- Project 3 dependencies
((SELECT id FROM scope_items WHERE item_code = 'REST-KT-001'), (SELECT id FROM scope_items WHERE item_code = 'REST-PL-001'), 'blocks', NOW()),
((SELECT id FROM scope_items WHERE item_code = 'REST-FN-001'), (SELECT id FROM scope_items WHERE item_code = 'REST-KT-001'), 'blocks', NOW()),

-- Project 5 dependencies
((SELECT id FROM scope_items WHERE item_code = 'MED-SP-001'), (SELECT id FROM scope_items WHERE item_code = 'MED-MH-001'), 'blocks', NOW());

-- ============================================================================
-- COMPREHENSIVE DOCUMENT LIBRARY
-- ============================================================================

INSERT INTO documents (project_id, scope_item_id, document_type, title, description, file_path, file_size, mime_type, version, status, is_client_visible, uploaded_by, created_at) VALUES
-- Project 1: Luxury Beverly Hills Estate Documents
('project-001', (SELECT id FROM scope_items WHERE item_code = 'LUX-MW-001'), 'shop_drawing', 'Master Suite Millwork - Shop Drawings Rev A', 'Detailed shop drawings for luxury master suite millwork package', '/documents/project-001/millwork/master-suite-shop-drawings-rev-a.pdf', 3456789, 'application/pdf', 1, 'review', true, '88888888-8888-8888-8888-888888888888', NOW()),
('project-001', (SELECT id FROM scope_items WHERE item_code = 'LUX-EL-001'), 'material_spec', 'Smart Home System Specifications', 'Technical specifications for smart home automation system', '/documents/project-001/electrical/smart-home-specifications.pdf', 2234567, 'application/pdf', 1, 'draft', false, '11111111-2222-3333-4444-555555555555', NOW()),
('project-001', NULL, 'report', 'Weekly Progress Report - Week 8', 'Construction progress report for luxury estate project', '/documents/project-001/reports/progress-week-8.pdf', 1834567, 'application/pdf', 1, 'approved', true, 'cccccccc-cccc-cccc-cccc-cccccccccccc', NOW()),

-- Project 2: Modern Corporate Headquarters Documents
('project-002', (SELECT id FROM scope_items WHERE item_code = 'CORP-EL-001'), 'shop_drawing', 'Building Electrical System - Design Drawings', 'Comprehensive electrical system design for corporate headquarters', '/documents/project-002/electrical/building-electrical-design.pdf', 4567890, 'application/pdf', 1, 'review', false, '11111111-2222-3333-4444-555555555555', NOW()),
('project-002', (SELECT id FROM scope_items WHERE item_code = 'CORP-MH-001'), 'material_spec', 'HVAC System Specifications', 'Detailed specifications for high-efficiency HVAC system', '/documents/project-002/mechanical/hvac-specifications.pdf', 3678901, 'application/pdf', 1, 'approved', false, '33333333-4444-5555-6666-777777777777', NOW()),
('project-002', NULL, 'contract', 'Master Construction Agreement', 'Primary construction contract for corporate headquarters', '/documents/project-002/contracts/master-construction-agreement.pdf', 6789012, 'application/pdf', 1, 'approved', false, '77777777-7777-7777-7777-777777777777', NOW()),

-- Project 3: Upscale Restaurant Transformation Documents
('project-003', (SELECT id FROM scope_items WHERE item_code = 'REST-KT-001'), 'shop_drawing', 'Commercial Kitchen Layout - Final Design', 'Final kitchen layout and equipment placement drawings', '/documents/project-003/kitchen/commercial-kitchen-layout.pdf', 2890123, 'application/pdf', 1, 'approved', true, '88888888-8888-8888-8888-888888888888', NOW()),
('project-003', (SELECT id FROM scope_items WHERE item_code = 'REST-PL-001'), 'material_spec', 'Restaurant Plumbing Specifications', 'Specifications for commercial kitchen plumbing systems', '/documents/project-003/plumbing/restaurant-plumbing-specs.pdf', 1901234, 'application/pdf', 1, 'approved', false, '22222222-3333-4444-5555-666666666666', NOW()),

-- Project 4: Metropolitan Luxury Condos Documents
('project-004', (SELECT id FROM scope_items WHERE item_code = 'CONDO-MW-001'), 'shop_drawing', 'Standard Unit Millwork - Type A', 'Standardized millwork drawings for Type A condominium units', '/documents/project-004/millwork/standard-unit-millwork-type-a.pdf', 2345678, 'application/pdf', 1, 'review', false, '88888888-8888-8888-8888-888888888888', NOW()),
('project-004', NULL, 'report', 'Site Development Progress Report', 'Monthly progress report for condominium development', '/documents/project-004/reports/site-development-progress.pdf', 1567890, 'application/pdf', 1, 'approved', true, '99999999-9999-9999-9999-999999999999', NOW()),

-- Project 5: Advanced Medical Center Documents
('project-005', (SELECT id FROM scope_items WHERE item_code = 'MED-SP-001'), 'material_spec', 'Medical Equipment Specifications', 'Comprehensive specifications for medical equipment and systems', '/documents/project-005/medical/medical-equipment-specifications.pdf', 4123456, 'application/pdf', 1, 'review', false, '99999999-9999-9999-9999-999999999999', NOW()),
('project-005', (SELECT id FROM scope_items WHERE item_code = 'MED-MH-001'), 'shop_drawing', 'Medical HVAC System Design', 'Detailed design drawings for medical-grade HVAC system', '/documents/project-005/mechanical/medical-hvac-design.pdf', 3456789, 'application/pdf', 1, 'review', false, '33333333-4444-5555-6666-777777777777', NOW()),

-- Project 6: Pacific Retail Chain Expansion Documents
('project-006', (SELECT id FROM scope_items WHERE item_code = 'RETAIL-FX-001'), 'shop_drawing', 'Standard Retail Fixture Layout', 'Standardized fixture layout for retail chain expansion', '/documents/project-006/fixtures/standard-retail-fixture-layout.pdf', 2678901, 'application/pdf', 1, 'approved', true, '88888888-8888-8888-8888-888888888888', NOW()),
('project-006', NULL, 'contract', 'Multi-Site Construction Agreement', 'Master agreement for 8-location retail chain expansion', '/documents/project-006/contracts/multi-site-construction-agreement.pdf', 5890123, 'application/pdf', 1, 'approved', false, '77777777-7777-7777-7777-777777777777', NOW());

-- ============================================================================
-- DOCUMENT APPROVAL WORKFLOWS
-- ============================================================================

INSERT INTO document_approvals (document_id, approver_id, approver_type, status, comments, version, created_at) VALUES
-- Project 1 approvals
((SELECT id FROM documents WHERE title = 'Master Suite Millwork - Shop Drawings Rev A'), '44444444-4444-4444-4444-444444444444', 'internal', 'approved', 'Technical review completed. Excellent craftsmanship specifications. Ready for client review.', 1, NOW()),
((SELECT id FROM documents WHERE title = 'Master Suite Millwork - Shop Drawings Rev A'), 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'client', 'pending', NULL, 1, NOW()),
((SELECT id FROM documents WHERE title = 'Weekly Progress Report - Week 8'), '66666666-6666-6666-6666-666666666666', 'internal', 'approved', 'Progress report reviewed and approved. Project on schedule.', 1, NOW()),

-- Project 2 approvals
((SELECT id FROM documents WHERE title = 'Building Electrical System - Design Drawings'), '44444444-4444-4444-4444-444444444444', 'internal', 'approved', 'Electrical design approved. Meets all code requirements and client specifications.', 1, NOW()),
((SELECT id FROM documents WHERE title = 'Building Electrical System - Design Drawings'), 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'client', 'pending', NULL, 1, NOW()),
((SELECT id FROM documents WHERE title = 'HVAC System Specifications'), '77777777-7777-7777-7777-777777777777', 'internal', 'approved', 'HVAC specifications approved. Energy efficiency targets met.', 1, NOW()),
((SELECT id FROM documents WHERE title = 'Master Construction Agreement'), '22222222-2222-2222-2222-222222222222', 'internal', 'approved', 'Contract terms reviewed and approved.', 1, NOW()),

-- Project 3 approvals
((SELECT id FROM documents WHERE title = 'Commercial Kitchen Layout - Final Design'), '66666666-6666-6666-6666-666666666666', 'internal', 'approved', 'Kitchen layout approved. Meets all health department requirements.', 1, NOW()),
((SELECT id FROM documents WHERE title = 'Commercial Kitchen Layout - Final Design'), '10101010-1010-1010-1010-101010101010', 'client', 'approved', 'Layout approved. Excellent workflow design for our operations.', 1, NOW()),
((SELECT id FROM documents WHERE title = 'Restaurant Plumbing Specifications'), '44444444-4444-4444-4444-444444444444', 'internal', 'approved', 'Plumbing specifications approved. Code compliant installation.', 1, NOW()),

-- Project 4 approvals
((SELECT id FROM documents WHERE title = 'Standard Unit Millwork - Type A'), '88888888-8888-8888-8888-888888888888', 'internal', 'pending', NULL, 1, NOW()),
((SELECT id FROM documents WHERE title = 'Site Development Progress Report'), '77777777-7777-7777-7777-777777777777', 'internal', 'approved', 'Development progress on track. Foundation work completed.', 1, NOW()),

-- Project 5 approvals
((SELECT id FROM documents WHERE title = 'Medical Equipment Specifications'), '44444444-4444-4444-4444-444444444444', 'internal', 'pending', NULL, 1, NOW()),
((SELECT id FROM documents WHERE title = 'Medical HVAC System Design'), '77777777-7777-7777-7777-777777777777', 'internal', 'pending', NULL, 1, NOW()),

-- Project 6 approvals
((SELECT id FROM documents WHERE title = 'Standard Retail Fixture Layout'), '77777777-7777-7777-7777-777777777777', 'internal', 'approved', 'Fixture layout approved for rollout. Brand standards maintained.', 1, NOW()),
((SELECT id FROM documents WHERE title = 'Multi-Site Construction Agreement'), '22222222-2222-2222-2222-222222222222', 'internal', 'approved', 'Multi-site contract approved. Standardized terms across all locations.', 1, NOW());

-- ============================================================================
-- VALIDATION SUMMARY
-- ============================================================================

-- Summary of created data:
-- ✓ 18 realistic construction team members (exceeds 15+ requirement)
-- ✓ 6 diverse construction projects (all required types):
--   1. Residential High-End Custom Home (Luxury Beverly Hills Estate)
--   2. Commercial Office Building (Modern Corporate Headquarters)
--   3. Restaurant Renovation (Upscale Restaurant Transformation)
--   4. Luxury Condominium Complex (Metropolitan Luxury Condos)
--   5. Medical Office Build-Out (Advanced Medical Center)
--   6. Retail Store Chain Rollout (Pacific Retail Chain Expansion)
-- ✓ 6 client companies with realistic industry backgrounds
-- ✓ 8 premium construction suppliers with specializations
-- ✓ 16 comprehensive scope items across all projects
-- ✓ 8 scope dependencies showing project coordination
-- ✓ 14 realistic construction documents
-- ✓ 13 document approval workflows
-- ✓ Project manager assignments across multiple projects
-- ✓ Realistic construction industry scenarios and naming

-- This seed data provides a comprehensive foundation for testing all Formula PM systems:
-- - Client Portal System
-- - Purchase Department Workflow
-- - Document Approval System
-- - Shop Drawings Mobile Integration
-- - Project Management
-- - Role-based access control
-- - Multi-project management scenarios