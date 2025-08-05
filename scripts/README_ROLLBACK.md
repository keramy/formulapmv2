# Rollback Scripts - Quick Reference

## 🚨 Emergency Quick Commands

```bash
# EMERGENCY: Complete system failure
./scripts/emergency-full-rollback.sh

# CRITICAL: Authentication broken
./scripts/rollback-auth-quick.sh

# STANDARD: Planned rollback
./scripts/rollback-phase1-standard.sh
```

## 📋 Pre-Implementation Workflow

**Before making ANY changes:**

```bash
# 1. Create backup
./scripts/create-rollback-backup.sh "phase1_auth_fixes"

# 2. Note the backup directory shown
# Example: backups/20250805_143022_phase1_auth_fixes

# 3. Proceed with your changes

# 4. If issues occur, use appropriate rollback script
```

## 🔍 Available Scripts

| Script | Time | Purpose |
|--------|------|---------|
| `create-rollback-backup.sh` | 2 min | Create comprehensive backup |
| `rollback-auth-quick.sh` | <5 min | Emergency auth rollback |
| `rollback-phase1-standard.sh` | <30 min | Complete Phase 1 rollback |
| `emergency-full-rollback.sh` | <60 min | Nuclear option - full reset |
| `validate-rollback-success.sh` | 5 min | Validate rollback worked |

## 🎯 Decision Matrix

| Issue | Severity | Script |
|-------|----------|--------|
| Auth completely broken | CRITICAL | `rollback-auth-quick.sh` |
| API endpoints failing | HIGH | `rollback-phase1-standard.sh` |
| Database corruption | CRITICAL | `emergency-full-rollback.sh` |
| Build failures | MEDIUM | `rollback-phase1-standard.sh` |
| Performance issues | LOW-HIGH | Depends on severity |

## ✅ Validation Checklist

After any rollback:

```bash
# 1. Validate rollback success
./scripts/validate-rollback-success.sh

# 2. Test key functions
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@formulapm.com","password":"admin123"}'

# 3. Test dashboard
curl http://localhost:3003/api/dashboard/stats

# 4. Run tests
npm test
```

## 🔧 Manual Recovery

If scripts fail, manual steps:

```bash
# 1. Find latest backup
ls -la backups/

# 2. Restore manually
BACKUP_DIR="backups/20250805_143022_phase1_auth_fixes"
cp -r $BACKUP_DIR/api_routes_backup/* src/app/api/
cp -r $BACKUP_DIR/lib_backup/* src/lib/
cp $BACKUP_DIR/middleware.ts middleware.ts
cp $BACKUP_DIR/package.json package.json
npm install

# 3. Validate
npm run type-check
npm run build
npm run dev
```

## 📞 Support

- **Rollback Plan**: See `ROLLBACK_PLAN.md` for comprehensive procedures
- **Backup Location**: `backups/` directory with timestamped folders
- **Logs**: Each script creates detailed logs in current directory
- **Validation**: Always run `validate-rollback-success.sh` after rollback