# User Data Protection Guide

## 🚨 Problem: Supabase Operations Delete Custom Users

When running `supabase db reset` or `supabase db push --include-seed`, custom users get deleted because:

1. **Seed File TRUNCATE**: `supabase/seed-realistic-construction-data.sql` contains `TRUNCATE user_profiles CASCADE`
2. **Database Reset**: Completely rebuilds database from scratch, losing all data
3. **Seed Inclusion**: `--include-seed` flag runs seed files that clear user data

## ✅ Solutions Implemented

### 1. Fixed Seed File (IMMEDIATE FIX)

**File**: `supabase/seed-realistic-construction-data.sql`
**Change**: Modified TRUNCATE to preserve custom users:

```sql
-- OLD (DELETES ALL USERS)
TRUNCATE TABLE user_profiles CASCADE;

-- NEW (PRESERVES CUSTOM USERS)
TRUNCATE TABLE document_approvals, documents, scope_dependencies, scope_items, 
              project_assignments, projects, clients, suppliers CASCADE;
DELETE FROM user_profiles WHERE email LIKE '%@premiumbuild.com' OR email LIKE '%@%group.com' OR email LIKE '%@%pro.com';
```

### 2. User Backup & Restore Utilities

**Files Created**:
- `scripts/backup-users.mjs` - Backs up all custom users
- `scripts/restore-users.mjs` - Restores users from backup
- `scripts/safe-db-reset.mjs` - Safe reset with auto backup/restore
- `scripts/safe-db-push.mjs` - Safe push with conditional backup/restore

### 3. New NPM Scripts

Added to `package.json`:
```json
{
  "backup-users": "node scripts/backup-users.mjs",
  "restore-users": "node scripts/restore-users.mjs", 
  "safe-db-reset": "node scripts/safe-db-reset.mjs",
  "safe-db-push": "node scripts/safe-db-push.mjs",
  "safe-db-push-seed": "node scripts/safe-db-push.mjs --include-seed"
}
```

## 🛡️ Safe Workflow (USE THESE COMMANDS)

### For Database Reset (Complete rebuild)
```bash
# SAFE: Auto backup & restore
npm run safe-db-reset

# UNSAFE: Will delete users
npx supabase db reset
```

### For Database Push (Deploy migrations)
```bash
# SAFE: No seed data (users preserved)
npm run safe-db-push

# SAFE: With seed data (auto backup/restore)
npm run safe-db-push-seed

# UNSAFE: Will delete users if seed included
npx supabase db push --include-seed
```

### Manual Backup & Restore
```bash
# Manual backup
npm run backup-users

# Manual restore (after any operation)
npm run restore-users user-backup-2025-07-28T10-30-45-123Z.json
```

## 🔍 What Gets Preserved vs Deleted

### ✅ PRESERVED (Custom Users)
- Users with custom email domains (not @premiumbuild.com, @formulapm.com, test@)
- All user_profiles data (role, permissions, etc.)
- Authentication credentials (users will need to reset passwords after restore)

### ❌ DELETED (Sample Data)
- Sample users from seed file (@premiumbuild.com, @group.com, @pro.com)
- Test users created by scripts
- All project data, documents, scope items (gets recreated from seed)

## 🚨 Emergency Recovery

If you accidentally deleted users:

1. **Find latest backup**:
   ```bash
   ls -la user-backup-*.json
   ```

2. **Restore from backup**:
   ```bash
   npm run restore-users user-backup-[timestamp].json
   ```

3. **Users need to reset passwords** (restored with temp passwords)

## 📋 Best Practices

### ✅ DO
- Always use `npm run safe-db-reset` instead of direct Supabase commands
- Run `npm run backup-users` before major database changes  
- Keep multiple backup files for safety
- Test with development database first

### ❌ DON'T
- Use `npx supabase db reset` without backup
- Use `npx supabase db push --include-seed` without backup
- Delete backup files (keep for disaster recovery)
- Run database operations on production without testing

## 🔧 Troubleshooting

### Users Still Getting Deleted?
1. Check if you're using safe scripts: `npm run safe-db-reset`
2. Verify seed file fix: Should NOT contain `TRUNCATE user_profiles`
3. Check for other seed files: `find . -name "seed*.sql"`

### Restore Failed?
1. Check backup file exists and is valid JSON
2. Verify Supabase is running: `npx supabase status`
3. Check environment variables: `NEXT_PUBLIC_SUPABASE_URL`

### Permission Errors?
1. Ensure using service role key (not anon key)
2. Check Supabase local vs remote configuration
3. Verify user has admin permissions

## 📊 Implementation Status

- ✅ **Seed File Fixed**: TRUNCATE no longer deletes all users
- ✅ **Backup System**: Automated backup/restore utilities
- ✅ **Safe Scripts**: npm commands that protect users  
- ✅ **Documentation**: Complete workflow guide
- ✅ **Emergency Recovery**: Manual restore procedures

## 🎯 Result

**BEFORE**: `supabase db reset` = ALL CUSTOM USERS DELETED  
**AFTER**: `npm run safe-db-reset` = CUSTOM USERS PRESERVED

Your custom users are now safe from database operations! 🛡️