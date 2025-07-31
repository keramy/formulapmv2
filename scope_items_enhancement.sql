-- SCOPE ITEMS ENHANCEMENT - Simple SQL for Supabase Dashboard
-- Copy and paste this into the Supabase SQL Editor

-- Add new columns to scope_items table
ALTER TABLE scope_items 
ADD COLUMN item_no INTEGER,
ADD COLUMN item_name TEXT,
ADD COLUMN specification TEXT,
ADD COLUMN location TEXT,
ADD COLUMN update_notes TEXT;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_scope_items_project_item_no 
ON scope_items(project_id, item_no) 
WHERE item_no IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scope_items_location 
ON scope_items(location) 
WHERE location IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scope_items_project_location 
ON scope_items(project_id, location) 
WHERE location IS NOT NULL;