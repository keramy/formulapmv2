# Formula PM 2.0 - Role Optimization Implementation Plan
**Enhanced 5-Role Structure with PM Hierarchy & Management Oversight**

## 🎯 **Project Overview**

**Objective**: Transform 13-role system to optimized 5-role structure with PM hierarchy and management oversight
**Expected Benefits**: 
- 62% fewer roles (13 → 5)
- 31% performance improvement (262ms → 180ms)
- 67% fewer RLS policies (45 → 15)
- Complete management oversight of PM workloads
- Structured PM approval hierarchy

## 📊 **Final Role Structure**

### 1. **Management** (3→1)
- **Replaces**: company_owner, general_manager, deputy_general_manager
- **Key Features**: 
  - Company-wide project oversight dashboard
  - PM workload monitoring and rebalancing
  - All budgets, active projects, recent updates visibility
  - Override capabilities for critical decisions

### 2. **Purchase Manager** (2→1)
- **Replaces**: purchase_director, purchase_specialist
- **Key Features**: Unified purchase operations, vendor management

### 3. **Technical Lead** (1→1)
- **Replaces**: technical_director
- **Key Features**: Scope list uploads, subcontractor assignments, technical oversight

### 4. **Project Manager** (4→1 with hierarchy)
- **Replaces**: project_manager, architect, technical_engineer, field_worker
- **Hierarchy Levels**:
  - **Senior PM**: Budget approval up to $50K, cross-project coordination
  - **Regular PM**: Budget approval up to $15K, requires senior approval for larger items
- **Key Features**: Unified project coordination, field work, architectural review

### 5. **Client** (1→1 simplified)
- **Replaces**: client (simplified)
- **Key Features**: Project progress view, report access only (read-only)

### **Subcontractors** → Database Entities
- **No user accounts**: Managed as assignable resources
- **Features**: Assignment tracking, payment calculation, performance monitoring

---

## 🗓️ **Implementation Timeline: 18-26 Weeks**

### **PHASE 1: Foundation & Database Schema (Weeks 1-3)**
**Duration**: 3 weeks | **Priority**: CRITICAL

#### Week 1: Database Schema Design & Migration Scripts
- [ ] Create new 5-role enum structure
- [ ] Design subcontractor entities table
- [ ] Create PM hierarchy support (seniority_level, approval_limits)
- [ ] Design approval_requests table for hierarchy workflows
- [ ] Create migration scripts for role consolidation

#### Week 2: RLS Policy Redesign
- [ ] Simplify RLS policies (45 → 15 policies)
- [ ] Implement management full-access policies
- [ ] Create PM hierarchy-aware policies
- [ ] Add subcontractor entity access policies
- [ ] Test policy performance improvements

#### Week 3: Data Migration & Testing
- [ ] Create user role mapping (13 → 5 roles)
- [ ] Migrate existing users to new role structure
- [ ] Convert subcontractor users to database entities
- [ ] Validate data integrity and permissions
- [ ] Performance testing of new schema

---

### **PHASE 2: Management Oversight Dashboard (Weeks 4-7)**
**Duration**: 4 weeks | **Priority**: HIGH

#### Week 4: Dashboard Architecture
- [ ] Design management dashboard component structure
- [ ] Create PM workload monitoring APIs
- [ ] Build real-time data aggregation services
- [ ] Set up dashboard routing and authentication

#### Week 5: PM Workload Monitoring
- [ ] Build PM workload distribution visualization
- [ ] Create active projects per PM tracking
- [ ] Implement performance metrics (timeline, budget, quality)
- [ ] Add resource utilization monitoring

#### Week 6: Approval Pipeline & Oversight
- [ ] Create approval pipeline dashboard
- [ ] Build bottleneck identification system
- [ ] Add escalation alerts and notifications
- [ ] Implement management action capabilities (reassign, override)

#### Week 7: Company-Wide Project Overview
- [ ] Build comprehensive project timeline (Gantt view)
- [ ] Create budget vs actual tracking across all projects
- [ ] Add risk indicators and mitigation actions
- [ ] Implement real-time updates and notifications

---

### **PHASE 3: Subcontractor System (Weeks 8-11)**
**Duration**: 4 weeks | **Priority**: MEDIUM

#### Week 8: Subcontractor Database Design
- [ ] Create subcontractor entities table
- [ ] Design assignment tracking system
- [ ] Build payment calculation logic
- [ ] Create performance monitoring structure

#### Week 9: Assignment Interface
- [ ] Build subcontractor assignment interface for technical leads
- [ ] Create scope item → subcontractor assignment workflow
- [ ] Add availability tracking and scheduling
- [ ] Implement assignment notifications

#### Week 10: Payment & Performance Tracking
- [ ] Build payment calculation and tracking
- [ ] Create performance rating system
- [ ] Add cost tracking per subcontractor
- [ ] Implement reporting and analytics

#### Week 11: Integration & Testing
- [ ] Integrate with existing project workflows
- [ ] Test assignment and payment workflows
- [ ] Validate performance tracking
- [ ] User acceptance testing with technical leads

---

### **PHASE 4: Unified Project Manager Role (Weeks 12-16)**
**Duration**: 5 weeks | **Priority**: HIGH

#### Week 12: Role Consolidation Planning
- [ ] Map existing architect/field worker/PM/engineer permissions
- [ ] Design unified project manager interface
- [ ] Plan mobile interface optimization for field work
- [ ] Create role transition documentation

#### Week 13: PM Hierarchy Implementation
- [ ] Implement senior/regular PM distinction
- [ ] Build approval request system
- [ ] Create approval routing logic
- [ ] Add approval limit enforcement

#### Week 14: Unified Interface Development
- [ ] Merge architect capabilities (design review, drawing approval)
- [ ] Integrate field worker features (photo upload, progress updates)
- [ ] Combine project management tools
- [ ] Optimize mobile interface for field use

#### Week 15: Approval Workflows
- [ ] Build budget approval workflows (Regular PM → Senior PM → Management)
- [ ] Create scope change approval system
- [ ] Implement timeline extension approvals
- [ ] Add resource request workflows

#### Week 16: Testing & Optimization
- [ ] Test unified PM role functionality
- [ ] Validate approval hierarchy workflows
- [ ] Performance testing (ensure 542ms → ~200ms improvement)
- [ ] Mobile interface testing and optimization

---

### **PHASE 5: Client Portal Simplification (Weeks 17-18)**
**Duration**: 2 weeks | **Priority**: MEDIUM

#### Week 17: Client Interface Redesign
- [ ] Simplify client dashboard (progress + reports only)
- [ ] Remove unnecessary features and complexity
- [ ] Optimize for read-only access patterns
- [ ] Improve report viewing experience

#### Week 18: Client Portal Testing
- [ ] User acceptance testing with clients
- [ ] Performance optimization for client queries
- [ ] Documentation and training materials
- [ ] Final client interface polish

---

### **PHASE 6: Migration & Production Deployment (Weeks 19-26)**
**Duration**: 8 weeks | **Priority**: CRITICAL

#### Weeks 19-20: Comprehensive Testing
- [ ] End-to-end workflow testing
- [ ] Performance validation (262ms → 180ms target)
- [ ] Security testing of new RLS policies
- [ ] Load testing with new role structure

#### Weeks 21-22: User Training & Documentation
- [ ] Create user training materials for new roles
- [ ] Document new approval workflows
- [ ] Train management on oversight dashboard
- [ ] Prepare change management communications

#### Weeks 23-24: Gradual Migration
- [ ] Migrate users in batches (start with management)
- [ ] Monitor system performance during migration
- [ ] Address any issues or edge cases
- [ ] Validate all workflows with real users

#### Weeks 25-26: Production Deployment & Monitoring
- [ ] Final production deployment
- [ ] Monitor performance improvements
- [ ] Collect user feedback and address issues
- [ ] Document lessons learned and optimizations

---

## 🎯 **Success Criteria**

### **Performance Targets**
- [ ] **Response Time**: 262ms → 180ms (31% improvement)
- [ ] **Role Count**: 13 → 5 (62% reduction)
- [ ] **RLS Policies**: 45 → 15 (67% reduction)
- [ ] **Field Worker Performance**: 542ms → ~200ms (63% improvement)

### **Functional Requirements**
- [ ] **Management Oversight**: Full PM workload visibility and control
- [ ] **PM Hierarchy**: Working approval chains (Regular → Senior → Management)
- [ ] **Subcontractor System**: Assignment tracking and payment calculation
- [ ] **Client Experience**: Simplified, read-only project access
- [ ] **Unified PM Role**: All capabilities (project management, field work, architecture)

### **Business Outcomes**
- [ ] **Improved Performance**: Faster application response times
- [ ] **Better Management Control**: Real-time oversight of all projects and PMs
- [ ] **Streamlined Operations**: Fewer handoffs, clearer responsibilities
- [ ] **Enhanced Accountability**: Structured approval chains and performance tracking
- [ ] **Scalability**: System ready for growth with clear role structure

---

## ⚠️ **Risk Mitigation**

### **Technical Risks**
- **Database Migration**: Comprehensive testing and rollback plans
- **Performance Regression**: Continuous monitoring during implementation
- **RLS Policy Issues**: Thorough security testing and validation

### **Business Risks**
- **User Adoption**: Comprehensive training and change management
- **Workflow Disruption**: Gradual migration and parallel running
- **Permission Issues**: Extensive testing with real user scenarios

### **Mitigation Strategies**
- **Feature Flags**: Gradual rollout of new features
- **Rollback Plans**: Ability to revert to previous system if needed
- **User Support**: Dedicated support during transition period
- **Monitoring**: Real-time performance and error monitoring

---

## 🚀 **Next Steps**

1. **Approve this implementation plan**
2. **Start Phase 1: Database schema design and migration scripts**
3. **Set up project tracking and milestone monitoring**
4. **Begin weekly progress reviews and adjustments**

**Ready to transform your application with 62% fewer roles and 31% better performance!**