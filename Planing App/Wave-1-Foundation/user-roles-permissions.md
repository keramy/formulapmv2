# User Roles & Permissions Matrix - Wave 1 Foundation
## Enhanced Coordinator Agent Implementation

### **🎯 OBJECTIVE**
Define and implement a comprehensive permission matrix for all 13 user types, ensuring proper access control, workflow permissions, and security boundaries for the Formula PM 2.0 construction management system.

### **📋 TASK BREAKDOWN FOR COORDINATOR**

**FOUNDATION TASKS (Spawn immediately):**
1. **Permission Matrix Design**: Complete access control definitions
2. **Role Hierarchy System**: Management vs operational role structures
3. **Resource Access Mapping**: What each role can access
4. **Workflow Permission Rules**: Process-specific permissions

**DEPENDENT TASKS (Wait for foundation approval):**
5. **Permission Testing Suite**: Automated role-based testing
6. **Audit Trail System**: Permission change tracking

---

## **👥 Complete User Role Definitions**

### **Management Level (5 Roles)**

#### **1. Company Owner** 
- **Authority Level**: Highest - Ultimate system access
- **Primary Functions**: Strategic oversight, final approvals, system administration
- **Access Pattern**: Full system access, all projects, all data
- **Key Permissions**: 
  - Full financial data access
  - System settings management
  - User creation and management
  - Override any decision
  - Access audit trails

#### **2. General Manager**
- **Authority Level**: Executive - Company-wide operations
- **Primary Functions**: Operational oversight, major decision approval
- **Access Pattern**: Full operational access, all projects
- **Key Permissions**:
  - All project data
  - Budget approval authority
  - Supplier selection approval
  - Team performance metrics
  - Strategic reporting

#### **3. Deputy General Manager**
- **Authority Level**: Senior Executive - Delegated authority
- **Primary Functions**: Operations management, project oversight
- **Access Pattern**: Full operational access with creation rights
- **Key Permissions**:
  - Create and assign tasks
  - Team member assignment
  - Supplier selection approval
  - Budget variance approval
  - Cross-project resource allocation

#### **4. Technical Office Director**
- **Authority Level**: Department Head - Technical oversight
- **Primary Functions**: Technical standards, tender processes
- **Access Pattern**: Full company access, technical focus
- **Key Permissions**:
  - Technical standards enforcement
  - Shop drawing final approval
  - BOQ and cost analysis review
  - Proposal approval authority
  - Technical team management

#### **5. Admin (Kerem)**
- **Authority Level**: System Administrator - Technical management
- **Primary Functions**: System administration, user management, technical support
- **Access Pattern**: Full system access for administration
- **Key Permissions**:
  - User account creation/management
  - System configuration
  - Database administration
  - Integration management
  - Support and troubleshooting

---

### **Project Level (3 Roles)**

#### **6. Project Manager**
- **Authority Level**: Project Authority - Complete project control
- **Primary Functions**: Project execution, team coordination, client communication
- **Access Pattern**: Full access to assigned projects
- **Key Permissions**:
  - Project creation and management
  - Scope item creation/editing
  - Team assignment within project
  - Internal approval authority
  - Client communication lead
  - Supplier selection participation
  - Report generation

#### **7. Architect** 
- **Authority Level**: Design Authority - Creative and technical design
- **Primary Functions**: Shop drawing creation, design reviews
- **Access Pattern**: Design-focused project access
- **Key Permissions**:
  - Shop drawing creation/editing
  - Design document management
  - Client comment responses
  - Drawing version control
  - Technical specification input

#### **8. Technical Engineer**
- **Authority Level**: Technical Specialist - Engineering support
- **Primary Functions**: BOQ preparation, cost analysis, technical support
- **Access Pattern**: Technical data focus, tender processes
- **Key Permissions**:
  - BOQ creation and management
  - Cost analysis preparation
  - Scope list pricing
  - Technical proposal writing
  - Material specification support
  - **Cost Tracking Access**: View and edit initial_cost, actual_cost, cost_variance
  - **Pricing Visibility**: Full access to unit_price, total_price, markup_percentage

---

### **Operational Level (2 Roles)**

#### **9. Purchase Director**
- **Authority Level**: Department Head - Procurement oversight
- **Primary Functions**: Supplier management, procurement strategy
- **Access Pattern**: Supplier and financial data focus
- **Key Permissions**:
  - Supplier database management
  - Procurement strategy decisions
  - Payment oversight
  - Supplier performance evaluation
  - Cost control monitoring
  - **Cost Tracking Access**: View and edit initial_cost, actual_cost, cost_variance
  - **Pricing Visibility**: Full access to unit_price, total_price, markup_percentage
  - **Supplier Cost Management**: Link suppliers to scope items with cost tracking

#### **10. Purchase Specialist**
- **Authority Level**: Specialist - Procurement execution
- **Primary Functions**: Day-to-day procurement, supplier relations
- **Access Pattern**: Operational procurement access
- **Key Permissions**:
  - Supplier database entry
  - Scope item supplier assignment
  - Payment tracking
  - Purchase order management
  - Supplier communication
  - **Cost Tracking Access**: View and edit initial_cost, actual_cost, cost_variance
  - **Pricing Visibility**: Full access to unit_price, total_price, markup_percentage

---

### **Field Level (1 Role)**

#### **11. Field Worker**
- **Authority Level**: Operational - Site execution
- **Primary Functions**: On-site work, progress reporting, task execution
- **Access Pattern**: Limited to assigned projects, no pricing data
- **Key Permissions**:
  - Mobile report creation
  - Progress photo upload
  - Task status updates
  - Issue reporting
  - Document viewing (no pricing)
- **Restricted Access**: 
  - **NO Cost Tracking**: Cannot view initial_cost, actual_cost, cost_variance
  - **NO Pricing Data**: Cannot view unit_price, total_price, markup_percentage
  - **Basic Scope View**: Only item_no, item_code, description, quantity, status

---

### **External Access (2 Roles)**

#### **12. Client**
- **Authority Level**: External Stakeholder - Review and approval authority
- **Primary Functions**: Project review, document approval, communication
- **Access Pattern**: Limited to their projects, approval-focused
- **Key Permissions**:
  - Shop drawing review/approval
  - Project progress viewing
  - Document download
  - Comment submission
- **Restricted Access**: 
  - **NO Cost Tracking**: Cannot view initial_cost, actual_cost, cost_variance
  - **NO Internal Pricing**: Cannot view unit_price, total_price, markup_percentage
  - **Basic Scope View**: Only item_no, item_code, description, quantity, completion status
  - PM communication

#### **13. Subcontractor**
- **Authority Level**: External Worker - Limited reporting access
- **Primary Functions**: Specialized work execution, progress reporting
- **Access Pattern**: Very limited, assigned project only
- **Key Permissions**:
  - Progress reporting for assigned work
  - Photo upload for assigned tasks
  - Task status updates
  - Limited document access
- **Restricted Access**: 
  - **NO Cost Tracking**: Cannot view initial_cost, actual_cost, cost_variance
  - **NO Internal Pricing**: Cannot view unit_price, total_price, markup_percentage
  - **Limited Scope View**: Only assigned scope items with basic information

---

## **🔐 Comprehensive Permission Matrix**

### **Project Management Permissions**
```typescript
const PROJECT_PERMISSIONS = {
  'projects.create': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
    description: 'Create new projects',
    restrictions: 'PM role requires management approval for budget >$100k'
  },
  'projects.read.all': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
    description: 'View all company projects',
    restrictions: 'Full access including financial data'
  },
  'projects.read.assigned': {
    allowed: ['project_manager', 'architect', 'technical_engineer', 'purchase_director', 'purchase_specialist'],
    description: 'View assigned projects only',
    restrictions: 'Based on project_assignments table'
  },
  'projects.read.own': {
    allowed: ['client', 'subcontractor', 'field_worker'],
    description: 'View own/related projects',
    restrictions: 'Clients see their projects, workers see assigned projects'
  },
  'projects.update': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
    description: 'Modify project details',
    restrictions: 'PM can only update assigned projects'
  },
  'projects.delete': {
    allowed: ['company_owner', 'general_manager', 'admin'],
    description: 'Delete projects (soft delete)',
    restrictions: 'Requires confirmation and audit trail'
  },
  'projects.archive': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'project_manager', 'admin'],
    description: 'Archive completed projects',
    restrictions: 'Only for completed/cancelled projects'
  }
}
```

### **Scope Management Permissions**
```typescript
const SCOPE_PERMISSIONS = {
  'scope.create': {
    allowed: ['project_manager', 'technical_engineer', 'deputy_general_manager'],
    description: 'Create scope items',
    restrictions: 'Must be assigned to project'
  },
  'scope.read.full': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'technical_engineer'],
    description: 'View scope including pricing',
    restrictions: 'Full financial data access'
  },
  'scope.read.limited': {
    allowed: ['architect', 'field_worker'],
    description: 'View scope without pricing',
    restrictions: 'No financial data visible'
  },
  'scope.update': {
    allowed: ['project_manager', 'technical_engineer'],
    description: 'Modify scope items',
    restrictions: 'Only for assigned projects'
  },
  'scope.pricing.set': {
    allowed: ['technical_engineer', 'project_manager'],
    description: 'Set scope item pricing',
    restrictions: 'Requires cost analysis documentation'
  },
  'scope.supplier.assign': {
    allowed: ['purchase_director', 'purchase_specialist'],
    description: 'Assign suppliers to scope items',
    restrictions: 'Requires GM/DGM/PM approval'
  }
}
```

### **Document Management Permissions**
```typescript
const DOCUMENT_PERMISSIONS = {
  'documents.create': {
    allowed: ['project_manager', 'architect', 'technical_engineer', 'field_worker'],
    description: 'Upload documents',
    restrictions: 'Field workers limited to reports and photos'
  },
  'documents.read.all': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
    description: 'Access all documents',
    restrictions: 'Full document library access'
  },
  'documents.read.project': {
    allowed: ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'purchase_director', 'purchase_specialist'],
    description: 'Access project documents',
    restrictions: 'Only for assigned/relevant projects'
  },
  'documents.read.client_visible': {
    allowed: ['client'],
    description: 'Access client-marked documents',
    restrictions: 'Only documents marked as client-visible'
  },
  'documents.approve.internal': {
    allowed: ['project_manager', 'technical_director', 'general_manager'],
    description: 'Internal document approval',
    restrictions: 'Based on document type and approval workflow'
  },
  'documents.approve.client': {
    allowed: ['client'],
    description: 'Client document approval',
    restrictions: 'Only for documents requiring client approval'
  },
  'documents.version.manage': {
    allowed: ['project_manager', 'architect'],
    description: 'Manage document versions',
    restrictions: 'Version control and history management'
  }
}
```

### **Shop Drawing Permissions**
```typescript
const SHOP_DRAWING_PERMISSIONS = {
  'shop_drawings.create': {
    allowed: ['architect'],
    description: 'Create shop drawings',
    restrictions: 'Primary design responsibility'
  },
  'shop_drawings.edit': {
    allowed: ['architect', 'project_manager'],
    description: 'Edit shop drawings',
    restrictions: 'PM can edit for corrections, architect for design'
  },
  'shop_drawings.review.internal': {
    allowed: ['project_manager', 'technical_director'],
    description: 'Internal shop drawing review',
    restrictions: 'Part of approval workflow'
  },
  'shop_drawings.approve.internal': {
    allowed: ['project_manager', 'technical_director'],
    description: 'Internal approval authority',
    restrictions: 'Required before client submission'
  },
  'shop_drawings.submit.client': {
    allowed: ['project_manager'],
    description: 'Submit to client for approval',
    restrictions: 'Must pass internal approval first'
  },
  'shop_drawings.approve.client': {
    allowed: ['client'],
    description: 'Client approval authority',
    restrictions: 'Final approval in workflow'
  },
  'shop_drawings.revision.request': {
    allowed: ['client', 'project_manager', 'technical_director'],
    description: 'Request revisions',
    restrictions: 'Triggers revision workflow'
  }
}
```

### **Purchase & Supplier Permissions**
```typescript
const PURCHASE_PERMISSIONS = {
  'suppliers.create': {
    allowed: ['purchase_director', 'purchase_specialist'],
    description: 'Add new suppliers',
    restrictions: 'Requires supplier validation process'
  },
  'suppliers.read': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'project_manager', 'purchase_director', 'purchase_specialist'],
    description: 'View supplier database',
    restrictions: 'Role-based data filtering'
  },
  'suppliers.approve': {
    allowed: ['general_manager', 'deputy_general_manager'],
    description: 'Approve suppliers for use',
    restrictions: 'Executive approval required'
  },
  'suppliers.evaluate': {
    allowed: ['purchase_director', 'purchase_specialist', 'project_manager'],
    description: 'Evaluate supplier performance',
    restrictions: 'Based on project experience'
  },
  'suppliers.select.scope': {
    allowed: ['purchase_director', 'purchase_specialist'],
    description: 'Select suppliers for scope items',
    restrictions: 'Requires approval workflow'
  },
  'payments.view': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin', 'purchase_director'],
    description: 'View payment information',
    restrictions: 'Financial data access'
  },
  'payments.track': {
    allowed: ['purchase_director', 'purchase_specialist'],
    description: 'Track payment status',
    restrictions: 'Operational payment management'
  }
}
```

### **Reporting Permissions**
```typescript
const REPORTING_PERMISSIONS = {
  'reports.create.internal': {
    allowed: ['project_manager', 'architect', 'technical_engineer'],
    description: 'Create internal reports',
    restrictions: 'Project-level reporting'
  },
  'reports.create.client': {
    allowed: ['project_manager'],
    description: 'Create client reports',
    restrictions: 'External communication reports'
  },
  'reports.create.field': {
    allowed: ['field_worker', 'subcontractor'],
    description: 'Create field progress reports',
    restrictions: 'Mobile-optimized, photo-driven'
  },
  'reports.read.all': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
    description: 'Access all reports',
    restrictions: 'Company-wide reporting access'
  },
  'reports.read.project': {
    allowed: ['project_manager', 'architect', 'technical_engineer'],
    description: 'Access project-specific reports',
    restrictions: 'Based on project assignment'
  },
  'reports.read.own': {
    allowed: ['field_worker', 'subcontractor', 'client'],
    description: 'Access own submitted reports',
    restrictions: 'Creator access only'
  },
  'reports.approve': {
    allowed: ['project_manager', 'general_manager'],
    description: 'Approve reports for distribution',
    restrictions: 'Quality control before sharing'
  }
}
```

### **Task Management Permissions**
```typescript
const TASK_PERMISSIONS = {
  'tasks.create': {
    allowed: ['deputy_general_manager', 'project_manager', 'technical_director'],
    description: 'Create tasks',
    restrictions: 'Assignment authority required'
  },
  'tasks.assign': {
    allowed: ['deputy_general_manager', 'project_manager'],
    description: 'Assign tasks to team members',
    restrictions: 'Must have project authority'
  },
  'tasks.read.all': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
    description: 'View all tasks',
    restrictions: 'Management oversight'
  },
  'tasks.read.assigned': {
    allowed: ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'subcontractor'],
    description: 'View assigned tasks',
    restrictions: 'Personal task access'
  },
  'tasks.update.status': {
    allowed: ['project_manager', 'architect', 'technical_engineer', 'field_worker', 'subcontractor'],
    description: 'Update task status',
    restrictions: 'For assigned tasks only'
  },
  'tasks.approve': {
    allowed: ['project_manager', 'deputy_general_manager'],
    description: 'Approve task completion',
    restrictions: 'Quality verification authority'
  }
}
```

### **User Management Permissions**
```typescript
const USER_PERMISSIONS = {
  'users.create': {
    allowed: ['company_owner', 'general_manager', 'admin'],
    description: 'Create new user accounts',
    restrictions: 'User provisioning authority'
  },
  'users.read.all': {
    allowed: ['company_owner', 'general_manager', 'deputy_general_manager', 'technical_director', 'admin'],
    description: 'View all user information',
    restrictions: 'HR and management access'
  },
  'users.read.team': {
    allowed: ['project_manager'],
    description: 'View team member information',
    restrictions: 'Project team members only'
  },
  'users.update': {
    allowed: ['company_owner', 'general_manager', 'admin'],
    description: 'Update user profiles',
    restrictions: 'Administrative changes'
  },
  'users.deactivate': {
    allowed: ['company_owner', 'general_manager', 'admin'],
    description: 'Deactivate user accounts',
    restrictions: 'Soft delete with audit trail'
  },
  'users.roles.assign': {
    allowed: ['company_owner', 'admin'],
    description: 'Assign user roles',
    restrictions: 'Critical security permission'
  }
}
```

---

## **🎯 Role-Based Dashboard Access**

### **Management Dashboard Features**
```typescript
const MANAGEMENT_DASHBOARD = {
  'company_owner': {
    widgets: [
      'company_health_score',
      'financial_overview',
      'project_portfolio_status',
      'team_performance_metrics',
      'critical_alerts',
      'strategic_kpis',
      'audit_trail_summary'
    ],
    permissions: 'full_system_access'
  },
  'general_manager': {
    widgets: [
      'operational_overview',
      'project_status_summary',
      'budget_performance',
      'team_productivity',
      'client_satisfaction',
      'resource_allocation'
    ],
    permissions: 'operational_management'
  },
  'deputy_general_manager': {
    widgets: [
      'task_assignment_overview',
      'project_progress_tracking',
      'team_workload_balance',
      'supplier_selection_queue',
      'approval_pending_items'
    ],
    permissions: 'delegated_authority'
  }
}
```

### **Project Level Dashboard Features**
```typescript
const PROJECT_DASHBOARD = {
  'project_manager': {
    widgets: [
      'assigned_projects_overview',
      'scope_completion_status',
      'team_task_progress',
      'client_approval_queue',
      'budget_tracking',
      'timeline_milestones',
      'field_reports_summary'
    ],
    permissions: 'project_authority'
  },
  'architect': {
    widgets: [
      'shop_drawing_pipeline',
      'client_feedback_queue',
      'revision_requests',
      'drawing_approval_status',
      'design_project_overview'
    ],
    permissions: 'design_authority'
  }
}
```

---

## **🔧 COORDINATOR IMPLEMENTATION INSTRUCTIONS**

### **Subagent Spawning Strategy**
```
TASK: User Roles & Permissions Implementation
OBJECTIVE: Deploy comprehensive role-based access control for all 13 user types
CONTEXT: Complete permission matrix with role-based features and dashboard access

REQUIRED READING:
- Patterns: @Patterns/optimized-coordinator-v1.md
- Database: @Planing App/Wave-1-Foundation/database-schema-design.md
- Auth: @Planing App/Wave-1-Foundation/authentication-system.md
- Templates: @Patterns/templates/subagent-template.md

IMPLEMENTATION REQUIREMENTS:
1. Implement all permission matrices as TypeScript types and functions
2. Create role-based dashboard configurations
3. Build permission testing suite for all user types
4. Integrate with authentication system and database RLS

DELIVERABLES:
1. Complete permission system implementation
2. Role-based dashboard components
3. Permission testing automation
4. Documentation for all 13 user types
```

### **Quality Gates**
- ✅ All 13 user roles have defined permissions
- ✅ Permission matrix prevents unauthorized access
- ✅ Dashboard features adapt to user role
- ✅ Role-based navigation functions correctly
- ✅ Testing covers all permission scenarios

### **Dependencies for Next Wave**
- Permission matrix must be fully tested
- All user roles validated against requirements
- Dashboard access controls implemented
- Integration with auth system complete

---

## **🎯 SUCCESS CRITERIA**
1. **Role Definition**: All 13 user types clearly defined with specific permissions
2. **Access Control**: Granular permissions for all system resources
3. **Dashboard Customization**: Role-appropriate feature access
4. **Security Validation**: No unauthorized access possible

**Evaluation Score Target**: 90+ using @Patterns/templates/evaluator-prompt.md