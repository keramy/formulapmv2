#!/bin/bash
# Emergency Authentication Rollback Script
# Usage: ./scripts/rollback-auth-quick.sh
# Time: < 5 minutes

set -e

echo "🚨 EXECUTING EMERGENCY AUTH ROLLBACK"
echo "===================================="

# Find latest backup directory
BACKUP_DIR=$(ls -td backups/*/ 2>/dev/null | head -1)
if [ -z "$BACKUP_DIR" ]; then
    echo "❌ No backup directory found! Cannot proceed."
    exit 1
fi

echo "📁 Using backup: $BACKUP_DIR"

# 1. Stop development server
echo "🛑 Stopping development server..."
pkill -f "next dev" 2>/dev/null || echo "No dev server running"

# 2. Restore authentication middleware
if [ -f "$BACKUP_DIR/middleware.ts" ]; then
    echo "📥 Restoring middleware.ts..."
    cp "$BACKUP_DIR/middleware.ts" middleware.ts
else
    echo "⚠️ No middleware.ts backup found"
fi

# 3. Restore core auth files
if [ -d "$BACKUP_DIR/lib_backup" ]; then
    echo "📥 Restoring auth libraries..."
    cp -r "$BACKUP_DIR/lib_backup/enhanced-auth-middleware.ts" src/lib/ 2>/dev/null || echo "⚠️ enhanced-auth-middleware.ts not found"
fi

if [ -d "$BACKUP_DIR/hooks_backup" ]; then
    echo "📥 Restoring auth hooks..."
    cp -r "$BACKUP_DIR/hooks_backup/useAuth.ts" src/hooks/ 2>/dev/null || echo "⚠️ useAuth.ts not found"
fi

# 4. Restore auth API routes
if [ -d "$BACKUP_DIR/api_routes_backup/auth" ]; then
    echo "📥 Restoring auth API routes..."
    rm -rf src/app/api/auth/*
    cp -r "$BACKUP_DIR/api_routes_backup/auth/"* src/app/api/auth/
else
    echo "⚠️ No auth API routes backup found"
fi

# 5. Restart development server
echo "🔄 Starting development server..."
npm run dev > /dev/null 2>&1 &
DEV_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 15

# 6. Test authentication
echo "🧪 Testing authentication..."
AUTH_TEST=$(curl -s -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@formulapm.com","password":"admin123"}' | jq -r '.success' 2>/dev/null || echo "false")

if [ "$AUTH_TEST" = "true" ]; then
    echo "✅ Authentication rollback successful!"
    echo "🔍 Verify manually: curl -X POST http://localhost:3003/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@formulapm.com\",\"password\":\"admin123\"}'"
else
    echo "❌ Authentication test failed - manual intervention required"
    echo "🔍 Check: http://localhost:3003/api/auth/diagnostics"
fi

echo ""
echo "📊 ROLLBACK SUMMARY"
echo "=================="
echo "Status: $([ "$AUTH_TEST" = "true" ] && echo "✅ SUCCESS" || echo "❌ FAILED")"
echo "Backup used: $BACKUP_DIR"
echo "Dev server PID: $DEV_PID"
echo "Next steps: Verify dashboard access and investigate root cause"

exit $([ "$AUTH_TEST" = "true" ] && echo 0 || echo 1)