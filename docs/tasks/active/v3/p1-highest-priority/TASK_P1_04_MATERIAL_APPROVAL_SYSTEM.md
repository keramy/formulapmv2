# Task: P1.04 - Material Approval & Management System Implementation

## Type: New Feature
**Priority**: P1 - Highest Priority (Can run parallel with other P1 tasks)
**Effort**: 2-3 days
**Complexity**: Moderate
**Dependencies**: None (Foundation ready)

## Request Analysis
**Original Request**: Implement material specification tracking and approval workflow system
**Objective**: Replace mock material spec data in MaterialSpecsTab with real material management functionality
**Over-Engineering Check**: Focus on core material specs - creation, approval workflow, linking to scope items

## Technical Requirements

### Database Changes Required
```sql
-- NEW TABLES NEEDED: Material specification system
CREATE TABLE material_specs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    specification TEXT NOT NULL, -- Detailed technical specs
    category TEXT, -- 'steel', 'concrete', 'finishes', etc.
    manufacturer TEXT,
    model_number TEXT,
    status material_status DEFAULT 'pending_approval',
    priority priority_level DEFAULT 'medium',
    estimated_cost NUMERIC,
    supplier_id UUID REFERENCES vendors(id), -- Link to existing vendor system
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id),
    approved_by UUID REFERENCES user_profiles(id),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT
);

CREATE TYPE material_status AS ENUM (
    'pending_approval',
    'approved',
    'rejected',
    'revision_required',
    'discontinued',
    'substitution_required'
);

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Link materials to scope items (many-to-many)
CREATE TABLE scope_material_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_item_id UUID REFERENCES scope_items(id) NOT NULL,
    material_spec_id UUID REFERENCES material_specs(id) NOT NULL,
    quantity_required NUMERIC,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(scope_item_id, material_spec_id)
);
```

### API Endpoints to Create
- `GET /api/projects/:projectId/material-specs` - List project material specs
- `POST /api/projects/:projectId/material-specs` - Create material spec
- `GET /api/material-specs/:specId` - Get specific material spec
- `PUT /api/material-specs/:specId` - Update material spec
- `DELETE /api/material-specs/:specId` - Delete material spec
- `POST /api/material-specs/:specId/approve` - Approve material spec
- `POST /api/material-specs/:specId/reject` - Reject material spec
- `POST /api/material-specs/:specId/link-scope` - Link to scope item
- `DELETE /api/material-specs/:specId/unlink-scope/:scopeItemId` - Unlink from scope

### Components to Build/Update
- `src/components/projects/tabs/MaterialSpecsTab.tsx` - Main material specs interface
- `src/components/materials/MaterialSpecList.tsx` - Material spec list display
- `src/components/materials/MaterialSpecForm.tsx` - Create/edit material form
- `src/components/materials/MaterialSpecCard.tsx` - Individual spec display
- `src/components/materials/MaterialApprovalForm.tsx` - Approval workflow form
- `src/components/materials/ScopeMaterialLinker.tsx` - Link materials to scope items
- Update `src/components/projects/tabs/ScopeListTab.tsx` - Show linked materials

## Implementation Phases

### Phase 1: Database & Core API (Day 1)
**Goal**: Database foundation and basic CRUD operations

**Tasks**:
1. Create migration for material specs tables
2. Add material status and priority enums
3. Implement RLS policies for material specs
4. Create basic API routes for material CRUD
5. Add material linking to scope items API

**Success Criteria**:
- Database migration runs successfully
- API endpoints return proper responses
- Material specs can be linked to scope items
- RLS policies secure data access

### Phase 2: Material Management Interface (Day 2)
**Goal**: User interface for material specification management

**Tasks**:
1. Create MaterialSpecsTab for project workspace
2. Build MaterialSpecList with status indicators
3. Implement MaterialSpecForm for creating/editing
4. Add material category filtering and search
5. Integrate tab into project workspace

**Success Criteria**:
- Material specs display in project tabs
- Users can create new material specifications
- Material editing and filtering works
- Category organization functions properly

### Phase 3: Approval Workflow & Scope Integration (Day 3)
**Goal**: Approval system and scope item integration

**Tasks**:
1. Build MaterialApprovalForm for review workflow
2. Implement approval/rejection actions
3. Create ScopeMaterialLinker component
4. Update ScopeListTab to show linked materials
5. Add material cost integration to scope items

**Success Criteria**:
- Material approval workflow functions
- Materials can be linked to scope items
- Scope items show associated materials
- Cost calculations include material costs

## Technical Implementation Details

### Material Workflow States
```
pending_approval → (review) → approved
                            ↓
                        rejected
                            ↓
                    revision_required → (edit) → pending_approval
```

### Material Categories
```typescript
const MATERIAL_CATEGORIES = [
  'structural_steel',
  'concrete',
  'lumber',
  'finishes',
  'electrical',
  'mechanical',
  'plumbing',
  'specialty'
] as const;
```

### Permission Requirements
- `materials.create` - Create new material specifications
- `materials.read` - View project material specs
- `materials.update` - Update material details
- `materials.delete` - Delete material specs
- `materials.approve` - Approve material specifications
- `materials.link_scope` - Link materials to scope items

### Files to Create
**New Files**:
- `supabase/migrations/20250708000004_material_specs_system.sql`
- `src/app/api/projects/[id]/material-specs/route.ts`
- `src/app/api/material-specs/[id]/route.ts`
- `src/app/api/material-specs/[id]/approve/route.ts`
- `src/app/api/material-specs/[id]/reject/route.ts`
- `src/app/api/material-specs/[id]/link-scope/route.ts`
- `src/components/projects/tabs/MaterialSpecsTab.tsx`
- `src/components/materials/MaterialSpecList.tsx`
- `src/components/materials/MaterialSpecForm.tsx`
- `src/components/materials/MaterialSpecCard.tsx`
- `src/components/materials/MaterialApprovalForm.tsx`
- `src/components/materials/ScopeMaterialLinker.tsx`
- `src/types/materials.ts`

**Modified Files**:
- `src/components/projects/tabs/ScopeListTab.tsx`
- `src/components/projects/TabbedWorkspace.tsx`
- `src/lib/permissions.ts`

## Success Criteria
- [ ] Material specifications database schema created
- [ ] All material CRUD operations work correctly
- [ ] Material approval workflow functions properly
- [ ] Materials can be linked to scope items
- [ ] ScopeListTab displays associated materials
- [ ] Material cost integration works
- [ ] All TypeScript compilation passes: `npm run type-check`
- [ ] All tests pass: `npm test`
- [ ] Mobile responsive material interface

## Integration Points
- **ScopeListTab**: Show linked materials for each scope item
- **Vendor System**: Link materials to existing vendor/supplier system
- **Cost Tracking**: Include material costs in project financial calculations
- **Purchase Orders**: Create purchase orders from approved materials (future)
- **Dashboard**: Show material approval metrics

## Business Value
- **Project Managers**: Centralized material specification management
- **Procurement**: Clear material requirements with supplier information
- **Cost Control**: Better material cost tracking and estimation
- **Quality Assurance**: Approval workflow ensures proper material selection
- **Compliance**: Documentation trail for material specifications

## Data Flow Examples
```typescript
// Link material to scope item
POST /api/material-specs/123/link-scope
{
  scope_item_id: "scope-456",
  quantity_required: 100,
  notes: "Foundation rebar requirements"
}

// Scope item with materials
{
  id: "scope-456",
  name: "Foundation Rebar",
  materials: [
    {
      id: "mat-123",
      name: "#4 Rebar Grade 60",
      status: "approved",
      quantity_required: 100
    }
  ]
}
```

## Risk Mitigation
- **Risk**: Complex material-scope relationships
  **Mitigation**: Start with simple linking, enhance with quantity tracking
- **Risk**: Material cost updates affecting scope calculations
  **Mitigation**: Version material costs, allow manual overrides
- **Risk**: Supplier integration complexity
  **Mitigation**: Use existing vendor system, add material-specific fields later

## Future Enhancements (Post-P1)
- Material cost history and trending
- Automatic material substitution suggestions
- Integration with supplier catalogs
- Material delivery tracking
- Waste calculation and optimization
- Material specification templates

## Testing Strategy
- Unit tests for material CRUD operations
- Integration tests for scope-material linking
- Component tests for material forms and displays
- API tests for approval workflows
- Performance tests with large material lists

## Status Tracking
- [ ] Phase 1: Database & Core API - Status: ⟳ PENDING
- [ ] Phase 2: Material Management Interface - Status: ⟳ PENDING
- [ ] Phase 3: Approval Workflow & Scope Integration - Status: ⟳ PENDING
- [ ] Testing & Validation - Status: ⟳ PENDING

**Overall Progress**: 0% | **Current Phase**: Not Started | **Blockers**: None | **Can Start**: Immediately (parallel with other P1 tasks)