-- Database Validation Helper Functions
-- Created: 2025-07-18
-- Purpose: Support comprehensive database validation

-- Function to get enum values for validation
CREATE OR REPLACE FUNCTION get_enum_values(enum_name text)
RETURNS text[] AS $
DECLARE
    enum_values text[];
BEGIN
    SELECT array_agg(enumlabel ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = enum_name;
    
    RETURN COALESCE(enum_values, ARRAY[]::text[]);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table column information
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE(
    column_name text,
    data_type text,
    is_nullable boolean,
    column_default text,
    is_primary_key boolean
) AS $
DECLARE
    schema_name text := 'public';
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text,
        CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END,
        c.column_default::text,
        CASE WHEN tc.constraint_type = 'PRIMARY KEY' THEN true ELSE false END
    FROM information_schema.columns c
    LEFT JOIN information_schema.key_column_usage kcu 
        ON c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
        AND c.table_schema = kcu.table_schema
    LEFT JOIN information_schema.table_constraints tc 
        ON kcu.constraint_name = tc.constraint_name
        AND kcu.table_schema = tc.table_schema
        AND tc.constraint_type = 'PRIMARY KEY'
    WHERE c.table_schema = schema_name 
        AND c.table_name = get_table_columns.table_name
    ORDER BY c.ordinal_position;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate RLS policies exist
CREATE OR REPLACE FUNCTION check_rls_policies(table_name text)
RETURNS TABLE(
    policy_name text,
    policy_command text,
    policy_roles text[]
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        p.policyname::text,
        p.polcmd::text,
        CASE 
            WHEN p.polroles IS NULL THEN ARRAY['public']::text[]
            ELSE ARRAY(
                SELECT rolname::text 
                FROM pg_roles 
                WHERE oid = ANY(p.polroles)
            )
        END
    FROM pg_policy p
    JOIN pg_class c ON p.polrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' 
        AND c.relname = check_rls_policies.table_name;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get constraint information
CREATE OR REPLACE FUNCTION get_table_constraints(table_name text)
RETURNS TABLE(
    constraint_name text,
    constraint_type text,
    column_names text[]
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        tc.constraint_name::text,
        tc.constraint_type::text,
        array_agg(kcu.column_name::text ORDER BY kcu.ordinal_position) as column_names
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' 
        AND tc.table_name = get_table_constraints.table_name
    GROUP BY tc.constraint_name, tc.constraint_type;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get index information
CREATE OR REPLACE FUNCTION get_table_indexes(table_name text)
RETURNS TABLE(
    index_name text,
    column_names text[],
    is_unique boolean
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        i.relname::text as index_name,
        array_agg(a.attname::text ORDER BY a.attnum) as column_names,
        ix.indisunique as is_unique
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relkind = 'r'
        AND t.relname = get_table_indexes.table_name
        AND i.relname NOT LIKE '%_pkey'  -- Exclude primary key indexes
    GROUP BY i.relname, ix.indisunique;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate user role consistency
CREATE OR REPLACE FUNCTION validate_user_role_consistency()
RETURNS TABLE(
    user_id uuid,
    profile_role text,
    auth_role text,
    is_consistent boolean,
    issue_description text
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.role::text as profile_role,
        COALESCE(
            au.raw_app_meta_data->>'user_role',
            au.app_metadata->>'user_role'
        ) as auth_role,
        CASE 
            WHEN up.role::text = COALESCE(
                au.raw_app_meta_data->>'user_role',
                au.app_metadata->>'user_role'
            ) THEN true
            ELSE false
        END as is_consistent,
        CASE 
            WHEN COALESCE(
                au.raw_app_meta_data->>'user_role',
                au.app_metadata->>'user_role'
            ) IS NULL THEN 'Missing JWT role claim'
            WHEN up.role::text != COALESCE(
                au.raw_app_meta_data->>'user_role',
                au.app_metadata->>'user_role'
            ) THEN 'Role mismatch between profile and JWT'
            ELSE 'Consistent'
        END as issue_description
    FROM user_profiles up
    LEFT JOIN auth.users au ON up.id = au.id;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check for orphaned records
CREATE OR REPLACE FUNCTION check_orphaned_records()
RETURNS TABLE(
    table_name text,
    orphaned_count bigint,
    description text
) AS $
BEGIN
    -- Projects without project managers
    RETURN QUERY
    SELECT 
        'projects'::text,
        COUNT(*)::bigint,
        'Projects with project_manager_id not in user_profiles'::text
    FROM projects p
    LEFT JOIN user_profiles up ON p.project_manager_id = up.id
    WHERE p.project_manager_id IS NOT NULL AND up.id IS NULL;
    
    -- Scope items without projects
    RETURN QUERY
    SELECT 
        'scope_items'::text,
        COUNT(*)::bigint,
        'Scope items with project_id not in projects'::text
    FROM scope_items si
    LEFT JOIN projects p ON si.project_id = p.id
    WHERE p.id IS NULL;
    
    -- Project assignments without users
    RETURN QUERY
    SELECT 
        'project_assignments'::text,
        COUNT(*)::bigint,
        'Project assignments with user_id not in user_profiles'::text
    FROM project_assignments pa
    LEFT JOIN user_profiles up ON pa.user_id = up.id
    WHERE up.id IS NULL;
    
    -- Add more orphaned record checks as needed
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_enum_values(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_constraints(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_user_role_consistency() TO authenticated;
GRANT EXECUTE ON FUNCTION check_orphaned_records() TO authenticated;

-- Grant service role full access
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Add migration tracking
INSERT INTO public.migration_log (migration_name, status, completed_at) 
VALUES ('20250718000005_validation_helpers', 'completed', NOW())
ON CONFLICT (migration_name) DO UPDATE SET 
  status = 'completed', 
  completed_at = NOW();

-- Success message
SELECT 'Database validation helper functions created successfully!' as status;