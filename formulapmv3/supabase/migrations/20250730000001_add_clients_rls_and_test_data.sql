-- Add RLS policies for clients table and create test client
-- Migration: 20250730000001_add_clients_rls_and_test_data.sql

-- Add comprehensive RLS policies for clients table
CREATE POLICY "clients_full_access_policy" ON "public"."clients"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('management', 'admin', 'purchase_manager')
  )
);

CREATE POLICY "clients_read_policy" ON "public"."clients"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role IN ('project_manager', 'technical_lead')
  )
);

CREATE POLICY "clients_own_record_policy" ON "public"."clients"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT auth.uid()) 
    AND role = 'client'
    AND email = clients.email
  )
);

-- Insert test client data
INSERT INTO clients (
  id,
  name,
  contact_person,
  email,
  phone,
  address,
  city,
  country,
  created_by,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'ABC Construction Ltd',
  'John Smith',
  'john@abc-construction.com',
  '+1-555-0123',
  '123 Main Street',
  'New York',
  'USA',
  'e076a127-0983-4717-b904-0e0ff9214c2c'::uuid,
  true,
  NOW(),
  NOW()
);

-- Create additional test clients for variety
INSERT INTO clients (
  id,
  name,
  contact_person,
  email,
  phone,
  address,
  city,
  country,
  created_by,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'Delta Engineering Corp',
  'Sarah Johnson',
  'sarah@delta-eng.com',
  '+1-555-0456',
  '456 Oak Avenue',
  'Los Angeles',
  'USA',
  'e076a127-0983-4717-b904-0e0ff9214c2c'::uuid,
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Metro Development Group',
  'Mike Chen',
  'mike@metro-dev.com',
  '+1-555-0789',
  '789 Pine Street',
  'Chicago',
  'USA',
  'e076a127-0983-4717-b904-0e0ff9214c2c'::uuid,
  true,
  NOW(),
  NOW()
);

-- Verification and feedback
DO $$
BEGIN
  RAISE NOTICE '✅ Clients RLS policies created successfully';
  RAISE NOTICE '📊 Test clients created:';
  RAISE NOTICE '   - ABC Construction Ltd (john@abc-construction.com)';
  RAISE NOTICE '   - Delta Engineering Corp (sarah@delta-eng.com)';
  RAISE NOTICE '   - Metro Development Group (mike@metro-dev.com)';
  RAISE NOTICE '🔒 RLS policies implemented for role-based access control';
END $$;