-- ============================================================================
-- STORAGE BUCKETS SETUP
-- ============================================================================
-- This migration creates the required storage buckets for the V3 system:
-- - shop-drawings: For shop drawing files and attachments
-- - profiles: For user profile photos and avatars
-- - reports: Already exists but included for completeness
-- 
-- All buckets use simple patterns with proper RLS policies.
-- ============================================================================

-- Create storage bucket for shop drawings if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-drawings', 'shop-drawings', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user profiles if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for reports if it doesn't exist (for completeness)
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Shop Drawings Bucket Policies
-- ============================================================================

-- Policy: Users can view shop drawings if they have access to the project
CREATE POLICY "shop_drawings_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'shop-drawings' AND
  EXISTS (
    SELECT 1 FROM shop_drawing_submissions sds
    JOIN shop_drawings sd ON sd.id = sds.shop_drawing_id
    JOIN projects p ON p.id = sd.project_id
    WHERE sds.file_url LIKE '%' || storage.objects.name || '%'
    AND (
      p.project_manager_id = auth.uid() OR
      sd.created_by = auth.uid() OR
      sds.submitted_by = auth.uid() OR
      auth.uid() IN (
        SELECT up.id FROM user_profiles up 
        WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'architect', 'technical_engineer')
      )
    )
  )
);

-- Policy: Users can upload shop drawings if they have proper permissions
CREATE POLICY "shop_drawings_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'shop-drawings' AND
  auth.uid() IN (
    SELECT up.id FROM user_profiles up 
    WHERE up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker', 'technical_director')
  )
);

-- Policy: Users can update shop drawings if they created them or have admin access
CREATE POLICY "shop_drawings_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'shop-drawings' AND
  (
    EXISTS (
      SELECT 1 FROM shop_drawing_submissions sds
      JOIN shop_drawings sd ON sd.id = sds.shop_drawing_id
      WHERE sds.file_url LIKE '%' || storage.objects.name || '%'
      AND (sd.created_by = auth.uid() OR sds.submitted_by = auth.uid())
    ) OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);

-- Policy: Users can delete shop drawings if they created them or have admin access
CREATE POLICY "shop_drawings_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'shop-drawings' AND
  (
    EXISTS (
      SELECT 1 FROM shop_drawing_submissions sds
      JOIN shop_drawings sd ON sd.id = sds.shop_drawing_id
      WHERE sds.file_url LIKE '%' || storage.objects.name || '%'
      AND (sd.created_by = auth.uid() OR sds.submitted_by = auth.uid())
    ) OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);

-- Profiles Bucket Policies
-- ============================================================================

-- Policy: Users can view their own profile photos and admins can view all
CREATE POLICY "profiles_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles' AND
  (
    -- Users can view their own profile photos (files prefixed with their user ID)
    storage.objects.name LIKE auth.uid()::text || '%' OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);

-- Policy: Users can upload their own profile photos
CREATE POLICY "profiles_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND
  auth.uid() IS NOT NULL
);

-- Policy: Users can update their own profile photos
CREATE POLICY "profiles_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profiles' AND
  (
    -- Users can update their own profile photos (files prefixed with their user ID)
    storage.objects.name LIKE auth.uid()::text || '%' OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);

-- Policy: Users can delete their own profile photos
CREATE POLICY "profiles_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profiles' AND
  (
    -- Users can delete their own profile photos (files prefixed with their user ID)
    storage.objects.name LIKE auth.uid()::text || '%' OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);

-- Reports Bucket Policies (for completeness - may already exist)
-- ============================================================================

-- Policy: Users can view report files if they have access to the project
CREATE POLICY "reports_select_policy" ON storage.objects
FOR SELECT USING (
  bucket_id = 'reports' AND
  (
    EXISTS (
      SELECT 1 FROM report_line_photos rlp
      JOIN report_lines rl ON rl.id = rlp.report_line_id
      JOIN reports r ON r.id = rl.report_id
      JOIN projects p ON p.id = r.project_id 
      WHERE rlp.photo_url LIKE '%' || storage.objects.name || '%'
      AND (
        p.project_manager_id = auth.uid() OR
        r.generated_by = auth.uid() OR
        auth.uid() IN (
          SELECT up.id FROM user_profiles up 
          WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
        )
      )
    ) OR
    EXISTS (
      SELECT 1 FROM reports r
      JOIN projects p ON p.id = r.project_id 
      WHERE r.pdf_url LIKE '%' || storage.objects.name || '%'
      AND (
        p.project_manager_id = auth.uid() OR
        r.generated_by = auth.uid() OR
        auth.uid() IN (
          SELECT up.id FROM user_profiles up 
          WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
        )
      )
    )
  )
);

-- Policy: Users can upload report files if they have proper permissions
CREATE POLICY "reports_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'reports' AND
  auth.uid() IN (
    SELECT up.id FROM user_profiles up 
    WHERE up.role IN ('project_manager', 'architect', 'technical_engineer', 'field_worker')
  )
);

-- Policy: Users can update report files if they created them or have admin access
CREATE POLICY "reports_update_policy" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'reports' AND
  (
    EXISTS (
      SELECT 1 FROM report_line_photos rlp
      JOIN report_lines rl ON rl.id = rlp.report_line_id
      JOIN reports r ON r.id = rl.report_id
      WHERE rlp.photo_url LIKE '%' || storage.objects.name || '%'
      AND r.generated_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.pdf_url LIKE '%' || storage.objects.name || '%'
      AND r.generated_by = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);

-- Policy: Users can delete report files if they created them or have admin access
CREATE POLICY "reports_delete_policy" ON storage.objects
FOR DELETE USING (
  bucket_id = 'reports' AND
  (
    EXISTS (
      SELECT 1 FROM report_line_photos rlp
      JOIN report_lines rl ON rl.id = rlp.report_line_id
      JOIN reports r ON r.id = rl.report_id
      WHERE rlp.photo_url LIKE '%' || storage.objects.name || '%'
      AND r.generated_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.pdf_url LIKE '%' || storage.objects.name || '%'
      AND r.generated_by = auth.uid()
    ) OR
    auth.uid() IN (
      SELECT up.id FROM user_profiles up 
      WHERE up.role IN ('company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin')
    )
  )
);