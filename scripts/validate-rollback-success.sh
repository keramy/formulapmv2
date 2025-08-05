#!/bin/bash
# Rollback Success Validation Script
# Usage: ./scripts/validate-rollback-success.sh [backup-dir]
# Validates that rollback was successful and system is functional

set -e

BACKUP_DIR="$1"
if [ -z "$BACKUP_DIR" ]; then
    BACKUP_DIR=$(ls -td backups/*/ 2>/dev/null | head -1)
fi

echo "🔍 VALIDATING ROLLBACK SUCCESS"
echo "============================="
echo "Using backup reference: $BACKUP_DIR"

# Initialize validation results
VALIDATION_RESULTS=()
ERRORS=()
WARNINGS=()

# Helper function to add validation result
add_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    VALIDATION_RESULTS+=("$status|$test_name|$message")
    
    if [ "$status" = "PASS" ]; then
        echo "  ✅ $test_name: $message"
    elif [ "$status" = "FAIL" ]; then
        echo "  ❌ $test_name: $message"
        ERRORS+=("$test_name: $message")
    else
        echo "  ⚠️ $test_name: $message"
        WARNINGS+=("$test_name: $message")
    fi
}

# 1. Basic System Health
echo ""
echo "🏥 BASIC SYSTEM HEALTH"
echo "====================="

# Check if development server is running
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/ | grep -q "200"; then
    add_result "Server Connectivity" "PASS" "Development server responding (200)"
else
    add_result "Server Connectivity" "FAIL" "Development server not responding"
fi

# Check for build errors
if [ -f ".next/BUILD_ID" ]; then
    add_result "Build Status" "PASS" "Next.js build exists"
else
    add_result "Build Status" "WARN" "No Next.js build found - may need to run 'npm run build'"
fi

# Check TypeScript compilation
if npm run type-check > /dev/null 2>&1; then
    add_result "TypeScript" "PASS" "No TypeScript errors"
else
    add_result "TypeScript" "FAIL" "TypeScript compilation errors detected"
fi

# 2. Authentication System
echo ""
echo "🔐 AUTHENTICATION SYSTEM"
echo "======================="

# Test auth diagnostics endpoint
AUTH_DIAG=$(curl -s http://localhost:3003/api/auth/diagnostics 2>/dev/null || echo '{"status":"failed"}')
AUTH_STATUS=$(echo "$AUTH_DIAG" | jq -r '.status' 2>/dev/null || echo "failed")

if [ "$AUTH_STATUS" = "ok" ]; then
    add_result "Auth Diagnostics" "PASS" "Authentication system healthy"
else
    add_result "Auth Diagnostics" "FAIL" "Authentication diagnostics failed"
fi

# Test admin login
LOGIN_RESULT=$(curl -s -X POST http://localhost:3003/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@formulapm.com","password":"admin123"}' 2>/dev/null || echo '{"success":false}')

LOGIN_SUCCESS=$(echo "$LOGIN_RESULT" | jq -r '.success' 2>/dev/null || echo "false")

if [ "$LOGIN_SUCCESS" = "true" ]; then
    add_result "Admin Login" "PASS" "Admin user can authenticate"
    
    # Extract token for further tests
    ACCESS_TOKEN=$(echo "$LOGIN_RESULT" | jq -r '.accessToken' 2>/dev/null || echo "")
else
    add_result "Admin Login" "FAIL" "Admin user authentication failed"
    ACCESS_TOKEN=""
fi

# Test profile endpoint with token
if [ -n "$ACCESS_TOKEN" ]; then
    PROFILE_RESULT=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:3003/api/auth/profile 2>/dev/null || echo '{"success":false}')
    
    PROFILE_SUCCESS=$(echo "$PROFILE_RESULT" | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$PROFILE_SUCCESS" = "true" ]; then
        add_result "Profile Access" "PASS" "User profile accessible with token"
    else
        add_result "Profile Access" "FAIL" "User profile not accessible with token"
    fi
else
    add_result "Profile Access" "SKIP" "Skipped due to login failure"
fi

# 3. API Endpoints
echo ""
echo "🌐 API ENDPOINTS"
echo "==============="

# Test dashboard stats
if [ -n "$ACCESS_TOKEN" ]; then
    DASHBOARD_RESULT=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:3003/api/dashboard/stats 2>/dev/null || echo '{"success":false}')
    
    DASHBOARD_SUCCESS=$(echo "$DASHBOARD_RESULT" | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$DASHBOARD_SUCCESS" = "true" ]; then
        add_result "Dashboard API" "PASS" "Dashboard statistics accessible"
    else
        add_result "Dashboard API" "FAIL" "Dashboard statistics not accessible"
    fi
else
    add_result "Dashboard API" "SKIP" "Skipped due to authentication failure"
fi

# Test projects endpoint
if [ -n "$ACCESS_TOKEN" ]; then
    PROJECTS_RESULT=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:3003/api/projects 2>/dev/null || echo '{"success":false}')
    
    PROJECTS_SUCCESS=$(echo "$PROJECTS_RESULT" | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$PROJECTS_SUCCESS" = "true" ]; then
        add_result "Projects API" "PASS" "Projects endpoint accessible"
    else
        add_result "Projects API" "FAIL" "Projects endpoint not accessible"
    fi
else
    add_result "Projects API" "SKIP" "Skipped due to authentication failure"
fi

# 4. Database Connectivity
echo ""
echo "🗄️ DATABASE CONNECTIVITY"
echo "======================="

# Test user profiles access (indirect database test)
if [ -n "$ACCESS_TOKEN" ]; then
    USERS_RESULT=$(curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:3003/api/admin/users 2>/dev/null || echo '{"success":false}')
    
    USERS_SUCCESS=$(echo "$USERS_RESULT" | jq -r '.success' 2>/dev/null || echo "false")
    
    if [ "$USERS_SUCCESS" = "true" ]; then
        add_result "Database Access" "PASS" "Database queries working"
    else
        add_result "Database Access" "FAIL" "Database queries failing"
    fi
else
    add_result "Database Access" "SKIP" "Skipped due to authentication failure"
fi

# 5. File System Integrity
echo ""
echo "📁 FILE SYSTEM INTEGRITY"
echo "======================="

# Check critical files exist
CRITICAL_FILES=(
    "src/app/api/auth/login/route.ts"
    "src/app/api/dashboard/stats/route.ts"
    "src/lib/enhanced-auth-middleware.ts"
    "src/hooks/useAuth.ts"
    "middleware.ts"
    "package.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        add_result "File: $(basename "$file")" "PASS" "File exists and readable"
    else
        add_result "File: $(basename "$file")" "FAIL" "Critical file missing"
    fi
done

# 6. Performance Check
echo ""
echo "⚡ PERFORMANCE CHECK"
echo "=================="

# Measure response times
if [ -n "$ACCESS_TOKEN" ]; then
    # Dashboard response time
    DASHBOARD_TIME=$(curl -o /dev/null -s -w "%{time_total}" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        http://localhost:3003/api/dashboard/stats 2>/dev/null || echo "999")
    
    if (( $(echo "$DASHBOARD_TIME < 2.0" | bc -l 2>/dev/null || echo 0) )); then
        add_result "Dashboard Response Time" "PASS" "${DASHBOARD_TIME}s (< 2s)"
    else
        add_result "Dashboard Response Time" "WARN" "${DASHBOARD_TIME}s (>= 2s)"
    fi
    
    # Auth response time
    AUTH_TIME=$(curl -o /dev/null -s -w "%{time_total}" \
        -X POST -H "Content-Type: application/json" \
        -d '{"email":"admin@formulapm.com","password":"admin123"}' \
        http://localhost:3003/api/auth/login 2>/dev/null || echo "999")
    
    if (( $(echo "$AUTH_TIME < 1.0" | bc -l 2>/dev/null || echo 0) )); then
        add_result "Auth Response Time" "PASS" "${AUTH_TIME}s (< 1s)"
    else
        add_result "Auth Response Time" "WARN" "${AUTH_TIME}s (>= 1s)"
    fi
else
    add_result "Performance Tests" "SKIP" "Skipped due to authentication failure"
fi

# 7. Generate Report
echo ""
echo "📊 VALIDATION REPORT"
echo "==================="

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0
SKIP_COUNT=0

for result in "${VALIDATION_RESULTS[@]}"; do
    IFS='|' read -r status test_name message <<< "$result"
    case "$status" in
        "PASS") ((PASS_COUNT++)) ;;
        "FAIL") ((FAIL_COUNT++)) ;;
        "WARN") ((WARN_COUNT++)) ;;
        "SKIP") ((SKIP_COUNT++)) ;;
    esac
done

echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "⚠️ Warnings: $WARN_COUNT"
echo "⏭️ Skipped: $SKIP_COUNT"

# Calculate success percentage
TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASS_COUNT * 100) / TOTAL_TESTS ))
    echo "📈 Success Rate: ${SUCCESS_RATE}%"
else
    SUCCESS_RATE=0
    echo "📈 Success Rate: N/A"
fi

# 8. Detailed Error Report
if [ ${#ERRORS[@]} -gt 0 ]; then
    echo ""
    echo "❌ ERRORS DETECTED"
    echo "=================="
    for error in "${ERRORS[@]}"; do
        echo "  • $error"
    done
fi

if [ ${#WARNINGS[@]} -gt 0 ]; then
    echo ""
    echo "⚠️ WARNINGS"
    echo "==========="
    for warning in "${WARNINGS[@]}"; do
        echo "  • $warning"
    done
fi

# 9. Recommendations
echo ""
echo "💡 RECOMMENDATIONS"
echo "=================="

if [ $FAIL_COUNT -eq 0 ]; then
    echo "🎉 Rollback validation successful! System is fully operational."
elif [ $FAIL_COUNT -le 2 ] && [ $SUCCESS_RATE -ge 80 ]; then
    echo "✅ Rollback mostly successful with minor issues."
    echo "🔧 Address the failed tests above to complete recovery."
else
    echo "⚠️ Rollback validation indicates significant issues."
    echo "🚨 Consider emergency rollback or manual intervention."
fi

echo ""
echo "🔄 NEXT STEPS"
echo "============"
if [ $FAIL_COUNT -eq 0 ]; then
    echo "1. ✅ System is ready for normal operation"
    echo "2. 📝 Document incident and lessons learned"
    echo "3. 🔍 Investigate root cause of original issue"
else
    echo "1. 🔧 Fix failed validation tests above"
    echo "2. 🔄 Re-run validation: ./scripts/validate-rollback-success.sh"
    echo "3. 🚨 Consider emergency rollback if issues persist"
fi

# Save detailed report
REPORT_FILE="rollback_validation_$(date +%Y%m%d_%H%M%S).log"
{
    echo "# Rollback Validation Report"
    echo "Generated: $(date)"
    echo "Backup Reference: $BACKUP_DIR"
    echo ""
    echo "## Summary"
    echo "- Passed: $PASS_COUNT"
    echo "- Failed: $FAIL_COUNT"  
    echo "- Warnings: $WARN_COUNT"
    echo "- Skipped: $SKIP_COUNT"
    echo "- Success Rate: ${SUCCESS_RATE}%"
    echo ""
    echo "## Detailed Results"
    for result in "${VALIDATION_RESULTS[@]}"; do
        IFS='|' read -r status test_name message <<< "$result"
        echo "- [$status] $test_name: $message"
    done
} > "$REPORT_FILE"

echo "📄 Detailed report saved: $REPORT_FILE"

# Exit with appropriate code
if [ $FAIL_COUNT -eq 0 ]; then
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    exit 1  # Minor issues
else
    exit 2  # Major issues
fi