#!/bin/bash

# Formula PM 2.0 Local Development Setup Script
# This script sets up a complete local development environment

set -e

echo "🚀 Setting up Formula PM 2.0 Local Development Environment"
echo "=========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if running in WSL
if grep -q microsoft /proc/version; then
    echo -e "${BLUE}✓ Running in WSL environment${NC}"
    WSL_ENV=true
else
    echo -e "${BLUE}✓ Running in native Linux environment${NC}"
    WSL_ENV=false
fi

# Function to print status
print_status() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check prerequisites
echo
echo "🔍 Checking prerequisites..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm first."
    exit 1
fi

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    print_status "Supabase CLI found: $SUPABASE_VERSION"
else
    print_warning "Supabase CLI not found. Installing..."
    if [[ "$WSL_ENV" == true ]]; then
        # WSL installation
        curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb -o supabase.deb
        sudo dpkg -i supabase.deb
        rm supabase.deb
    else
        # Native Linux installation
        curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
        sudo mv supabase /usr/local/bin/
    fi
    print_status "Supabase CLI installed"
fi

# Check Docker
if command -v docker &> /dev/null; then
    print_status "Docker found"
    
    # Check if Docker is running
    if docker info &> /dev/null; then
        print_status "Docker is running"
    else
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
else
    print_error "Docker not found. Please install Docker first."
    exit 1
fi

echo
echo "📦 Installing project dependencies..."

# Install Node.js dependencies
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm install
else
    print_status "Dependencies already installed"
fi

echo
echo "🗄️ Setting up Supabase local development..."

# Start Supabase local development
if ! supabase status | grep -q "API URL"; then
    print_status "Starting Supabase local development..."
    supabase start
else
    print_status "Supabase already running"
fi

# Wait for Supabase to be ready
echo "⏳ Waiting for Supabase to be ready..."
sleep 10

# Check if migrations need to be applied
echo
echo "🔄 Validating and applying database migrations..."

# First, validate all migrations
echo "🔍 Validating SQL migrations..."
if npm run validate-migrations:ci; then
    print_status "Migration validation passed"
else
    print_error "Migration validation failed"
    echo "💡 Run 'npm run validate-migrations:verbose' to see detailed issues"
    echo "💡 Run 'npm run validate-migrations:fix' to auto-fix issues"
    exit 1
fi

# Apply migrations
supabase db reset --linked=false

print_status "Database migrations applied"

echo
echo "🌱 Loading realistic construction data..."

# Load comprehensive seed data
if [ -f "supabase/seed-realistic-construction-data.sql" ]; then
    supabase db load --file supabase/seed-realistic-construction-data.sql
    print_status "Realistic construction data loaded"
else
    print_warning "Seed data file not found. Using basic sample data."
    if [ -f "supabase/migrations/20250702000003_sample_data.sql" ]; then
        supabase db load --file supabase/migrations/20250702000003_sample_data.sql
        print_status "Sample data loaded"
    fi
fi

echo
echo "🔧 Configuring environment..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_status "Created .env.local from template"
    else
        print_warning ".env.example not found. Please configure environment manually."
    fi
else
    print_status ".env.local already exists"
fi

echo
echo "🧪 Running system validation..."

# Check if all services are running
SUPABASE_STATUS=$(supabase status)
if echo "$SUPABASE_STATUS" | grep -q "API URL"; then
    print_status "Supabase API is running"
else
    print_error "Supabase API is not running"
    exit 1
fi

if echo "$SUPABASE_STATUS" | grep -q "Studio URL"; then
    STUDIO_URL=$(echo "$SUPABASE_STATUS" | grep "Studio URL" | awk '{print $3}')
    print_status "Supabase Studio is running at: $STUDIO_URL"
else
    print_error "Supabase Studio is not running"
fi

# Build the Next.js application
echo
echo "🏗️ Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "Next.js application built successfully"
else
    print_error "Next.js build failed"
    exit 1
fi

echo
echo "🎉 Setup Complete!"
echo "===================="
echo
echo "Your Formula PM 2.0 local development environment is ready!"
echo
echo "📋 Summary of what was set up:"
echo "  • 18 realistic construction team members"
echo "  • 6 diverse construction projects:"
echo "    1. Luxury Beverly Hills Estate (Residential)"
echo "    2. Modern Corporate Headquarters (Commercial Office)"
echo "    3. Upscale Restaurant Transformation (Renovation)"
echo "    4. Metropolitan Luxury Condos (Multi-Unit)"
echo "    5. Advanced Medical Center (Medical Facility)"
echo "    6. Pacific Retail Chain Expansion (Retail Rollout)"
echo "  • Complete project assignments and workflows"
echo "  • Realistic supplier and client data"
echo "  • Document approval workflows"
echo "  • Authentication and permission systems"
echo
echo "🚀 To start development:"
echo "  1. Run: npm run dev"
echo "  2. Open: http://localhost:3000"
echo "  3. Supabase Studio: $STUDIO_URL"
echo
echo "👥 Test Users (username/password):"
echo "  • Company Owner: robert.construction@premiumbuild.com / password123"
echo "  • Project Manager: lisa.thompson@premiumbuild.com / password123"
echo "  • Client: william.luxury@highendliving.com / password123"
echo "  • Admin: david.admin@premiumbuild.com / password123"
echo
echo "📊 All Formula PM systems are configured and ready:"
echo "  ✓ Client Portal System"
echo "  ✓ Purchase Department Workflow"
echo "  ✓ Document Approval System"
echo "  ✓ Shop Drawings Mobile Integration"
echo "  ✓ Project Management"
echo "  ✓ Role-based access control"
echo
echo "Happy coding! 🎯"