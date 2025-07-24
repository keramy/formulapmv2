-- Migration Logging System
-- Tracks all changes during role migration for audit and rollback purposes

-- Create migration schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS migration_tracking;

-- Migration log table for tracking individual user changes
CREATE TABLE IF NOT EXISTS migration_tracking.migration_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email TEXT,
    old_role TEXT, -- Store as text to preserve original enum value
    new_role TEXT,
    old_seniority_level TEXT,
    new_seniority_level TEXT,
    migration_timestamp TIMESTAMPTZ DEFAULT NOW(),
    migration_status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'rolled_back'
    rollback_data JSONB, -- Store complete original user data for rollback
    migration_batch_id UUID, -- Group related migrations
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration batch tracking table
CREATE TABLE IF NOT EXISTS migration_tracking.migration_batch (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_name TEXT NOT NULL,
    migration_type TEXT NOT NULL, -- 'role_migration', 'rollback', 'test'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'rolled_back'
    total_users INTEGER DEFAULT 0,
    successful_migrations INTEGER DEFAULT 0,
    failed_migrations INTEGER DEFAULT 0,
    rollback_available BOOLEAN DEFAULT true,
    notes TEXT,
    created_by TEXT DEFAULT current_user
);

-- RLS policy changes tracking
CREATE TABLE IF NOT EXISTS migration_tracking.rls_policy_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name TEXT NOT NULL,
    table_name TEXT NOT NULL,
    old_definition TEXT,
    new_definition TEXT,
    change_type TEXT NOT NULL, -- 'updated', 'created', 'dropped'
    migration_batch_id UUID REFERENCES migration_tracking.migration_batch(batch_id),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    rollback_sql TEXT,
    status TEXT DEFAULT 'applied' -- 'applied', 'failed', 'rolled_back'
);

-- Function to start a new migration batch
CREATE OR REPLACE FUNCTION migration_tracking.start_migration_batch(
    p_batch_name TEXT,
    p_migration_type TEXT DEFAULT 'role_migration',
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    batch_uuid UUID := gen_random_uuid();
    user_count INTEGER;
BEGIN
    -- Get current user count for tracking
    SELECT COUNT(*) INTO user_count FROM user_profiles;
    
    INSERT INTO migration_tracking.migration_batch (
        batch_id,
        batch_name,
        migration_type,
        total_users,
        notes
    ) VALUES (
        batch_uuid,
        p_batch_name,
        p_migration_type,
        user_count,
        p_notes
    );
    
    RAISE NOTICE 'Started migration batch: % (ID: %)', p_batch_name, batch_uuid;
    RETURN batch_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to log individual user migration
CREATE OR REPLACE FUNCTION migration_tracking.log_user_migration(
    p_user_id UUID,
    p_old_role TEXT,
    p_new_role TEXT,
    p_old_seniority TEXT,
    p_new_seniority TEXT,
    p_batch_id UUID,
    p_rollback_data JSONB
) RETURNS UUID AS $$
DECLARE
    log_uuid UUID := gen_random_uuid();
    user_email_val TEXT;
BEGIN
    -- Get user email for easier identification
    SELECT email INTO user_email_val FROM user_profiles WHERE id = p_user_id;
    
    INSERT INTO migration_tracking.migration_log (
        id,
        user_id,
        user_email,
        old_role,
        new_role,
        old_seniority_level,
        new_seniority_level,
        migration_batch_id,
        rollback_data,
        migration_status
    ) VALUES (
        log_uuid,
        p_user_id,
        user_email_val,
        p_old_role,
        p_new_role,
        p_old_seniority,
        p_new_seniority,
        p_batch_id,
        p_rollback_data,
        'completed'
    );
    
    RETURN log_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to complete migration batch
CREATE OR REPLACE FUNCTION migration_tracking.complete_migration_batch(
    p_batch_id UUID,
    p_status TEXT DEFAULT 'completed'
) RETURNS BOOLEAN AS $$
DECLARE
    success_count INTEGER;
    fail_count INTEGER;
BEGIN
    -- Count successful and failed migrations
    SELECT 
        COUNT(*) FILTER (WHERE migration_status = 'completed'),
        COUNT(*) FILTER (WHERE migration_status = 'failed')
    INTO success_count, fail_count
    FROM migration_tracking.migration_log 
    WHERE migration_batch_id = p_batch_id;
    
    -- Update batch record
    UPDATE migration_tracking.migration_batch 
    SET 
        completed_at = NOW(),
        status = p_status,
        successful_migrations = success_count,
        failed_migrations = fail_count,
        updated_at = NOW()
    WHERE batch_id = p_batch_id;
    
    RAISE NOTICE 'Migration batch % completed: % successful, % failed', 
        p_batch_id, success_count, fail_count;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get migration status summary
CREATE OR REPLACE FUNCTION migration_tracking.get_migration_status(p_batch_id UUID)
RETURNS TABLE(
    batch_name TEXT,
    status TEXT,
    total_users INTEGER,
    successful INTEGER,
    failed INTEGER,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mb.batch_name,
        mb.status,
        mb.total_users,
        mb.successful_migrations,
        mb.failed_migrations,
        mb.started_at,
        mb.completed_at,
        mb.completed_at - mb.started_at as duration
    FROM migration_tracking.migration_batch mb
    WHERE mb.batch_id = p_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log RLS policy changes
CREATE OR REPLACE FUNCTION migration_tracking.log_rls_policy_change(
    p_policy_name TEXT,
    p_table_name TEXT,
    p_old_definition TEXT,
    p_new_definition TEXT,
    p_change_type TEXT,
    p_batch_id UUID,
    p_rollback_sql TEXT
) RETURNS UUID AS $$
DECLARE
    change_uuid UUID := gen_random_uuid();
BEGIN
    INSERT INTO migration_tracking.rls_policy_changes (
        id,
        policy_name,
        table_name,
        old_definition,
        new_definition,
        change_type,
        migration_batch_id,
        rollback_sql
    ) VALUES (
        change_uuid,
        p_policy_name,
        p_table_name,
        p_old_definition,
        p_new_definition,
        p_change_type,
        p_batch_id,
        p_rollback_sql
    );
    
    RETURN change_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_migration_log_user_id 
ON migration_tracking.migration_log(user_id);

CREATE INDEX IF NOT EXISTS idx_migration_log_batch_id 
ON migration_tracking.migration_log(migration_batch_id);

CREATE INDEX IF NOT EXISTS idx_migration_log_timestamp 
ON migration_tracking.migration_log(migration_timestamp);

CREATE INDEX IF NOT EXISTS idx_migration_batch_status 
ON migration_tracking.migration_batch(status);

CREATE INDEX IF NOT EXISTS idx_rls_policy_changes_batch_id 
ON migration_tracking.rls_policy_changes(migration_batch_id);

-- Add update timestamp trigger
CREATE OR REPLACE FUNCTION migration_tracking.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER migration_log_update_timestamp
    BEFORE UPDATE ON migration_tracking.migration_log
    FOR EACH ROW EXECUTE FUNCTION migration_tracking.update_timestamp();

-- Grant permissions
GRANT USAGE ON SCHEMA migration_tracking TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA migration_tracking TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA migration_tracking TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA migration_tracking TO postgres;

-- Add comments
COMMENT ON SCHEMA migration_tracking IS 'Schema for tracking role migration progress and changes';
COMMENT ON TABLE migration_tracking.migration_log IS 'Detailed log of individual user role migrations';
COMMENT ON TABLE migration_tracking.migration_batch IS 'Batch tracking for migration operations';
COMMENT ON TABLE migration_tracking.rls_policy_changes IS 'Log of RLS policy modifications during migration';