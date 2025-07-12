# Formula PM 2.0

A comprehensive construction project management system built with Next.js 15 and Supabase.

## 🏗️ Project Overview

Formula PM 2.0 is a modern construction project management platform designed to streamline project workflows, scope management, document approvals, and team collaboration across 13 different user roles.

## 🚀 Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Supabase (Database + Authentication)
- **UI Components**: Shadcn/ui + Tailwind CSS
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth with custom RBAC
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Deployment**: Vercel (Frontend) + Supabase (Backend)

## 👥 User Roles Supported

1. Company Owner
2. General Manager
3. Deputy General Manager
4. Technical Director
5. Admin
6. Project Manager
7. Architect
8. Technical Engineer
9. Purchase Director
10. Purchase Specialist
11. Field Worker
12. Client
13. Subcontractor

## 🎯 Key Features

### Wave 1 - Foundation ✅ COMPLETE
- ✅ Authentication system with 13 user roles
- ✅ Global sidebar navigation with permission-based filtering
- ✅ Project creation and management system
- ✅ Core UI framework with responsive design
- ✅ Database schema with RLS policies

### Wave 2 - Business Logic ✅ COMPLETE
- ✅ 4-category scope management (Construction, Millwork, Electrical, Mechanical)
- ✅ Document approval workflows
- ✅ Shop drawings integration
- ✅ Purchase department workflows
- ✅ Material specifications system

### Wave 3 - Testing & Admin Features ✅ COMPLETE
- ✅ Comprehensive testing framework (Jest + React Testing Library)
- ✅ **Admin User Impersonation System** 🎭
- ✅ Multi-project Jest configuration
- ✅ API route testing patterns
- ✅ Component integration testing
- ✅ Authentication flow testing

### Admin Impersonation Features 🎭
- **Security-First Design**: Role-based access with hierarchy protection
- **Visual Indicators**: Clear banners and icons during impersonation
- **Session Management**: 4-hour timeout with sessionStorage
- **Easy Navigation**: Switch User button in header dropdown
- **Quick Return**: Return to Admin from anywhere
- **Comprehensive Audit**: Full logging and monitoring capabilities

### Wave 4 - External Access & Mobile
- 📋 Client portal system
- 📋 Mobile field interface (PWA)
- 📋 Subcontractor access controls

### Wave 5 - Optimization
- 📋 Performance optimization
- 📋 Real-time collaboration features
- 📋 Production deployment setup

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/keramy/FORMULAPMV2.git
cd FORMULAPMV2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Supabase:
- Create a new Supabase project
- Add your Supabase URL and anon key to `.env.local`
- Run the database migrations

5. Start the development server:
```bash
npm run dev
```

## 📁 Project Structure

```
FORMULAPMV2/
├── Planing App/                 # Comprehensive project documentation
│   ├── Wave-1-Foundation/       # Core system architecture
│   ├── Wave-2-Business-Logic/   # Business workflow implementations
│   ├── Wave-3-External-Access/  # Client and mobile interfaces
│   ├── Wave-4-Optimization/     # Performance and deployment
│   └── Implementation-Support/  # Development guidelines
├── Patterns/                    # Development patterns and templates
├── app/                         # Next.js 15 app directory
├── components/                  # Reusable UI components
├── lib/                         # Utility functions and configurations
├── types/                       # TypeScript type definitions
└── public/                      # Static assets
```

## 🔐 Authentication & Permissions

The system implements a comprehensive role-based access control (RBAC) system:

- **13 distinct user roles** with granular permissions
- **Global navigation** with authentication-based filtering
- **Project-level assignments** for role-based data access
- **Row Level Security (RLS)** at the database level

## 🧭 Global Navigation

Users can access key features directly through the global sidebar:
- **Tasks**: Role-filtered task management
- **Scope**: 4-category scope items with permissions
- **Shop Drawings**: Drawing management and approvals
- **Clients**: Client relationship management
- **Procurement**: Purchase orders and supplier management

## 🔍 SQL Migration Validation

Formula PM 2.0 includes a comprehensive SQL migration validation system to ensure database integrity and best practices.

### Features
- **Automated validation** of SQL migrations before deployment
- **9 validation rules** covering syntax, references, and naming conventions
- **Auto-fix capabilities** for common issues
- **CI/CD integration** with GitHub Actions
- **Pre-commit hooks** to prevent invalid SQL from being committed
- **Migration template generator** for consistent migration structure

### Usage

#### Validate all migrations:
```bash
npm run validate-migrations
```

#### Validate with auto-fix:
```bash
npm run validate-migrations:fix
```

#### Validate specific file:
```bash
npm run validate-migrations:file path/to/migration.sql
```

#### Generate new migration:
```bash
npm run generate-migration -- "description of migration"
```

#### Validate before Supabase operations:
```bash
npm run supabase:start    # Validates before starting Supabase
npm run supabase:reset    # Validates before resetting database
```

### Validation Rules
1. **Generated Column Syntax** - Ensures proper GENERATED ALWAYS AS syntax
2. **Foreign Key References** - Validates referenced tables exist
3. **Subquery Detection** - Prevents subqueries in generated columns
4. **Missing STORED Keywords** - Ensures generated columns use STORED
5. **Comma Placement** - Validates proper SQL syntax
6. **Table References** - Checks for valid table references
7. **Column Definitions** - Validates data types and constraints
8. **Index Creation** - Ensures proper naming conventions
9. **Constraint Naming** - Validates constraint naming standards

### CI/CD Integration
- **GitHub Actions** automatically validate SQL on pull requests
- **Pre-commit hooks** prevent committing invalid SQL
- **Auto-commenting** on PRs with validation results
- **Performance checks** for potential issues

### Migration Templates
The generator provides templates for:
- **Table Creation** - Complete table with RLS, triggers, and policies
- **Column Addition** - Properly formatted column additions
- **Index Creation** - Performance-optimized indexes
- **Constraint Addition** - Various constraint types
- **Custom Migrations** - Flexible template for complex operations

## 📖 Documentation

Comprehensive documentation is available in the following locations:

### Planning & Architecture
- **Development Plan**: `Planing App/updated_development_plan.md`
- **User Workflows**: `Planing App/management_user_workflow.md`
- **Architecture Guides**: Individual wave documentation
- **Implementation Patterns**: `Planing App/Patterns/` directory

### Feature Documentation
- **🎭 Admin Impersonation Guide**: `docs/ADMIN_IMPERSONATION_GUIDE.md`
- **SQL Migration Guidelines**: `POSTGRESQL_SUPABASE_MIGRATION_GUIDELINES.md`
- **Testing Framework**: `docs/TESTING_GUIDE.md`
- **Authentication Flow**: `AUTH_FLOW_DIAGRAM.md`

### Quick Start Guides
- **Test Users & Credentials**: All test users use password `testpass123`
- **Admin Access**: Login as `admin@formulapm.com` for full system access
- **User Impersonation**: See admin guide for switching between user types

## 🚢 Deployment

The application is designed for deployment on:
- **Frontend**: Vercel
- **Backend**: Supabase
- **Database**: Supabase PostgreSQL
- **File Storage**: Supabase Storage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions, please contact the development team or create an issue in this repository.

---

**Formula PM 2.0** - Streamlining construction project management with modern technology.