-- RLS Policy Migration Script
-- This script updates all RLS policies from user_role_old to user_role system
-- Based on the role mapping defined in the design document

-- ============================================================================
-- ROLE MAPPING REFERENCE
-- ============================================================================
-- Old Role -> New Role (with seniority context)
-- company_owner -> management (executive)
-- general_manager -> management (executive) 
-- deputy_general_manager -> management (senior)
-- technical_director -> technical_lead (senior)
-- architect -> project_manager (senior)
-- technical_engineer -> project_manager (regular)
-- field_worker -> project_manager (regular)
-- purchase_director -> purchase_manager (senior)
-- purchase_specialist -> purchase_manager (regular)
-- project_manager -> project_manager (regular)
-- subcontractor -> project_manager (regular)
-- client -> client (standard)
-- admin -> admin (system)

BEGIN;

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES THAT REFERENCE user_role_old
-- ============================================================================

-- Mobile devices policies
DROP POLICY IF EXISTS "Admin manage all devices" ON public.mobile_devices;

-- Subcontractor users policies
DROP POLICY IF EXISTS "Admins can insert subcontractor profiles" ON public.subcontractor_users;
DROP POLICY IF EXISTS "Admins can update subcontractor profiles" ON public.subcontractor_users;
DROP POLICY IF EXISTS "Internal users can view subcontractor profiles" ON public.subcontractor_users;

-- Purchase orders policies
DROP POLICY IF EXISTS "Field worker delivery confirmation" ON public.delivery_confirmations;

-- Purchase requests policies  
DROP POLICY IF EXISTS "Field worker purchase request read" ON public.purchase_requests;

-- Vendor ratings policies
DROP POLICY IF EXISTS "Project manager vendor rating access" ON public.vendor_ratings;

-- Subcontractor scope access policies
DROP POLICY IF EXISTS "Project managers can manage scope access" ON public.subcontractor_scope_access;

-- Suppliers policies
DROP POLICY IF EXISTS "Project managers can manage suppliers" ON public.suppliers;

-- Subcontractor reports policies
DROP POLICY IF EXISTS "Project managers can view project reports" ON public.subcontractor_reports;

-- Documents policies that use JWT user_role
DROP POLICY IF EXISTS "Field worker document create" ON public.documents;
DROP POLICY IF EXISTS "Field worker own documents" ON public.documents;
DROP POLICY IF EXISTS "Subcontractor document access" ON public.documents;

-- Suppliers policies that use JWT user_role
DROP POLICY IF EXISTS "Management supplier access" ON public.suppliers;
DROP POLICY IF EXISTS "Project team supplier read" ON public.suppliers;

-- ============================================================================
-- STEP 2: CREATE NEW POLICIES USING user_role ENUM
-- ============================================================================

-- Mobile devices policies
CREATE POLICY "Admin manage all devices" ON public.mobile_devices 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = 'admin'::public.user_role
    )
);

-- Subcontractor users policies
CREATE POLICY "Admins can insert subcontractor profiles" ON public.subcontractor_users 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = ANY(ARRAY[
            'admin'::public.user_role, 
            'project_manager'::public.user_role, 
            'technical_lead'::public.user_role
        ])
    )
);

CREATE POLICY "Admins can update subcontractor profiles" ON public.subcontractor_users 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = ANY(ARRAY[
            'admin'::public.user_role, 
            'project_manager'::public.user_role, 
            'technical_lead'::public.user_role
        ])
    )
);

CREATE POLICY "Internal users can view subcontractor profiles" ON public.subcontractor_users 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = ANY(ARRAY[
            'admin'::public.user_role, 
            'project_manager'::public.user_role, 
            'technical_lead'::public.user_role
        ])
    )
);

-- Purchase orders - Field worker delivery confirmation
CREATE POLICY "Field worker delivery confirmation" ON public.delivery_confirmations 
USING (
    confirmed_by = auth.uid() 
    OR EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.purchase_orders po ON po.id = delivery_confirmations.purchase_order_id
        JOIN public.purchase_requests pr ON pr.id = po.purchase_request_id
        JOIN public.project_assignments pa ON pa.project_id = pr.project_id
        WHERE up.id = auth.uid() 
        AND up.role = 'project_manager'::public.user_role 
        AND pa.user_id = auth.uid() 
        AND pa.is_active = true
    )
);

-- Purchase requests - Field worker read access
CREATE POLICY "Field worker purchase request read" ON public.purchase_requests 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.project_assignments pa ON pa.user_id = up.id
        WHERE up.id = auth.uid() 
        AND up.role = 'project_manager'::public.user_role 
        AND pa.project_id = purchase_requests.project_id 
        AND pa.is_active = true
    )
);

-- Vendor ratings - Project manager access
CREATE POLICY "Project manager vendor rating access" ON public.vendor_ratings 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles up
        JOIN public.projects p ON p.project_manager_id = up.id
        WHERE up.id = auth.uid() 
        AND up.role = 'project_manager'::public.user_role 
        AND p.id = vendor_ratings.project_id
    )
);

-- Subcontractor scope access
CREATE POLICY "Project managers can manage scope access" ON public.subcontractor_scope_access 
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = ANY(ARRAY[
            'admin'::public.user_role, 
            'project_manager'::public.user_role, 
            'technical_lead'::public.user_role
        ])
    )
);

-- Suppliers management
CREATE POLICY "Project managers can manage suppliers" ON public.suppliers 
USING (
    auth.uid() IN (
        SELECT user_profiles.id FROM public.user_profiles 
        WHERE user_profiles.role = ANY(ARRAY[
            'management'::public.user_role, 
            'project_manager'::public.user_role
        ])
    )
);

-- Subcontractor reports
CREATE POLICY "Project managers can view project reports" ON public.subcontractor_reports 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_profiles.id = auth.uid() 
        AND user_profiles.role = ANY(ARRAY[
            'admin'::public.user_role, 
            'management'::public.user_role, 
            'project_manager'::public.user_role, 
            'technical_lead'::public.user_role
        ])
    )
);

-- ============================================================================
-- STEP 3: UPDATE POLICIES THAT USE JWT user_role CLAIMS
-- ============================================================================
-- Note: These policies use auth.jwt() ->> 'user_role' which should now return new role values

-- Documents - Field worker document creation
CREATE POLICY "Field worker document create" ON public.documents 
FOR INSERT WITH CHECK (
    (auth.jwt() ->> 'user_role')::text = 'project_manager'::text 
    AND EXISTS (
        SELECT 1 FROM public.project_assignments pa
        WHERE pa.user_id = auth.uid() 
        AND pa.project_id = documents.project_id 
        AND pa.is_active = true 
        AND documents.document_type = ANY(ARRAY[
            'report'::public.document_type, 
            'photo'::public.document_type
        ])
    )
);

-- Documents - Field worker own documents
CREATE POLICY "Field worker own documents" ON public.documents 
USING (
    uploaded_by = auth.uid() 
    AND (auth.jwt() ->> 'user_role')::text = 'project_manager'::text
);

-- Suppliers - Management access
CREATE POLICY "Management supplier access" ON public.suppliers 
USING (
    public.is_management_role() 
    OR (auth.jwt() ->> 'user_role')::text = ANY(ARRAY[
        'purchase_manager'::text
    ])
);

-- Suppliers - Project team read access
CREATE POLICY "Project team supplier read" ON public.suppliers 
FOR SELECT USING (
    (auth.jwt() ->> 'user_role')::text = ANY(ARRAY[
        'project_manager'::text, 
        'technical_lead'::text
    ])
);

-- Documents - Subcontractor access
CREATE POLICY "Subcontractor document access" ON public.documents 
FOR SELECT USING (
    ((auth.jwt() ->> 'user_role')::text = 'project_manager'::text 
     AND EXISTS (
         SELECT 1 FROM public.project_assignments pa
         WHERE pa.user_id = auth.uid() 
         AND pa.project_id = documents.project_id 
         AND pa.is_active = true
     )) 
    OR uploaded_by = auth.uid()
);

-- ============================================================================
-- STEP 4: UPDATE HELPER FUNCTIONS THAT REFERENCE OLD ROLES
-- ============================================================================

-- Update is_management_role function to use new roles
CREATE OR REPLACE FUNCTION public.is_management_role()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role')::text = 'management'::text;
END;
$$;

-- Update has_purchase_department_access function
CREATE OR REPLACE FUNCTION public.has_purchase_department_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role')::text = ANY(ARRAY[
        'management'::text,
        'purchase_manager'::text
    ]);
END;
$$;

-- Update is_project_manager function
CREATE OR REPLACE FUNCTION public.is_project_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role')::text = ANY(ARRAY[
        'project_manager'::text,
        'technical_lead'::text
    ]);
END;
$$;

-- Update can_confirm_deliveries function
CREATE OR REPLACE FUNCTION public.can_confirm_deliveries()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (auth.jwt() ->> 'user_role')::text = ANY(ARRAY[
        'project_manager'::text,
        'purchase_manager'::text,
        'management'::text
    ]);
END;
$$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify no policies reference user_role_old
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE qual LIKE '%user_role_old%' 
   OR with_check LIKE '%user_role_old%';

-- Verify new policies are in place
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE qual LIKE '%user_role%' 
   AND qual NOT LIKE '%user_role_old%'
ORDER BY tablename, policyname;