# Formula PM 2.0 - MCP Server Prompts Guide

## 🚀 **SETUP COMMANDS**

### Initial Installation
```bash
# Navigate to your project
cd C:\Users\Kerem\Desktop\formulapmv2

# Install critical MCP servers
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
claude mcp add github -s user -- npx -y @modelcontextprotocol/server-github
claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=YOUR_PROJECT_REF
claude mcp add sql-analyzer -s user -- uvx --from git+https://github.com/j4c0bs/mcp-server-sql-analyzer.git mcp-server-sql-analyzer

# Verify installation
claude mcp list
```

---

## 🔍 **DAILY DEVELOPMENT PROMPTS**

### Morning Health Check
```
Use Sentry MCP to show overnight errors in my Formula PM 2.0 construction app, GitHub MCP to show new issues, and Supabase MCP to check database performance for my project_milestones and scope_items tables.
```

### Before Coding Session
```
Prepare my Formula PM 2.0 development environment: Use GitHub MCP to pull latest changes, Supabase MCP to verify my 13-user role RLS policies are working, and Sentry MCP to clear any pending authentication errors.
```

### End of Day Review
```
Review my Formula PM 2.0 development progress: Use GitHub MCP to summarize my commits, Supabase MCP to check query performance on construction project tables, and Sentry MCP to review any new errors in my Next.js API routes.
```

---

## 🛡️ **ERROR MONITORING & DEBUGGING**

### Production Error Analysis
```
Use Sentry MCP to analyze recent errors in my Formula PM 2.0 construction app, focusing on:
1. Authentication failures across my 13 user roles
2. Database connection issues in Supabase
3. SQL migration validation errors
4. API route failures in /api/projects, /api/milestones, and /api/scope
5. Provide specific fixes for each error
```

### Database-Related Bug Fixing
```
I have a database issue in my [SPECIFIC_FEATURE]. Use Supabase MCP to:
1. Check my table relationships for projects, scope_items, and milestones
2. Validate my RLS policies for the affected user role
3. Review recent SQL migrations for potential issues
4. Suggest database fixes and optimization
```

### Authentication Bug Debugging
```
Debug authentication issues in my Formula PM 2.0 app: Use Sentry MCP to find auth-related errors, GitHub MCP to review my verifyAuth middleware, and Supabase MCP to check user_profiles table for role assignment issues.
```

---

## 🏗️ **CONSTRUCTION PROJECT SPECIFIC PROMPTS**

### Multi-Role System Validation
```
Validate my 13-user role system in Formula PM 2.0: Use Supabase MCP to check RLS policies for Company Owner, Project Manager, Field Worker, Client, and Subcontractor roles. Verify that cost data is hidden from field workers and clients can only see approved project data.
```

### Construction Workflow Testing
```
Test my construction project workflow: Use Supabase MCP to validate scope_items table relationships, GitHub MCP to review my project management components, and verify the complete workflow from project creation → milestone tracking → scope management → completion.
```

### Financial Data Security Audit
```
Audit financial data security in my construction app: Use Supabase MCP to verify RLS policies protect cost data, GitHub MCP to review financial calculation components, and Sentry MCP to monitor unauthorized access attempts to pricing information.
```

---

## 📊 **DATABASE OPTIMIZATION PROMPTS**

### Performance Analysis
```
Analyze my Formula PM 2.0 database performance: Use Supabase MCP to identify slow queries on projects, scope_items, milestones, and user_profiles tables. Check my indexes and suggest optimizations for construction project data access patterns.
```

### SQL Migration Validation
```
Validate my SQL migrations: Use SQL Analyzer MCP to check my migration files in supabase/migrations/, verify my 9 validation rules are working, and ensure my generated columns use proper STORED syntax for construction project calculations.
```

### Schema Optimization
```
Optimize my construction database schema: Use Supabase MCP to analyze my table relationships, check foreign key performance, and suggest improvements for my project management data structure with 13 user roles.
```

---

## 🚀 **FEATURE DEVELOPMENT PROMPTS**

### New Feature Development
```
I'm developing [FEATURE_NAME] for Formula PM 2.0. Help me by:
1. Using Supabase MCP to design the database schema
2. Using SQL Analyzer MCP to validate migration files
3. Using GitHub MCP to review my React components
4. Using Sentry MCP to set up error monitoring
5. Test the feature with different user roles
```

### Milestone System Enhancement
```
Enhance my milestone tracking system: Use Supabase MCP to check project_milestones table performance, GitHub MCP to review my MilestoneList and MilestoneForm components, and suggest improvements for construction project timeline management.
```

### Task Management Completion
```
Complete my P1.01 Task Management system: Use Supabase MCP to create the tasks table migration, SQL Analyzer MCP to validate the schema, and GitHub MCP to review my TaskList component that currently uses mock data.
```

### Client Portal Development
```
Develop my client portal: Use Supabase MCP to check client_users table structure, GitHub MCP to review client authentication flow, and verify clients can view project progress but not see internal cost data.
```

---

## 🔐 **SECURITY & COMPLIANCE PROMPTS**

### Security Audit
```
Perform security audit on Formula PM 2.0: Use GitHub MCP to scan for vulnerabilities, Supabase MCP to audit RLS policies for all 13 user roles, and Sentry MCP to check for security-related errors in my construction app.
```

### Permission System Validation
```
Validate my permission system: Use Supabase MCP to test RLS policies for Company Owner (full access), Project Manager (project-specific), Field Worker (limited data), Client (read-only approved data), and Subcontractor (restricted reporting).
```

### Data Privacy Compliance
```
Ensure data privacy compliance for construction industry: Use Supabase MCP to verify financial data protection, GitHub MCP to check authentication middleware, and confirm that sensitive project costs are hidden from unauthorized roles.
```

---

## 📱 **MOBILE & RESPONSIVE TESTING**

### Mobile Field Worker Testing
```
Test mobile functionality for field workers: Use Puppeteer MCP to test responsive design on mobile devices, verify field workers can access limited project data, and ensure construction site workflows work offline.
```

### Client Portal Mobile Testing
```
Test client portal on mobile devices: Use Puppeteer MCP to verify responsive design, test client authentication flow, and ensure clients can view project progress and milestones on tablets and phones.
```

---

## 🔄 **CI/CD & DEPLOYMENT PROMPTS**

### Pre-Deployment Checklist
```
Pre-deployment checklist for Formula PM 2.0: Use GitHub MCP to run CI/CD checks, Supabase MCP to validate all migrations, SQL Analyzer MCP to ensure migration quality, and run my Jest test suite for construction project workflows.
```

### Post-Deployment Monitoring
```
Monitor Formula PM 2.0 after deployment: Use Sentry MCP to watch for new errors, Supabase MCP to monitor database performance, verify all 13 user roles can access their features, and check construction project workflows.
```

### Production Health Check
```
Production health check: Use Sentry MCP to show recent errors, Supabase MCP to check database performance metrics, and GitHub MCP to verify deployment success for my construction project management system.
```

---

## 🎯 **CODE QUALITY & OPTIMIZATION**

### Code Review Process
```
Review my pull request for Formula PM 2.0: Use GitHub MCP to analyze code changes, SQL Analyzer MCP to validate SQL modifications, Supabase MCP to check database impact, and suggest improvements before merging.
```

### Performance Optimization
```
Optimize Formula PM 2.0 performance: Use Supabase MCP to identify slow queries, GitHub MCP to review React component optimization, check my useMilestones and useProjects hooks for efficiency, and suggest specific improvements.
```

### TypeScript & Testing Enhancement
```
Enhance my TypeScript and testing: Use GitHub MCP to review my types in src/types/, check my Jest configuration for API routes and components, and suggest improvements to my test coverage for construction workflows.
```

---

## 🛠️ **SPECIFIC COMPONENT TESTING**

### API Route Testing
```
Test my API routes: Use Sentry MCP to monitor errors in /api/projects, /api/milestones, /api/scope, and /api/tasks. Use Supabase MCP to verify database operations and check authentication middleware performance.
```

### Component Performance Testing
```
Test my React components: Use GitHub MCP to review MilestoneList, TaskList, and ProjectWorkspace components. Check for optimization opportunities and ensure they work correctly with my 13-user role system.
```

### Database Migration Testing
```
Test my SQL migrations: Use SQL Analyzer MCP to validate migration files, Supabase MCP to check migration execution, and verify my 9 validation rules catch common issues in construction project database changes.
```

---

## 📈 **ADVANCED ANALYSIS PROMPTS**

### Business Logic Validation
```
Validate my construction business logic: Use Supabase MCP to check scope_items calculations, milestone dependency logic, and project budget tracking. Ensure my construction project workflows match industry standards.
```

### Data Integrity Check
```
Check data integrity in Formula PM 2.0: Use Supabase MCP to verify foreign key relationships, check for orphaned records, and validate that my construction project data remains consistent across all user roles.
```

### Scalability Analysis
```
Analyze Formula PM 2.0 scalability: Use Supabase MCP to check database performance under load, GitHub MCP to review component efficiency, and suggest improvements for handling multiple construction projects simultaneously.
```

---

## 🎨 **SPECIFIC FEATURE PROMPTS**

### Scope Management Enhancement
```
Enhance my scope management: Use Supabase MCP to optimize scope_items table queries, GitHub MCP to review my Excel import functionality, and ensure scope categorization (Construction, Millwork, Electrical, Mechanical) works correctly.
```

### Purchase Department Integration
```
Integrate purchase department workflows: Use Supabase MCP to design purchase_orders table relationships, check supplier management, and verify purchase director and specialist roles have appropriate access levels.
```

### Document Approval System
```
Implement document approval system: Use Supabase MCP to design approval workflow tables, GitHub MCP to review document management components, and ensure proper permission levels for document access across user roles.
```

---

## 💡 **QUICK TROUBLESHOOTING PROMPTS**

### Authentication Issues
```
Fix authentication issues: Use Sentry MCP to find auth errors, Supabase MCP to check user_profiles table, and GitHub MCP to review my verifyAuth middleware for Formula PM 2.0.
```

### Database Connection Problems
```
Fix database connection issues: Use Supabase MCP to check connection health, review my database URL configuration, and verify my RLS policies aren't blocking legitimate access.
```

### Build/Deployment Errors
```
Fix build errors: Use GitHub MCP to check CI/CD pipeline failures, review my Next.js configuration, and ensure all TypeScript types are properly defined for construction project features.
```

---

## 🔧 **MAINTENANCE PROMPTS**

### Weekly Health Check
```
Weekly Formula PM 2.0 health check: Use Sentry MCP to review error trends, Supabase MCP to check database performance over the week, and GitHub MCP to analyze code quality metrics.
```

### Monthly Security Review
```
Monthly security review: Use GitHub MCP to scan for new vulnerabilities, Supabase MCP to audit RLS policies, and Sentry MCP to review security-related errors in my construction app.
```

### Quarterly Performance Analysis
```
Quarterly performance analysis: Use Supabase MCP to analyze database growth and optimization needs, GitHub MCP to review code quality trends, and plan improvements for my construction project management system.
```

---

## 📝 **DOCUMENTATION & REPORTING**

### Feature Documentation
```
Document my [FEATURE_NAME]: Use GitHub MCP to review code comments, create API documentation, and generate user guide content for the specific construction project management feature.
```

### Performance Report
```
Generate performance report: Use Supabase MCP to create database performance metrics, Sentry MCP to summarize error trends, and create a comprehensive report on Formula PM 2.0 system health.
```

### Deployment Report
```
Create deployment report: Use GitHub MCP to summarize changes, Supabase MCP to document database modifications, and create a comprehensive deployment summary for Formula PM 2.0.
```

---

## 🎯 **FORMULA PM 2.0 SPECIFIC CONTEXTS**

When using these prompts, always mention:
- **App Name**: Formula PM 2.0 construction project management system
- **User Roles**: 13 specific roles (Company Owner, Project Manager, Field Worker, Client, etc.)
- **Tech Stack**: Next.js 15, Supabase, TypeScript, Tailwind CSS
- **Key Features**: Project management, milestone tracking, scope management, user roles
- **Current Status**: Wave 1 Foundation complete, P1.02 Milestone Tracking 90% done

This context helps MCPs provide more accurate and relevant assistance for your construction industry application.