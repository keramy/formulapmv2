# Task: Phase 2 - Core Business Features

## Type: New Feature
**Priority**: High
**Effort**: 2 weeks  
**Subagents**: 2 (working in parallel)
**Approach**: Parallel

## Request Analysis
**Original Request**: "Implement core business features: tasks, milestones, materials, and shop drawings"
**Objective**: Build the heart of the project management system with real functionality
**Over-Engineering Check**: Using existing schema, following established patterns

## Subagent Assignments

### Week 3-4: Parallel Implementation

#### Subagent C: Task & Milestone Systems Specialist
```
TASK_NAME: TASK_MILESTONE_IMPLEMENTATION
TASK_GOAL: Fully functional task management and milestone tracking systems
REQUIREMENTS:
1. Implement task CRUD operations with real database
2. Create task assignment and status tracking
3. Build comment system with @mentions functionality
4. Implement task dependencies and priority system
5. Create milestone progress calculation algorithms
6. Add deadline tracking and alert system
7. Build milestone-to-task relationships
8. Implement calendar integration views
9. Create real-time updates using WebSocket patterns
10. Ensure compilation: npm run build && npm run type-check
CONSTRAINTS:
- Use existing tasks and project_milestones tables
- Follow withAuth pattern for all endpoints
- Implement optimistic updates for better UX
- Use Kiro's RLS patterns for security
DEPENDENCIES: 
- Phase 1 completed (real auth and APIs)
- Access to comment_mentions table schema
OUTPUT_ARTIFACTS:
- Task management API endpoints
- Milestone tracking components
- Real-time update implementation
- Test coverage report
```

#### Subagent D: Material & Approval Workflows Specialist
```
TASK_NAME: MATERIAL_APPROVAL_IMPLEMENTATION
TASK_GOAL: Complete material specification and shop drawing approval systems
REQUIREMENTS:
1. Build material specification CRUD operations
2. Implement multi-stage approval workflow
3. Create rejection handling with revision requests
4. Build material-to-scope item integration
5. Implement shop drawing file upload system
6. Create drawing approval workflow
7. Add version control for drawings
8. Integrate with project timelines
9. Build notification system for approvals
10. Ensure compilation: npm run build && npm run type-check
CONSTRAINTS:
- Use existing material_specs table structure
- Follow established file upload patterns
- Implement proper file size limits
- Use role-based approval permissions
DEPENDENCIES:
- Phase 1 completed (role system working)
- File storage configuration
OUTPUT_ARTIFACTS:
- Material approval API endpoints
- Shop drawing management system
- File upload implementation
- Workflow state machines
```

## Technical Details

### Database Schemas to Use

**Task Management** (Subagent C):
```typescript
// Existing tables to leverage
- tasks (if exists, or create)
- task_comments (if exists, or create)
- comment_mentions (create in Phase 1)
- project_milestones (existing)

// Key relationships
- Tasks belong to projects
- Tasks can have dependencies
- Milestones contain multiple tasks
- Comments belong to tasks
```

**Material Management** (Subagent D):
```typescript
// Existing tables to leverage
- material_specs (existing)
- material_scope_links (existing)
- scope_items (existing)

// Shop drawings (may need new table)
- shop_drawings
- drawing_versions
- approval_history
```

### API Implementation Patterns

```typescript
// Task API Example (Subagent C)
export const POST = withAuth(async (request, { user, profile }) => {
  const body = await request.json();
  
  // Validate task data
  const validation = validateData(schemas.taskSchema, body);
  if (!validation.success) {
    return createErrorResponse('Validation failed', 400, validation.errors);
  }
  
  // Create task with proper relationships
  const task = await supabase
    .from('tasks')
    .insert({
      ...body,
      created_by: user.id,
      assigned_to: body.assigned_to || null
    })
    .select()
    .single();
    
  // Send real-time update
  await broadcastUpdate('task.created', task);
  
  return createSuccessResponse(task);
}, { permission: 'tasks.create' });

// Material Approval Example (Subagent D)
export const PUT = withAuth(async (request, { user, profile }) => {
  const { id } = params;
  const { action, reason } = await request.json();
  
  // Validate approval action
  if (!['approve', 'reject', 'request_revision'].includes(action)) {
    return createErrorResponse('Invalid action', 400);
  }
  
  // Check approval permissions
  if (!canApprove(profile.role, profile.seniority)) {
    return createErrorResponse('Insufficient permissions', 403);
  }
  
  // Update material status
  const result = await supabase
    .from('material_specs')
    .update({
      status: action === 'approve' ? 'approved' : 
              action === 'reject' ? 'rejected' : 'revision_required',
      approved_by: action === 'approve' ? user.id : null,
      approved_at: action === 'approve' ? new Date().toISOString() : null,
      rejection_reason: reason || null
    })
    .eq('id', id)
    .select()
    .single();
    
  // Notify relevant parties
  await notifyMaterialStatusChange(result);
  
  return createSuccessResponse(result);
}, { permission: 'materials.approve' });
```

### Frontend Integration Points

**Task Components** (Subagent C):
- `src/components/tasks/TaskList.tsx`
- `src/components/tasks/TaskCard.tsx`
- `src/components/tasks/TaskForm.tsx`
- `src/components/milestones/MilestoneCalendar.tsx`
- `src/components/milestones/MilestoneProgressBar.tsx`

**Material Components** (Subagent D):
- `src/components/materials/MaterialApprovalFlow.tsx`
- `src/components/materials/MaterialSpecForm.tsx`
- `src/components/shop-drawings/DrawingUpload.tsx`
- `src/components/shop-drawings/ApprovalWorkflow.tsx`

## Success Criteria

### Subagent C Success Metrics
- [ ] Full task CRUD operations working
- [ ] Task assignment notifications functional
- [ ] @mentions creating proper notifications
- [ ] Milestone progress auto-calculating
- [ ] Calendar view showing all milestones
- [ ] Real-time updates working across users
- [ ] 90%+ test coverage for task system

### Subagent D Success Metrics
- [ ] Material specifications fully manageable
- [ ] Approval workflow with 3+ stages working
- [ ] File upload accepting PDF/DWG formats
- [ ] Version control tracking all changes
- [ ] Approval notifications sent correctly
- [ ] Integration with scope items working
- [ ] 90%+ test coverage for materials

## Coordination Points

### Daily Requirements
1. API endpoint coordination (avoid conflicts)
2. Shared component updates synchronization
3. Database migration coordination
4. Real-time features integration
5. Testing coordination

### Integration Points
- Both systems need notification service
- Shared permission checking logic
- Common file upload infrastructure
- Unified activity logging

## Risk Management

### Technical Risks
- **Risk**: Real-time updates causing performance issues
- **Mitigation**: Implement debouncing, use connection pooling

### Business Logic Risks
- **Risk**: Complex approval workflows with edge cases
- **Mitigation**: Create comprehensive state diagrams first

### Integration Risks
- **Risk**: Task-milestone relationships complexity
- **Mitigation**: Clear data model, extensive relationship testing

## Status Tracking (For Coordinator)

### Week 3 Progress
- [ ] Task CRUD APIs complete
- [ ] Basic material management working
- [ ] File upload infrastructure ready
- [ ] Initial frontend integration

### Week 4 Progress
- [ ] Milestone calculations working
- [ ] Approval workflows complete
- [ ] Real-time updates functional
- [ ] All tests passing

### Feature Completion
- [ ] Task Management: ___% complete
- [ ] Milestone Tracking: ___% complete
- [ ] Material Approvals: ___% complete
- [ ] Shop Drawings: ___% complete

### Subagent Status
- [ ] Subagent C: Task & Milestones - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________
- [ ] Subagent D: Materials & Approvals - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Quality Metrics
- Test Coverage: ___%
- API Response Time: ___ms
- Bug Count: ___
- Code Review Status: ___

### Phase Completion Criteria
- [ ] All CRUD operations for tasks/milestones working
- [ ] Approval workflows fully functional
- [ ] Real-time updates operational
- [ ] File uploads working with proper limits
- [ ] All tests passing (90%+ coverage)
- [ ] Performance targets met (<200ms)
- [ ] No critical bugs
- [ ] Documentation complete