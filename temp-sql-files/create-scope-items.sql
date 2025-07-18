-- Create Scope Items for Test Projects
-- This adds scope items to make the dashboard statistics meaningful

-- Get project IDs
WITH downtown_project AS (
    SELECT id FROM projects WHERE name = 'Downtown Office Renovation' LIMIT 1
),
warehouse_project AS (
    SELECT id FROM projects WHERE name = 'Warehouse Expansion Project' LIMIT 1
)
-- Create scope items for Downtown Office Renovation
INSERT INTO scope_items (
    project_id,
    category,
    description,
    quantity,
    unit,
    unit_price,
    status,
    progress_percentage,
    priority,
    created_by
)
SELECT 
    downtown_project.id,
    category,
    description,
    quantity,
    unit,
    unit_price,
    status,
    progress,
    priority,
    (SELECT id FROM user_profiles WHERE email = 'admin@formulapm.com')
FROM downtown_project, (VALUES 
    ('construction', 'Demolition and site preparation', 1, 'LS', 25000.00, 'completed', 100, 1),
    ('construction', 'Framing and drywall installation', 2500, 'SF', 12.50, 'in_progress', 75, 2),
    ('electrical', 'Main electrical panel upgrade', 1, 'EA', 15000.00, 'in_progress', 50, 3),
    ('electrical', 'Lighting fixtures installation', 85, 'EA', 350.00, 'not_started', 0, 4),
    ('mechanical', 'HVAC system installation', 1, 'LS', 45000.00, 'in_progress', 30, 5),
    ('millwork', 'Custom reception desk', 1, 'EA', 12000.00, 'not_started', 0, 6),
    ('millwork', 'Conference room built-ins', 2, 'EA', 8500.00, 'not_started', 0, 7)
) AS items(category, description, quantity, unit, unit_price, status, progress, priority);

-- Create scope items for Warehouse Expansion
WITH warehouse_project AS (
    SELECT id FROM projects WHERE name = 'Warehouse Expansion Project' LIMIT 1
)
INSERT INTO scope_items (
    project_id,
    category,
    description,
    quantity,
    unit,
    unit_price,
    status,
    progress_percentage,
    priority,
    created_by
)
SELECT 
    warehouse_project.id,
    category,
    description,
    quantity,
    unit,
    unit_price,
    status,
    progress,
    priority,
    (SELECT id FROM user_profiles WHERE email = 'admin@formulapm.com')
FROM warehouse_project, (VALUES 
    ('construction', 'Foundation and concrete work', 10000, 'SF', 15.00, 'not_started', 0, 1),
    ('construction', 'Steel structure erection', 1, 'LS', 125000.00, 'not_started', 0, 2),
    ('construction', 'Roofing and insulation', 10000, 'SF', 8.50, 'not_started', 0, 3),
    ('electrical', 'Power distribution system', 1, 'LS', 35000.00, 'not_started', 0, 4),
    ('mechanical', 'Loading dock equipment', 4, 'EA', 15000.00, 'not_started', 0, 5),
    ('mechanical', 'Ventilation system', 1, 'LS', 25000.00, 'not_started', 0, 6)
) AS items(category, description, quantity, unit, unit_price, status, progress, priority);

-- Verify scope items
SELECT 
    p.name as project_name,
    COUNT(si.id) as scope_items_count,
    SUM(CASE WHEN si.status = 'completed' THEN 1 ELSE 0 END) as completed_items,
    ROUND(AVG(si.progress_percentage)) as avg_progress
FROM projects p
LEFT JOIN scope_items si ON p.id = si.project_id
GROUP BY p.id, p.name;

SELECT 'Scope items created successfully!' as result;