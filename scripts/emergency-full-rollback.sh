#!/bin/bash
# Emergency Full System Rollback Script
# Usage: ./scripts/emergency-full-rollback.sh [commit-hash]
# Time: < 60 minutes

set -e

echo "🚨🚨 EMERGENCY FULL SYSTEM ROLLBACK 🚨🚨"
echo "======================================="

ROLLBACK_COMMIT="$1"

# 1. Stop all processes
echo "🛑 Stopping all processes..."
pkill -f "next" 2>/dev/null || echo "No Next.js processes"
pkill -f "node" 2>/dev/null || echo "No Node.js processes"
pkill -f "npm" 2>/dev/null || echo "No npm processes"
pkill -f "jest" 2>/dev/null || echo "No Jest processes"
pkill -f "playwright" 2>/dev/null || echo "No Playwright processes"

# 2. Create emergency backup of current state
EMERGENCY_BACKUP="emergency_backup_$(date +%Y%m%d_%H%M%S)"
echo "💾 Creating emergency backup: $EMERGENCY_BACKUP"
mkdir -p "$EMERGENCY_BACKUP"
cp -r src/ "$EMERGENCY_BACKUP/" 2>/dev/null || echo "Failed to backup src/"
cp middleware.ts "$EMERGENCY_BACKUP/" 2>/dev/null || echo "No middleware.ts"
cp package.json "$EMERGENCY_BACKUP/" 2>/dev/null || echo "No package.json"
cp next.config.js "$EMERGENCY_BACKUP/" 2>/dev/null || echo "No next.config.js"
git log --oneline -20 > "$EMERGENCY_BACKUP/git_state.log"

# 3. Git-based rollback to last known good state
echo "📍 Determining rollback target..."

if [ -n "$ROLLBACK_COMMIT" ]; then
    echo "🎯 Using specified commit: $ROLLBACK_COMMIT"
    TARGET_COMMIT="$ROLLBACK_COMMIT"
else
    # Try to find last commit with success indicators
    TARGET_COMMIT=$(git log --oneline --grep="✅\|SUCCESS\|WORKING\|COMPLETE" -1 --format="%H" 2>/dev/null || echo "")
    
    if [ -z "$TARGET_COMMIT" ]; then
        # Fall back to commit from 24 hours ago
        TARGET_COMMIT=$(git log --since="24 hours ago" --format="%H" | tail -1)
        echo "⚠️ No marked good commit found, using 24-hour rollback: $TARGET_COMMIT"
    else
        echo "🎯 Found last good commit: $TARGET_COMMIT"
    fi
    
    if [ -z "$TARGET_COMMIT" ]; then
        echo "❌ Cannot determine rollback target - using HEAD~10"
        TARGET_COMMIT="HEAD~10"
    fi
fi

# Confirm rollback target
echo "📊 Rollback target details:"
git show --oneline -s "$TARGET_COMMIT" || echo "⚠️ Invalid commit hash"

# Execute git rollback
echo "🔄 Executing git rollback..."
git stash push -m "Emergency rollback stash $(date)"
git reset --hard "$TARGET_COMMIT"

# 4. Restore dependencies
echo "📦 Restoring dependencies..."
if [ -f "package-lock.json" ]; then
    echo "  🔄 Using package-lock.json..."
    npm ci
else
    echo "  🔄 Installing from package.json..."
    npm install
fi

# 5. Emergency database restore
echo "🗄️ Executing emergency database restore..."
if [ -f "scripts/automatic-rollback.js" ]; then
    echo "  🤖 Running automatic rollback system..."
    node scripts/automatic-rollback.js --force || echo "  ⚠️ Automatic rollback had issues"
else
    echo "  ⚠️ No automatic rollback system found"
fi

# Restore user data from latest backup
USER_BACKUP=$(ls -t user-backup-*.json 2>/dev/null | head -1)
if [ -n "$USER_BACKUP" ] && [ -f "scripts/restore-users.mjs" ]; then
    echo "  📥 Restoring user data from $USER_BACKUP..."
    node scripts/restore-users.mjs "$USER_BACKUP" || echo "  ⚠️ User restore had issues"
else
    echo "  ℹ️ No user backup or restore script found"
fi

# 6. Validate critical functionality
echo "🧪 Validating critical functionality..."

# Type checking
echo "  🔍 Type checking..."
npm run type-check > emergency_rollback_typecheck.log 2>&1 || echo "  ⚠️ Type check issues - see emergency_rollback_typecheck.log"

# Build test
echo "  🔍 Build test..."
npm run build > emergency_rollback_build.log 2>&1 || {
    echo "  ❌ Build failed - checking for immediate fixes..."
    
    # Try to fix common issues
    echo "  🔧 Attempting automatic fixes..."
    
    # Remove .next directory
    rm -rf .next
    
    # Clear npm cache
    npm cache clean --force
    
    # Retry build
    npm run build > emergency_rollback_build_retry.log 2>&1 || echo "  ❌ Build still failing after fixes"
}

# 7. Start in safe mode
echo "🚀 Starting in safe mode..."
NODE_ENV=development npm run dev > emergency_rollback_server.log 2>&1 &
DEV_PID=$!

# Wait for server
echo "⏳ Waiting for server to start..."
sleep 30

# 8. Health checks
echo "🏥 Performing health checks..."

AUTH_CHECK=$(curl -s http://localhost:3003/api/auth/diagnostics | jq -r '.status' 2>/dev/null || echo "failed")
DASHBOARD_CHECK=$(curl -s http://localhost:3003/api/dashboard/stats | jq -r '.success' 2>/dev/null || echo "false")

# Basic connectivity test
BASIC_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/ || echo "000")

echo ""
echo "🚨 EMERGENCY ROLLBACK REPORT 🚨"
echo "==============================="
echo "Rollback target: $TARGET_COMMIT"
echo "Basic connectivity: $([ "$BASIC_CHECK" = "200" ] && echo "✅ OK (200)" || echo "❌ Failed ($BASIC_CHECK)")"
echo "Auth diagnostics: $([ "$AUTH_CHECK" = "ok" ] && echo "✅ OK" || echo "❌ Failed")"
echo "Dashboard API: $([ "$DASHBOARD_CHECK" = "true" ] && echo "✅ Working" || echo "❌ Failed")"
echo "Dev server PID: $DEV_PID"
echo "Emergency backup: $EMERGENCY_BACKUP"
echo ""

# Provide next steps
echo "📋 IMMEDIATE NEXT STEPS:"
echo "1. Verify core functionality: http://localhost:3003/"
echo "2. Test authentication: curl -X POST http://localhost:3003/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"admin@formulapm.com\",\"password\":\"admin123\"}'"
echo "3. Check logs: emergency_rollback_*.log"
echo "4. Review changes needed to prevent recurrence"
echo "5. Plan incremental fixes and re-deployment"

# Set exit code based on health checks
if [ "$BASIC_CHECK" = "200" ]; then
    echo "🆘 Emergency rollback completed - system operational in safe mode"
    exit 0
else
    echo "💥 Emergency rollback completed but system may have issues - immediate investigation required"
    exit 1
fi