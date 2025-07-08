# Task: Local App Testing & Validation with Realistic Construction Data

## Type: Testing/Validation
**Priority**: High
**Effort**: 7-10 hours (1-2 days)  
**Subagents**: 3
**Approach**: Sequential

## Request Analysis
**Original Request**: "i want to run the app locally to see the product. use app,give feedback,add new features or test the current features.Want to make sure everything works well. i want to focus on testing. ı want to be able to create projects,tasks, and frankly to see some data so i can understand how things work. I would like to have construction project including millwork,consturction, and electricity. create at least 6 different projects,include 15 team member or more if needed. show some pm's working on multiple projects. create these projects scope lists,shopdrawings,materials as well. also add tasks"

**Objective**: Set up local development environment with comprehensive realistic construction data for thorough testing and validation of Formula PM functionality

**Over-Engineering Check**: Focused on practical testing with real-world scenarios - minimum viable approach for maximum validation value

## Subagent Assignments

### Wave 1: Environment Setup & Data Foundation
#### Subagent 1: devops - Local Development Environment & Core Data Setup
```
TASK_NAME: setup_local_environment_with_construction_data
TASK_GOAL: Establish fully functional local development environment with realistic construction company data foundation
REQUIREMENTS:
1. Set up local development environment (Next.js + Supabase)
2. Verify all database migrations are applied correctly
3. Create 15+ team members with realistic construction roles and assignments
4. Generate 6 diverse construction projects with proper categorization
5. Set up project manager assignments across multiple projects
6. Ensure authentication and permissions work locally
7. Validate all core systems are functional (Client Portal, Purchase Department, etc.)
CONSTRAINTS:
- Use existing database schema without modifications
- Follow Formula PM role hierarchy exactly
- Ensure realistic construction industry naming and scenarios
- Do not create dummy/test data - make it production-quality realistic
DEPENDENCIES: None
```

### Wave 2: Comprehensive Content Generation
#### Subagent 2: content - Realistic Construction Project Content & Workflows
```
TASK_NAME: generate_comprehensive_construction_workflows
TASK_GOAL: Populate projects with complete scope lists, shop drawings, materials, and task assignments representing real construction workflows
REQUIREMENTS:
1. Create comprehensive scope lists for all 6 projects covering millwork, construction, and electrical trades
2. Generate realistic shop drawing workflows with approval chains
3. Populate material specifications with real construction materials and suppliers
4. Create task assignments with dependencies across projects and team members
5. Set up approval workflows for shop drawings and purchase requests
6. Generate realistic timeline data and project phases
7. Create sample client communications and document approvals
8. Add purchase requests and vendor interactions
CONSTRAINTS:
- Use actual construction terminology and processes
- Ensure scope items reflect real-world construction project breakdown
- Create realistic dependencies between tasks and trades
- Follow construction industry best practices for workflows
DEPENDENCIES: Wave 1 completed (environment and base data ready)
```

### Wave 3: Testing & Validation
#### Subagent 3: qa - Comprehensive System Testing & User Experience Validation
```
TASK_NAME: comprehensive_formula_pm_testing_validation
TASK_GOAL: Conduct thorough testing of all Formula PM features using realistic data and document findings with improvement recommendations
REQUIREMENTS:
1. Test complete project creation and management workflows
2. Validate task assignment and tracking across multiple projects
3. Test shop drawing approval workflows end-to-end
4. Verify purchase department functionality with realistic scenarios
5. Test client portal access and functionality
6. Validate mobile responsiveness and user experience
7. Test permission system with different user roles
8. Document any bugs, usability issues, or performance problems
9. Create user experience feedback report with improvement suggestions
10. Verify data integrity across all workflows
CONSTRAINTS:
- Test from perspective of different user roles (PM, architect, field worker, client)
- Focus on real-world usage scenarios, not edge cases
- Document specific issues with reproduction steps
- Provide actionable feedback for improvements
DEPENDENCIES: Wave 1 & 2 completed (full environment with realistic data)
```

## Technical Details
**Files to modify**: 
- Local environment configuration
- Database seeding scripts
- Sample data generation
- No core application code modifications

**Patterns to use**: 
- Existing Formula PM database schema
- Current user role and permission patterns
- Established project and task management workflows

**Environment setup**: Local Next.js + Supabase development environment

## Success Criteria
- Local Formula PM environment running smoothly with realistic construction data
- 6 construction projects with complete scope, materials, and task data
- 15+ team members with proper role assignments and multi-project participation
- All core workflows tested and validated with realistic scenarios
- Comprehensive feedback report documenting user experience and any issues found
- Validation: All features work as expected with realistic construction project data

## Status Tracking (For Coordinator)

### Wave 1: Environment Setup & Data Foundation
- [ ] Subagent 1: setup_local_environment_with_construction_data - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 2: Content Generation
- [ ] Subagent 2: generate_comprehensive_construction_workflows - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 3: Testing & Validation
- [ ] Subagent 3: comprehensive_formula_pm_testing_validation - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Overall Progress
- **Progress**: ___% (X/3 tasks approved)
- **Blocked**: ___
- **Re-delegated**: ___
- **Current Wave**: ___
- **Next Action**: ____________

### Decisions Made
- [Decision 1]: [Rationale and impact]
- [Decision 2]: [Rationale and impact]

## Expected Deliverables
1. **Fully functional local development environment**
2. **6 realistic construction projects** with complete data
3. **15+ team members** with proper role assignments
4. **Comprehensive scope lists, shop drawings, and materials** for all projects
5. **Complete task assignments** with realistic dependencies
6. **Testing validation report** with user experience feedback
7. **Issue documentation** with improvement recommendations
8. **Working demonstration** of all Formula PM core features

## Project Portfolio to be Created
1. **Residential High-End Custom Home** (Millwork intensive)
2. **Commercial Office Building** (Construction + Electrical focus)
3. **Restaurant Renovation** (Mixed trades with tight timeline)
4. **Luxury Condominium Complex** (Large scale, multiple PMs)
5. **Medical Office Build-Out** (Specialized electrical + millwork)
6. **Retail Store Chain Rollout** (Standardized but customized)

## Team Structure to be Created
- **Project Managers**: 4-5 (managing multiple projects)
- **Architects**: 3-4 
- **Technical Engineers**: 2-3
- **Field Workers**: 3-4
- **Purchase Specialists**: 2
- **Admin Staff**: 2-3
- **Company Leadership**: 2

Total: 18-23 team members with realistic overlapping responsibilities