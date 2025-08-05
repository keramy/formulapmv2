#!/bin/bash
# Phase 1 Standard Rollback Script
# Usage: ./scripts/rollback-phase1-standard.sh
# Time: < 30 minutes

set -e

echo "🔄 EXECUTING PHASE 1 STANDARD ROLLBACK"
echo "======================================"

# Find latest backup directory
BACKUP_DIR=$(ls -td backups/*/ 2>/dev/null | head -1)
if [ -z "$BACKUP_DIR" ]; then
    echo "❌ No backup directory found! Cannot proceed."
    exit 1
fi

echo "📁 Using backup: $BACKUP_DIR"

# 1. Stop all processes
echo "🛑 Stopping all development processes..."
pkill -f "next dev" 2>/dev/null || echo "No Next.js dev server running"
pkill -f "jest" 2>/dev/null || echo "No Jest processes running"
pkill -f "playwright" 2>/dev/null || echo "No Playwright processes running"

# 2. Restore all modified files
echo "📥 Restoring application files..."

# Restore API routes
if [ -d "$BACKUP_DIR/api_routes_backup" ]; then
    echo "  📂 Restoring API routes..."
    rm -rf src/app/api/*
    cp -r "$BACKUP_DIR/api_routes_backup/"* src/app/api/
else
    echo "  ⚠️ No API routes backup found"
fi

# Restore libraries
if [ -d "$BACKUP_DIR/lib_backup" ]; then
    echo "  📂 Restoring libraries..."
    rm -rf src/lib/*
    cp -r "$BACKUP_DIR/lib_backup/"* src/lib/
else
    echo "  ⚠️ No lib backup found"
fi

# Restore hooks
if [ -d "$BACKUP_DIR/hooks_backup" ]; then
    echo "  📂 Restoring hooks..."
    rm -rf src/hooks/*
    cp -r "$BACKUP_DIR/hooks_backup/"* src/hooks/
else
    echo "  ⚠️ No hooks backup found"
fi

# Restore components
if [ -d "$BACKUP_DIR/components_backup" ]; then
    echo "  📂 Restoring components..."
    rm -rf src/components/*
    cp -r "$BACKUP_DIR/components_backup/"* src/components/
else
    echo "  ⚠️ No components backup found"
fi

# Restore middleware
if [ -f "$BACKUP_DIR/middleware.ts" ]; then
    echo "  📄 Restoring middleware..."
    cp "$BACKUP_DIR/middleware.ts" middleware.ts
fi

# Restore configuration files
if [ -f "$BACKUP_DIR/next.config.js" ]; then
    echo "  📄 Restoring Next.js config..."
    cp "$BACKUP_DIR/next.config.js" next.config.js
fi

# 3. Restore package dependencies
echo "📦 Restoring package dependencies..."
if [ -f "$BACKUP_DIR/package.json" ] && [ -f "$BACKUP_DIR/package-lock.json" ]; then
    cp "$BACKUP_DIR/package.json" package.json
    cp "$BACKUP_DIR/package-lock.json" package-lock.json
    echo "  🔄 Reinstalling dependencies..."
    npm ci
else
    echo "  ⚠️ No package files backup found, using current dependencies"
fi

# 4. Restore database state (if needed)
echo "🗄️ Checking for database backups..."
USER_BACKUP=$(ls -t user-backup-*.json 2>/dev/null | head -1)
if [ -n "$USER_BACKUP" ]; then
    echo "  📥 Restoring user data from $USER_BACKUP..."
    if [ -f "scripts/restore-users.mjs" ]; then
        node scripts/restore-users.mjs "$USER_BACKUP"
    else
        echo "  ⚠️ restore-users.mjs script not found"
    fi
else
    echo "  ℹ️ No user backup found - database not restored"
fi

# 5. Validate rollback
echo "🧪 Validating rollback..."

# Check for TypeScript errors
echo "  🔍 Checking TypeScript..."
if npm run type-check; then
    echo "  ✅ TypeScript validation passed"
else
    echo "  ❌ TypeScript validation failed"
fi

# Test API routes
echo "  🔍 Testing API routes..."
npm run test:api > rollback_test_results.log 2>&1 || echo "  ⚠️ Some API tests failed - check rollback_test_results.log"

# Test build process
echo "  🔍 Testing build process..."
if npm run build; then
    echo "  ✅ Build validation passed"
else
    echo "  ❌ Build validation failed"
fi

# 6. Start development server
echo "🚀 Starting development server..."
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 20

# 7. Final validation
echo "🏁 Final validation..."
AUTH_TEST=$(curl -s -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@formulapm.com","password":"admin123"}' | jq -r '.success' 2>/dev/null || echo "false")

DASHBOARD_TEST=$(curl -s http://localhost:3003/api/dashboard/stats | jq -r '.success' 2>/dev/null || echo "false")

echo ""
echo "📊 ROLLBACK SUMMARY"
echo "=================="
echo "Status: $([ "$AUTH_TEST" = "true" ] && [ "$DASHBOARD_TEST" = "true" ] && echo "✅ SUCCESS" || echo "❌ PARTIAL SUCCESS")"
echo "Authentication: $([ "$AUTH_TEST" = "true" ] && echo "✅ Working" || echo "❌ Failed")"
echo "Dashboard API: $([ "$DASHBOARD_TEST" = "true" ] && echo "✅ Working" || echo "❌ Failed")"
echo "Backup used: $BACKUP_DIR"
echo "Dev server PID: $DEV_PID"
echo "Test results: rollback_test_results.log"

# Final exit code
if [ "$AUTH_TEST" = "true" ] && [ "$DASHBOARD_TEST" = "true" ]; then
    echo "🎉 Phase 1 rollback completed successfully!"
    exit 0
else
    echo "⚠️ Phase 1 rollback completed with issues - manual intervention may be required"
    exit 1
fi