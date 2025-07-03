# Formula PM Development Orchestration Pattern

## Overview
Master orchestration pattern for developing the entire Formula PM application using specialized subagents. This pattern ensures consistent quality, parallel development efficiency, and adherence to Formula PM's specific patterns and conventions.

## Core Philosophy
**Never develop solo when complexity requires specialization.** Use expert subagents for focused, high-quality implementation that follows Formula PM's established patterns.

## Specialized Agent Roles

### 🗄️ Database Architecture Agent
**Specialization**: PostgreSQL, Supabase, schema design, performance optimization
**Responsibilities**:
- Design database schemas for all features
- Create optimized indexes and relationships
- Handle data migrations and versioning
- Ensure data integrity and constraints

**Template Usage**:
```markdown
TASK: Design complete database schema for [feature_name]
EXPERTISE: PostgreSQL, Supabase, indexing, relationships, performance
DELIVERABLES: 
- Migration files following Formula PM naming conventions
- Performance-optimized indexes
- Data validation constraints
- Relationship mappings
PATTERN FOCUS: Study existing Formula PM database patterns in /schema/
SPECIFIC FILES TO READ: 
- Existing migration files
- Current table structures
- Indexing strategies
COMPILATION TARGET: Database migration validation
```

### 🔧 Backend API Agent  
**Specialization**: Next.js API routes, authentication, validation, business logic
**Responsibilities**:
- Implement REST API endpoints
- Handle authentication and authorization
- Data validation and sanitization
- Error handling and logging

**Template Usage**:
```markdown
TASK: Implement complete API layer for [feature_name]
EXPERTISE: Next.js API routes, Supabase client, authentication, validation
DELIVERABLES:
- CRUD endpoints with proper HTTP methods
- Input validation using Formula PM patterns
- Error handling following project conventions
- Authentication middleware integration
PATTERN FOCUS: Study existing API patterns in /api/
SPECIFIC FILES TO READ:
- /api/ route handlers
- Authentication middleware
- Validation schemas
- Error handling patterns
COMPILATION TARGET: API endpoint functionality and TypeScript compliance
```

### 🎨 Frontend UI Agent
**Specialization**: React, Next.js, Shadcn/ui, form handling, state management
**Responsibilities**:
- Build React components and pages
- Implement forms with validation
- State management and data flow
- UI/UX consistency

**Template Usage**:
```markdown
TASK: Build complete frontend interface for [feature_name]
EXPERTISE: React, Next.js 15, Shadcn/ui, React Hook Form, state management
DELIVERABLES:
- React components following Formula PM design system
- Form handling with validation
- Responsive layouts using Tailwind CSS
- Integration with backend APIs
PATTERN FOCUS: Study existing UI patterns in /src/components/
SPECIFIC FILES TO READ:
- Existing component library
- Form handling patterns
- Layout components
- Design system tokens
COMPILATION TARGET: React component compilation and TypeScript compliance
```

### 📁 File Management Agent
**Specialization**: File uploads, image processing, storage optimization, CDN
**Responsibilities**:
- Implement secure file upload systems
- Image processing and optimization
- Storage management and cleanup
- Performance optimization

**Template Usage**:
```markdown
TASK: Implement file management system for [feature_name]
EXPERTISE: File handling, image optimization, Supabase storage, performance
DELIVERABLES:
- Secure file upload with validation
- Image processing and optimization
- Storage organization and cleanup
- Performance monitoring
PATTERN FOCUS: Study existing file handling in Formula PM
SPECIFIC FILES TO READ:
- Current file upload implementations
- Storage configuration
- Image processing utilities
COMPILATION TARGET: File handling functionality and security compliance
```

### 🔗 Integration Agent
**Specialization**: API integration, testing, deployment, cross-component coordination
**Responsibilities**:
- Connect frontend and backend components
- End-to-end testing
- API contract validation
- Deployment coordination

**Template Usage**:
```markdown
TASK: Integrate all components for [feature_name] into production-ready system
EXPERTISE: API integration, testing, deployment, cross-component coordination
DELIVERABLES:
- End-to-end integration testing
- API contract validation
- Performance testing
- Deployment scripts and documentation
PATTERN FOCUS: Study existing integration patterns in Formula PM
SPECIFIC FILES TO READ:
- API integration examples
- Testing utilities
- Deployment configurations
COMPILATION TARGET: Full feature integration and deployment readiness
```

### ⚡ Quality Evaluator Agent
**Specialization**: Code review, pattern compliance, over-engineering detection
**Responsibilities**:
- Evaluate each component for production readiness
- Ensure pattern compliance
- Prevent over-engineering
- Final production approval

**Template Usage**: Use existing `/Patterns/templates/evaluator-prompt.md`

## Development Orchestration Workflows

### 🚀 Feature Development Workflow

#### Phase 1: Foundation (Parallel Execution)
1. **Database Agent** + **Backend Agent** work simultaneously
   - Database Agent: Schema design and migrations
   - Backend Agent: API structure and authentication
2. **Frontend Agent** creates UI mockups and component structure
3. **File Management Agent** (if needed): Designs upload architecture

#### Phase 2: Implementation (Coordinated Parallel)
1. **Backend Agent** completes API implementation
2. **Frontend Agent** builds components with mock data
3. **File Management Agent** implements upload systems
4. **Evaluator Agent** reviews each component (90+ score required)

#### Phase 3: Integration (Sequential)
1. **Integration Agent** connects all components
2. **Evaluator Agent** validates integration quality
3. **Failed components**: Re-delegated to specialist agents
4. **Final approval**: Production readiness check

### 🎯 Quality Gates

#### Component-Level Quality (Per Agent)
- **Minimum Score**: 90/100 using evaluator template
- **Pattern Compliance**: Must use Formula PM conventions
- **Compilation**: Must pass TypeScript/build checks
- **Testing**: Component-level tests must pass

#### Integration-Level Quality
- **API Contract**: Frontend/backend compatibility verified
- **Performance**: Load testing and optimization
- **Security**: Authentication and validation verified
- **End-to-End**: User workflows tested and verified

## Coordination Protocols

### 🤝 Inter-Agent Communication

#### API Contract Definition
```typescript
// Shared between Backend and Frontend Agents
interface FeatureAPI {
  endpoints: APIEndpoint[];
  types: TypeDefinition[];
  errorHandling: ErrorPattern[];
  authentication: AuthRequirement[];
}
```

#### Component Interface Definition
```typescript
// Shared between Frontend and Integration Agents  
interface ComponentInterface {
  props: PropDefinition[];
  events: EventDefinition[];
  stateManagement: StatePattern[];
  dependencies: DependencyList[];
}
```

### 📋 Handoff Protocols

#### Database → Backend Handoff
- **Deliverable**: Schema files, type definitions, migration scripts
- **Validation**: Backend Agent validates schema matches API requirements
- **Success Criteria**: Backend can implement all required operations

#### Backend → Frontend Handoff  
- **Deliverable**: API documentation, type definitions, authentication flow
- **Validation**: Frontend Agent validates API contracts meet UI requirements
- **Success Criteria**: Frontend can implement all user workflows

#### Component → Integration Handoff
- **Deliverable**: All components, API integrations, test suites
- **Validation**: Integration Agent validates end-to-end functionality
- **Success Criteria**: Complete feature works in production environment

## Formula PM Specific Requirements

### 🏗️ Architecture Compliance
- **Next.js 15 App Router**: All routing must use app directory structure
- **Supabase**: Database operations through Supabase client
- **Shadcn/ui**: UI components must use established design system
- **TypeScript**: Strict type safety throughout

### 📁 File Structure Compliance
```
/src/
  /app/              # Next.js 15 app router pages
  /components/       # Reusable UI components
  /lib/              # Utility functions and configurations
  /types/            # TypeScript type definitions
  /hooks/            # Custom React hooks
/supabase/
  /migrations/       # Database migrations
  /functions/        # Edge functions
```

### 🎨 Design System Compliance
- **Components**: Must use Shadcn/ui base components
- **Styling**: Tailwind CSS with Formula PM theme
- **Forms**: React Hook Form with Zod validation
- **State**: Use appropriate state management (useState, Context, etc.)

### 🔐 Security Compliance
- **Authentication**: Supabase Auth integration
- **Authorization**: Role-based access control
- **Input Validation**: Server-side validation for all inputs
- **File Upload**: Secure file handling with type/size limits

## Agent Spawning Decision Matrix

### 🔍 When to Use Single Agent
- **Simple CRUD operations**: Backend Agent only
- **UI-only changes**: Frontend Agent only  
- **Database schema updates**: Database Agent only

### 🎭 When to Use Multiple Agents
- **New features with UI + API**: Frontend + Backend + Integration
- **Complex data operations**: Database + Backend + Integration
- **File handling features**: All agents (Database, Backend, Frontend, File Management, Integration)

### 🏛️ When to Use Full Orchestration
- **Major feature additions**: All 6 agents
- **Architecture changes**: All agents with extra evaluator oversight
- **Production releases**: Full orchestration with comprehensive testing

## Success Metrics

### 📊 Individual Agent Success
- **Quality Score**: ≥90/100 on evaluator template
- **Compilation**: Zero TypeScript/build errors
- **Pattern Compliance**: Uses Formula PM conventions exactly
- **Testing**: All component tests pass

### 🎯 Integration Success  
- **End-to-End Tests**: All user workflows functional
- **Performance**: Meets Formula PM performance standards
- **Security**: Passes security audit checklist
- **Documentation**: Complete API and component documentation

### 🚀 Production Readiness
- **Deployment**: Successfully deploys to staging/production
- **Monitoring**: Proper logging and error tracking
- **Rollback Plan**: Clear rollback procedures documented
- **User Acceptance**: Meets user requirements and acceptance criteria

## Usage Instructions

### 🎬 How to Orchestrate Development

1. **Analyze Feature Requirements**
   - Determine complexity level
   - Identify required agent specializations
   - Plan coordination dependencies

2. **Spawn Appropriate Agents**
   - Use subagent template for each specialist
   - Provide feature-specific context
   - Set clear deliverables and success criteria

3. **Monitor Progress**
   - Review agent deliverables against quality standards
   - Coordinate handoffs between agents
   - Re-delegate if quality standards not met

4. **Integration and Deployment**
   - Use Integration Agent for final assembly
   - Use Evaluator Agent for production readiness
   - Follow Formula PM deployment procedures

### 📝 Pattern Evolution
This orchestration pattern should be updated based on:
- **Agent Performance**: Refine roles based on success rates
- **Quality Outcomes**: Adjust standards based on production results  
- **Formula PM Evolution**: Update as architecture and patterns evolve
- **Team Feedback**: Incorporate learnings from development cycles

---

## Current Session Status

### ✅ Wave 1 Foundation Progress
- **Database Schema Foundation**: APPROVED (95/100) - Production ready
- **Authentication System**: Pending - Ready to spawn
- **Core UI Components**: Pending - Ready to spawn

### 📋 Active Implementation
**Session Date**: 2025-01-02
**Current Wave**: Wave 1 Foundation
**Completed**: 1/3 foundation tasks
**Quality Standard**: 95/100 average (exceeds requirement)

### 🚀 Next Session Actions
1. Spawn Authentication System Agent (Backend API Specialist)
2. Spawn Core UI Components Agent (Frontend UI Specialist)  
3. Evaluate and approve remaining Wave 1 tasks
4. Proceed to Wave 2 after all foundation approved

---

**Remember**: This pattern exists to ensure consistent, high-quality development across all Formula PM features. Always prefer specialized agents over solo development for complex features.