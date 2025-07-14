-- Create Test Project Data - FIXED VERSION
-- This will create a sample project so the dashboard doesn't error with empty data

-- First, create a test client
INSERT INTO clients (
    id,
    user_id,
    company_name,
    contact_person,
    billing_address,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    NULL, -- No specific user association for now
    'ABC Construction Company',
    'John Smith',
    '123 Main Street, New York, NY 10001',
    NOW(),
    NOW()
) ON CONFLICT (company_name) DO NOTHING;

-- Get the client ID for use in project
WITH client_data AS (
    SELECT id FROM clients WHERE company_name = 'ABC Construction Company' LIMIT 1
),
pm_data AS (
    SELECT id FROM user_profiles WHERE email = 'admin@formulapm.com' LIMIT 1
)
-- Create a test project
INSERT INTO projects (
    id,
    name,
    description,
    project_type,
    status,
    priority,
    client_id,
    project_manager_id,
    location,
    start_date,
    end_date,
    budget,
    actual_cost,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Downtown Office Renovation',
    'Complete renovation of 5000 sq ft office space including new electrical, HVAC, and modern finishes',
    'commercial',
    'active',
    1, -- high priority (1-3 scale)
    client_data.id,
    pm_data.id,
    '456 Business Ave, New York, NY 10002',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days',
    500000.00,
    125000.00,
    '{"client_portal_enabled": true, "mobile_reporting_enabled": true}'::jsonb,
    NOW(),
    NOW()
FROM client_data, pm_data
WHERE client_data.id IS NOT NULL AND pm_data.id IS NOT NULL;

-- Add a second project
WITH client_data AS (
    SELECT id FROM clients WHERE company_name = 'ABC Construction Company' LIMIT 1
),
pm_data AS (
    SELECT id FROM user_profiles WHERE email = 'admin@formulapm.com' LIMIT 1
)
INSERT INTO projects (
    id,
    name,
    description,
    project_type,
    status,
    priority,
    client_id,
    project_manager_id,
    location,
    start_date,
    end_date,
    budget,
    actual_cost,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    'Warehouse Expansion Project',
    'Adding 10,000 sq ft to existing warehouse facility with new loading docks',
    'industrial',
    'planning',
    2, -- medium priority (1-3 scale)
    client_data.id,
    pm_data.id,
    '789 Industrial Way, Brooklyn, NY 11201',
    CURRENT_DATE + INTERVAL '30 days',
    CURRENT_DATE + INTERVAL '180 days',
    750000.00,
    0.00,
    '{"approval_workflow_enabled": true}'::jsonb,
    NOW(),
    NOW()
FROM client_data, pm_data
WHERE client_data.id IS NOT NULL AND pm_data.id IS NOT NULL;

-- Verify the data was created
SELECT 
    p.name as project_name,
    p.status,
    p.budget,
    c.company_name as client_name,
    pm.first_name || ' ' || pm.last_name as project_manager
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN user_profiles pm ON p.project_manager_id = pm.id;

SELECT 'Test projects created successfully!' as result;