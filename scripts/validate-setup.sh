#!/bin/bash

# Formula PM 2.0 Setup Validation Script
# This script validates that the local development environment is properly configured

set -e

echo "🔍 Validating Formula PM 2.0 Local Development Setup"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print status
print_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Test 1: Check required files exist
echo
echo "📁 Checking required files..."

if [ -f "package.json" ]; then
    print_pass "package.json exists"
else
    print_fail "package.json missing"
fi

if [ -f ".env.local" ]; then
    print_pass ".env.local exists"
else
    print_fail ".env.local missing"
fi

if [ -f "supabase/config.toml" ]; then
    print_pass "supabase/config.toml exists"
else
    print_fail "supabase/config.toml missing"
fi

if [ -f "supabase/seed-realistic-construction-data.sql" ]; then
    print_pass "Realistic construction data seed file exists"
else
    print_fail "Realistic construction data seed file missing"
fi

# Test 2: Check dependencies
echo
echo "📦 Checking dependencies..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_pass "Node.js installed: $NODE_VERSION"
else
    print_fail "Node.js not installed"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_pass "npm installed: $NPM_VERSION"
else
    print_fail "npm not installed"
fi

if command -v docker &> /dev/null; then
    if docker info &> /dev/null; then
        print_pass "Docker installed and running"
    else
        print_fail "Docker installed but not running"
    fi
else
    print_fail "Docker not installed"
fi

if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    print_pass "Supabase CLI installed: $SUPABASE_VERSION"
else
    print_fail "Supabase CLI not installed"
fi

# Test 3: Check Node.js dependencies
echo
echo "🔗 Checking Node.js dependencies..."

if [ -d "node_modules" ]; then
    print_pass "node_modules directory exists"
    
    # Check key dependencies
    if [ -d "node_modules/next" ]; then
        print_pass "Next.js installed"
    else
        print_fail "Next.js not installed"
    fi
    
    if [ -d "node_modules/@supabase/supabase-js" ]; then
        print_pass "Supabase JS client installed"
    else
        print_fail "Supabase JS client not installed"
    fi
else
    print_fail "node_modules directory missing - run 'npm install'"
fi

# Test 4: Check Supabase local development
echo
echo "🗄️ Checking Supabase local development..."

if supabase status &> /dev/null; then
    SUPABASE_STATUS=$(supabase status 2>/dev/null)
    
    if echo "$SUPABASE_STATUS" | grep -q "API URL"; then
        API_URL=$(echo "$SUPABASE_STATUS" | grep "API URL" | awk '{print $3}')
        print_pass "Supabase API running at: $API_URL"
    else
        print_fail "Supabase API not running"
    fi
    
    if echo "$SUPABASE_STATUS" | grep -q "Studio URL"; then
        STUDIO_URL=$(echo "$SUPABASE_STATUS" | grep "Studio URL" | awk '{print $3}')
        print_pass "Supabase Studio running at: $STUDIO_URL"
    else
        print_fail "Supabase Studio not running"
    fi
    
    if echo "$SUPABASE_STATUS" | grep -q "DB URL"; then
        DB_URL=$(echo "$SUPABASE_STATUS" | grep "DB URL" | awk '{print $3}')
        print_pass "Database accessible at: $DB_URL"
    else
        print_fail "Database not accessible"
    fi
else
    print_fail "Supabase not running - run 'supabase start'"
fi

# Test 5: SQL Migration validation
echo
echo "🔍 Validating SQL migrations..."

if [ -f "scripts/validate-migrations.ts" ]; then
    if npm run validate-migrations:ci > /dev/null 2>&1; then
        print_pass "SQL migrations validation passed"
    else
        print_fail "SQL migrations validation failed"
        print_info "Run 'npm run validate-migrations:verbose' for details"
    fi
else
    print_warning "SQL validator not found"
fi

# Test 6: Database validation
echo
echo "🏗️ Validating database structure..."

if command -v supabase &> /dev/null && supabase status &> /dev/null; then
    # Check if tables exist
    TABLE_COUNT=$(supabase db dump --data-only --schema=public 2>/dev/null | grep -c "CREATE TABLE" || echo "0")
    
    if [ "$TABLE_COUNT" -gt 0 ]; then
        print_pass "Database tables created ($TABLE_COUNT tables)"
    else
        print_fail "Database tables missing - run migrations"
    fi
    
    # Check if sample data exists
    USER_COUNT=$(supabase db execute "SELECT COUNT(*) FROM user_profiles;" 2>/dev/null | tail -1 || echo "0")
    
    if [ "$USER_COUNT" -ge 15 ]; then
        print_pass "User profiles loaded ($USER_COUNT users)"
    else
        print_fail "Insufficient user profiles - load seed data"
    fi
    
    PROJECT_COUNT=$(supabase db execute "SELECT COUNT(*) FROM projects;" 2>/dev/null | tail -1 || echo "0")
    
    if [ "$PROJECT_COUNT" -ge 6 ]; then
        print_pass "Projects loaded ($PROJECT_COUNT projects)"
    else
        print_fail "Insufficient projects - load seed data"
    fi
else
    print_warning "Cannot validate database - Supabase not running"
fi

# Test 6: Application build
echo
echo "🏗️ Testing application build..."

if npm run build > /dev/null 2>&1; then
    print_pass "Next.js application builds successfully"
else
    print_fail "Next.js application build failed"
fi

# Test 7: Environment configuration
echo
echo "⚙️ Validating environment configuration..."

if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        print_pass "Supabase URL configured"
    else
        print_fail "Supabase URL not configured"
    fi
    
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        print_pass "Supabase anon key configured"
    else
        print_fail "Supabase anon key not configured"
    fi
    
    if grep -q "ENABLE_CLIENT_PORTAL=true" .env.local; then
        print_pass "Client Portal enabled"
    else
        print_warning "Client Portal not enabled"
    fi
    
    if grep -q "ENABLE_PURCHASE_DEPARTMENT=true" .env.local; then
        print_pass "Purchase Department enabled"
    else
        print_warning "Purchase Department not enabled"
    fi
else
    print_fail ".env.local file missing"
fi

# Test 8: Port availability
echo
echo "🔌 Checking port availability..."

# Check if ports are available
if lsof -i :3000 &> /dev/null; then
    print_warning "Port 3000 is in use (Next.js might be running)"
else
    print_pass "Port 3000 available"
fi

if lsof -i :54321 &> /dev/null; then
    print_pass "Port 54321 in use (Supabase API running)"
else
    print_fail "Port 54321 not in use (Supabase API not running)"
fi

if lsof -i :54323 &> /dev/null; then
    print_pass "Port 54323 in use (Supabase Studio running)"
else
    print_fail "Port 54323 not in use (Supabase Studio not running)"
fi

# Summary
echo
echo "📊 Validation Summary"
echo "===================="
echo -e "✅ Passed: ${GREEN}$PASSED${NC}"
echo -e "❌ Failed: ${RED}$FAILED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$WARNINGS${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical validations passed!${NC}"
    echo -e "${GREEN}Your Formula PM 2.0 development environment is ready.${NC}"
    echo
    echo "🚀 To start development:"
    echo "   npm run dev"
    echo
    echo "🌐 Access the application at:"
    echo "   http://localhost:3000"
    echo
    echo "🛠️ Access Supabase Studio at:"
    if supabase status &> /dev/null; then
        STUDIO_URL=$(supabase status 2>/dev/null | grep "Studio URL" | awk '{print $3}')
        echo "   $STUDIO_URL"
    else
        echo "   http://localhost:54323"
    fi
else
    echo -e "${RED}❌ Some validations failed. Please address the issues above.${NC}"
    echo
    echo "🔧 Common fixes:"
    echo "   • Run 'npm install' to install dependencies"
    echo "   • Run 'supabase start' to start Supabase"
    echo "   • Run 'supabase db reset' to reset database"
    echo "   • Run 'supabase db load --file supabase/seed-realistic-construction-data.sql' to load data"
    
    exit 1
fi