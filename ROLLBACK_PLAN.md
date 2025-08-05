# Formula PM V2 - Comprehensive Rollback Plan

## 🚨 Critical Safety Notice

**This rollback plan is designed to safely revert any changes that break functionality during the 46-issue fix implementation across 3 phases. Always test rollback procedures in non-production environments first.**

## 📋 Executive Summary

### Risk Assessment
- **HIGH RISK**: Authentication middleware changes, database migrations
- **MEDIUM RISK**: API route implementations, business logic changes  
- **LOW RISK**: UI components, styling, documentation

### Rollback Strategy
- **Immediate**: Critical production issues (< 5 minutes)
- **Standard**: Planned rollbacks with validation (< 30 minutes)
- **Emergency**: Last resort procedures (< 60 minutes)

---

## 🔄 Phase 1: Pre-Implementation Backups

### 1.1 Critical Files Backup

**Before ANY changes, execute these backup commands:**

```bash
# Create timestamped backup directory
export BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# Backup critical application files
cp -r src/app/api $BACKUP_DIR/api_routes_backup/
cp -r src/lib $BACKUP_DIR/lib_backup/
cp -r src/hooks $BACKUP_DIR/hooks_backup/
cp -r src/components $BACKUP_DIR/components_backup/
cp middleware.ts $BACKUP_DIR/
cp next.config.js $BACKUP_DIR/
cp package.json $BACKUP_DIR/
cp package-lock.json $BACKUP_DIR/

# Backup environment and configuration
cp .env.local $BACKUP_DIR/ 2>/dev/null || echo "No .env.local found"
cp .env.example $BACKUP_DIR/
cp -r supabase/ $BACKUP_DIR/supabase_backup/

echo "✅ File backup completed: $BACKUP_DIR"
```

### 1.2 Database State Backup

**Execute database backup before each phase:**

```bash
# Backup user data using existing script
npm run backup-users

# Create database schema backup (if using local Supabase)
npx supabase db dump --data-only > $BACKUP_DIR/database_data_backup.sql
npx supabase db dump --schema-only > $BACKUP_DIR/database_schema_backup.sql

# For cloud database, use the existing backup-users.mjs script
node scripts/backup-users.mjs
```

### 1.3 Validation State Capture

**Document current system state:**

```bash
# Test current functionality
npm run test:api 2>&1 | tee $BACKUP_DIR/pre_implementation_test_results.log
npm run build 2>&1 | tee $BACKUP_DIR/pre_implementation_build.log

# Capture current performance metrics  
curl -s http://localhost:3003/api/auth/diagnostics > $BACKUP_DIR/auth_diagnostics_before.json
curl -s http://localhost:3003/api/dashboard/stats > $BACKUP_DIR/dashboard_stats_before.json

# Document current git state
git log --oneline -10 > $BACKUP_DIR/git_state_before.log
git status > $BACKUP_DIR/git_status_before.log
git diff --name-only > $BACKUP_DIR/modified_files_before.log
```

---

## 🎯 Phase-by-Phase Rollback Procedures

## Phase 1: Authentication & Test Environment Fixes

### 1.1 Rollback Triggers
- **IMMEDIATE**: Authentication completely broken (401 errors for admin user)
- **CONSIDER**: Test failures exceed 15% of current pass rate
- **MONITOR**: Performance degradation > 20%

### 1.2 Quick Authentication Rollback (< 5 minutes)

```bash
#!/bin/bash
# File: rollback_auth_quick.sh

echo "🚨 EXECUTING EMERGENCY AUTH ROLLBACK"

# 1. Restore authentication middleware
cp $BACKUP_DIR/middleware.ts middleware.ts

# 2. Restore core auth files
cp -r $BACKUP_DIR/lib_backup/enhanced-auth-middleware.ts src/lib/
cp -r $BACKUP_DIR/hooks_backup/useAuth.ts src/hooks/

# 3. Restore auth API routes
cp -r $BACKUP_DIR/api_routes_backup/auth/ src/app/api/auth/

# 4. Restart development server
pkill -f "next dev"
npm run dev &

echo "✅ Emergency auth rollback completed"
echo "🔍 Verify: curl -H 'Authorization: Bearer TOKEN' localhost:3003/api/auth/profile"
```

### 1.3 Standard Phase 1 Rollback (< 30 minutes)

```bash
#!/bin/bash
# File: rollback_phase1_standard.sh

echo "🔄 EXECUTING PHASE 1 STANDARD ROLLBACK"

# 1. Stop all processes
pkill -f "next dev"
pkill -f "jest"

# 2. Restore all modified files
cp -r $BACKUP_DIR/api_routes_backup/* src/app/api/
cp -r $BACKUP_DIR/lib_backup/* src/lib/  
cp -r $BACKUP_DIR/hooks_backup/* src/hooks/
cp $BACKUP_DIR/middleware.ts middleware.ts

# 3. Restore package dependencies
cp $BACKUP_DIR/package.json package.json
cp $BACKUP_DIR/package-lock.json package-lock.json
npm install

# 4. Restore database state (if needed)
if [ -f "$BACKUP_DIR/user-backup-*.json" ]; then
    echo "📥 Restoring user data..."
    node scripts/restore-users.mjs $BACKUP_DIR/user-backup-*.json
fi

# 5. Validate rollback
npm run test:api
npm run build

echo "✅ Phase 1 rollback completed"
```

### 1.4 Phase 1 Rollback Validation

```bash
# Validate authentication works
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@formulapm.com","password":"admin123"}'

# Validate dashboard access
npm run test:integration -- --testNamePattern="dashboard"

# Check for regressions
npm run lint
npm run type-check
```

---

## Phase 2: API Route Completion & Business Logic

### 2.1 Rollback Triggers
- **IMMEDIATE**: Core business operations fail (CRUD operations)
- **CONSIDER**: Database performance degradation > 30%
- **MONITOR**: API response times > 2x baseline

### 2.2 Business Logic Rollback (< 15 minutes)

```bash
#!/bin/bash
# File: rollback_phase2_business_logic.sh

echo "🔄 EXECUTING PHASE 2 BUSINESS LOGIC ROLLBACK"

# 1. Identify which API routes were modified
MODIFIED_ROUTES=$(git diff --name-only HEAD~5..HEAD | grep "src/app/api" | head -20)

# 2. Restore each modified API route
for route in $MODIFIED_ROUTES; do
    if [ -f "$BACKUP_DIR/api_routes_backup/${route#src/app/api/}" ]; then
        echo "📥 Restoring $route"
        cp "$BACKUP_DIR/api_routes_backup/${route#src/app/api/}" "$route"
    fi
done

# 3. Restore business logic libraries  
cp -r $BACKUP_DIR/lib_backup/* src/lib/

# 4. Test critical business operations
npm run test:api -- --testNamePattern="CRUD|business"

echo "✅ Business logic rollback completed"
```

### 2.3 Database Rollback (if needed)

```bash
#!/bin/bash
# File: rollback_database_changes.sh

echo "🗄️ EXECUTING DATABASE ROLLBACK"

# 1. Check if database changes were made
if [ -f "$BACKUP_DIR/database_migration_log.json" ]; then
    echo "📊 Database changes detected, initiating rollback..."
    
    # 2. Use automatic rollback system
    node scripts/automatic-rollback.js --force
    
    # 3. Restore user data if needed
    if [ -f "$BACKUP_DIR/user-backup-*.json" ]; then
        node scripts/restore-users.mjs $BACKUP_DIR/user-backup-*.json
    fi
    
    # 4. Validate database state
    npm run validate-migrations
    npm run validate-rls
fi

echo "✅ Database rollback completed"
```

---

## Phase 3: Testing Infrastructure & Production Deployment

### 3.1 Rollback Triggers
- **IMMEDIATE**: Build process fails completely
- **CONSIDER**: Test coverage drops below 80%
- **MONITOR**: Deployment pipeline issues

### 3.2 Testing Infrastructure Rollback

```bash
#!/bin/bash  
# File: rollback_phase3_testing.sh

echo "🧪 EXECUTING PHASE 3 TESTING ROLLBACK"

# 1. Restore test configuration
if [ -f "$BACKUP_DIR/jest.config.js" ]; then
    cp $BACKUP_DIR/jest.config.js jest.config.js
fi

if [ -f "$BACKUP_DIR/playwright.config.ts" ]; then
    cp $BACKUP_DIR/playwright.config.ts playwright.config.ts
fi

# 2. Restore test files
cp -r $BACKUP_DIR/tests_backup/ tests/ 2>/dev/null || echo "No test backup found"

# 3. Restore package.json test scripts
cp $BACKUP_DIR/package.json package.json
npm install

# 4. Validate testing works
npm run test -- --passWithNoTests
npm run test:e2e -- --reporter=list

echo "✅ Testing infrastructure rollback completed"
```

---

## 🚨 Emergency Procedures

### Emergency Full System Rollback (< 60 minutes)

```bash
#!/bin/bash
# File: emergency_full_rollback.sh

echo "🚨🚨 EMERGENCY FULL SYSTEM ROLLBACK 🚨🚨"

# 1. Stop all processes
pkill -f "next"
pkill -f "node"
pkill -f "npm"

# 2. Git-based rollback to last known good state
LAST_GOOD_COMMIT=$(git log --oneline --grep="✅" -1 --format="%H")
if [ -n "$LAST_GOOD_COMMIT" ]; then
    echo "📍 Rolling back to last good commit: $LAST_GOOD_COMMIT"
    git reset --hard $LAST_GOOD_COMMIT
else
    echo "⚠️ No marked good commit found, rolling back 10 commits"
    git reset --hard HEAD~10
fi

# 3. Restore node_modules from backup
if [ -d "$BACKUP_DIR/node_modules_backup" ]; then
    rm -rf node_modules
    cp -r $BACKUP_DIR/node_modules_backup node_modules
else
    npm install
fi

# 4. Emergency database restore
node scripts/automatic-rollback.js --force

# 5. Emergency user data restore
LATEST_USER_BACKUP=$(ls -t user-backup-*.json 2>/dev/null | head -1)
if [ -n "$LATEST_USER_BACKUP" ]; then
    node scripts/restore-users.mjs $LATEST_USER_BACKUP
fi

# 6. Start in safe mode
NODE_ENV=development npm run dev

echo "🆘 Emergency rollback completed - system in safe mode"
```

### Production Hotfix Rollback

```bash
#!/bin/bash
# File: production_hotfix_rollback.sh

echo "🔥 PRODUCTION HOTFIX ROLLBACK"

# 1. Switch to main branch
git checkout main

# 2. Restore production environment
cp .env.production .env.local

# 3. Build with production settings
npm run build

# 4. Test production build
npm run start &
sleep 10

# 5. Health check
curl -f http://localhost:3000/api/auth/diagnostics || {
    echo "❌ Health check failed"
    exit 1
}

echo "✅ Production hotfix rollback completed"
```

---

## 🔍 Rollback Decision Matrix

### Trigger Conditions

| Condition | Phase 1 | Phase 2 | Phase 3 | Action |
|-----------|---------|---------|---------|---------|
| Authentication fails | IMMEDIATE | IMMEDIATE | IMMEDIATE | `rollback_auth_quick.sh` |
| Test failures > 20% | CONSIDER | IMMEDIATE | IMMEDIATE | `rollback_phase_standard.sh` |
| Build fails | MONITOR | CONSIDER | IMMEDIATE | `rollback_phase_testing.sh` |
| Performance drops > 50% | IMMEDIATE | IMMEDIATE | CONSIDER | `emergency_full_rollback.sh` |
| Database corruption | IMMEDIATE | IMMEDIATE | IMMEDIATE | `rollback_database_changes.sh` |
| User complaints > 5 | CONSIDER | IMMEDIATE | CONSIDER | Standard rollback + investigation |

### Success Validation Checklist

**After any rollback, verify:**

- [ ] Authentication works (`admin@formulapm.com` can login)
- [ ] Dashboard loads without errors
- [ ] API routes respond correctly
- [ ] Database queries execute within normal timeframes
- [ ] Tests pass at baseline level
- [ ] Build process completes successfully
- [ ] No console errors in browser
- [ ] Performance metrics within acceptable range

---

## 🛠️ Rollback Tools & Scripts

### Pre-built Rollback Scripts

Create these executable scripts in your project root:

```bash
# Make all rollback scripts executable
chmod +x rollback_auth_quick.sh
chmod +x rollback_phase1_standard.sh  
chmod +x rollback_phase2_business_logic.sh
chmod +x rollback_phase3_testing.sh
chmod +x emergency_full_rollback.sh
chmod +x production_hotfix_rollback.sh
```

### Rollback Testing

**Test rollback procedures monthly:**

```bash
#!/bin/bash
# File: test_rollback_procedures.sh

echo "🧪 TESTING ROLLBACK PROCEDURES"

# 1. Create test backup
export BACKUP_DIR="test_rollback_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r src/app/api $BACKUP_DIR/api_routes_backup/

# 2. Make intentional breaking change
echo "// INTENTIONAL BREAK" >> src/app/api/auth/login/route.ts

# 3. Test rollback procedure
./rollback_auth_quick.sh

# 4. Verify rollback worked
npm run test:api -- --testNamePattern="auth"

# 5. Clean up
rm -rf $BACKUP_DIR
git checkout -- src/app/api/auth/login/route.ts

echo "✅ Rollback procedure test completed"
```

---

## 📊 Risk Mitigation Strategies

### High-Risk Areas

1. **Authentication Middleware**
   - **Risk**: Complete system lockout
   - **Mitigation**: Always keep backup of working middleware.ts
   - **Test**: Automated auth tests before deployment

2. **Database Migrations**
   - **Risk**: Data corruption or loss
   - **Mitigation**: Always backup before migrations + automatic rollback system
   - **Test**: Migration validation scripts

3. **API Route Changes**
   - **Risk**: Breaking business operations
   - **Mitigation**: Incremental deployment + comprehensive API testing
   - **Test**: Business logic integration tests

### Dependencies That Prevent Clean Rollback

1. **Database Schema Changes**
   - **Problem**: New columns added, data migrated
   - **Solution**: Use backward-compatible migrations + rollback migrations

2. **Package Dependencies**
   - **Problem**: New npm packages added
   - **Solution**: Backup package.json + package-lock.json before changes

3. **Environment Variables**
   - **Problem**: New environment variables required
   - **Solution**: Document all new env vars + fallback defaults

---

## 🔔 Monitoring & Alerting

### Automated Rollback Triggers

Set up monitoring that automatically triggers rollback:

```typescript
// File: scripts/automated-rollback-monitor.ts
interface RollbackTrigger {
  condition: string
  threshold: number
  action: 'immediate' | 'consider' | 'monitor'
  script: string
}

const rollbackTriggers: RollbackTrigger[] = [
  {
    condition: 'auth_failure_rate',
    threshold: 0.95, // 95%+ auth failures
    action: 'immediate',
    script: './rollback_auth_quick.sh'
  },
  {
    condition: 'api_error_rate', 
    threshold: 0.30, // 30%+ API errors
    action: 'immediate',
    script: './rollback_phase2_business_logic.sh'
  },
  {
    condition: 'response_time_degradation',
    threshold: 3.0, // 3x normal response time
    action: 'consider',
    script: './rollback_phase1_standard.sh'
  }
]
```

### Manual Rollback Checklist

**Before initiating rollback:**

1. [ ] **Identify Issue Scope**: Authentication, API, Database, UI?
2. [ ] **Check Recent Changes**: `git log --oneline -10`
3. [ ] **Verify Backup Exists**: Confirm backup directory and files
4. [ ] **Select Rollback Type**: Quick, Standard, or Emergency?
5. [ ] **Notify Team**: Inform team of rollback initiation
6. [ ] **Execute Rollback**: Run appropriate rollback script
7. [ ] **Validate Success**: Complete success validation checklist
8. [ ] **Document Issue**: Create incident report for post-mortem

---

## 📞 Emergency Contacts & Procedures

### Immediate Response Team

- **Technical Lead**: Responsible for rollback decisions
- **Database Admin**: Handles database rollbacks
- **DevOps**: Manages production deployments
- **Product Owner**: Approves rollback in production

### Escalation Matrix

1. **Developer**: Notices issue, attempts quick fix (15 minutes)
2. **Technical Lead**: Approves rollback, executes standard procedure (30 minutes)  
3. **Database Admin**: Handles database rollbacks (60 minutes)
4. **DevOps**: Coordinates production rollbacks (120 minutes)

### Communication Template

```
🚨 ROLLBACK INITIATED 🚨

Issue: [Brief description]
Scope: [Authentication/API/Database/Full System]
Rollback Type: [Quick/Standard/Emergency]
Estimated Downtime: [X minutes]
Status: [IN_PROGRESS/COMPLETED/FAILED]

Next Update: [Timestamp]
```

---

## 📈 Success Metrics & KPIs

### Rollback Success Indicators

- **Recovery Time**: Target < 30 minutes for standard rollbacks
- **Data Integrity**: 100% data preservation during rollbacks
- **Service Availability**: > 99.5% uptime maintained
- **User Impact**: Minimal user-facing disruption

### Post-Rollback Analysis

**Required within 24 hours of rollback:**

1. **Root Cause Analysis**: Why did the issue occur?
2. **Rollback Effectiveness**: How well did procedures work?
3. **Improvement Actions**: What can be prevented next time?
4. **Documentation Updates**: Update rollback procedures based on learnings

---

## 🎯 Conclusion

This comprehensive rollback plan provides multiple layers of protection for the Formula PM V2 implementation:

- **Proactive**: Comprehensive backup procedures
- **Reactive**: Phase-specific rollback procedures  
- **Emergency**: Full system recovery procedures
- **Preventive**: Risk mitigation and monitoring

**Remember**: The best rollback is one you never need to use. Always test changes thoroughly in development before implementing in production.

---

**Document Version**: 1.0  
**Last Updated**: August 5, 2025  
**Next Review**: After Phase 1 completion  
**Owner**: Security Auditor / Technical Lead