# Formula PM 2.0 Local Development Setup Guide

## Overview

This guide provides complete instructions for setting up a fully functional local development environment for Formula PM 2.0 with comprehensive realistic construction data.

## What You'll Get

### 18 Realistic Construction Team Members
- **Management Level (5 roles)**: Company Owner, General Manager, Deputy General Manager, Technical Director, Admin
- **Project Management (4 roles)**: 2 Project Managers, 1 Architect, 1 Technical Engineer
- **Operations (4 roles)**: Purchase Director, Purchase Specialist, 2 Field Workers
- **Clients (3 roles)**: Representatives from different industries
- **Subcontractors (3 roles)**: Electrical, Plumbing, HVAC specialists

### 6 Diverse Construction Projects
1. **Luxury Beverly Hills Estate** - $3.5M residential high-end custom home
2. **Modern Corporate Headquarters** - $2.8M commercial office building
3. **Upscale Restaurant Transformation** - $850K restaurant renovation
4. **Metropolitan Luxury Condos** - $4.2M luxury condominium complex
5. **Advanced Medical Center** - $1.65M medical office build-out
6. **Pacific Retail Chain Expansion** - $2.4M retail store chain rollout

### Complete System Integration
- Client Portal System with realistic client data
- Purchase Department Workflow with approved suppliers
- Document Approval System with actual construction documents
- Shop Drawings Mobile Integration
- Project Management with multi-project assignments
- Role-based access control and permissions

## Prerequisites

### System Requirements
- **Operating System**: Windows 10/11 with WSL2, macOS, or Linux
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Docker**: Latest version with Docker Desktop running
- **Git**: Latest version

### Memory Requirements
- **RAM**: Minimum 8GB, recommended 16GB
- **Disk Space**: Minimum 5GB free space
- **Docker Memory**: Allocated at least 4GB to Docker

## Quick Setup (Automated)

### Option 1: One-Command Setup
```bash
# Navigate to project directory
cd /path/to/formulapmv2

# Run automated setup script
./scripts/setup-local-dev.sh
```

The script will:
- Install Supabase CLI if needed
- Start Supabase local development
- Apply all database migrations
- Load comprehensive realistic construction data
- Configure environment variables
- Build and validate the application

### Option 2: Manual Setup

If you prefer manual setup or the script fails, follow these steps:

#### Step 1: Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Supabase CLI (if not already installed)
# On Windows WSL/Linux:
curl -fsSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.deb -o supabase.deb
sudo dpkg -i supabase.deb
rm supabase.deb

# On macOS:
brew install supabase/tap/supabase
```

#### Step 2: Start Supabase
```bash
# Start Supabase local development
supabase start

# This will start:
# - PostgreSQL database
# - Supabase API
# - Supabase Studio
# - Authentication service
# - Storage service
```

#### Step 3: Setup Database
```bash
# Reset database and apply all migrations
supabase db reset --linked=false

# Load comprehensive realistic construction data
supabase db load --file supabase/seed-realistic-construction-data.sql
```

#### Step 4: Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# The .env.local file is already configured for local development
# No changes needed for basic setup
```

#### Step 5: Build and Test
```bash
# Build the Next.js application
npm run build

# Start development server
npm run dev
```

## Access Information

### Application URLs
- **Main Application**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (database admin)
- **Supabase API**: http://localhost:54321
- **Email Testing**: http://localhost:54324 (Inbucket)

### Test User Accounts

All test users have the password: `password123`

#### Core Test Accounts (@formulapm.com)
- **Admin**: `admin@formulapm.com`
- **Company Owner**: `owner@formulapm.com`
- **Project Manager**: `pm@formulapm.com`
- **Client**: `client@formulapm.com`
- **Subcontractor**: `subcontractor@formulapm.com`

#### Additional Sample Users (Legacy - for reference)
- **General Manager**: `sarah.mitchell@premiumbuild.com`
- **Technical Director**: `jennifer.chen@premiumbuild.com`
- **Commercial PM**: `james.williams@premiumbuild.com`
- **Architect**: `emily.design@premiumbuild.com`
- **Engineer**: `carlos.structural@premiumbuild.com`

#### Operations Team
- **Purchase Director**: `amanda.procurement@premiumbuild.com`
- **Purchase Specialist**: `kevin.buyer@premiumbuild.com`
- **Site Supervisor**: `maria.supervisor@premiumbuild.com`
- **Construction Foreman**: `tony.foreman@premiumbuild.com`

#### Client Representatives
- **Primary Client**: `client@formulapm.com` (recommended for testing)
- **Luxury Client**: `william.luxury@highendliving.com` (legacy)
- **Corporate Client**: `jessica.corporate@innovativeoffice.com` (legacy)
- **Restaurant Client**: `marcus.restaurant@culinarygroup.com` (legacy)

#### Subcontractors
- **Primary Subcontractor**: `subcontractor@formulapm.com` (recommended for testing)
- **Electrical**: `elena.electrical@powerpro.com` (legacy)
- **Plumbing**: `roberto.plumbing@aquaflow.com` (legacy)
- **HVAC**: `isabella.hvac@climatecontrol.com` (legacy)

## Project Data Overview

### Project 1: Luxury Beverly Hills Estate
- **Type**: Residential High-End Custom Home
- **Budget**: $3,500,000
- **Status**: Active
- **Key Features**: Smart home automation, premium millwork, natural stone
- **Project Manager**: Lisa Thompson

### Project 2: Modern Corporate Headquarters
- **Type**: Commercial Office Building
- **Budget**: $2,800,000
- **Status**: Active
- **Key Features**: Sustainable design, advanced HVAC, smart building systems
- **Project Manager**: James Williams

### Project 3: Upscale Restaurant Transformation
- **Type**: Restaurant Renovation
- **Budget**: $850,000
- **Status**: Active
- **Key Features**: Commercial kitchen, high-end finishes, specialized plumbing
- **Project Manager**: Lisa Thompson

### Project 4: Metropolitan Luxury Condos
- **Type**: Luxury Condominium Complex
- **Budget**: $4,200,000
- **Status**: Planning
- **Key Features**: 24 units, premium amenities, standardized finishes
- **Project Manager**: James Williams

### Project 5: Advanced Medical Center
- **Type**: Medical Office Build-Out
- **Budget**: $1,650,000
- **Status**: Planning
- **Key Features**: Surgical suites, clean rooms, medical-grade systems
- **Project Manager**: Lisa Thompson

### Project 6: Pacific Retail Chain Expansion
- **Type**: Retail Store Chain Rollout
- **Budget**: $2,400,000
- **Status**: Bidding
- **Key Features**: 8 locations, standardized fixtures, brand consistency
- **Project Manager**: James Williams

## System Features to Test

### Client Portal System
1. Login as a client user
2. View assigned projects and progress
3. Review and approve documents
4. Access project communications
5. View project notifications

### Purchase Department Workflow
1. Login as purchase director/specialist
2. Create purchase requests
3. Manage supplier relationships
4. Process approvals
5. Track deliveries

### Document Approval System
1. Upload project documents
2. Route for internal approvals
3. Submit to clients for review
4. Track approval status
5. Manage document versions

### Shop Drawings Mobile Integration
1. Access shop drawings on mobile
2. Upload progress photos
3. Mark items as complete
4. Add field notes and comments

### Project Management
1. View project dashboards
2. Manage scope items
3. Track project progress
4. Assign team members
5. Generate reports

## Database Schema

The local database includes:
- **User Profiles**: 18 realistic construction team members
- **Projects**: 6 diverse construction projects
- **Clients**: 6 client companies across different industries
- **Suppliers**: 8 specialized construction suppliers
- **Scope Items**: 16 detailed scope items across all projects
- **Documents**: 14 construction documents with approval workflows
- **Project Assignments**: Team assignments across multiple projects

## Troubleshooting

### Common Issues

#### Supabase Won't Start
```bash
# Check Docker is running
docker ps

# Stop and restart Supabase
supabase stop
supabase start
```

#### Database Connection Issues
```bash
# Reset database
supabase db reset --linked=false

# Check database status
supabase status
```

#### Permission Errors
```bash
# On WSL, ensure files have correct permissions
chmod -R 755 /mnt/c/Users/Kerem/Desktop/formulapmv2
```

#### Build Failures
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables

The `.env.local` file is pre-configured with:
- Supabase local development URLs
- Database connection strings
- JWT secrets for development
- Feature flags enabled
- Development tools enabled

### Performance Optimization

For better performance:
1. Allocate at least 4GB RAM to Docker
2. Use SSD storage for project directory
3. Close unnecessary applications
4. Enable Docker BuildKit

## Development Workflow

### Starting Development
```bash
# Start Supabase (if not already running)
supabase start

# Start Next.js development server
npm run dev
```

### Making Changes
1. Database changes: Create new migration files
2. Frontend changes: Edit components in `src/components/`
3. API changes: Edit route handlers in `src/app/api/`
4. Type definitions: Update files in `src/types/`

### Testing
```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Run tests (when available)
npm run test
```

## Next Steps

After setup is complete, you can:
1. Explore the application with different user roles
2. Test all core Formula PM features
3. Modify the realistic construction data
4. Add new projects or team members
5. Customize the application for your needs

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the Supabase local development logs
3. Verify all prerequisites are installed
4. Check Docker resource allocation
5. Ensure all ports are available (3000, 54321-54328)

The setup provides a complete, realistic construction company environment for testing and development of Formula PM 2.0.