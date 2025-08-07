# Formula PM 2.0 Database Schema Documentation

## Overview
This directory contains the complete database schema implementation for Formula PM 2.0 Wave 1 Foundation. The schema is designed to support 13 distinct user types with comprehensive Row Level Security (RLS) policies, optimized performance, and strict data validation.

## Migration Files

### 20250702000000_migrations_table.sql
- Creates the migration tracking table
- Ensures proper version control for database changes

### 20250702000001_initial_schema.sql
- Complete database schema with all core tables
- Includes all enums, tables, relationships, and constraints
- Implements auto-update triggers and computed fields
- Performance-optimized indexes for all tables

### 20250702000002_row_level_security.sql
- Comprehensive RLS policies for all 13 user types
- Granular access control with helper functions
- Role-based data filtering and security boundaries

### 20250702000003_sample_data.sql
- Sample data for testing and validation
- Includes all user types with realistic project data
- Test data for validating RLS policies and computed fields

## Database Schema Overview

### Core Tables

#### User Management
- **user_profiles**: Extended user information for all 13 user types
- **clients**: Client company information and preferences
- **suppliers**: Supplier database with performance tracking

#### Project Management
- **projects**: Main project table with budget and timeline tracking
- **project_assignments**: Team member assignments with role-based responsibilities

#### Scope Management
- **scope_items**: Detailed scope items with cost tracking and business logic
- **scope_dependencies**: Dependency relationships between scope items

#### Document Management
- **documents**: Document storage with version control and client visibility
- **document_approvals**: Approval workflow for internal and client approvals

### User Roles (13 Types)

#### Management Level (5 roles)
1. **company_owner** - Ultimate system access
2. **general_manager** - Company-wide operations
3. **deputy_general_manager** - Delegated authority
4. **technical_director** - Technical oversight
5. **admin** - System administration

#### Project Level (3 roles)
6. **project_manager** - Complete project control
7. **architect** - Design authority
8. **technical_engineer** - Technical support and cost tracking

#### Operational Level (2 roles)
9. **purchase_director** - Procurement oversight
10. **purchase_specialist** - Procurement execution

#### Field Level (1 role)
11. **field_worker** - Site execution (limited access)

#### External Access (2 roles)
12. **client** - Review and approval authority
13. **subcontractor** - Limited reporting access

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- Role-based access control for all operations
- Cost data protection for sensitive financial information
- Helper functions for efficient permission checking

### Data Protection
- **Cost Tracking Access**: Limited to technical office and purchasing roles
- **Field Worker Restrictions**: No access to pricing or cost data
- **Client Limitations**: Only client-visible documents and basic scope information
- **Management Override**: Full access for management roles

## Performance Optimizations

### Indexes
- Strategic indexes on all frequently queried columns
- Composite indexes for complex queries
- GIN indexes for array fields (assigned_to, dependencies)
- Partial indexes for conditional queries

### Computed Fields
- **total_price**: Automatically calculated from quantity × unit_price
- **final_price**: Includes markup percentage calculation
- **cost_variance**: Tracks difference between initial and actual costs

### Triggers
- Automatic timestamp updates on all tables
- Auto-generation of sequential item numbers for scope items
- Data validation and consistency checks

## Business Logic Implementation

### Scope Items Core Fields
- **item_no**: Auto-generated sequential number per project
- **item_code**: Optional client-provided code for integration
- **description**: Required detailed description
- **quantity**: Numeric quantity with validation
- **unit_price**: Base unit pricing
- **initial_cost**: Original estimated cost (restricted access)
- **actual_cost**: Real incurred cost (restricted access)

### Cost Tracking Permissions
Only these roles can access cost data:
- company_owner, general_manager, deputy_general_manager
- technical_director, admin
- technical_engineer, purchase_director, purchase_specialist

## Migration Usage

### Development Setup
```bash
# Run migrations in order
supabase db reset
# This will run all migrations in sequence
```

### Production Deployment
```bash
# Apply migrations one by one
supabase db push
```

### Validation
Use the provided sample data to test:
- All user role permissions
- RLS policy enforcement
- Computed field calculations
- Trigger functionality

## File Structure
```
supabase/
├── migrations/
│   ├── 20250702000000_migrations_table.sql
│   ├── 20250702000001_initial_schema.sql
│   ├── 20250702000002_row_level_security.sql
│   └── 20250702000003_sample_data.sql
├── config.toml
├── seed.sql
└── README.md
```

## Testing and Validation

### Sample Data Includes
- 13 user profiles (one for each role)
- 3 clients with different project types
- 4 suppliers with various specializations
- 3 projects in different statuses
- Multiple scope items with dependencies
- Documents with approval workflows

### Validation Queries
The sample data migration includes commented validation queries to verify:
- Record counts in all tables
- Computed field calculations
- RLS policy enforcement
- Data integrity constraints

## TypeScript Integration

### Database Types
Complete TypeScript definitions are provided in:
- `/src/types/database.ts` - All database interfaces and types
- `/src/lib/database.ts` - Database utilities and validation functions

### Key Features
- Full type safety for all database operations
- Role-based data filtering functions
- Permission validation helpers
- Database health check utilities

## Next Steps

This database schema serves as the foundation for Formula PM Wave 1. The following components can now be built:

1. **Backend API Layer** - REST endpoints using these database types
2. **Frontend UI Components** - User interfaces with proper role-based access
3. **Authentication System** - Integration with Supabase Auth
4. **File Management** - Document storage and approval workflows

## Security Considerations

### Production Deployment
- Ensure proper environment variables are set
- Review and test all RLS policies
- Validate user permissions in application layer
- Monitor database performance with provided indexes

### Ongoing Maintenance
- Regular backup and migration procedures
- Performance monitoring of query execution
- Security audits of user access patterns
- Updates to RLS policies as business requirements evolve

## Contact
For questions about the database schema implementation, refer to the Formula PM development orchestration documentation in `/Patterns/formula-pm-development-orchestration.md`.