-- Migration tracking table
-- This table keeps track of applied migrations for database versioning

CREATE TABLE IF NOT EXISTS public.migrations (
  version TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON public.migrations(executed_at);

-- Comment
COMMENT ON TABLE public.migrations IS 'Tracks database migration execution for version control';

-- Insert this migration record
INSERT INTO public.migrations (version, name, executed_at) 
VALUES ('20250702000000', 'migrations_table', NOW())
ON CONFLICT (version) DO NOTHING;