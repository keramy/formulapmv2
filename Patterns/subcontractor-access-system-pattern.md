# Subcontractor Access System Pattern

## Overview
The Subcontractor Access System pattern provides minimal external access for subcontractors to submit site reports and access assigned scope PDFs. This ultra-simple system focuses only on essential functionality without complex features like GPS tracking, offline capabilities, or performance metrics.

## Pattern Classification
**Type**: External Access Pattern  
**Complexity**: Low  
**Dependencies**: Authentication, Document Management, Project Management  
**User Roles**: subcontractor, project_manager, technical_director, admin

## Core Components

### Database Schema
```sql
-- Minimal database schema for subcontractor access
CREATE TABLE subcontractor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(user_id),
  
  -- Basic Information
  company_name VARCHAR(200) NOT NULL,
  contact_person VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100) NOT NULL,
  
  -- Access Control
  is_active BOOLEAN DEFAULT true,
  
  -- Authentication
  last_login TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT false,
  
  -- Tracking
  created_by UUID NOT NULL REFERENCES user_profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subcontractor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractor_users(id),
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Report Content
  report_date DATE NOT NULL,
  description TEXT NOT NULL,
  photos TEXT[], -- Array of photo URLs
  
  -- Status
  status report_status NOT NULL DEFAULT 'submitted',
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subcontractor_scope_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcontractor_id UUID NOT NULL REFERENCES subcontractor_users(id),
  scope_item_id UUID NOT NULL REFERENCES scope_items(id),
  document_id UUID NOT NULL REFERENCES documents(id),
  
  -- Access Control
  can_download BOOLEAN DEFAULT true,
  
  -- Tracking
  granted_by UUID NOT NULL REFERENCES user_profiles(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(subcontractor_id, document_id)
);

-- Enums
CREATE TYPE report_status AS ENUM ('submitted', 'reviewed', 'approved');

-- Indexes for performance
CREATE INDEX idx_subcontractor_users_active ON subcontractor_users(is_active);
CREATE INDEX idx_subcontractor_reports_project ON subcontractor_reports(project_id, report_date);
CREATE INDEX idx_subcontractor_reports_subcontractor ON subcontractor_reports(subcontractor_id);
CREATE INDEX idx_subcontractor_scope_access_subcontractor ON subcontractor_scope_access(subcontractor_id);
```

### API Routes Structure
```
/api/subcontractor/
  ├── auth/
  │   ├── POST   /login        # Subcontractor login
  │   └── POST   /logout       # Subcontractor logout
  ├── reports/
  │   ├── GET    /             # List subcontractor's reports
  │   ├── POST   /             # Submit new report
  │   └── GET    /[id]         # Get specific report
  ├── documents/
  │   ├── GET    /             # List accessible PDFs
  │   └── GET    /[id]/download # Download PDF
  └── profile/
      └── GET    /             # Get subcontractor profile
```

### Component Architecture
```
SubcontractorPortalCoordinator (Main orchestrator)
├── SubcontractorAuth
│   ├── SubcontractorLoginForm
│   └── SubcontractorSessionManager
├── SubcontractorReportManager
│   ├── ReportSubmissionForm
│   └── ReportsList
├── SubcontractorDocumentViewer
│   ├── ScopeDocumentList
│   └── PDFDownloader
└── SubcontractorProfile
    └── BasicProfileView
```

## Implementation Requirements

### Authentication & Authorization
- **Simple Authentication**: Basic login/logout with session management
- **Role-based Access**: Single 'subcontractor' role with project-specific document access
- **Session Management**: Basic session handling with timeout controls
- **Access Control**: Document access limited to assigned scope items only

### Business Rules
1. **Report Submission**:
   - Subcontractors can submit daily/weekly reports with photos
   - Reports are automatically linked to their assigned project
   - No editing after submission (keep it simple)

2. **Document Access**:
   - Only scope PDFs explicitly assigned to the subcontractor
   - Read-only access (view and download)
   - No commenting or approval capabilities

3. **Project Assignment**:
   - Subcontractors are assigned to specific projects by project managers
   - Access is automatically granted to relevant scope documents
   - No multi-project access per user

### Performance Requirements
- **API Response**: <200ms for all endpoints
- **PDF Loading**: <3s for document downloads
- **Mobile Responsive**: Basic mobile-friendly interface
- **No Offline**: Keep implementation simple without offline capabilities

### Security Requirements
- **Access Control**: Subcontractors can only access their assigned documents
- **Input Validation**: Basic validation for report submissions
- **File Security**: Secure PDF access with proper authentication checks
- **Audit Trail**: Basic logging of document access and report submissions

## Integration Points

### Existing Systems
- **Document Management**: Reuse existing document storage and access patterns
- **Project Management**: Link subcontractors to specific projects
- **Scope Management**: Connect document access to scope items
- **Authentication System**: Extend existing auth patterns for external users

### External Communications
- **Email Notifications**: Basic email alerts for new reports (optional)
- **File Storage**: Secure photo upload for reports
- **PDF Serving**: Secure PDF download with access controls

## Mobile Considerations
- **Simple Interface**: Basic mobile-friendly forms and lists
- **Photo Upload**: Camera integration for report photos
- **Touch-Optimized**: Large buttons and simple navigation
- **No PWA**: Keep it simple without progressive web app features

## Simplified Approach
- **No GPS Tracking**: Remove location-based features
- **No Offline Mode**: Online-only operation
- **No Performance Metrics**: Simple status tracking only
- **No Complex Workflows**: Basic submit-and-view functionality
- **No Real-time Features**: Standard request/response pattern

## Quality Metrics
- **Evaluation Target**: 85+ score (simpler than client portal)
- **Pattern Compliance**: Follow Formula PM conventions
- **TypeScript Coverage**: 100% type safety
- **Security**: Basic role-based access control
- **Performance**: Sub-200ms response times

## Success Indicators
- Simple report submission workflow
- Secure access to assigned scope PDFs
- Basic project assignment and document access control
- Mobile-friendly interface for field use
- Integration with existing Formula PM authentication

## Implementation Notes
- Follow existing Formula PM patterns where possible
- Reuse client portal authentication patterns
- Use Supabase RLS for data isolation
- Implement using Next.js 15 App Router
- Use Shadcn/ui for consistent UI components
- Keep all features minimal and focused on core needs

## Design Principles
- **Extreme Simplicity**: Only implement what's explicitly requested
- **Reuse Existing Patterns**: Leverage client portal and document management patterns
- **No Feature Creep**: Resist adding "nice to have" features
- **Mobile-First**: Design for field workers using mobile devices
- **Security-Conscious**: Maintain proper access controls despite simplicity