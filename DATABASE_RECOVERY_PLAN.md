# Database Recovery & Clean Schema Creation Plan
*Created: January 24, 2025*
*Status: Ready to Execute*

## Current Situation Summary

### What Happened:
- **Local Database**: Had 65 tables from complex migrations, now empty after reset
- **Cloud Database**: Has 9 core tables, working but simple
- **App Configuration**: Points to local database (127.0.0.1:54321)
- **Performance Issues**: Were on wrong database (outdated CSV report)
- **All Migrations**: Safely backed up in `supabase/migrations/backup/`

### Key Discovery:
Your business needs **12-15 core tables**, not 65 complex ones or just 9 minimal ones.

## The Plan: Clean Database Schema From Scratch

### Phase 1: Schema Design (30 minutes)
**Goal**: Create optimal 12-15 table schema based on business workflow

#### Core Tables Needed:

**User & Authentication (3 tables):**
- `user_profiles` - All user roles and information
- `clients` - Client company data
- `project_assignments` - Project team assignments

**Project Management (2 tables):**
- `projects` - Main project information
- `project_milestones` - Timeline and milestones

**Scope Management (3 tables):**
- `scope_items` - Core business entity (scope items)
- `material_specs` - Material specifications  
- `material_scope_links` - Material-scope relationships

**Financial Tracking (2 tables):**
- `suppliers` - Vendor/supplier management
- `purchase_orders` - Purchase tracking

**Document Management (2 tables):**
- `documents` - File management
- `document_approvals` - Workflow approvals

**System (1 table):**
- `migrations` - Schema change tracking

#### Performance Features Built-In:
- ✅ Proper indexes on all foreign keys
- ✅ Optimized RLS policies with `(SELECT auth.uid())`
- ✅ No direct `auth.uid()` performance killers
- ✅ Clean relationships and constraints

### Phase 2: Local Database Setup (15 minutes)
1. **Create**: `20250124000001_clean_business_schema.sql`
2. **Clear**: All existing migrations from local
3. **Apply**: Clean schema to local database
4. **Test**: Basic app connectivity

### Phase 3: Validation & Testing (30 minutes)
1. **Business Workflow Validation**:
   - User authentication and roles
   - Project creation and management
   - Scope item CRUD operations
   - Material specifications
   - Document management

2. **Performance Validation**:
   - Run Performance Security Lints
   - Verify no auth.uid() issues
   - Check proper indexing

### Phase 4: Cloud Synchronization (15 minutes)
1. **Compare**: New local schema vs cloud (9 tables)
2. **Decide**: Update cloud OR keep separate
3. **Document**: Schema differences

## Benefits of This Approach:
- ✅ **Clean slate** - No legacy complexity
- ✅ **Business-focused** - Only necessary tables
- ✅ **Performance optimized** - Built with best practices
- ✅ **Maintainable** - Easy to understand
- ✅ **Scalable** - Can grow with business needs

## Business Workflow Supported:
1. **User Management** - Role-based access (6 roles)
2. **Project Management** - Full project lifecycle
3. **Scope Management** - Core business functionality
4. **Purchase Management** - Vendor and procurement
5. **Financial Management** - Budget and cost tracking
6. **Client Portal** - External client access

## Current Configuration:
- **Local Supabase**: Running on http://127.0.0.1:54321
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **App Config**: Points to local (.env.local)
- **Migrations Backup**: `supabase/migrations/backup/` (65 migration files)

## Next Session Tasks:
1. **Start with Phase 1** - Design the 12-15 table schema
2. **Create migration file** with clean, optimized structure
3. **Apply to local database** and test
4. **Validate business workflows** work correctly

## Files to Reference:
- `CLAUDE.md` - Business requirements and workflow
- `.env.local` - Current app configuration
- `supabase/migrations/backup/` - Legacy migrations for reference
- Your cloud database tables (9 tables) - Current production state

## Key Decision Made:
**Create 12-15 table schema** that balances simplicity with business needs, optimized for performance from the start.

---
*Ready to continue tomorrow with clean database creation!*