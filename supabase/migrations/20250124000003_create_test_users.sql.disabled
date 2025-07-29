-- Formula PM 2.0 Test Users Creation
-- Created: 2025-01-24
-- Purpose: Create test users for all 6 roles with proper JWT claims
-- Password for all test users: testpass123

-- ============================================================================
-- CREATE TEST USERS IN AUTH.USERS
-- ============================================================================

-- Insert test users into auth.users
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
  -- Management user (replaces owner, GM, deputy GM)
  ('11111111-1111-1111-1111-111111111111', 'management.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "management"}'::jsonb, 
   '{"first_name": "Management", "last_name": "User"}'::jsonb),
  
  -- Purchase Manager
  ('22222222-2222-2222-2222-222222222222', 'purchase.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "purchase_manager"}'::jsonb, 
   '{"first_name": "Purchase", "last_name": "Manager"}'::jsonb),
  
  -- Technical Lead
  ('33333333-3333-3333-3333-333333333333', 'technical.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "technical_lead"}'::jsonb, 
   '{"first_name": "Technical", "last_name": "Lead"}'::jsonb),
  
  -- Project Manager
  ('44444444-4444-4444-4444-444444444444', 'pm.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "project_manager"}'::jsonb, 
   '{"first_name": "Project", "last_name": "Manager"}'::jsonb),
  
  -- Client
  ('55555555-5555-5555-5555-555555555555', 'client.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "client"}'::jsonb, 
   '{"first_name": "Client", "last_name": "User"}'::jsonb),
  
  -- Admin
  ('66666666-6666-6666-6666-666666666666', 'admin.test@formulapm.com', 
   crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), 
   '{"provider": "email", "providers": ["email"], "user_role": "admin"}'::jsonb, 
   '{"first_name": "Admin", "last_name": "User"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET 
  raw_app_meta_data = EXCLUDED.raw_app_meta_data,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data;

-- ============================================================================
-- CREATE USER PROFILES
-- ============================================================================

-- Create corresponding user profiles
INSERT INTO user_profiles (id, email, first_name, last_name, role, seniority, phone, company, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'management.test@formulapm.com', 
   'Management', 'User', 'management', 'executive', '+1234567890', 'Formula PM', true),
  
  ('22222222-2222-2222-2222-222222222222', 'purchase.test@formulapm.com', 
   'Purchase', 'Manager', 'purchase_manager', 'senior', '+1234567891', 'Formula PM', true),
  
  ('33333333-3333-3333-3333-333333333333', 'technical.test@formulapm.com', 
   'Technical', 'Lead', 'technical_lead', 'senior', '+1234567892', 'Formula PM', true),
  
  ('44444444-4444-4444-4444-444444444444', 'pm.test@formulapm.com', 
   'Project', 'Manager', 'project_manager', 'regular', '+1234567893', 'Formula PM', true),
  
  ('55555555-5555-5555-5555-555555555555', 'client.test@formulapm.com', 
   'Client', 'User', 'client', 'regular', '+1234567894', 'Test Client Company', true),
  
  ('66666666-6666-6666-6666-666666666666', 'admin.test@formulapm.com', 
   'Admin', 'User', 'admin', 'regular', '+1234567895', 'Formula PM', true)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  seniority = EXCLUDED.seniority,
  is_active = EXCLUDED.is_active;

-- ============================================================================
-- CREATE TEST CLIENT COMPANY
-- ============================================================================

-- Create a test client company
INSERT INTO clients (id, user_id, company_name, contact_person, email, phone)
VALUES (
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Test Client Company',
  'Client User',
  'client.test@formulapm.com',
  '+1234567894'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- CREATE TEST PROJECT
-- ============================================================================

-- Create a test project
INSERT INTO projects (name, description, client_id, project_manager_id, status, budget)
VALUES (
  'Test Project Alpha',
  'A test project for development and testing',
  'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid,
  '44444444-4444-4444-4444-444444444444'::uuid,
  'active',
  1000000.00
);

-- Get the project ID for assignments
DO $$
DECLARE
  test_project_id UUID;
BEGIN
  SELECT id INTO test_project_id FROM projects WHERE name = 'Test Project Alpha' LIMIT 1;
  
  -- Create project assignments
  INSERT INTO project_assignments (project_id, user_id, role)
  VALUES 
    (test_project_id, '11111111-1111-1111-1111-111111111111'::uuid, 'Executive Oversight'),
    (test_project_id, '22222222-2222-2222-2222-222222222222'::uuid, 'Procurement Lead'),
    (test_project_id, '33333333-3333-3333-3333-333333333333'::uuid, 'Technical Reviewer'),
    (test_project_id, '44444444-4444-4444-4444-444444444444'::uuid, 'Project Manager')
  ON CONFLICT (project_id, user_id, role) DO NOTHING;
END $$;

-- ============================================================================
-- CREATE JWT CLAIMS TRIGGER
-- ============================================================================

-- Function to update JWT claims with user role
CREATE OR REPLACE FUNCTION update_jwt_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the raw_app_meta_data with the user's role
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{user_role}',
    to_jsonb(NEW.role::text)
  )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update JWT claims when user profile changes
DROP TRIGGER IF EXISTS update_user_jwt_claims ON user_profiles;
CREATE TRIGGER update_user_jwt_claims
  AFTER INSERT OR UPDATE OF role ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_jwt_claims();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify users were created successfully
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  user_record RECORD;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users WHERE email LIKE '%test@formulapm.com';
  SELECT COUNT(*) INTO profile_count FROM user_profiles WHERE email LIKE '%test@formulapm.com';
  
  RAISE NOTICE 'Created % auth users and % user profiles', user_count, profile_count;
  
  -- Show user roles
  FOR user_record IN (SELECT email, role, seniority FROM user_profiles WHERE email LIKE '%test@formulapm.com' ORDER BY role)
  LOOP
    RAISE NOTICE 'User: % - Role: % - Seniority: %', user_record.email, user_record.role, user_record.seniority;
  END LOOP;
END $$;