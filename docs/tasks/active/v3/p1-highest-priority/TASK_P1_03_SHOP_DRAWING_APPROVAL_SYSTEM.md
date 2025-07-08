# Task: P1.03 - Shop Drawing Approval System Implementation

## Type: New Feature
**Priority**: P1 - Highest Priority (Start after P1.01 or P1.02)
**Effort**: 4-5 days
**Complexity**: Complex
**Dependencies**: P1.01 (Task Management) recommended for approval workflow patterns

## Request Analysis
**Original Request**: Implement comprehensive shop drawing approval system with file uploads, versioning, and multi-stage approval workflow
**Objective**: Replace mock shop drawing data in ShopDrawingsTab with real file-based approval system
**Over-Engineering Check**: Focus on core approval workflow - upload, internal review, client review, approval/rejection

## Technical Requirements

### Database Changes Required
```sql
-- NEW TABLES NEEDED: Shop drawing system
CREATE TABLE shop_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    title TEXT NOT NULL,
    discipline TEXT, -- 'structural', 'electrical', 'mechanical', etc.
    drawing_number TEXT UNIQUE, -- 'SD-001', 'E-101', etc.
    current_submission_id UUID, -- Points to latest submission
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES user_profiles(id)
);

CREATE TABLE shop_drawing_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_drawing_id UUID REFERENCES shop_drawings(id) NOT NULL,
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL, -- Supabase Storage URL
    file_name TEXT NOT NULL,
    file_size INTEGER,
    status submission_status DEFAULT 'pending_internal_review',
    submitted_at TIMESTAMP DEFAULT NOW(),
    submitted_by UUID REFERENCES user_profiles(id),
    internal_review_completed_at TIMESTAMP,
    client_review_completed_at TIMESTAMP,
    notes TEXT
);

CREATE TYPE submission_status AS ENUM (
    'pending_internal_review',
    'revision_required_internal',
    'ready_for_client_review',
    'pending_client_review',
    'revision_required_client', 
    'approved',
    'rejected'
);

CREATE TABLE shop_drawing_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES shop_drawing_submissions(id) NOT NULL,
    reviewer_id UUID REFERENCES user_profiles(id) NOT NULL,
    review_type review_type NOT NULL,
    action review_action NOT NULL,
    comments TEXT,
    reviewed_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE review_type AS ENUM ('internal', 'client');
CREATE TYPE review_action AS ENUM ('approved', 'rejected', 'revision_required', 'commented');
```

### Supabase Storage Setup
```sql
-- Storage bucket for shop drawings
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-drawings', 'shop-drawings', false);

-- Storage policies for secure file access
```

### API Endpoints to Create
- `GET /api/projects/:projectId/shop-drawings` - List project shop drawings
- `POST /api/projects/:projectId/shop-drawings` - Create new shop drawing
- `GET /api/shop-drawings/:drawingId` - Get shop drawing details
- `POST /api/shop-drawings/:drawingId/submissions` - Upload new submission
- `GET /api/shop-drawings/submissions/:submissionId` - Get submission details
- `POST /api/shop-drawings/submissions/:submissionId/review` - Submit review
- `GET /api/shop-drawings/submissions/:submissionId/file` - Download file
- `PUT /api/shop-drawings/submissions/:submissionId/status` - Update status

### Components to Build/Update
- `src/components/projects/tabs/ShopDrawingsTab.tsx` - Main shop drawing interface
- `src/components/shop-drawings/ShopDrawingList.tsx` - Drawing list display
- `src/components/shop-drawings/ShopDrawingUploadForm.tsx` - File upload form
- `src/components/shop-drawings/ShopDrawingViewer.tsx` - PDF/drawing viewer
- `src/components/shop-drawings/SubmissionHistory.tsx` - Version history
- `src/components/shop-drawings/ReviewForm.tsx` - Review and approval form
- `src/components/shop-drawings/ApprovalWorkflow.tsx` - Workflow status display

## Implementation Phases

### Phase 1: Database & Storage Foundation (Day 1)
**Goal**: Set up database schema and file storage infrastructure

**Tasks**:
1. Create migration for shop drawing tables
2. Set up Supabase Storage bucket and policies
3. Add shop drawing enums and types
4. Implement RLS policies for security
5. Test file upload/download with storage

**Success Criteria**:
- Database migration runs successfully
- Storage bucket created with proper policies
- File upload/download works via API
- RLS policies secure data access

### Phase 2: Core API Development (Day 2)
**Goal**: Backend API for shop drawing management

**Tasks**:
1. Implement shop drawing CRUD operations
2. Build file upload API with validation
3. Create submission version tracking
4. Add file metadata handling
5. Implement basic status transitions

**Success Criteria**:
- Can create shop drawings and submissions
- File uploads work with proper validation
- Version numbering increments correctly
- Status transitions work as designed

### Phase 3: Frontend Components (Day 3)
**Goal**: User interface for shop drawing management

**Tasks**:
1. Build ShopDrawingsTab for project workspace
2. Create ShopDrawingList with status indicators
3. Implement file upload form with drag-drop
4. Add basic drawing viewer (PDF support)
5. Build submission history display

**Success Criteria**:
- Shop drawings display in project tabs
- File upload works via drag-drop interface
- PDF files can be viewed in browser
- Version history shows all submissions

### Phase 4: Approval Workflow (Day 4)
**Goal**: Multi-stage approval system

**Tasks**:
1. Build review form for internal/client reviews
2. Implement approval workflow logic
3. Add status transition validation
4. Create workflow visualization
5. Add review comments and history

**Success Criteria**:
- Internal reviewers can approve/reject
- Client reviewers can provide feedback
- Workflow moves through stages correctly
- All review history is tracked

### Phase 5: Integration & Polish (Day 5)
**Goal**: Connect to existing systems and enhance UX

**Tasks**:
1. Replace mock shop drawing data in ShopDrawingsTab
2. Add shop drawing metrics to dashboard
3. Implement file access permissions
4. Add notification system for status changes
5. Mobile responsive design and testing

**Success Criteria**:
- No mock data remains in shop drawing components
- Dashboard shows real shop drawing statistics
- File access respects user permissions
- Mobile interface works properly

## Technical Implementation Details

### File Upload Workflow
```typescript
// Upload process
1. User selects PDF file
2. Validate file type and size
3. Upload to Supabase Storage
4. Create submission record in database
5. Update shop drawing current_submission_id
6. Trigger approval workflow
```

### Approval Workflow States
```
pending_internal_review → (internal review) → ready_for_client_review
                       ↓
                  revision_required_internal

ready_for_client_review → (client review) → approved
                        ↓                  ↓
                  pending_client_review   rejected
                        ↓
                  revision_required_client
```

### Permission Requirements
- `shop_drawings.create` - Upload new shop drawings
- `shop_drawings.read.all` - View all project shop drawings
- `shop_drawings.read.assigned` - View assigned reviews only
- `shop_drawings.review.internal` - Perform internal reviews
- `shop_drawings.review.client` - Perform client reviews (client users)
- `shop_drawings.admin` - Manage all shop drawings

### Files to Create
**New Files**:
- `supabase/migrations/20250708000003_shop_drawing_system.sql`
- `src/app/api/projects/[id]/shop-drawings/route.ts`
- `src/app/api/shop-drawings/[id]/route.ts`
- `src/app/api/shop-drawings/[id]/submissions/route.ts`
- `src/app/api/shop-drawings/submissions/[id]/route.ts`
- `src/app/api/shop-drawings/submissions/[id]/review/route.ts`
- `src/app/api/shop-drawings/submissions/[id]/file/route.ts`
- `src/components/projects/tabs/ShopDrawingsTab.tsx`
- `src/components/shop-drawings/ShopDrawingList.tsx`
- `src/components/shop-drawings/ShopDrawingUploadForm.tsx`
- `src/components/shop-drawings/ShopDrawingViewer.tsx`
- `src/components/shop-drawings/SubmissionHistory.tsx`
- `src/components/shop-drawings/ReviewForm.tsx`
- `src/components/shop-drawings/ApprovalWorkflow.tsx`
- `src/types/shop-drawings.ts`
- `src/lib/storage/shop-drawings.ts` - Storage utilities

**Modified Files**:
- `src/components/projects/TabbedWorkspace.tsx`
- `src/app/dashboard/components/DashboardStats.tsx`
- `src/lib/permissions.ts`

## Success Criteria
- [ ] Shop drawing database schema created successfully
- [ ] Supabase Storage configured with proper policies
- [ ] File upload/download functionality works
- [ ] Multi-stage approval workflow functions correctly
- [ ] PDF viewer displays shop drawings properly
- [ ] Version history tracks all submissions
- [ ] Dashboard shows real shop drawing metrics
- [ ] All TypeScript compilation passes: `npm run type-check`
- [ ] All tests pass: `npm test`
- [ ] Mobile responsive shop drawing interface

## Integration Points
- **ShopDrawingsTab**: Replace all mock data with real database queries
- **Client Portal**: Clients can view and review assigned shop drawings (P2)
- **Dashboard**: Show pending reviews and approval statistics
- **Notifications**: Alert users when reviews are required
- **Task Management**: Create tasks for shop drawing reviews (integration with P1.01)

## Technical Challenges & Solutions

### Challenge 1: PDF Viewing in Browser
**Solution**: Use `react-pdf` library for PDF rendering, fallback to browser default viewer

### Challenge 2: Large File Uploads
**Solution**: Implement chunked uploads via Supabase Storage, show progress indicators

### Challenge 3: Concurrent Reviews
**Solution**: Use optimistic locking and conflict resolution for simultaneous reviews

### Challenge 4: File Access Security
**Solution**: Generate signed URLs with expiration for authorized file access

## Risk Mitigation
- **Risk**: Storage costs with large files
  **Mitigation**: Implement file size limits and retention policies
- **Risk**: PDF rendering performance
  **Mitigation**: Load PDFs lazily, provide download option
- **Risk**: Complex approval workflow bugs
  **Mitigation**: Comprehensive state transition testing
- **Risk**: File corruption or loss
  **Mitigation**: Verify file integrity on upload, backup critical drawings

## Business Value
- **Project Managers**: Streamlined shop drawing approval process
- **Clients**: Transparent review process with clear status tracking
- **Teams**: Centralized drawing storage and version control
- **Compliance**: Audit trail of all approvals and revisions

## Future Enhancements (Post-P1)
- CAD file format support beyond PDF
- Drawing comparison tools for revisions
- Automatic email notifications for approval requests
- Integration with external drawing management systems
- Mobile app for field review and markup

## Status Tracking
- [ ] Phase 1: Database & Storage Foundation - Status: ⟳ PENDING
- [ ] Phase 2: Core API Development - Status: ⟳ PENDING
- [ ] Phase 3: Frontend Components - Status: ⟳ PENDING
- [ ] Phase 4: Approval Workflow - Status: ⟳ PENDING
- [ ] Phase 5: Integration & Polish - Status: ⟳ PENDING

**Overall Progress**: 0% | **Current Phase**: Not Started | **Blockers**: None | **Recommended Start**: After P1.01 completion