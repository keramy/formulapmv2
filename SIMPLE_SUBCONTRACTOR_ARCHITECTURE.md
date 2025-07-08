# Simple Subcontractor System Architecture

## Overview
This document outlines the minimal architecture for a simple subcontractor access system that provides only two core features:
1. **Site Report Submission** - Subcontractors can submit daily/weekly reports with photos
2. **PDF Access** - Subcontractors can view and download assigned scope PDFs

## Architecture Decisions

### Design Principles
- **Maximum Simplicity**: Only implement explicitly requested features
- **Reuse Existing Patterns**: Leverage Formula PM's client portal patterns
- **No Feature Creep**: Resist adding "nice to have" features
- **Mobile-First**: Design for field workers using mobile devices
- **Security-Conscious**: Maintain proper access controls despite simplicity

### What's Included
✅ Basic authentication (login/logout)  
✅ Site report submission with photos  
✅ PDF document access for assigned scopes  
✅ Simple user profile management  
✅ Basic security with RLS policies  

### What's Excluded
❌ GPS tracking or location services  
❌ Offline capabilities  
❌ Performance metrics or analytics  
❌ Complex workflows or approvals  
❌ Real-time notifications  
❌ Mobile PWA features  
❌ Advanced reporting or dashboards  

## Database Schema

### Tables (3 total)

1. **`subcontractor_users`** - Basic user profiles
2. **`subcontractor_reports`** - Site reports with photos
3. **`subcontractor_scope_access`** - Document access permissions

### Key Features
- **Minimal Data**: Only essential fields for core functionality
- **RLS Security**: Row-level security for data isolation
- **Simple Relationships**: Direct foreign key relationships
- **Basic Indexing**: Performance indexes on frequently queried fields

## API Endpoints (6 total)

```
/api/subcontractor/
  ├── auth/login         # POST - Login
  ├── auth/logout        # POST - Logout
  ├── profile/           # GET - Profile info
  ├── reports/           # GET - List reports, POST - Submit report
  ├── reports/[id]       # GET - View specific report
  ├── documents/         # GET - List accessible PDFs
  └── documents/[id]/download # GET - Download PDF
```

## Component Structure (4 components)

```
SubcontractorPortalCoordinator (Main)
├── SubcontractorAuth (Login/Session)
├── SubcontractorReportManager (Report CRUD)
├── SubcontractorDocumentViewer (PDF access)
└── SubcontractorProfile (Basic profile)
```

## Implementation Strategy

### Phase 1: Authentication & Profile
1. Create basic login system using Formula PM patterns
2. Implement user profile management
3. Set up session handling

### Phase 2: Report Submission
1. Create report submission form
2. Implement photo upload functionality
3. Add report listing and viewing

### Phase 3: Document Access
1. Link subcontractors to scope items
2. Implement PDF access controls
3. Add download functionality

### Phase 4: Integration
1. Connect to existing project management
2. Integrate with document storage
3. Add basic notifications (optional)

## Security Model

### Access Control
- **Project-based**: Subcontractors only see their assigned projects
- **Document-based**: Only PDFs explicitly assigned to them
- **Report-based**: Only their own submitted reports

### Authentication
- **Session-based**: Similar to client portal authentication
- **Role-based**: Single 'subcontractor' role with limited permissions
- **Lockout**: Basic account lockout after failed attempts

### Data Protection
- **RLS Policies**: Supabase row-level security
- **Input Validation**: Zod schemas for all inputs
- **File Security**: Secure photo upload and PDF access

## Integration Points

### Existing Systems
- **User Management**: Extends existing user_profiles table
- **Project Management**: Links to existing projects table
- **Document Management**: Reuses existing documents table
- **Scope Management**: Connects to existing scope_items table

### File Storage
- **Photos**: Secure upload to Formula PM storage
- **PDFs**: Access existing document storage
- **Security**: Proper access controls for all files

## Mobile Considerations

### Interface Design
- **Simple Forms**: Easy-to-use report submission
- **Large Buttons**: Touch-friendly navigation
- **Responsive Layout**: Works on all screen sizes
- **Photo Upload**: Camera integration for reports

### Performance
- **Fast Loading**: Minimal data transfer
- **Offline-Ready**: Basic caching (no complex offline features)
- **Progressive**: Works on slower connections

## Quality Assurance

### Testing Strategy
- **Unit Tests**: Basic validation and business logic
- **Integration Tests**: API endpoint testing
- **Security Tests**: Access control validation
- **Mobile Tests**: Responsive design validation

### Performance Targets
- **API Response**: <200ms for all endpoints
- **PDF Download**: <3s for document access
- **Photo Upload**: <5s for report submission
- **Page Load**: <2s for all pages

## Deployment Strategy

### Database Migration
1. Run migration: `20250704000001_simple_subcontractor_access.sql`
2. Verify RLS policies are active
3. Test basic CRUD operations

### Application Deployment
1. Deploy API routes
2. Deploy React components
3. Test authentication flow
4. Verify document access

### User Onboarding
1. Admin creates subcontractor accounts
2. Assign projects and scope access
3. Provide login credentials
4. Basic training on system use

## Success Metrics

### Functional Goals
- ✅ Subcontractors can log in successfully
- ✅ Reports are submitted and viewable
- ✅ PDFs are accessible and downloadable
- ✅ System is secure and performs well

### Business Goals
- **Improved Communication**: Better site reporting
- **Document Access**: Easy PDF access for subcontractors
- **Reduced Overhead**: Simple system requiring minimal training
- **Mobile Accessibility**: Field workers can use mobile devices

## Future Considerations

### Potential Enhancements (Phase 2)
- Email notifications for submitted reports
- Basic search functionality
- Simple approval workflow for reports
- Integration with existing communication systems

### Scalability
- Current design supports 50+ concurrent subcontractors
- Database can handle 1000+ reports and documents
- API can scale with Formula PM infrastructure

## Risk Mitigation

### Technical Risks
- **File Upload**: Limit file sizes and types
- **Security**: Comprehensive access controls
- **Performance**: Proper indexing and caching
- **Maintenance**: Simple codebase for easy updates

### Business Risks
- **User Adoption**: Simple interface for easy adoption
- **Data Loss**: Proper backups and versioning
- **Access Control**: Strict permission management
- **Compliance**: Proper audit trails

## Implementation Timeline

### Week 1: Foundation
- Database migration
- Basic authentication
- User profile management

### Week 2: Core Features
- Report submission
- Photo upload
- Document access

### Week 3: Integration
- Project integration
- Scope document linking
- Permission management

### Week 4: Testing & Deployment
- Security testing
- Performance optimization
- Production deployment

## Files Created

### Pattern Documentation
- `/Patterns/subcontractor-access-system-pattern.md` - System pattern definition

### Database Schema
- `/supabase/migrations/20250704000001_simple_subcontractor_access.sql` - Database migration

### Type Definitions
- `/src/types/subcontractor.ts` - TypeScript type definitions

### Validation
- `/src/lib/validation/subcontractor.ts` - Input validation schemas

### Architecture Documentation
- `/SIMPLE_SUBCONTRACTOR_ARCHITECTURE.md` - This comprehensive architecture document

## Conclusion

This minimal subcontractor system provides exactly what was requested:
- **Simple site reporting** with photo uploads
- **Basic PDF access** for assigned scope documents
- **Secure authentication** and access controls
- **Mobile-friendly interface** for field workers

The architecture is designed for simplicity, security, and maintainability while integrating seamlessly with the existing Formula PM system. The implementation follows established patterns and avoids over-engineering, ensuring the system meets user needs without unnecessary complexity.