-- Mock Data Generation for Formula PM 2.0
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: CREATE TEST USERS (Auth + Profiles)
-- ============================================================================

-- Temporarily disable RLS for data insertion
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;

-- Clean existing test data
DELETE FROM tasks WHERE title LIKE '%Test%' OR title LIKE '%Mock%';
DELETE FROM scope_items WHERE name LIKE '%Test%' OR name LIKE '%Mock%';
DELETE FROM projects WHERE name LIKE '%Test%' OR name LIKE '%Mock%' OR name LIKE '%Downtown%';
DELETE FROM clients WHERE company_name LIKE '%Test%' OR company_name LIKE '%Mock%';
DELETE FROM user_profiles WHERE email LIKE '%formulapm.com' OR email LIKE '%test%';
DELETE FROM auth.users WHERE email LIKE '%formulapm.com' OR email LIKE '%test%';

-- Create auth users with profiles
DO $$
DECLARE
    user_data RECORD;
    auth_user_id UUID;
BEGIN
    -- Array of users to create
    FOR user_data IN 
        SELECT * FROM (VALUES
            ('admin@formulapm.com', 'Admin', 'User', 'company_owner', 'Management'),
            ('pm1@formulapm.com', 'Mike', 'Johnson', 'project_manager', 'Projects'),
            ('pm2@formulapm.com', 'Lisa', 'Chen', 'project_manager', 'Projects'),
            ('architect1@formulapm.com', 'Emma', 'Taylor', 'architect', 'Design'),
            ('engineer1@formulapm.com', 'James', 'Brown', 'technical_office', 'Engineering'),
            ('supervisor1@formulapm.com', 'Robert', 'Miller', 'site_supervisor', 'Field Operations'),
            ('worker1@formulapm.com', 'Tom', 'Anderson', 'field_worker', 'Construction'),
            ('finance@formulapm.com', 'Jennifer', 'Lee', 'finance_team', 'Finance'),
            ('purchase@formulapm.com', 'Kevin', 'White', 'purchase_department', 'Procurement'),
            ('client1@testcorp.com', 'Michael', 'Thompson', 'client', 'Operations'),
            ('client2@buildco.com', 'Susan', 'Clark', 'client', 'Development')
        ) AS t(email, first_name, last_name, role, department)
    LOOP
        -- Generate UUID for user
        auth_user_id := gen_random_uuid();
        
        -- Create auth user
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_super_admin
        ) VALUES (
            auth_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            user_data.email,
            '$2a$10$8K1p/a0dhrxSHxN5.WiISOjjK7qQlaYVt2/Oe9a5vgIAGHmgzVWLu', -- testpass123
            NOW(),
            ('{"provider": "email", "providers": ["email"], "user_role": "' || user_data.role || '"}')::jsonb,
            ('{"email": "' || user_data.email || '"}')::jsonb,
            NOW(),
            NOW(),
            false
        );
        
        -- Create user profile
        INSERT INTO user_profiles (
            id, email, first_name, last_name, role, department, company, is_active, permissions
        ) VALUES (
            auth_user_id,
            user_data.email,
            user_data.first_name,
            user_data.last_name,
            user_data.role::user_role,
            user_data.department,
            'Formula PM',
            true,
            '{}'::jsonb
        );
        
        RAISE NOTICE 'Created user: % (% %)', user_data.email, user_data.first_name, user_data.last_name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: CREATE CLIENT COMPANIES
-- ============================================================================

INSERT INTO clients (company_name, contact_person, email, phone, billing_address) VALUES
('TechCorp Industries', 'Michael Thompson', 'client1@testcorp.com', '+1-555-0101', '123 Business Ave, Downtown, NY 10001'),
('BuildCo Development', 'Susan Clark', 'client2@buildco.com', '+1-555-0102', '456 Development St, Midtown, NY 10002'),
('Metro Properties', 'Robert Johnson', 'contact@metroproperties.com', '+1-555-0103', '789 Property Blvd, Uptown, NY 10003');

-- ============================================================================
-- STEP 3: CREATE PROJECTS
-- ============================================================================

INSERT INTO projects (name, description, status, start_date, end_date, budget, actual_cost, location, project_type, priority, project_manager_id, client_id, created_by)
SELECT 
    project_data.name,
    project_data.description,
    project_data.status::project_status,
    project_data.start_date::date,
    project_data.end_date::date,
    project_data.budget,
    project_data.actual_cost,
    project_data.location,
    project_data.project_type,
    project_data.priority,
    pm.id,
    c.id,
    pm.id
FROM (VALUES
    ('Downtown Office Complex', 'Modern 15-story office building with retail space', 'in_progress', '2024-01-15', '2024-12-31', 2500000.00, 1200000.00, 'Downtown Business District', 'Commercial', 1),
    ('Residential Tower Phase 1', '25-story luxury residential tower with amenities', 'planning', '2024-03-01', '2025-08-15', 4200000.00, 150000.00, 'Waterfront District', 'Residential', 1),
    ('Shopping Mall Renovation', 'Complete renovation of existing shopping center', 'in_progress', '2023-11-01', '2024-06-30', 1800000.00, 1650000.00, 'Suburban Mall', 'Renovation', 2),
    ('Industrial Warehouse Complex', 'Multi-building warehouse and distribution center', 'completed', '2023-05-01', '2023-12-15', 3200000.00, 3150000.00, 'Industrial Park', 'Industrial', 3),
    ('School Campus Extension', 'New classroom building and sports facilities', 'planning', '2024-06-01', '2025-05-31', 1500000.00, 0.00, 'Education District', 'Educational', 2)
) AS project_data(name, description, status, start_date, end_date, budget, actual_cost, location, project_type, priority),
user_profiles pm,
clients c
WHERE pm.role = 'project_manager' 
AND c.company_name IN ('TechCorp Industries', 'BuildCo Development', 'Metro Properties')
AND ROW_NUMBER() OVER (ORDER BY project_data.name) <= (SELECT COUNT(*) FROM user_profiles WHERE role = 'project_manager')
AND c.id = (
    SELECT id FROM clients 
    ORDER BY id 
    LIMIT 1 OFFSET (ROW_NUMBER() OVER (ORDER BY project_data.name) - 1) % (SELECT COUNT(*) FROM clients)
);

-- ============================================================================
-- STEP 4: CREATE SCOPE ITEMS
-- ============================================================================

INSERT INTO scope_items (project_id, name, description, category, status, estimated_cost, actual_cost, created_by)
SELECT 
    p.id,
    scope_data.name,
    scope_data.description,
    scope_data.category,
    scope_data.status::scope_status,
    scope_data.estimated_cost,
    CASE WHEN scope_data.status = 'completed' THEN scope_data.estimated_cost * 0.95 ELSE 0 END,
    p.project_manager_id
FROM projects p,
(VALUES
    ('Foundation Work', 'Excavation and foundation pouring', 'structural', 'completed', 150000),
    ('Steel Framework', 'Steel structure installation', 'structural', 'in_progress', 300000),
    ('Electrical Systems', 'Electrical wiring and systems', 'mep', 'not_started', 120000),
    ('HVAC Installation', 'Heating and cooling systems', 'mep', 'not_started', 180000),
    ('Interior Finishing', 'Flooring, painting, fixtures', 'finishing', 'not_started', 200000)
) AS scope_data(name, description, category, status, estimated_cost);

-- ============================================================================
-- STEP 5: CREATE TASKS
-- ============================================================================

INSERT INTO tasks (project_id, scope_item_id, title, description, status, priority, assigned_to, created_by, due_date)
SELECT 
    s.project_id,
    s.id,
    task_data.title_prefix || s.name,
    task_data.description_prefix || s.name,
    task_data.status::task_status,
    task_data.priority::task_priority,
    p.project_manager_id,
    p.project_manager_id,
    (CURRENT_DATE + (random() * 30)::int)::date
FROM scope_items s
JOIN projects p ON p.id = s.project_id,
(VALUES
    ('Plan ', 'Planning phase for ', 'completed', 'high'),
    ('Execute ', 'Implementation of ', 'in_progress', 'high'),
    ('Review ', 'Quality review for ', 'pending', 'medium'),
    ('Test ', 'Testing and validation of ', 'pending', 'low')
) AS task_data(title_prefix, description_prefix, status, priority);

-- ============================================================================
-- STEP 6: RE-ENABLE RLS AND CREATE VERIFICATION
-- ============================================================================

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scope_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Verification queries
SELECT 'USERS CREATED' as summary, COUNT(*) as count FROM user_profiles WHERE email LIKE '%formulapm.com';
SELECT 'CLIENTS CREATED' as summary, COUNT(*) as count FROM clients WHERE company_name LIKE '%Test%' OR company_name LIKE '%Tech%' OR company_name LIKE '%Build%';
SELECT 'PROJECTS CREATED' as summary, COUNT(*) as count FROM projects;
SELECT 'SCOPE ITEMS CREATED' as summary, COUNT(*) as count FROM scope_items;
SELECT 'TASKS CREATED' as summary, COUNT(*) as count FROM tasks;

-- Success message
SELECT 
    '🎉 Mock data created successfully!' as result,
    'All users have password: testpass123' as note,
    'Login with: admin@formulapm.com, pm1@formulapm.com, client1@testcorp.com, etc.' as credentials;
