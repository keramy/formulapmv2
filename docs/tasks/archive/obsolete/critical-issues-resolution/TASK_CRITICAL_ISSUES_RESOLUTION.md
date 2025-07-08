# Task: Critical Issues Resolution Based on Gemini Plan

## Type: Refactoring
**Priority**: Critical
**Effort**: 13-18 days  
**Subagents**: 3
**Approach**: Sequential

## Request Analysis
**Original Request**: "read the gemini's plan to solve the critical issues in our app. these errors and problems are need to be resolved permanently. prepare it for the coordinator. Breakdown the tasks. Do not hurry and overengineer."
**Objective**: Systematically resolve all critical blocking issues preventing production deployment
**Over-Engineering Check**: Following Gemini's structured 5-phase plan with minimal viable fixes at each step

## Subagent Assignments

### Wave 1: Critical Foundation (Phases 1-2)
#### Subagent 1: debug + code - TypeScript Compilation & Authentication Fixes
```
TASK_NAME: resolve_compilation_and_auth_issues
TASK_GOAL: Achieve clean TypeScript compilation and fix Next.js 15 authentication incompatibility
REQUIREMENTS:
1. Fix all TypeScript compilation errors in 16+ affected component files
2. Update Next.js 15 import/export patterns across client-portal, subcontractor, purchase components
3. Resolve missing/incorrect type definitions and component prop type errors
4. Replace withAuth middleware with Next.js 15 compatible authentication system
5. Unify authentication flows into single API endpoint
6. Update session and cookie handling for App Router compatibility
7. Modernize JWT verification flow
8. Achieve zero TypeScript compilation errors with npm run build
CONSTRAINTS:
- MUST achieve clean build before proceeding to Wave 2
- AVOID changing core business logic during fixes
- Follow Next.js 15 official migration patterns
- Maintain existing authentication security levels
DEPENDENCIES: None
```

### Wave 2: Deprecation Cleanup (Phase 3)
#### Subagent 2: refactor - Remove Deprecated Features
```
TASK_NAME: complete_deprecation_cleanup
TASK_GOAL: Permanently remove all deprecated feature remnants and dead code
REQUIREMENTS:
1. Remove entire shop-drawings system and all references
2. Remove task management system remnants and disabled migrations
3. Remove document approval workflow remnants and disabled migrations
4. Clean up broken imports and unused code throughout codebase
5. Verify no deprecated code is inadvertently called or rendered
6. Ensure application builds and runs without missing file errors
CONSTRAINTS:
- DO NOT remove intended/new features - only deprecated systems
- AVOID breaking existing functional components
- Use search tools to ensure complete removal of references
- Verify build success after each major removal
DEPENDENCIES: resolve_compilation_and_auth_issues (completed)
```

### Wave 3: Architecture Simplification & Testing (Phases 4-5)
#### Subagent 3: architect + tdd - Simplify Architecture & Add Testing
```
TASK_NAME: simplify_architecture_and_test
TASK_GOAL: Reduce architectural complexity and add comprehensive testing
REQUIREMENTS:
1. Consolidate portal systems into main application with role-based views
2. Reduce abstraction layers and overly complex component hierarchies
3. Standardize component patterns and API structure across application
4. Add comprehensive test coverage for critical paths
5. Validate all critical user flows end-to-end
6. Conduct basic performance testing for regression detection
7. Perform basic security audit of authentication and data handling
8. Ensure all tests pass and application is production-ready
CONSTRAINTS:
- Prioritize readability and maintainability over optimization
- Focus testing on areas that underwent significant changes
- Use existing testing frameworks (Jest, React Testing Library)
- Maintain existing functionality while simplifying structure
DEPENDENCIES: complete_deprecation_cleanup (completed)
```

## Technical Details
**Files to modify**: 
- TypeScript compilation: 16+ component files in client-portal, subcontractor, purchase directories
- Authentication: src/lib/middleware/, src/app/api/auth/, middleware.ts
- Deprecation cleanup: src/components/shop-drawings/, disabled migration files
- Architecture: Portal directories, component hierarchies, API route structure

**Patterns to use**: 
- Next.js 15 App Router authentication patterns
- Unified component design patterns from Patterns/ directory
- Sequential phase execution per Gemini's plan

**Migration changes**: Remove disabled .sql files, ensure clean schema

## Success Criteria
- Zero TypeScript compilation errors with clean build
- Unified Next.js 15 compatible authentication system working
- All deprecated features completely removed without breaking app
- Simplified architecture with reduced complexity
- Comprehensive test coverage for critical functionality
- Application ready for production deployment

## Status Tracking (For Coordinator)

### Wave 1: Critical Foundation
- [ ] Subagent 1: resolve_compilation_and_auth_issues - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 2: Deprecation Cleanup
- [ ] Subagent 2: complete_deprecation_cleanup - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 3: Architecture & Testing
- [ ] Subagent 3: simplify_architecture_and_test - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Overall Progress
- **Progress**: ___% (0/3 tasks approved)
- **Blocked**: 0
- **Re-delegated**: 0
- **Current Wave**: 1
- **Next Action**: Start Wave 1 Critical Foundation

### Decisions Made
- [Sequential Execution]: Following Gemini's strict phase order to ensure stability
- [Three-Wave Approach]: Grouped Gemini's 5 phases into 3 logical waves for coordinator efficiency
- [Foundation First]: Prioritizing compilation and auth fixes as blocking issues for all other work