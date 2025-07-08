# Task: P1.05 - Report Creation & Management System Implementation

## Type: New Feature
**Priority**: P1 - Highest Priority (Complex - Start after simpler P1 tasks)
**Effort**: 4-5 days
**Complexity**: Complex
**Dependencies**: None (Foundation ready), but benefits from other P1 tasks providing data

## Request Analysis
**Original Request**: Implement comprehensive report creation system with line-by-line builder and PDF generation
**Objective**: Replace mock report data in ReportsTab with real report creation and management functionality
**Over-Engineering Check**: Focus on core reporting - line-by-line builder, photo attachments, PDF generation, sharing

## Technical Requirements

### Database Changes Required
```sql
-- NEW TABLES NEEDED: Report creation system
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) NOT NULL,
    name TEXT NOT NULL,
    report_type report_type DEFAULT 'custom',
    description TEXT,
    status report_status DEFAULT 'draft',
    generated_by UUID REFERENCES user_profiles(id) NOT NULL,
    generated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP,
    pdf_url TEXT, -- Supabase Storage URL for generated PDF
    summary TEXT,
    report_period DATE, -- For periodic reports
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE report_type AS ENUM (
    'daily',
    'weekly', 
    'monthly',
    'progress',
    'safety',
    'quality',
    'financial',
    'custom'
);

CREATE TYPE report_status AS ENUM (
    'draft',
    'pending_review',
    'published',
    'archived'
);

-- Report lines for line-by-line content
CREATE TABLE report_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) NOT NULL,
    line_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Photos attached to report lines
CREATE TABLE report_line_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_line_id UUID REFERENCES report_lines(id) NOT NULL,
    photo_url TEXT NOT NULL, -- Supabase Storage URL
    photo_name TEXT NOT NULL,
    caption TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Report sharing with clients and team members
CREATE TABLE report_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES reports(id) NOT NULL,
    shared_with_user_id UUID REFERENCES user_profiles(id),
    shared_with_client_id UUID REFERENCES clients(id),
    shared_at TIMESTAMP DEFAULT NOW(),
    access_level share_access DEFAULT 'read'
);

CREATE TYPE share_access AS ENUM ('read', 'comment', 'edit');
```

### Supabase Storage Setup
```sql
-- Storage buckets for reports and photos
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('report-photos', 'report-photos', false),
  ('report-pdfs', 'report-pdfs', false);
```

### API Endpoints to Create
- `GET /api/projects/:projectId/reports` - List project reports
- `POST /api/projects/:projectId/reports` - Create new report
- `GET /api/reports/:reportId` - Get full report with lines
- `PUT /api/reports/:reportId` - Update report metadata
- `DELETE /api/reports/:reportId` - Delete report
- `POST /api/reports/:reportId/lines` - Add report line
- `PUT /api/reports/lines/:lineId` - Update report line
- `DELETE /api/reports/lines/:lineId` - Delete report line
- `POST /api/reports/lines/:lineId/photos` - Upload line photos
- `POST /api/reports/:reportId/generate-pdf` - Generate PDF version
- `POST /api/reports/:reportId/publish` - Publish report
- `POST /api/reports/:reportId/share` - Share report with users/clients

### Components to Build/Update
- `src/components/projects/tabs/ReportsTab.tsx` - Main reports interface
- `src/components/reports/ReportList.tsx` - Report list display
- `src/components/reports/ReportCreationPage.tsx` - Report builder interface
- `src/components/reports/ReportLineEditor.tsx` - Line-by-line editor
- `src/components/reports/PhotoUpload.tsx` - Photo attachment component
- `src/components/reports/ReportPreview.tsx` - Report preview before PDF
- `src/components/reports/ReportPDFViewer.tsx` - Generated PDF viewer
- `src/components/reports/ReportShareModal.tsx` - Sharing interface

## Implementation Phases

### Phase 1: Database & Core API (Day 1)
**Goal**: Database foundation and basic report operations

**Tasks**:
1. Create migration for reports system tables
2. Set up storage buckets for photos and PDFs
3. Add report enums and types
4. Implement RLS policies for reports
5. Create basic report CRUD API routes

**Success Criteria**:
- Database migration runs successfully
- Storage buckets configured with policies
- Basic report operations work via API
- RLS policies secure report access

### Phase 2: Report Builder Interface (Day 2)
**Goal**: Core report creation and editing interface

**Tasks**:
1. Build ReportCreationPage with line editor
2. Implement ReportLineEditor for content input
3. Add drag-and-drop line reordering
4. Create PhotoUpload component for attachments
5. Add auto-save functionality for drafts

**Success Criteria**:
- Users can create reports with multiple lines
- Line editor supports rich text input
- Photos can be uploaded and attached to lines
- Auto-save prevents data loss

### Phase 3: PDF Generation (Day 3)
**Goal**: Server-side PDF generation from report data

**Tasks**:
1. Set up PDF generation library (puppeteer or jsPDF)
2. Create PDF template with company branding
3. Implement PDF generation API endpoint
4. Add photo embedding in PDF reports
5. Store generated PDFs in Supabase Storage

**Success Criteria**:
- Reports can be converted to PDF format
- PDFs include all text content and photos
- PDF generation handles various report sizes
- Generated PDFs are stored securely

### Phase 4: Report Sharing & Publishing (Day 4)
**Goal**: Report distribution and access control

**Tasks**:
1. Build report sharing interface
2. Implement sharing with team members and clients
3. Add report publishing workflow
4. Create access control for shared reports
5. Add email notifications for shared reports

**Success Criteria**:
- Reports can be shared with specific users
- Clients can access shared reports via portal
- Published reports have permanent URLs
- Access control works correctly

### Phase 5: Integration & Enhancement (Day 5)
**Goal**: Connect to existing systems and add polish

**Tasks**:
1. Replace mock report data in ReportsTab
2. Add report metrics to dashboard
3. Implement report templates for common types
4. Add report search and filtering
5. Mobile responsive design and testing

**Success Criteria**:
- No mock data remains in report components
- Dashboard shows real report statistics
- Report templates speed up creation
- Mobile interface works properly

## Technical Implementation Details

### PDF Generation Approach
```typescript
// Server-side PDF generation with Puppeteer
import puppeteer from 'puppeteer';

async function generateReportPDF(reportId: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Load report HTML template
  await page.setContent(reportHTML);
  
  // Generate PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  
  await browser.close();
  return pdf;
}
```

### Report Line Structure
```typescript
interface ReportLine {
  id: string;
  line_number: number;
  title: string;
  description: string;
  photos: ReportPhoto[];
}

interface ReportPhoto {
  id: string;
  photo_url: string;
  caption: string;
}
```

### Permission Requirements
- `reports.create` - Create new reports
- `reports.read.all` - View all project reports
- `reports.read.shared` - View shared reports only
- `reports.update` - Edit report content
- `reports.delete` - Delete reports
- `reports.publish` - Publish reports for distribution
- `reports.share` - Share reports with others

### Files to Create
**New Files**:
- `supabase/migrations/20250708000005_reports_system.sql`
- `src/app/api/projects/[id]/reports/route.ts`
- `src/app/api/reports/[id]/route.ts`
- `src/app/api/reports/[id]/lines/route.ts`
- `src/app/api/reports/lines/[id]/route.ts`
- `src/app/api/reports/lines/[id]/photos/route.ts`
- `src/app/api/reports/[id]/generate-pdf/route.ts`
- `src/app/api/reports/[id]/publish/route.ts`
- `src/app/api/reports/[id]/share/route.ts`
- `src/components/projects/tabs/ReportsTab.tsx`
- `src/components/reports/ReportList.tsx`
- `src/components/reports/ReportCreationPage.tsx`
- `src/components/reports/ReportLineEditor.tsx`
- `src/components/reports/PhotoUpload.tsx`
- `src/components/reports/ReportPreview.tsx`
- `src/components/reports/ReportPDFViewer.tsx`
- `src/components/reports/ReportShareModal.tsx`
- `src/types/reports.ts`
- `src/lib/pdf/report-generator.ts`

**Modified Files**:
- `src/components/projects/TabbedWorkspace.tsx`
- `src/app/dashboard/components/DashboardStats.tsx`
- `src/lib/permissions.ts`

## Success Criteria
- [ ] Report creation system database schema implemented
- [ ] Line-by-line report builder interface works
- [ ] Photo upload and attachment functionality
- [ ] PDF generation produces quality reports
- [ ] Report sharing with access control functions
- [ ] Mobile responsive report creation interface
- [ ] All TypeScript compilation passes: `npm run type-check`
- [ ] All tests pass: `npm test`
- [ ] Performance acceptable with large reports

## Integration Points
- **ReportsTab**: Replace all mock data with real database queries
- **Client Portal**: Clients can view shared reports (P2)
- **Dashboard**: Show report creation metrics and recent reports
- **Task Management**: Create tasks from report action items (future)
- **Email System**: Send report notifications (future)

## Technical Challenges & Solutions

### Challenge 1: PDF Generation Performance
**Solution**: Use server-side generation with caching, queue for large reports

### Challenge 2: Photo Storage and Optimization
**Solution**: Resize photos on upload, use WebP format for storage efficiency

### Challenge 3: Large Report Memory Usage
**Solution**: Stream PDF generation, paginate large reports

### Challenge 4: Real-time Collaboration
**Solution**: Use auto-save with conflict resolution, implement later

## Risk Mitigation
- **Risk**: PDF generation server resource usage
  **Mitigation**: Queue system for PDF generation, limit concurrent jobs
- **Risk**: Photo storage costs
  **Mitigation**: Image compression and size limits
- **Risk**: Complex report editor bugs
  **Mitigation**: Extensive testing with various content types
- **Risk**: Slow PDF generation times
  **Mitigation**: Background processing with progress indicators

## Business Value
- **Project Managers**: Streamlined progress reporting process
- **Clients**: Professional reports with photos and project updates
- **Teams**: Standardized reporting format and templates
- **Management**: Consistent project documentation and history

## Future Enhancements (Post-P1)
- Report templates for different report types
- Chart and graph generation from project data
- Report scheduling and automation
- Advanced photo markup and annotation
- Integration with external document systems
- Report analytics and engagement tracking

## Status Tracking
- [ ] Phase 1: Database & Core API - Status: ⟳ PENDING
- [ ] Phase 2: Report Builder Interface - Status: ⟳ PENDING
- [ ] Phase 3: PDF Generation - Status: ⟳ PENDING
- [ ] Phase 4: Report Sharing & Publishing - Status: ⟳ PENDING
- [ ] Phase 5: Integration & Enhancement - Status: ⟳ PENDING

**Overall Progress**: 0% | **Current Phase**: Not Started | **Blockers**: None | **Recommended Start**: After simpler P1 tasks for data availability