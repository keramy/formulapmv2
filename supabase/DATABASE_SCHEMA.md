# Formula PM 2.0 Database Schema Documentation

## Overview
Complete PostgreSQL database schema for Formula PM 2.0 supporting 13 distinct user roles with comprehensive construction project management features.

## Migration Files

### Core Schema Migrations
1. **20250702000000_migrations_table.sql** - Migration tracking system
2. **20250702000001_initial_schema.sql** - Core tables for users, projects, scope items, documents
3. **20250702000002_row_level_security.sql** - Comprehensive RLS policies for all user types
4. **20250702000003_sample_data.sql** - Test data for development (not for production)
5. **20250702000004_audit_system.sql** - Audit logging, notifications, tasks, field reports
6. **20250702000005_financial_tender_system.sql** - Financial tracking, invoicing, tender management
7. **20250702000006_shop_drawings_mobile.sql** - Shop drawings workflow and mobile features

## Database Tables

### User Management
- **user_profiles** - Extended user information for all 13 roles
- **clients** - Client company information
- **suppliers** - Supplier database with performance tracking
- **mobile_devices** - Registered mobile devices for field workers

### Project Management
- **projects** - Main project records with budget tracking
- **project_assignments** - Team member assignments to projects
- **project_budgets** - Budget allocation by category
- **project_announcements** - Bulletins and announcements

### Scope Management
- **scope_items** - Detailed work items with cost tracking
- **scope_dependencies** - Dependencies between scope items

### Document Management
- **documents** - All project documents with version control
- **document_approvals** - Approval workflow tracking
- **shop_drawings** - Specialized shop drawing management
- **shop_drawing_revisions** - Drawing revision history
- **shop_drawing_comments** - Comments and markups on drawings
- **shop_drawing_approvals** - Multi-level approval workflow
- **drawing_sets** - Drawing packages for submission

### Financial Management
- **purchase_orders** - Purchase order tracking
- **invoices** - Client and supplier invoices
- **invoice_items** - Line items for invoices
- **payments** - Payment tracking
- **tenders** - Tender/RFQ management
- **tender_items** - BOQ for tenders
- **tender_submissions** - Supplier bid submissions
- **tender_submission_items** - Detailed bid pricing
- **tender_evaluations** - Bid evaluation scores

### Task & Activity Management
- **tasks** - Task assignments and tracking
- **task_comments** - Comments on tasks
- **field_reports** - Daily/weekly field reports
- **field_photos** - Geotagged photo uploads
- **mobile_forms** - Customizable mobile forms
- **mobile_form_submissions** - Form submission data

### System & Audit
- **audit_logs** - Comprehensive audit trail
- **activity_summary** - User activity aggregation
- **notifications** - User notifications
- **messages** - Direct messaging between users
- **system_settings** - System configuration
- **permission_templates** - Role-based permission definitions
- **dashboard_widgets** - Dashboard configuration by role
- **user_dashboard_settings** - User-specific dashboard customization
- **mobile_sync_queue** - Offline action queue for mobile

## User Roles & Access Control

### Management Roles (Full Access)
1. **company_owner** - Ultimate system access
2. **general_manager** - Company-wide operations
3. **deputy_general_manager** - Delegated authority
4. **technical_director** - Technical oversight
5. **admin** - System administration

### Project Roles (Project-Specific Access)
6. **project_manager** - Complete project control
7. **architect** - Design and drawing management
8. **technical_engineer** - BOQ and cost analysis

### Operational Roles (Function-Specific Access)
9. **purchase_director** - Procurement oversight
10. **purchase_specialist** - Day-to-day procurement

### Field Role (Limited Access)
11. **field_worker** - Site execution, no pricing visibility

### External Roles (Restricted Access)
12. **client** - Project review and approvals
13. **subcontractor** - Limited reporting access

## Key Features

### Row Level Security (RLS)
- All tables have RLS policies enforced
- Helper functions for role checking
- Cost data protection for sensitive roles
- Client visibility controls

### Automatic Features
- Auto-generated sequential numbers (PO, Invoice, etc.)
- Timestamp management with triggers
- Computed fields for totals and variances
- Activity tracking and audit logging

### Performance Optimization
- Comprehensive indexing strategy
- Optimized for common query patterns
- Partitioning ready for large datasets

### Mobile Support
- Offline queue for field operations
- Photo geotagging
- Sync status tracking
- Mobile-optimized forms

## Security Considerations

### Data Protection
- Cost tracking restricted to authorized roles
- Financial data hidden from field workers and clients
- Document visibility controls
- Approval workflow enforcement

### Audit & Compliance
- Complete audit trail for all actions
- User activity tracking
- Permission change logging
- Data retention policies

## Integration Points

### Supabase Features
- Auth integration for user management
- Storage integration for file uploads
- Realtime subscriptions for live updates
- Edge functions for complex operations

### External Systems
- Excel import/export for scope items
- Document management system integration
- Financial system integration
- Mobile app synchronization

## Database Conventions

### Naming Conventions
- Tables: snake_case plural (e.g., scope_items)
- Columns: snake_case (e.g., created_at)
- Indexes: idx_table_column
- Constraints: table_constraint_type

### Data Types
- UUIDs for all primary keys
- TIMESTAMPTZ for all timestamps
- JSONB for flexible metadata
- Arrays for multi-value fields

### Best Practices
- Soft deletes via is_active flags
- Version tracking for documents
- Computed columns for derived values
- Proper foreign key constraints