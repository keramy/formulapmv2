# Scope Items Enhancement Migration Instructions

## Summary
The migration `20250731000003_add_scope_items_enhanced_fields.sql` needs to be applied to add 5 new columns to the `scope_items` table.

## Status
- **Migration Status**: ❌ **REQUIRED** - All 5 columns are missing
- **Columns to Add**: `item_no`, `item_name`, `specification`, `location`, `update_notes`
- **Migration File**: `supabase/migrations/20250731000003_add_scope_items_enhanced_fields.sql`

## Method 1: Using Supabase Dashboard (RECOMMENDED)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Navigate to your project: `formulapmv2`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the Simple Migration**
   Copy the contents of `simple-scope-migration.sql`:

```sql
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

-- Verification
SELECT 'Migration completed successfully!' as status;
```

4. **Execute the Query**
   - Click "Run" button
   - Verify success message appears

## Method 2: Using Supabase CLI (if available)

```bash
# Login to Supabase (requires access token)
npx supabase login

# Push the migration
npx supabase db push
```

## Method 3: Direct PostgreSQL Connection (if network allows)

```bash
# Using psql (if installed)
psql "postgresql://postgres:535425Keramy.@db.xrrrtwrfadcilwkgwacs.supabase.co:5432/postgres" -f supabase/migrations/20250731000003_add_scope_items_enhanced_fields.sql
```

## Verification

After applying the migration, verify success by running this in your browser:
```
POST http://localhost:3003/api/admin/migrate-scope-items
```

Or run the verification script:
```bash
node verify-migration.js
```

## Expected Results

After successful migration:
- ✅ 5 new columns added to `scope_items` table
- ✅ 3 performance indexes created
- ✅ Enterprise-grade optimization patterns applied
- ✅ All existing data preserved

## New Column Purposes

- **`item_no`**: Sequential item numbering per project (1,2,3,4...)
- **`item_name`**: Display name separate from description  
- **`specification`**: Technical specifications and requirements
- **`location`**: Physical location or area within project
- **`update_notes`**: Latest update comments and notes

## Migration Benefits

- **Performance**: Optimized indexes for fast queries
- **Usability**: Better item organization and tracking
- **Flexibility**: Nullable fields for gradual adoption
- **Security**: Follows enterprise-grade patterns from CLAUDE.md

## Support Files Created

- `simple-scope-migration.sql` - Simplified version for dashboard
- `apply-migration-pg.js` - Node.js script with pg client
- `verify-migration.js` - Verification script
- `MIGRATION_INSTRUCTIONS.md` - This instruction file

## Troubleshooting

If migration fails:
1. Check that you have admin/owner permissions on the Supabase project
2. Verify the database connection is working
3. Check for any existing constraints that might conflict
4. Contact support if network connectivity issues persist

## Next Steps

After successful migration:
1. Run verification to confirm all columns exist
2. Update frontend components to use new fields
3. Test scope item creation and editing with new fields
4. Clean up temporary migration files if desired