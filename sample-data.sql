-- Sample data for FormulaPM database
-- This creates realistic test data across all tables

-- Insert sample clients
INSERT INTO clients (id, company_name, contact_name, contact_email, contact_phone, address, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Tech Solutions Inc', 'John Smith', 'john.smith@techsolutions.com', '+1-555-0101', '123 Business Ave, Tech City, TC 12345', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'Green Energy Corp', 'Sarah Johnson', 'sarah.j@greenenergy.com', '+1-555-0102', '456 Eco Street, Green Valley, GV 67890', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'Manufacturing Plus', 'Mike Wilson', 'mike.wilson@mfgplus.com', '+1-555-0103', '789 Industrial Blvd, Factory Town, FT 11111', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'Retail Dynamics', 'Lisa Chen', 'lisa.chen@retaildyn.com', '+1-555-0104', '321 Commerce St, Shopping City, SC 22222', 'active'),
('550e8400-e29b-41d4-a716-446655440005', 'Healthcare Systems', 'David Brown', 'david.brown@healthsys.com', '+1-555-0105', '654 Medical Center Dr, Health City, HC 33333', 'active');

-- Insert sample suppliers
INSERT INTO suppliers (id, name, contact_name, contact_email, contact_phone, address, status, category, rating, notes) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Steel & Metal Works', 'Robert Taylor', 'robert@steelworks.com', '+1-555-0201', '100 Steel Ave, Metal City, MC 44444', 'active', 'Materials', 4, 'Reliable steel supplier with good pricing'),
('660e8400-e29b-41d4-a716-446655440002', 'ElectroTech Components', 'Maria Garcia', 'maria@electrotech.com', '+1-555-0202', '200 Circuit St, Tech Valley, TV 55555', 'active', 'Electronics', 5, 'Premium electronic components supplier'),
('660e8400-e29b-41d4-a716-446655440003', 'Construction Materials Co', 'James Anderson', 'james@constructmat.com', '+1-555-0203', '300 Build Blvd, Construct City, CC 66666', 'active', 'Construction', 4, 'Wide range of construction materials'),
('660e8400-e29b-41d4-a716-446655440004', 'Safety Equipment Plus', 'Jennifer White', 'jennifer@safetyplus.com', '+1-555-0204', '400 Safety St, Secure Town, ST 77777', 'active', 'Safety', 5, 'Top-quality safety equipment'),
('660e8400-e29b-41d4-a716-446655440005', 'Industrial Tools Ltd', 'Michael Davis', 'michael@indtools.com', '+1-555-0205', '500 Tool Ave, Industry City, IC 88888', 'active', 'Tools', 4, 'Professional grade industrial tools');

-- Insert sample user profiles (these would normally be created via auth, but for testing)
INSERT INTO user_profiles (id, first_name, last_name, email, role, phone, department, position, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'Alex', 'Manager', 'alex.manager@company.com', 'general_manager', '+1-555-0301', 'Management', 'General Manager', true),
('770e8400-e29b-41d4-a716-446655440002', 'Emma', 'Project', 'emma.project@company.com', 'project_manager', '+1-555-0302', 'Projects', 'Senior Project Manager', true),
('770e8400-e29b-41d4-a716-446655440003', 'Tom', 'Technical', 'tom.tech@company.com', 'technical_lead', '+1-555-0303', 'Engineering', 'Technical Lead', true),
('770e8400-e29b-41d4-a716-446655440004', 'Sophie', 'Developer', 'sophie.dev@company.com', 'user', '+1-555-0304', 'Engineering', 'Senior Developer', true),
('770e8400-e29b-41d4-a716-446655440005', 'Ryan', 'Analyst', 'ryan.analyst@company.com', 'user', '+1-555-0305', 'Analysis', 'Business Analyst', true),
('770e8400-e29b-41d4-a716-446655440006', 'Maya', 'Designer', 'maya.design@company.com', 'user', '+1-555-0306', 'Design', 'UI/UX Designer', true),
('770e8400-e29b-41d4-a716-446655440007', 'Chris', 'QA', 'chris.qa@company.com', 'user', '+1-555-0307', 'Quality', 'QA Engineer', true),
('770e8400-e29b-41d4-a716-446655440008', 'Nina', 'Admin', 'nina.admin@company.com', 'admin', '+1-555-0308', 'Administration', 'System Administrator', true);

-- Insert sample projects
INSERT INTO projects (id, name, description, status, budget, actual_cost, start_date, end_date, project_manager_id, client_id) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'E-Commerce Platform Upgrade', 'Complete overhaul of the existing e-commerce platform with modern tech stack', 'in_progress', 150000.00, 45000.00, '2024-01-15', '2024-06-30', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001'),
('880e8400-e29b-41d4-a716-446655440002', 'Solar Panel Installation', 'Installation of solar panels for manufacturing facility', 'planning', 250000.00, 0.00, '2024-03-01', '2024-08-15', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002'),
('880e8400-e29b-41d4-a716-446655440003', 'Factory Automation System', 'Implementation of automated production line systems', 'in_progress', 500000.00, 125000.00, '2024-02-01', '2024-12-31', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003'),
('880e8400-e29b-41d4-a716-446655440004', 'Retail POS System', 'New point-of-sale system for retail chain', 'completed', 75000.00, 72000.00, '2023-10-01', '2024-01-31', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004'),
('880e8400-e29b-41d4-a716-446655440005', 'Hospital Management System', 'Comprehensive hospital management and patient tracking system', 'planning', 300000.00, 0.00, '2024-04-01', '2024-11-30', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005');

-- Insert project assignments
INSERT INTO project_assignments (id, project_id, user_id, role, is_active) VALUES
('990e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'technical_lead', true),
('990e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', 'developer', true),
('990e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440006', 'designer', true),
('990e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 'technical_lead', true),
('990e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003', 'technical_lead', true),
('990e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440004', 'developer', true),
('990e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440007', 'qa_engineer', true),
('990e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440005', 'analyst', true);-- Insert
 sample tasks
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assigned_to) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Database Schema Design', 'Design and implement the new database schema for the e-commerce platform', 'completed', 'high', '2024-02-15', '770e8400-e29b-41d4-a716-446655440003'),
('aa0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'Frontend UI Development', 'Develop the main user interface components', 'in_progress', 'high', '2024-03-30', '770e8400-e29b-41d4-a716-446655440004'),
('aa0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 'Payment Gateway Integration', 'Integrate multiple payment gateways', 'todo', 'medium', '2024-04-15', '770e8400-e29b-41d4-a716-446655440004'),
('aa0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', 'User Experience Testing', 'Conduct comprehensive UX testing', 'todo', 'medium', '2024-05-30', '770e8400-e29b-41d4-a716-446655440006'),
('aa0e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440002', 'Site Survey and Assessment', 'Conduct detailed site survey for solar installation', 'completed', 'high', '2024-03-15', '770e8400-e29b-41d4-a716-446655440003'),
('aa0e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440002', 'Permit Applications', 'Submit all required permits for solar installation', 'in_progress', 'high', '2024-04-01', '770e8400-e29b-41d4-a716-446655440005'),
('aa0e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003', 'Equipment Procurement', 'Source and purchase automation equipment', 'in_progress', 'high', '2024-04-30', '770e8400-e29b-41d4-a716-446655440003'),
('aa0e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440003', 'System Integration Testing', 'Test integration between all automation systems', 'todo', 'medium', '2024-08-15', '770e8400-e29b-41d4-a716-446655440007'),
('aa0e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440005', 'Requirements Gathering', 'Gather detailed requirements from hospital staff', 'todo', 'high', '2024-04-15', '770e8400-e29b-41d4-a716-446655440005'),
('aa0e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440005', 'System Architecture Design', 'Design the overall system architecture', 'todo', 'high', '2024-05-01', '770e8400-e29b-41d4-a716-446655440003');

-- Insert sample scope items
INSERT INTO scope_items (id, project_id, category, item_no, item_code, description, quantity, unit_price, status, progress_percentage, timeline_start, timeline_end, assigned_to) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 'Development', 'DEV-001', 'ECOM-DB', 'Database development and optimization', 1, 15000.00, 'completed', 100, '2024-01-15', '2024-02-15', ARRAY['770e8400-e29b-41d4-a716-446655440003']),
('bb0e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 'Development', 'DEV-002', 'ECOM-FE', 'Frontend development with React', 1, 25000.00, 'in_progress', 60, '2024-02-01', '2024-04-30', ARRAY['770e8400-e29b-41d4-a716-446655440004']),
('bb0e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 'Integration', 'INT-001', 'ECOM-PAY', 'Payment gateway integration', 1, 8000.00, 'pending', 0, '2024-04-01', '2024-05-15', ARRAY['770e8400-e29b-41d4-a716-446655440004']),
('bb0e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', 'Testing', 'TEST-001', 'ECOM-QA', 'Quality assurance and testing', 1, 12000.00, 'pending', 0, '2024-05-01', '2024-06-15', ARRAY['770e8400-e29b-41d4-a716-446655440007']),
('bb0e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440002', 'Equipment', 'EQP-001', 'SOLAR-PAN', 'Solar panels - 500W each', 200, 350.00, 'pending', 0, '2024-05-01', '2024-07-01', ARRAY['770e8400-e29b-41d4-a716-446655440003']),
('bb0e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440002', 'Installation', 'INS-001', 'SOLAR-INS', 'Solar panel installation and setup', 1, 45000.00, 'pending', 0, '2024-07-01', '2024-08-15', ARRAY['770e8400-e29b-41d4-a716-446655440003']),
('bb0e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440003', 'Equipment', 'EQP-002', 'AUTO-ROB', 'Industrial robotic arms', 5, 45000.00, 'in_progress', 25, '2024-03-01', '2024-06-30', ARRAY['770e8400-e29b-41d4-a716-446655440003']),
('bb0e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440003', 'Software', 'SW-001', 'AUTO-CTRL', 'Automation control software', 1, 75000.00, 'in_progress', 40, '2024-04-01', '2024-09-30', ARRAY['770e8400-e29b-41d4-a716-446655440004']),
('bb0e8400-e29b-41d4-a716-446655440009', '880e8400-e29b-41d4-a716-446655440005', 'Development', 'DEV-003', 'HMS-CORE', 'Core hospital management system', 1, 120000.00, 'pending', 0, '2024-05-01', '2024-10-31', ARRAY['770e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440003']),
('bb0e8400-e29b-41d4-a716-446655440010', '880e8400-e29b-41d4-a716-446655440005', 'Integration', 'INT-002', 'HMS-MED', 'Medical equipment integration', 1, 35000.00, 'pending', 0, '2024-08-01', '2024-11-30', ARRAY['770e8400-e29b-41d4-a716-446655440003']);

-- Insert some audit log entries for demonstration
INSERT INTO audit_log (id, user_id, action, table_name, record_id, old_data, new_data) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'UPDATE', 'projects', '880e8400-e29b-41d4-a716-446655440001', '{"status": "planning"}', '{"status": "in_progress"}'),
('cc0e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440003', 'UPDATE', 'tasks', 'aa0e8400-e29b-41d4-a716-446655440001', '{"status": "in_progress"}', '{"status": "completed"}'),
('cc0e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', 'INSERT', 'scope_items', 'bb0e8400-e29b-41d4-a716-446655440001', null, '{"category": "Development", "description": "Database development and optimization"}');