---
name: specialist
description: Direct routing command to send tasks directly to a specific specialist agent when you know exactly which domain expert is needed.
---

# 🎯 /specialist - Direct Agent Routing

**Command to route tasks directly to a specific specialist agent when you know exactly which domain expert is needed, bypassing orchestration analysis.**

## Usage

```
/specialist <agent-type> <task description>
```

## Available Specialist Types

### 🔴 **supabase** - Database & Performance Expert
```
/specialist supabase <task>
```
**Best for:**
- Database schema changes and migrations
- RLS policy creation and optimization  
- Query performance tuning and indexing
- Authentication and user management setup
- Database security and access control

**Example:**
```
/specialist supabase Create a new table for construction reports with proper RLS policies and performance indexes
```

### 🟠 **backend** - API & Server Logic Expert
```
/specialist backend <task>
```
**Best for:**
- Next.js API route development
- Business logic implementation
- Authentication middleware and JWT handling
- Data validation and error handling
- Third-party API integrations

**Example:**
```
/specialist backend Create API endpoints for project CRUD operations with proper validation and error handling
```

### 🟢 **frontend** - UI/UX & React Expert
```
/specialist frontend <task>
```
**Best for:**
- React component development
- Form creation and validation
- Responsive design and accessibility
- User interface improvements
- Real-time data integration

**Example:**
```
/specialist frontend Create a responsive project dashboard component with real-time updates and filtering
```

### 🟡 **performance** - Speed & Efficiency Expert
```
/specialist performance <task>
```
**Best for:**
- Core Web Vitals optimization
- Bundle size analysis and code splitting
- API response time improvements
- Database query optimization
- Caching strategy implementation

**Example:**
```
/specialist performance Analyze and optimize the dashboard loading performance - currently taking 8+ seconds
```

### 🔴 **security** - Application Security Expert
```
/specialist security <task>
```
**Best for:**
- Security vulnerability assessment
- Access control validation and implementation
- Data protection and privacy compliance
- Authentication flow security review
- Security best practices implementation

**Example:**
```
/specialist security Conduct security audit of the authentication system and implement multi-factor authentication
```

### 🟣 **qa** - Quality Assurance Expert
```
/specialist qa <task>
```
**Best for:**
- Test strategy development
- Automated test creation (unit, integration, e2e)
- Bug detection and regression testing
- Quality gates and release validation
- Test coverage analysis

**Example:**
```
/specialist qa Create comprehensive test suite for the project management API with >80% coverage
```

## When to Use Direct Routing vs Orchestration

### **Use `/specialist`** when:
- ✅ You know exactly which domain expert is needed
- ✅ The task is clearly within one specialist's expertise
- ✅ You want faster response (no orchestration analysis)
- ✅ The task doesn't require multi-agent coordination

### **Use `/orchestrate`** when:
- 🎯 The task spans multiple domains
- 🎯 You're unsure which specialists are needed
- 🎯 The task requires complex coordination
- 🎯 You want comprehensive analysis and planning

## Response Pattern

When you use `/specialist`, the agent will:

1. **Acknowledge the task** and confirm it's within their domain
2. **Analyze requirements** specific to their expertise
3. **Provide focused solution** without orchestration overhead
4. **Suggest collaboration** if other agents are needed
5. **Deliver specialized output** with domain-specific insights

## Common Use Cases

### **Database Tasks** → `/specialist supabase`
```
/specialist supabase Add indexes to the projects table to improve query performance for the dashboard

/specialist supabase Create RLS policies for the new user_documents table with role-based access

/specialist supabase Write a migration to add seniority levels to project managers
```

### **API Development** → `/specialist backend`
```
/specialist backend Add pagination and filtering to the /api/projects endpoint

/specialist backend Fix the authentication middleware to properly handle JWT token expiration

/specialist backend Create API validation for the project creation form using Zod schemas
```

### **UI/UX Work** → `/specialist frontend`
```
/specialist frontend Create a mobile-responsive navigation component with user menu

/specialist frontend Fix the form validation feedback - error messages aren't showing properly

/specialist frontend Add loading states and error handling to the project list component
```

### **Performance Issues** → `/specialist performance` 
```
/specialist performance The project listing page is loading slowly - need optimization analysis

/specialist performance Reduce the bundle size - it's over 500KB and affecting page load speed

/specialist performance Optimize the API response times for the dashboard - currently 2+ seconds
```

### **Security Reviews** → `/specialist security`
```
/specialist security Review the file upload functionality for security vulnerabilities

/specialist security Validate that user permissions are properly enforced in the project API

/specialist security Check if the authentication system is vulnerable to session fixation attacks
```

### **Testing & QA** → `/specialist qa`
```
/specialist qa Create unit tests for the new project validation functions

/specialist qa Set up integration tests for the authentication workflow

/specialist qa Add e2e tests for the project creation and management user flow
```

## Agent Handoff

If a specialist determines the task requires other agents, they will:

1. **Complete their portion** of the work
2. **Identify collaboration needs** with specific agents
3. **Suggest next steps** with recommended agent routing
4. **Provide context** for seamless handoff

**Example:**
```
🔴 Supabase Specialist: "I've created the database schema and RLS policies for the new feature. 
The task now needs:
- Backend Engineer: API endpoints (/specialist backend)  
- Frontend Specialist: UI components (/specialist frontend)
- QA Engineer: Test coverage (/specialist qa)

Would you like me to coordinate with them, or use /orchestrate for full coordination?"
```

## Quick Reference

| Need | Command | Agent |
|------|---------|-------|
| Database work | `/specialist supabase` | 🔴 Database Expert |
| API development | `/specialist backend` | 🟠 Server Logic Expert |
| UI components | `/specialist frontend` | 🟢 React Expert |
| Speed issues | `/specialist performance` | 🟡 Optimization Expert |
| Security review | `/specialist security` | 🔴 Security Expert |
| Testing & QA | `/specialist qa` | 🟣 Testing Expert |

## Tips for Best Results

### **Be Specific About Your Needs**
```
✅ GOOD: /specialist frontend Create a data table component with sorting, filtering, and pagination
❌ VAGUE: /specialist frontend Make a table
```

### **Include Context When Helpful**
```
✅ HELPFUL: /specialist performance The dashboard loads in 8 seconds, users are complaining
❌ UNCLEAR: /specialist performance Dashboard is slow
```

### **Mention Constraints**
```
✅ USEFUL: /specialist security Review authentication - must be compliant with enterprise security
❌ BASIC: /specialist security Check auth
```

---

**Remember**: Direct specialist routing is faster and more focused, but orchestration provides comprehensive coordination. Choose based on your task complexity and coordination needs.