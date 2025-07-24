-- Role System Preparation Migration
-- This migration runs BEFORE all others to ensure compatibility
-- It creates mapping functions and temporary compatibility measures

-- Create a temporary compatibility function for old role references
-- This allows existing migration files to work without modification
CREATE OR REPLACE FUNCTION map_legacy_role(legacy_role TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN CASE legacy_role
    WHEN 'company_owner' THEN 'management'
    WHEN 'general_manager' THEN 'management'
    WHEN 'deputy_general_manager' THEN 'management'
    WHEN 'technical_director' THEN 'technical_lead'
    WHEN 'architect' THEN 'technical_lead'
    WHEN 'technical_engineer' THEN 'technical_lead'
    WHEN 'purchase_director' THEN 'purchase_manager'
    WHEN 'purchase_specialist' THEN 'purchase_manager'
    WHEN 'field_worker' THEN 'technical_lead'
    WHEN 'subcontractor' THEN 'technical_lead'
    WHEN 'project_manager' THEN 'project_manager'
    WHEN 'client' THEN 'client'
    WHEN 'admin' THEN 'admin'
    ELSE 'project_manager' -- Default fallback
  END;
END;
$$ LANGUAGE plpgsql;

-- This migration prepares for the 6-role system
SELECT 'Role system preparation completed' as status;