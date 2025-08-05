#!/bin/bash
# Create Comprehensive Rollback Backup Script
# Usage: ./scripts/create-rollback-backup.sh [phase-name]
# Creates timestamped backup for rollback procedures

set -e

PHASE_NAME="${1:-manual}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${TIMESTAMP}_${PHASE_NAME}"

echo "🔄 Creating comprehensive rollback backup"
echo "========================================"
echo "Phase: $PHASE_NAME"
echo "Backup directory: $BACKUP_DIR"

# Create backup directory structure
mkdir -p "$BACKUP_DIR"/{api_routes_backup,lib_backup,hooks_backup,components_backup,tests_backup,config_backup}

# 1. Backup critical application files
echo "📂 Backing up application files..."

# API routes
if [ -d "src/app/api" ]; then
    echo "  📁 API routes..."
    cp -r src/app/api/* "$BACKUP_DIR/api_routes_backup/" 2>/dev/null || echo "  ⚠️ No API routes found"
fi

# Libraries
if [ -d "src/lib" ]; then
    echo "  📁 Libraries..."
    cp -r src/lib/* "$BACKUP_DIR/lib_backup/" 2>/dev/null || echo "  ⚠️ No lib files found"
fi

# Hooks
if [ -d "src/hooks" ]; then
    echo "  📁 Hooks..."
    cp -r src/hooks/* "$BACKUP_DIR/hooks_backup/" 2>/dev/null || echo "  ⚠️ No hooks found"
fi

# Components
if [ -d "src/components" ]; then
    echo "  📁 Components..."
    cp -r src/components/* "$BACKUP_DIR/components_backup/" 2>/dev/null || echo "  ⚠️ No components found"
fi

# Tests
if [ -d "tests" ]; then
    echo "  📁 Tests..."
    cp -r tests/* "$BACKUP_DIR/tests_backup/" 2>/dev/null || echo "  ⚠️ No tests directory found"
fi

if [ -d "__tests__" ]; then
    echo "  📁 __tests__..."
    cp -r __tests__/* "$BACKUP_DIR/tests_backup/" 2>/dev/null || echo "  ℹ️ No __tests__ directory"
fi

# 2. Backup configuration files
echo "📄 Backing up configuration files..."
cp middleware.ts "$BACKUP_DIR/" 2>/dev/null || echo "  ⚠️ No middleware.ts"
cp next.config.js "$BACKUP_DIR/" 2>/dev/null || echo "  ⚠️ No next.config.js"
cp package.json "$BACKUP_DIR/" 2>/dev/null || echo "  ⚠️ No package.json"
cp package-lock.json "$BACKUP_DIR/" 2>/dev/null || echo "  ⚠️ No package-lock.json"
cp tsconfig.json "$BACKUP_DIR/" 2>/dev/null || echo "  ℹ️ No tsconfig.json"
cp tailwind.config.js "$BACKUP_DIR/" 2>/dev/null || echo "  ℹ️ No tailwind.config.js"
cp jest.config.js "$BACKUP_DIR/" 2>/dev/null || echo "  ℹ️ No jest.config.js"
cp playwright.config.ts "$BACKUP_DIR/" 2>/dev/null || echo "  ℹ️ No playwright.config.ts"

# Environment files (without sensitive data)
if [ -f ".env.example" ]; then
    cp .env.example "$BACKUP_DIR/"
fi

# Supabase configuration
if [ -d "supabase" ]; then
    echo "  📁 Supabase config..."
    cp -r supabase/ "$BACKUP_DIR/supabase_backup/" 2>/dev/null || echo "  ⚠️ No supabase directory"
fi

# 3. Capture current system state
echo "📊 Capturing system state..."

# Git state
git log --oneline -20 > "$BACKUP_DIR/git_state.log" 2>/dev/null || echo "  ⚠️ Git log failed"
git status > "$BACKUP_DIR/git_status.log" 2>/dev/null || echo "  ⚠️ Git status failed"
git diff --name-only > "$BACKUP_DIR/modified_files.log" 2>/dev/null || echo "  ℹ️ No git diff"

# Current branch
git rev-parse --abbrev-ref HEAD > "$BACKUP_DIR/current_branch.txt" 2>/dev/null || echo "unknown" > "$BACKUP_DIR/current_branch.txt"

# Node and npm versions
node --version > "$BACKUP_DIR/node_version.txt" 2>/dev/null || echo "unknown" > "$BACKUP_DIR/node_version.txt"
npm --version > "$BACKUP_DIR/npm_version.txt" 2>/dev/null || echo "unknown" > "$BACKUP_DIR/npm_version.txt"

# 4. Test current functionality (if server is running)
echo "🧪 Testing current functionality..."

if curl -s http://localhost:3003/ > /dev/null 2>&1; then
    echo "  ✅ Server is running - capturing test results..."
    
    # Auth diagnostics
    curl -s http://localhost:3003/api/auth/diagnostics > "$BACKUP_DIR/auth_diagnostics.json" 2>/dev/null || echo "  ⚠️ Auth diagnostics failed"
    
    # Dashboard stats
    curl -s http://localhost:3003/api/dashboard/stats > "$BACKUP_DIR/dashboard_stats.json" 2>/dev/null || echo "  ⚠️ Dashboard stats failed"
    
    # Basic API test
    curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/ > "$BACKUP_DIR/server_response_code.txt" 2>/dev/null || echo "000" > "$BACKUP_DIR/server_response_code.txt"
else
    echo "  ℹ️ Server not running - skipping API tests"
fi

# Run tests if available (but don't fail if they fail)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "  🧪 Running test suite..."
    npm test > "$BACKUP_DIR/test_results.log" 2>&1 || echo "  ⚠️ Tests had issues - see test_results.log"
fi

# TypeScript check
if [ -f "tsconfig.json" ]; then
    echo "  🔍 TypeScript validation..."
    npm run type-check > "$BACKUP_DIR/typecheck_results.log" 2>&1 || echo "  ⚠️ TypeScript issues - see typecheck_results.log"
fi

# 5. Backup database users (if script exists)
echo "🗄️ Backing up database state..."
if [ -f "scripts/backup-users.mjs" ]; then
    echo "  👥 Backing up users..."
    node scripts/backup-users.mjs > "$BACKUP_DIR/user_backup.log" 2>&1 || echo "  ⚠️ User backup failed - see user_backup.log"
    
    # Move the created user backup to our backup directory
    LATEST_USER_BACKUP=$(ls -t user-backup-*.json 2>/dev/null | head -1)
    if [ -n "$LATEST_USER_BACKUP" ]; then
        cp "$LATEST_USER_BACKUP" "$BACKUP_DIR/"
        echo "  ✅ User backup: $LATEST_USER_BACKUP"
    fi
else
    echo "  ℹ️ No user backup script found"
fi

# 6. Create backup manifest
echo "📋 Creating backup manifest..."
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# Backup Manifest

**Created**: $(date)
**Phase**: $PHASE_NAME
**Git Commit**: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
**Git Branch**: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
**Node Version**: $(node --version 2>/dev/null || echo "unknown")
**NPM Version**: $(npm --version 2>/dev/null || echo "unknown")

## Contents

### Application Files
- ✅ API Routes: $(find "$BACKUP_DIR/api_routes_backup" -type f 2>/dev/null | wc -l) files
- ✅ Libraries: $(find "$BACKUP_DIR/lib_backup" -type f 2>/dev/null | wc -l) files  
- ✅ Hooks: $(find "$BACKUP_DIR/hooks_backup" -type f 2>/dev/null | wc -l) files
- ✅ Components: $(find "$BACKUP_DIR/components_backup" -type f 2>/dev/null | wc -l) files

### Configuration Files
$(ls -la "$BACKUP_DIR"/*.{ts,js,json} 2>/dev/null || echo "No config files")

### System State
- Git log: $(wc -l < "$BACKUP_DIR/git_state.log" 2>/dev/null || echo "0") commits
- Modified files: $(wc -l < "$BACKUP_DIR/modified_files.log" 2>/dev/null || echo "0") files
- Server status: $(cat "$BACKUP_DIR/server_response_code.txt" 2>/dev/null || echo "unknown")

### Test Results
- Test log: $([ -f "$BACKUP_DIR/test_results.log" ] && echo "✅ Available" || echo "❌ Not available")
- TypeScript: $([ -f "$BACKUP_DIR/typecheck_results.log" ] && echo "✅ Available" || echo "❌ Not available")

### Database
- User backup: $([ -f "$BACKUP_DIR/user-backup-"*.json ] && echo "✅ Available" || echo "❌ Not available")

## Rollback Usage

To restore from this backup:

\`\`\`bash
# Quick auth rollback
./scripts/rollback-auth-quick.sh

# Standard rollback (will use this backup automatically)
./scripts/rollback-phase1-standard.sh

# Manual restoration
cp -r $BACKUP_DIR/api_routes_backup/* src/app/api/
cp -r $BACKUP_DIR/lib_backup/* src/lib/
cp -r $BACKUP_DIR/hooks_backup/* src/hooks/
cp $BACKUP_DIR/middleware.ts middleware.ts
cp $BACKUP_DIR/package.json package.json
npm install
\`\`\`

## Validation Commands

\`\`\`bash
# Test authentication
curl -X POST http://localhost:3003/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@formulapm.com","password":"admin123"}'

# Test dashboard
curl http://localhost:3003/api/dashboard/stats

# Run tests
npm test

# Type check
npm run type-check
\`\`\`
EOF

# 7. Set up backup retention (keep last 10 backups)
echo "🧹 Cleaning up old backups..."
BACKUP_COUNT=$(ls -1d backups/*/ 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
    BACKUPS_TO_DELETE=$((BACKUP_COUNT - 10))
    echo "  🗑️ Removing $BACKUPS_TO_DELETE old backups..."
    ls -1td backups/*/ | tail -n "$BACKUPS_TO_DELETE" | xargs rm -rf
fi

# 8. Final summary
echo ""
echo "✅ BACKUP COMPLETED SUCCESSFULLY"
echo "================================"
echo "📁 Backup location: $BACKUP_DIR"
echo "📊 Backup size: $(du -sh "$BACKUP_DIR" | cut -f1)"
echo "📋 Manifest: $BACKUP_DIR/BACKUP_MANIFEST.md"
echo ""
echo "🔧 Available rollback scripts:"
echo "  • ./scripts/rollback-auth-quick.sh (< 5 min)"
echo "  • ./scripts/rollback-phase1-standard.sh (< 30 min)"
echo "  • ./scripts/emergency-full-rollback.sh (< 60 min)"
echo ""
echo "📞 In case of emergency:"
echo "  1. Run: ./scripts/emergency-full-rollback.sh"
echo "  2. Check: $BACKUP_DIR/BACKUP_MANIFEST.md"
echo "  3. Validate: Follow instructions in manifest"

exit 0