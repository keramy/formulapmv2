-- Add seniority column and test users for 6-role system
-- This migration complements the updated initial schema with 6 roles

-- Add seniority column for PM hierarchy
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS seniority TEXT DEFAULT 'regular'
CHECK (seniority IN ('executive', 'senior', 'regular'));

-- Create test users for all 6 roles with proper authentication
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'management.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "management"}'::jsonb, '{}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'purchase.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "purchase_manager"}'::jsonb, '{}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'technical.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "technical_lead"}'::jsonb, '{}'::jsonb),
  ('44444444-4444-4444-4444-444444444444', 'pm.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "project_manager"}'::jsonb, '{}'::jsonb),
  ('55555555-5555-5555-5555-555555555555', 'client.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "client"}'::jsonb, '{}'::jsonb),
  ('66666666-6666-6666-6666-666666666666', 'admin.test@formulapm.com', crypt('testpass123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"user_role": "admin"}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles for test users
INSERT INTO user_profiles (id, first_name, last_name, email, role, seniority, is_active, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Management', 'User', 'management.test@formulapm.com', 'management', 'executive', true, NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Purchase', 'Manager', 'purchase.test@formulapm.com', 'purchase_manager', 'senior', true, NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Technical', 'Lead', 'technical.test@formulapm.com', 'technical_lead', 'senior', true, NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'Project', 'Manager', 'pm.test@formulapm.com', 'project_manager', 'regular', true, NOW(), NOW()),
  ('55555555-5555-5555-5555-555555555555', 'Client', 'User', 'client.test@formulapm.com', 'client', 'regular', true, NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'Admin', 'User', 'admin.test@formulapm.com', 'admin', 'regular', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create performance indexes for new system
CREATE INDEX IF NOT EXISTS idx_user_profiles_role_new ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_seniority ON user_profiles(seniority);

-- Verification and status
SELECT 'SUCCESS: 6-role system initialized!' as status;
SELECT role, count(*) as user_count, 
       string_agg(DISTINCT seniority, ', ' ORDER BY seniority) as seniority_levels
FROM user_profiles 
GROUP BY role 
ORDER BY role;