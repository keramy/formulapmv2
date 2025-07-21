# V3 Implementation Master Plan

**Project Goal**: Complete Formula PM V3 implementation with full project management functionality, corrected role system, and production-ready features.

**Date Initiated**: 2025-01-21  
**Current Status**: Foundation Analysis Complete - Ready for Implementation  
**Timeline**: 6-7 weeks (Corrected from previous estimates)

---

## Executive Summary: Critical Reality Check

### **🚨 Major Discrepancy Identified**

**Kiro's Documentation vs Database Reality:**
- **Claimed**: 6-role system implemented (62% reduction)
- **Reality**: 13 roles still exist in database
- **Impact**: Performance claims and timeline estimates require correction

### **Corrected Assessment: 75% V3 Ready (Not 92%)**

**What Kiro Actually Completed** ✅:
- Authentication system fixes (JWT token usage corrected)
- API standardization with withAuth patterns
- Security implementations (100% controls)
- Testing framework establishment (88% pass rate)
- Database schema validation (95% production ready)

**What Still Needs Implementation** ❌:
- Role system migration (13→6 roles)
- V3 business features
- Mock data replacement
- Client portal functionality

---

## Phase-Based Implementation Plan

### **Phase 1: Foundation Correction & Role Migration** (Week 1-2)

#### **Week 1: Role System Migration - Agent A**
1. **Database Schema Migration**
   - Create new 6-role enum type
   - Map existing 13 roles to new 6-role system
   - Update user_profiles table structure
   - Migrate existing test users to new roles

2. **Permission System Overhaul**
   - Update RLS policies for 6-role system
   - Implement role hierarchy (management > purchase_manager > technical_lead > project_manager > client)
   - Add seniority levels (executive, senior, regular)
   - Test permission boundaries

3. **Frontend Role Adaptation**
   - Update role-based UI components
   - Modify dashboard views for new roles
   - Update navigation permissions
   - Test role switching functionality

#### **Week 2: Mock Data Elimination - Agent B**
1. **API Integration Phase**
   - Replace mock task data with real database calls
   - Replace mock project data with functional APIs
   - Replace mock milestone data with backend integration
   - Replace mock user data with authentication system

2. **Data Validation & Testing**
   - Verify all API endpoints return real data
   - Test CRUD operations for all entities
   - Validate data relationships and constraints
   - Performance test with real database queries

**Guiding Notes for Phase 1:**
- Use Kiro's withAuth pattern for all new API endpoints
- Follow RLS optimization pattern: `(SELECT auth.uid())` not `auth.uid()`
- Maintain 88% test pass rate during migrations
- Validate against established security controls

---

### **Phase 2: Core Business Features** (Week 3-4)

#### **Week 3: Task & Milestone Systems - Agent C**
1. **Task Management Implementation**
   - Create/Read/Update/Delete task operations
   - Task assignment and status tracking
   - Comment system with @mentions
   - Task dependencies and priority system

2. **Milestone Tracking Enhancement**
   - Progress calculation algorithms
   - Deadline tracking and alerts
   - Milestone-to-task relationships
   - Calendar integration and views

#### **Week 4: Material & Approval Workflows - Agent D**
1. **Material Specification System**
   - Material approval workflow implementation
   - Multi-stage approval process
   - Rejection handling and revision requests
   - Integration with scope items

2. **Shop Drawing System**
   - File upload and storage system
   - Drawing approval workflow
   - Version control for drawings
   - Integration with project timelines

**Guiding Notes for Phase 2:**
- Leverage existing material_specs and project_milestones tables
- Use established file handling patterns from Kiro's work
- Implement approval workflows using security controls
- Maintain real-time updates using WebSocket patterns

---

### **Phase 3: Enhanced Features & Reports** (Week 5)

#### **Week 5: Reporting & Financial Tracking - Agent E**
1. **Report Generation System**
   - Create reports, report_lines, report_line_photos tables
   - PDF generation functionality
   - Line-by-line progress reporting
   - Photo attachments and documentation

2. **Enhanced Scope Financial**
   - Add sell_price and group_progress_percentage columns
   - Cost variance calculations
   - Profit margin tracking
   - Excel import/export functionality

3. **Dashboard Refinements**
   - Real-time data integration
   - Role-based dashboard views
   - Performance metrics and KPIs
   - Interactive charts and graphs

**Guiding Notes for Phase 3:**
- Use established PDF generation libraries
- Follow Kiro's performance optimization patterns
- Implement cost calculations as generated columns where appropriate
- Ensure Excel integration follows security protocols

---

### **Phase 4: Team Management & Client Features** (Week 6)

#### **Week 6: Project Teams & Client Portal - Agent F**
1. **Project Team Management**
   - Create project_members table
   - Team assignment and role management
   - Workload distribution tracking
   - Team performance metrics

2. **Client Dashboard Implementation**
   - Client-facing project views
   - Create client_dashboard_access table
   - Read-only project progress for clients
   - Client communication system

3. **Navigation & UX Integration**
   - Complete navigation system
   - Feature discoverability improvements
   - Mobile responsiveness optimization
   - User experience consistency

**Guiding Notes for Phase 4:**
- Use client role isolation patterns from security implementation
- Follow established authentication patterns for client access
- Ensure all client-facing features are read-only
- Test thoroughly with client role permissions

---

### **Phase 5: Final Testing & Production Readiness** (Week 7)

#### **Week 7: Integration Testing & Launch Prep - Agent G**
1. **End-to-End Testing**
   - Complete workflow testing
   - Cross-role permission validation
   - Performance testing under load
   - Security penetration testing

2. **Production Deployment Preparation**
   - Environment configuration validation
   - Database migration scripts finalization
   - Monitoring and logging setup
   - Backup and recovery procedures

3. **Documentation & Training**
   - User documentation completion
   - Admin guide preparation
   - API documentation updates
   - Training material creation

**Guiding Notes for Phase 5:**
- Use established testing framework (88% pass rate target)
- Follow Kiro's security testing patterns
- Validate all performance improvements maintain 31% improvement
- Ensure production environment matches optimized development setup

---

## Database Changes Required

### **New Tables (7 total)**
```sql
-- Report System
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  line_number INTEGER NOT NULL,
  description TEXT,
  progress_percentage INTEGER DEFAULT 0,
  notes TEXT
);

CREATE TABLE report_line_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_line_id UUID REFERENCES report_lines(id),
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id),
  shared_with UUID REFERENCES user_profiles(id),
  permission_level TEXT DEFAULT 'read'
);

-- Team Management
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES user_profiles(id),
  role_in_project TEXT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Mention System
CREATE TABLE comment_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID, -- References task_comments or other comment tables
  mentioned_user_id UUID REFERENCES user_profiles(id),
  mentioned_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Client Portal
CREATE TABLE client_dashboard_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  access_level TEXT DEFAULT 'read_only',
  granted_by UUID REFERENCES user_profiles(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Role System Migration**
```sql
-- New 6-role enum
CREATE TYPE new_user_role AS ENUM (
  'management',         -- Replaces: company_owner, general_manager, deputy_general_manager
  'purchase_manager',   -- Replaces: purchase_director, purchase_specialist
  'technical_lead',     -- Replaces: technical_director, architect, technical_engineer
  'project_manager',    -- Keeps: project_manager (with seniority levels)
  'client',            -- Keeps: client
  'admin'              -- Keeps: admin
);

-- Add seniority column for PM hierarchy
ALTER TABLE user_profiles ADD COLUMN seniority TEXT DEFAULT 'regular' 
  CHECK (seniority IN ('executive', 'senior', 'regular'));

-- Migration script to map old roles to new roles
UPDATE user_profiles SET role = 'management'::new_user_role 
  WHERE role IN ('company_owner', 'general_manager', 'deputy_general_manager');
  
UPDATE user_profiles SET role = 'purchase_manager'::new_user_role 
  WHERE role IN ('purchase_director', 'purchase_specialist');
  
UPDATE user_profiles SET role = 'technical_lead'::new_user_role 
  WHERE role IN ('technical_director', 'architect', 'technical_engineer');
```

### **Column Additions (2 columns)**
```sql
-- Scope Items Enhancement
ALTER TABLE scope_items ADD COLUMN sell_price NUMERIC;
ALTER TABLE scope_items ADD COLUMN group_progress_percentage INTEGER DEFAULT 0 
  CHECK (group_progress_percentage >= 0 AND group_progress_percentage <= 100);
```

---

## Success Metrics & Validation

### **Phase Completion Criteria**

#### **Phase 1 Success Metrics:**
- ✅ 6 roles implemented in database
- ✅ All existing users migrated successfully
- ✅ Zero mock data remaining in UI
- ✅ All API endpoints return real data
- ✅ Performance maintains 31% improvement

#### **Phase 2 Success Metrics:**
- ✅ Task CRUD operations 100% functional
- ✅ Milestone progress tracking accurate
- ✅ Material approval workflow complete
- ✅ Shop drawing system operational

#### **Phase 3 Success Metrics:**
- ✅ PDF report generation working
- ✅ Financial calculations accurate
- ✅ Dashboard shows real-time data
- ✅ Excel integration functional

#### **Phase 4 Success Metrics:**
- ✅ Team management fully operational
- ✅ Client portal secure and functional
- ✅ All features discoverable in navigation
- ✅ Mobile responsiveness complete

#### **Phase 5 Success Metrics:**
- ✅ 90%+ test pass rate maintained
- ✅ Security controls validate 100%
- ✅ Production deployment successful
- ✅ Documentation complete

### **Performance Targets**
- **Response Time**: <200ms (maintain Kiro's 31% improvement)
- **Database Queries**: Use optimized RLS patterns
- **Test Coverage**: Maintain 80%+ established by Kiro
- **API Success Rate**: 95%+ under load
- **User Experience**: Sub-2s page load times

### **Security Validation**
- ✅ All 6 security controls operational
- ✅ Role-based access control validated
- ✅ Client isolation confirmed
- ✅ File upload security verified
- ✅ API authentication 100% functional

---

## Risk Management & Mitigation

### **High Risk Items → Mitigation Strategies**

#### **1. Role Migration Complexity**
**Risk**: User disruption during role transition
**Mitigation**: 
- Implement role migration during maintenance window
- Create rollback scripts for all changes
- Test migration with backup database first
- Maintain user session continuity

#### **2. Performance Degradation**
**Risk**: New features impact response times
**Mitigation**:
- Follow Kiro's RLS optimization patterns religiously
- Implement database indexing for new tables
- Use established caching strategies
- Monitor response times continuously

#### **3. Data Integrity**
**Risk**: Mock-to-real data transition errors
**Mitigation**:
- Implement comprehensive data validation
- Create data verification scripts
- Test all relationships and constraints
- Maintain audit logs of changes

#### **4. Security Vulnerabilities**
**Risk**: New features introduce security gaps
**Mitigation**:
- Use Kiro's established security patterns
- Test all new features with security test suite
- Validate role permissions thoroughly
- Follow principle of least privilege

---

## Implementation Guidelines

### **Core Development Principles**

#### **1. Follow Kiro's Proven Patterns**
```typescript
// ✅ ALWAYS use withAuth pattern
export const GET = withAuth(async (request, { user, profile }) => {
  return createSuccessResponse(data);
}, { permission: 'permission.name' });

// ✅ ALWAYS use optimized RLS pattern
USING (user_id = (SELECT auth.uid()))
```

#### **2. Maintain Quality Standards**
- 80%+ test coverage for all new features
- TypeScript strict mode compliance
- Consistent error handling patterns
- Real-time validation implementation

#### **3. Security-First Development**
- All new API endpoints require authentication
- Role-based access control on all features
- Input validation and sanitization
- Secure file upload implementation

#### **4. Performance Optimization**
- Database queries use proper indexing
- API responses cached appropriately
- Real-time updates minimize database load
- Mobile performance considered

---

## Agent Assignment Strategy

### **Agent Specialization & Distribution**

#### **Agent A: Foundation Specialist**
- **Expertise**: Database migrations, role systems, authentication
- **Responsibilities**: Phase 1 complete implementation
- **Duration**: 2 weeks

#### **Agent B: API Integration Specialist**  
- **Expertise**: Backend development, API design, data integration
- **Responsibilities**: Mock data elimination, API standardization
- **Duration**: 1 week (concurrent with Agent A)

#### **Agent C: Workflow Specialist**
- **Expertise**: Business logic, task management, process automation
- **Responsibilities**: Task and milestone systems
- **Duration**: 1 week

#### **Agent D: Approval Systems Specialist**
- **Expertise**: Document workflows, file handling, approval processes
- **Responsibilities**: Material and shop drawing systems
- **Duration**: 1 week (concurrent with Agent C)

#### **Agent E: Reporting & Analytics Specialist**
- **Expertise**: Data visualization, PDF generation, financial calculations
- **Responsibilities**: Reporting system and financial enhancements
- **Duration**: 1 week

#### **Agent F: User Experience Specialist**
- **Expertise**: Frontend development, user interfaces, client portals
- **Responsibilities**: Team management and client features
- **Duration**: 1 week

#### **Agent G: Quality Assurance Specialist**
- **Expertise**: Testing, deployment, production readiness
- **Responsibilities**: Final testing and launch preparation
- **Duration**: 1 week

---

## Memory Bank Structure

### **Project Memory Organization**
```
Memory/
├── README.md                                    # Memory Bank index
├── Phase_1_Foundation_Correction/
│   ├── Task_1_1_Role_Migration_Log.md
│   ├── Task_1_2_Mock_Data_Elimination_Log.md
│   └── Phase_1_Summary.md
├── Phase_2_Core_Business_Features/
│   ├── Task_2_1_Task_Management_Log.md
│   ├── Task_2_2_Material_Workflows_Log.md
│   └── Phase_2_Summary.md
├── Phase_3_Enhanced_Features/
│   ├── Task_3_1_Reporting_System_Log.md
│   ├── Task_3_2_Dashboard_Refinements_Log.md
│   └── Phase_3_Summary.md
├── Phase_4_Team_Client_Features/
│   ├── Task_4_1_Team_Management_Log.md
│   ├── Task_4_2_Client_Portal_Log.md
│   └── Phase_4_Summary.md
└── Phase_5_Production_Readiness/
    ├── Task_5_1_Integration_Testing_Log.md
    ├── Task_5_2_Deployment_Prep_Log.md
    └── Project_Completion_Summary.md
```

---

## Handover Protocol Reference

For long-running projects or situations requiring context transfer (e.g., exceeding LLM context limits, changing specialized agents), the APM Handover Protocol should be initiated. This ensures smooth transitions and preserves project knowledge.

**Key Handover Triggers:**
- Agent specialization changes between phases
- Context window limitations reached
- Critical blockers requiring different expertise
- Phase completion and transition

**Handover Artifacts Required:**
- `Handover_File.md` - Complete context dump
- `Handover_Prompt.md` - Incoming agent instructions
- Phase completion summary
- Updated Memory Bank logs

---

## Final Success Definition

**V3 Implementation Complete When:**

### **✅ All Core Features Operational**
- Task management with assignments and tracking
- Milestone progress with calendar integration  
- Material approval workflows functional
- Shop drawing management system
- Report generation with PDF export
- Enhanced scope with financial tracking

### **✅ Infrastructure Optimized**
- 6-role system fully implemented
- Performance maintains 31% improvement
- Security controls 100% operational
- Testing framework 90%+ pass rate
- Production deployment successful

### **✅ User Experience Complete**
- Zero mock data in application
- All features discoverable in navigation
- Role-based dashboards functional
- Client portal secure and operational
- Mobile responsiveness achieved

### **✅ Business Value Delivered**
- Complete project lifecycle management
- Real-time progress tracking
- Cost management and profitability
- Client communication and transparency
- Team collaboration and efficiency

---

**Implementation Timeline: 6-7 weeks**  
**Start Date**: Upon plan approval  
**Estimated Completion**: March 3-10, 2025  
**Success Probability**: High (leveraging Kiro's foundation)

---

*This plan corrects previous overestimations and provides a realistic roadmap for completing V3 implementation with proper foundation work included.*