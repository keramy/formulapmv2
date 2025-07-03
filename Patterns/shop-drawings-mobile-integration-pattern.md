# Shop Drawings Mobile Integration Pattern

## Implementation Guide
Formula PM Wave 2C - Shop Drawings Mobile Integration System

## Pattern Overview
Implements a mobile-optimized shop drawing management system following Formula PM's established patterns. This system manages shop drawing workflows, mobile PDF access, approval processes, and progress photo documentation for construction projects.

## Core Components

### 1. Coordinator Pattern
```typescript
// ShopDrawingsCoordinator.tsx
interface ShopDrawingsCoordinator {
  // Main orchestrator for shop drawings management
  manageDrawingWorkflows(): void
  coordinateApprovalProcess(): void
  handleMobileAccess(): void
  manageProgressPhotos(): void
}
```

### 2. Database Schema Pattern
```sql
-- Core shop drawings tables
shop_drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  drawing_number TEXT NOT NULL,
  drawing_title TEXT NOT NULL,
  drawing_category TEXT NOT NULL, -- 'structural', 'mechanical', 'electrical', 'plumbing', 'architectural'
  current_version TEXT NOT NULL DEFAULT '1.0',
  current_status drawing_status NOT NULL DEFAULT 'draft',
  pdf_file_path TEXT,
  pdf_file_size INTEGER,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id), -- Field worker assignment
  submission_date TIMESTAMP WITH TIME ZONE,
  target_approval_date TIMESTAMP WITH TIME ZONE,
  actual_approval_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop drawing versions for revision control
shop_drawing_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  pdf_file_path TEXT NOT NULL,
  pdf_file_size INTEGER,
  revision_notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop drawing approvals workflow
shop_drawing_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  version_number TEXT NOT NULL,
  approver_role approval_role NOT NULL, -- 'architect', 'project_manager', 'client'
  approver_user_id UUID NOT NULL REFERENCES auth.users(id),
  approval_status approval_status NOT NULL DEFAULT 'pending',
  approval_date TIMESTAMP WITH TIME ZONE,
  comments TEXT,
  signature_data TEXT, -- Digital signature JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress photos linked to shop drawings
shop_drawing_progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_drawing_id UUID NOT NULL REFERENCES shop_drawings(id) ON DELETE CASCADE,
  photo_file_path TEXT NOT NULL,
  photo_file_size INTEGER,
  description TEXT,
  location_notes TEXT,
  taken_by UUID NOT NULL REFERENCES auth.users(id),
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_issue_photo BOOLEAN DEFAULT false,
  issue_description TEXT
);

-- Status enumeration
CREATE TYPE drawing_status AS ENUM (
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_required'
);

CREATE TYPE approval_role AS ENUM (
  'architect', 'project_manager', 'client'
);

CREATE TYPE approval_status AS ENUM (
  'pending', 'approved', 'rejected', 'revision_requested'
);
```

### 3. API Route Pattern
```typescript
// /src/app/api/shop-drawings/route.ts
export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    // List shop drawings with mobile optimization
    const drawings = await getShopDrawings(user, filters)
    return NextResponse.json(drawings)
  }, { requiredPermission: 'shop_drawings.view' })
}

// /src/app/api/shop-drawings/[id]/pdf/route.ts
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    // Serve PDF file with mobile optimization
    const pdfStream = await getOptimizedPDF(params.id, user)
    return new Response(pdfStream, { headers: pdfHeaders })
  }, { requiredPermission: 'shop_drawings.view' })
}

// /src/app/api/shop-drawings/[id]/approve/route.ts
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth(request, async (user) => {
    // Approve shop drawing with digital signature
    const approval = await approveShopDrawing(params.id, user, approvalData)
    await sendApprovalNotifications(approval)
    return NextResponse.json(approval)
  }, { requiredPermission: 'shop_drawings.approve' })
}
```

### 4. Component Architecture
```typescript
// Component hierarchy
/src/components/shop-drawings/
├── ShopDrawingsCoordinator.tsx          # Main orchestrator
├── ShopDrawingsList.tsx                 # Mobile-optimized list
├── ShopDrawingViewer.tsx                # PDF viewer component
├── mobile/
│   ├── MobileDrawingCard.tsx           # Touch-optimized card
│   ├── MobilePDFViewer.tsx             # Mobile PDF viewer
│   └── MobileApprovalActions.tsx       # Mobile approval interface
├── approvals/
│   ├── ApprovalWorkflow.tsx            # Approval process manager
│   ├── DigitalSignature.tsx            # Digital signature capture
│   └── ApprovalHistory.tsx             # Approval audit trail
├── progress/
│   ├── ProgressPhotoUpload.tsx         # Photo upload component
│   ├── ProgressPhotoGallery.tsx        # Photo gallery view
│   └── IssueReporting.tsx              # Issue reporting interface
└── filters/
    ├── DrawingFilters.tsx              # Category and status filters
    └── MobileSearch.tsx                # Mobile search interface
```

## Implementation Requirements

### 1. Authentication & Authorization
- **Required Permissions**: `shop_drawings.view`, `shop_drawings.approve`, `shop_drawings.upload`
- **Role-based Access**: Different capabilities based on user role
- **Mobile Authentication**: Optimized login flow for mobile devices

### 2. Mobile-First Design
- **Responsive Layout**: Mobile-first design with progressive enhancement
- **Touch Optimization**: Large touch targets and swipe gestures
- **PDF Optimization**: Efficient PDF rendering for mobile bandwidth
- **Offline Ready**: Service worker for basic offline functionality

### 3. Approval Workflow
- **Sequential Process**: Architect → Project Manager → Client
- **Digital Signatures**: Capture and store digital signatures
- **Notification System**: Real-time notifications for approval requests
- **Audit Trail**: Complete approval history with timestamps

### 4. Progress Photo Management
- **Photo Upload**: Efficient photo upload with compression
- **Drawing Association**: Link photos to specific shop drawings
- **Issue Reporting**: Flag issues with photo documentation
- **Gallery View**: Organized photo gallery by drawing

## Security Considerations

### 1. Row Level Security
```sql
-- Shop drawings RLS
CREATE POLICY "shop_drawings_access" ON shop_drawings
  FOR ALL TO authenticated
  USING (
    -- Project team members can access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      WHERE pa.project_id = shop_drawings.project_id
      AND pa.user_id = auth.uid()
    )
  );

-- Progress photos RLS
CREATE POLICY "progress_photos_access" ON shop_drawing_progress_photos
  FOR ALL TO authenticated
  USING (
    -- Project team members can access
    EXISTS (
      SELECT 1 FROM project_assignments pa
      JOIN shop_drawings sd ON sd.project_id = pa.project_id
      WHERE sd.id = shop_drawing_progress_photos.shop_drawing_id
      AND pa.user_id = auth.uid()
    )
  );
```

### 2. File Security
- **PDF Access Control**: Secure PDF serving with authentication
- **Photo Upload Validation**: File type and size validation
- **Virus Scanning**: Integration with file scanning services
- **Watermarking**: Optional PDF watermarking for sensitive drawings

### 3. Digital Signatures
- **Signature Validation**: Cryptographic signature verification
- **Timestamp Authority**: Trusted timestamp services
- **Non-repudiation**: Legal compliance for digital signatures
- **Audit Logging**: Complete signature audit trail

## Performance Optimization

### 1. Mobile Performance
```sql
-- Performance indexes
CREATE INDEX idx_shop_drawings_project_status ON shop_drawings(project_id, current_status);
CREATE INDEX idx_shop_drawings_category ON shop_drawings(drawing_category);
CREATE INDEX idx_shop_drawings_assigned ON shop_drawings(assigned_to);
CREATE INDEX idx_progress_photos_drawing ON shop_drawing_progress_photos(shop_drawing_id);
CREATE INDEX idx_approvals_drawing_role ON shop_drawing_approvals(shop_drawing_id, approver_role);
```

### 2. PDF Optimization
- **Progressive Loading**: Load PDF pages progressively
- **Thumbnail Generation**: Generate PDF thumbnails for quick preview
- **Compression**: Optimize PDF file sizes for mobile
- **Caching**: Aggressive caching of frequently accessed drawings

### 3. Photo Optimization
- **Image Compression**: Automatic photo compression
- **Multiple Formats**: WebP, JPEG optimization
- **Lazy Loading**: Load photos on demand
- **Thumbnail Generation**: Generate photo thumbnails

## Real-time Integration

### 1. Supabase Subscriptions
```typescript
// Real-time shop drawing updates
const subscription = supabase
  .channel('shop-drawings')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'shop_drawings'
  }, (payload) => {
    updateDrawingStatus(payload.new)
  })
  .subscribe()
```

### 2. Notification Triggers
```sql
-- Database triggers for notifications
CREATE OR REPLACE FUNCTION notify_drawing_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Send notification when drawing status changes
  INSERT INTO notifications (user_id, type, title, message, metadata)
  SELECT 
    pa.user_id,
    'shop_drawing',
    'Shop Drawing Status Updated',
    format('Drawing "%s" status changed to %s', NEW.drawing_title, NEW.current_status),
    jsonb_build_object(
      'drawing_id', NEW.id,
      'status', NEW.current_status,
      'drawing_number', NEW.drawing_number
    )
  FROM project_assignments pa
  WHERE pa.project_id = NEW.project_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drawing_status_change_trigger
  AFTER UPDATE ON shop_drawings
  FOR EACH ROW
  WHEN (OLD.current_status != NEW.current_status)
  EXECUTE FUNCTION notify_drawing_status_change();
```

## Testing Strategy

### 1. Mobile Testing
- **Device Testing**: Test on various mobile devices and screen sizes
- **Performance Testing**: Test PDF loading and rendering performance
- **Touch Testing**: Verify touch interactions and gestures
- **Network Testing**: Test with various network conditions

### 2. Approval Workflow Testing
- **Role-based Testing**: Test approval workflow for each user role
- **Permission Testing**: Verify role-based access control
- **Signature Testing**: Test digital signature capture and validation
- **Notification Testing**: Verify real-time notifications

### 3. Integration Testing
- **API Testing**: Test all API endpoints with various scenarios
- **Database Testing**: Test database constraints and triggers
- **File Upload Testing**: Test PDF and photo upload functionality
- **Security Testing**: Test authentication and authorization

## Deployment Considerations

### 1. Mobile Optimization
- **Service Worker**: Install service worker for offline functionality
- **App Manifest**: Configure web app manifest for mobile installation
- **Push Notifications**: Configure push notification services
- **Performance Monitoring**: Monitor mobile performance metrics

### 2. File Storage
- **CDN Integration**: Use CDN for PDF and photo delivery
- **Storage Optimization**: Implement storage lifecycle policies
- **Backup Strategy**: Ensure reliable file backup and recovery
- **Compliance**: Meet industry compliance requirements for file storage

## Success Metrics

### 1. Functional Requirements
- **90+ Evaluation Score**: Must meet quality standards
- **Response Time**: <500ms API response times
- **Mobile Performance**: <2 second page load times
- **PDF Rendering**: <3 second PDF load times on mobile

### 2. Business Metrics
- **Approval Time**: Reduce approval cycle time by 50%
- **Mobile Adoption**: 80% of field workers using mobile interface
- **Error Reduction**: 90% reduction in drawing-related errors
- **User Satisfaction**: 95% user satisfaction with mobile experience

## Integration Points

### 1. Existing Systems
- **Project Management**: Link to existing project structure
- **Document Management**: Integrate with document approval workflow
- **Task Management**: Create tasks from drawing approvals
- **Notification System**: Use existing notification infrastructure

### 2. Future Integrations
- **BIM Integration**: Link to Building Information Modeling systems
- **CAD Integration**: Direct integration with CAD software
- **Quality Control**: Link to quality management systems
- **Progress Tracking**: Integration with project progress systems

This pattern ensures the Shop Drawings Mobile Integration system maintains consistency with Formula PM's established architecture while providing specialized functionality for mobile shop drawing management, approval workflows, and progress photo documentation.