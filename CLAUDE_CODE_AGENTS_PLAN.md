# Claude Code Custom AI Agents Plan for Formula PM V2

## 🎯 Overview

Claude Code sub-agents are specialized AI assistants that can handle specific tasks with custom configurations. They help preserve context, improve task execution, and enable modular development patterns.

## 📋 Proposed Sub-Agents for Formula PM V2

### 1. **Supabase Database Agent** (`/supabase-expert`)
```yaml
name: supabase-expert
description: Expert in Supabase database operations, RLS policies, migrations, and performance optimization
tools: Read, Write, MultiEdit, Bash, Grep, mcp__supabase__execute_sql, mcp__supabase__apply_migration
```

**Responsibilities:**
- Database schema design and optimization
- RLS policy creation and troubleshooting
- Performance query optimization
- Migration script generation
- Index management
- Data integrity validation
- Backup and recovery procedures

**Example Usage:**
```
/supabase-expert Fix the infinite recursion in user_profiles RLS policies
/supabase-expert Create optimized indexes for the projects table
/supabase-expert Generate a migration for shop_drawings workflow
```

### 2. **Backend API Agent** (`/backend-specialist`)
```yaml
name: backend-specialist
description: Specialist in Next.js API routes, authentication middleware, and backend architecture
tools: Read, Write, MultiEdit, Grep, Glob, useApiQuery, withAuth patterns
```

**Responsibilities:**
- API route creation with proper authentication
- Middleware implementation
- JWT token management
- Error handling patterns
- Request/response optimization
- API versioning strategies
- Rate limiting implementation

**Example Usage:**
```
/backend-specialist Create a new API endpoint for bulk project updates
/backend-specialist Fix authentication issues in the shop-drawings API
/backend-specialist Implement rate limiting for public endpoints
```

### 3. **Code Refactoring Agent** (`/refactor-expert`)
```yaml
name: refactor-expert
description: Expert in code refactoring, optimization, and applying enterprise patterns
tools: Read, Write, MultiEdit, Grep, Glob, Task
```

**Responsibilities:**
- Apply SOLID principles
- Implement design patterns
- Remove code duplication
- Optimize performance bottlenecks
- Modernize legacy code
- Improve type safety
- Extract reusable components

**Example Usage:**
```
/refactor-expert Apply the withAuth pattern to all API routes
/refactor-expert Extract common data fetching logic into custom hooks
/refactor-expert Optimize the projects list component for better performance
```

### 4. **UI/UX Enhancement Agent** (`/ui-ux-specialist`)
```yaml
name: ui-ux-specialist  
description: Specialist in React components, responsive design, accessibility, and user experience
tools: Read, Write, MultiEdit, mcp__playwright__playwright_screenshot, mcp__playwright__playwright_navigate
```

**Responsibilities:**
- Component architecture design
- Responsive layout implementation
- Accessibility (WCAG) compliance
- Animation and transitions
- Form validation and UX
- Loading states and error handling
- Theme and styling consistency

**Example Usage:**
```
/ui-ux-specialist Make the dashboard mobile-responsive
/ui-ux-specialist Add proper loading states to all data tables
/ui-ux-specialist Implement dark mode across the application
```

### 5. **Testing & QA Agent** (`/test-specialist`)
```yaml
name: test-specialist
description: Expert in Jest testing, E2E testing with Playwright, and test coverage optimization
tools: Read, Write, MultiEdit, Bash, mcp__playwright__start_codegen_session
```

**Responsibilities:**
- Unit test creation
- Integration test implementation
- E2E test scenarios
- Test coverage analysis
- Performance testing
- Security testing
- Regression test suites

**Example Usage:**
```
/test-specialist Create comprehensive tests for the authentication flow
/test-specialist Generate E2E tests for the project creation workflow
/test-specialist Analyze and improve test coverage for critical paths
```

### 6. **Security Audit Agent** (`/security-auditor`)
```yaml
name: security-auditor
description: Security specialist for vulnerability scanning, authentication hardening, and compliance
tools: Read, Grep, Glob, Bash, WebSearch
```

**Responsibilities:**
- Security vulnerability scanning
- Authentication flow auditing
- SQL injection prevention
- XSS protection verification
- CSRF token implementation
- Permission boundary validation
- Compliance checking (GDPR, SOC2)

**Example Usage:**
```
/security-auditor Audit all API endpoints for security vulnerabilities
/security-auditor Verify RLS policies prevent unauthorized access
/security-auditor Check for exposed secrets or API keys
```

### 7. **Performance Optimization Agent** (`/performance-expert`)
```yaml
name: performance-expert
description: Expert in React performance, database query optimization, and bundle size reduction
tools: Read, Write, MultiEdit, Bash, Grep, performanceMonitor
```

**Responsibilities:**
- React component optimization
- Database query analysis
- Bundle size reduction
- Caching strategy implementation
- Lazy loading setup
- Memory leak detection
- Performance metrics tracking

**Example Usage:**
```
/performance-expert Optimize the dashboard loading time
/performance-expert Reduce the initial bundle size by 50%
/performance-expert Implement caching for frequently accessed data
```

### 8. **Documentation Agent** (`/docs-writer`)
```yaml
name: docs-writer
description: Technical documentation specialist for API docs, user guides, and code comments
tools: Read, Write, MultiEdit, Glob
```

**Responsibilities:**
- API documentation generation
- User guide creation
- Code comment standardization
- README updates
- Architecture documentation
- Deployment guides
- Troubleshooting documentation

**Example Usage:**
```
/docs-writer Generate API documentation for all endpoints
/docs-writer Create a deployment guide for production
/docs-writer Document the authentication flow with diagrams
```

## 🚀 Implementation Strategy

### Phase 1: Core Agents (Week 1)
1. **Supabase Database Agent** - Critical for database operations
2. **Backend API Agent** - Essential for API consistency
3. **Code Refactoring Agent** - Improve code quality

### Phase 2: Enhancement Agents (Week 2)
4. **UI/UX Enhancement Agent** - Better user experience
5. **Testing & QA Agent** - Ensure reliability
6. **Security Audit Agent** - Security hardening

### Phase 3: Optimization Agents (Week 3)
7. **Performance Optimization Agent** - Speed improvements
8. **Documentation Agent** - Comprehensive documentation

## 📁 File Structure

```
.claude/
├── agents/
│   ├── supabase-expert.md
│   ├── backend-specialist.md
│   ├── refactor-expert.md
│   ├── ui-ux-specialist.md
│   ├── test-specialist.md
│   ├── security-auditor.md
│   ├── performance-expert.md
│   └── docs-writer.md
└── commands/
    ├── fix-auth.md
    ├── optimize-query.md
    ├── create-api.md
    └── add-tests.md
```

## 🎯 Custom Slash Commands

### Quick Action Commands

**`/fix-auth`** - Fix authentication issues
```markdown
Fix authentication and login issues in the application. Check:
1. JWT token usage in all hooks
2. RLS policies for infinite recursion
3. Authentication middleware configuration
4. Clear browser storage if needed
$ARGUMENTS
```

**`/optimize-query`** - Optimize database queries
```markdown
Optimize the database query for $ARGUMENTS. Apply these optimizations:
1. Add proper indexes
2. Use SELECT wrappers for auth.uid()
3. Implement query caching
4. Add performance monitoring
```

**`/create-api`** - Create new API endpoint
```markdown
Create a new API endpoint for $ARGUMENTS with:
1. Proper withAuth middleware
2. Request validation
3. Error handling
4. TypeScript types
5. Response formatting
```

**`/add-tests`** - Add comprehensive tests
```markdown
Create comprehensive tests for $ARGUMENTS including:
1. Unit tests with Jest
2. Integration tests for API endpoints
3. E2E tests with Playwright
4. Edge case coverage
```

## 🔧 Agent Creation Template

```markdown
---
name: agent-name
description: Clear description of when this agent should be used
tools: List, Of, Required, Tools
---

You are an expert [role] specializing in [domain].

## Your Expertise:
- [Specific skill 1]
- [Specific skill 2]
- [Specific skill 3]

## Your Approach:
1. [Step 1 of your methodology]
2. [Step 2 of your methodology]
3. [Step 3 of your methodology]

## Best Practices You Follow:
- [Best practice 1]
- [Best practice 2]
- [Best practice 3]

## Common Patterns You Apply:
- [Pattern 1 with example]
- [Pattern 2 with example]

When given a task, you will:
1. Analyze the requirements thoroughly
2. Apply best practices and patterns
3. Provide clean, maintainable solutions
4. Include proper error handling
5. Add relevant tests when applicable
```

## 🎉 Benefits

1. **Context Preservation**: Each agent works in its own context, preserving the main conversation
2. **Specialized Expertise**: Agents have focused knowledge and optimized prompts
3. **Parallel Processing**: Multiple agents can work on different aspects simultaneously
4. **Consistency**: Standardized approaches across the codebase
5. **Team Scalability**: New developers can use agents to maintain code standards
6. **Reduced Errors**: Specialized agents catch domain-specific issues
7. **Faster Development**: Quick access to expert-level assistance

## 📊 Success Metrics

- **Development Speed**: 40% faster feature implementation
- **Code Quality**: 60% reduction in code review issues
- **Bug Reduction**: 50% fewer production bugs
- **Documentation**: 100% API documentation coverage
- **Test Coverage**: Achieve 80%+ test coverage
- **Performance**: 30% improvement in app performance

## 🚦 Next Steps

1. **Create the `.claude/agents/` directory structure**
2. **Implement the Supabase Database Agent first** (most critical)
3. **Test agent effectiveness with current issues**
4. **Iterate and improve agent prompts based on usage**
5. **Document agent usage patterns for the team**
6. **Create project-specific agents as patterns emerge**

This modular approach will make Formula PM V2 development more efficient, maintainable, and scalable!