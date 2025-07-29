---
name: orchestrate
description: Master command to coordinate specialized subagents for complex Formula PM V2 development tasks. Analyzes requirements and routes to appropriate domain experts.
---

# 🎯 /orchestrate - Master Orchestrator Command

**Primary command for coordinating the 6-agent specialist team to deliver comprehensive solutions for Formula PM V2 development tasks.**

## Usage

```
/orchestrate <task description>
```

## How It Works

The Master Orchestrator analyzes your task and coordinates the appropriate specialists:

### 🔴 **Supabase Specialist** - Database & Performance
- Database schema changes and migrations  
- RLS policy optimization and security
- Query performance tuning and indexing
- Authentication and user management issues

### 🟠 **Backend Engineer** - API & Server Logic
- Next.js API route development
- Business logic implementation
- Authentication middleware and JWT handling
- Data validation and error handling

### 🟢 **Frontend Specialist** - UI/UX & React
- React component development
- Form creation and validation
- Responsive design and accessibility
- Real-time data integration

### 🟡 **Performance Optimizer** - Speed & Efficiency  
- Core Web Vitals optimization
- Bundle size analysis and code splitting
- API response time improvements
- Database query optimization

### 🔴 **Security Auditor** - Application Security
- Vulnerability assessment and penetration testing
- Access control validation
- Data protection and privacy compliance
- Security best practices implementation

### 🟣 **QA Engineer** - Quality Assurance
- Test strategy development
- Automated test creation
- Bug detection and regression testing
- Quality gates and release validation

## Orchestration Patterns

### **Sequential Pattern** (Dependencies)
```
Database → API → Frontend → Testing
```
*Used when changes must be done in order*

### **Parallel Pattern** (Independent Work)
```
├─ Backend Engineer (API logic)
├─ Frontend Specialist (UI components)  
└─ QA Engineer (test planning)
```
*Used for independent work streams*

### **Review Pattern** (Quality Gates)
```
Implementation → Security → Performance → QA
```
*Used when quality validation is critical*

### **Hybrid Pattern** (Mixed Approach)
*Intelligent combination based on task complexity*

## Example Commands

### Feature Development
```
/orchestrate Create a user management system with CRUD operations, role-based access control, and real-time updates
```
**Result**: Coordinates Supabase Specialist (schema), Backend Engineer (API), Frontend Specialist (UI), Security Auditor (access control), and QA Engineer (testing)

### Performance Issues
```
/orchestrate Optimize the dashboard loading performance - it's taking 8+ seconds to load
```
**Result**: Performance Optimizer leads analysis, coordinates with Backend Engineer (API optimization), Frontend Specialist (component optimization), and Supabase Specialist (query optimization)

### Security Implementation
```
/orchestrate Add comprehensive security review for the authentication system and implement multi-factor authentication
```
**Result**: Security Auditor leads assessment, coordinates with Backend Engineer (MFA implementation), Supabase Specialist (security policies), and QA Engineer (security testing)

### Bug Fixes
```
/orchestrate Fix the authentication timeout issues - users are getting logged out randomly
```
**Result**: Backend Engineer investigates JWT handling, Supabase Specialist checks database sessions, Security Auditor validates security implications, QA Engineer creates regression tests

### Database Optimization
```
/orchestrate The project queries are very slow, need comprehensive database performance optimization
```
**Result**: Supabase Specialist leads optimization (RLS, indexing), Performance Optimizer validates improvements, Backend Engineer updates API patterns, QA Engineer creates performance tests

## Task Analysis Process

1. **Complexity Assessment**: Simple, moderate, complex, or enterprise-level
2. **Domain Identification**: Which specialties are involved
3. **Dependency Analysis**: What order should work be done
4. **Risk Assessment**: Security, performance, or quality concerns
5. **Agent Selection**: Which specialists are needed
6. **Execution Strategy**: Sequential, parallel, review, or hybrid

## Quality Checkpoints

- **Security Review**: All authentication, authorization, and data protection changes
- **Performance Validation**: All optimization changes and large features  
- **Testing Requirements**: All new features and bug fixes
- **Code Review**: All database schema changes and API modifications

## Expected Output

The orchestrator provides:

1. **Task Analysis**: Complexity, requirements, and approach
2. **Agent Coordination Plan**: Which specialists will work and in what order
3. **Execution Timeline**: Estimated completion time
4. **Quality Gates**: Required validations and checkpoints
5. **Progress Tracking**: Real-time updates from each specialist
6. **Final Summary**: Comprehensive results and recommendations

## Tips for Best Results

### **Be Specific About Requirements**
```
✅ GOOD: Create a project dashboard with real-time progress tracking, team member management, and budget overview with role-based access control

❌ VAGUE: Make a dashboard
```

### **Include Context When Needed**
```
✅ HELPFUL: Fix the slow project loading (currently 8+ seconds) on the /projects page - users are complaining

❌ UNCLEAR: Project page is slow
```

### **Mention Constraints or Preferences**
```
✅ USEFUL: Implement file upload with virus scanning - must support PDF and images up to 10MB, needs to be secure for client documents

❌ BASIC: Add file upload
```

## Advanced Usage

### **Multi-Step Complex Tasks**
```
/orchestrate Implement a complete shop drawing approval workflow with:
1. Drawing upload and version control
2. Multi-stage approval based on PM seniority levels  
3. Email notifications and real-time status updates
4. Audit trail and reporting
5. Integration with existing project management
```

### **Performance-Critical Features**
```
/orchestrate Build a real-time construction progress tracking system that can handle 100+ concurrent users, with live photo uploads, GPS tracking, and instant team notifications - performance is critical
```

### **Security-Focused Implementation**
```
/orchestrate Implement client portal access with strict data isolation, audit logging, and document access controls - must be enterprise-grade secure for construction industry compliance
```

---

**Remember**: The orchestrator coordinates specialists but doesn't replace domain expertise. Each agent brings deep knowledge in their area, and the orchestrator ensures they work together effectively to deliver comprehensive solutions.