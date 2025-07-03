# Formula PM Authentication Pattern

## Overview
Complete authentication and authorization implementation for Formula PM 2.0 supporting 13 distinct user roles with granular permissions using Supabase Auth and JWT tokens.

## Architecture Components

### 1. Core Authentication Flow
```typescript
// Supabase Client Configuration (/lib/supabase.ts)
- Client-side client with session persistence
- Server-side client for API routes
- Admin client for elevated operations
```

### 2. User Roles (13 Types)
**Management Level (5)**
- company_owner: Ultimate system access
- general_manager: Company-wide operations
- deputy_general_manager: Delegated authority
- technical_director: Technical oversight
- admin: System administration

**Project Level (3)**
- project_manager: Complete project control
- architect: Design authority
- technical_engineer: Engineering support

**Operational Level (2)**
- purchase_director: Procurement oversight
- purchase_specialist: Procurement execution

**Field Level (1)**
- field_worker: Site execution

**External Access (2)**
- client: Review and approval
- subcontractor: Limited reporting

### 3. Permission System
```typescript
// Permission Matrix (/lib/permissions.ts)
const PERMISSIONS = {
  // Project Management
  'projects.create': [...allowedRoles],
  'projects.read.all': [...managementRoles],
  'projects.read.assigned': [...projectRoles],
  
  // Scope Management (with pricing visibility control)
  'scope.prices.view': [...authorizedRoles], // NOT field_worker, client, subcontractor
  'scope.read.limited': [...restrictedRoles], // No pricing data
  
  // Document & Shop Drawing Management
  'shop_drawings.create': ['architect'],
  'shop_drawings.approve.client': ['client'],
  
  // Task Management
  'tasks.create': [...taskCreators],
  'tasks.manage_all': [...managementRoles],
  
  // User Management
  'users.create': [...adminRoles],
  'users.roles.assign': ['company_owner', 'admin']
}
```

### 4. Authentication Components

#### Auth Hook (/hooks/useAuth.ts)
```typescript
export const useAuth = () => {
  // Session management
  // Profile fetching with role
  // Sign in/up/out methods
  // Password reset
  // Profile updates
  // Role-based helpers (isManagement, isProjectRole, etc.)
}
```

#### Permission Hook (/hooks/usePermissions.ts)
```typescript
export const usePermissions = () => {
  // Permission checking methods
  // Role-based access helpers
  // Navigation visibility
  // Feature access control
}
```

#### Auth Guard Component (/components/auth/AuthGuard.tsx)
```typescript
<AuthGuard 
  requiredPermission="projects.create"
  allowedRoles={['project_manager', 'admin']}
  requireManagement={false}
>
  {/* Protected content */}
</AuthGuard>
```

### 5. API Authentication Middleware

#### Protected API Routes (/lib/middleware.ts)
```typescript
// Basic authentication
export const withAuth = (handler, options?: {
  permission?: Permission
  roles?: UserRole[]
  requireManagement?: boolean
  requireAdmin?: boolean
})

// Usage in API routes
export const GET = withAuth(async (request) => {
  const user = getAuthenticatedUser(request)
  // Handler logic
}, { permission: 'projects.read.all' })
```

### 6. Authentication API Endpoints

#### Login (/api/auth/login)
- Email/password validation
- Active account check
- Profile fetching
- Session creation

#### Register (/api/auth/register)
- User creation with role
- Profile setup
- Email validation
- Password strength check

#### Logout (/api/auth/logout)
- Session termination
- Client-side cleanup

#### Password Reset (/api/auth/reset-password)
- Email verification
- Reset token generation
- Password update flow

#### Profile Management (/api/auth/profile)
- Get current profile
- Update allowed fields
- Permission-based field access

### 7. Role-Based Navigation

#### Navigation Component (/components/navigation/Navigation.tsx)
```typescript
// Dynamic navigation based on permissions
const navigationItems = [
  {
    name: 'Projects',
    href: '/projects',
    requiresPermission: () => isManagement() || canCreateProject()
  },
  {
    name: 'Client Portal',
    href: '/client',
    requiresRole: ['client']
  }
]
```

## Security Features

### 1. JWT Token Management
- Auto-refresh tokens
- Secure session persistence
- PKCE flow for enhanced security

### 2. Password Security
- Minimum 8 characters
- Strength validation
- Secure reset flow

### 3. Session Management
- Server-side session validation
- Active account verification
- Role-based session data

### 4. Rate Limiting
- Basic rate limiting per identifier
- Configurable request limits
- Automatic cleanup

### 5. Input Validation
- Email format validation
- Phone number validation
- SQL injection prevention
- XSS protection

## Implementation Patterns

### 1. Client-Side Authentication
```typescript
// In React components
const { user, profile, signIn, signOut } = useAuth()
const { checkPermission, canViewPricing } = usePermissions()

// Protected routes
<AuthGuard requiredPermission="projects.create">
  <ProjectCreationForm />
</AuthGuard>
```

### 2. Server-Side Authentication
```typescript
// In API routes
export const POST = withAuth(async (request) => {
  const user = getAuthenticatedUser(request)
  // Authorized logic here
}, { permission: 'projects.create' })
```

### 3. Role-Based UI Rendering
```typescript
// Conditional rendering based on permissions
{canViewPricing() && <PricingSection />}
{isManagement() && <ManagementDashboard />}
```

### 4. Navigation Filtering
```typescript
// Dynamic navigation based on role
const visibleItems = navigationItems.filter(item => 
  hasAccessToNavItem(item)
)
```

## Testing Checklist

### Authentication Flow
- [x] User can sign up with valid credentials
- [x] User can sign in with email/password
- [x] Invalid credentials show appropriate errors
- [x] Deactivated accounts cannot login
- [x] Session persists across page refreshes
- [x] Logout clears session completely

### Authorization
- [x] Each role sees only permitted navigation items
- [x] Permission-based API protection works
- [x] Role hierarchy enforced correctly
- [x] Field workers cannot see pricing data
- [x] Clients see only client-visible content

### Security
- [x] JWT tokens auto-refresh
- [x] Expired sessions redirect to login
- [x] Password reset flow secure
- [x] Rate limiting prevents abuse
- [x] Input validation prevents injection

## Migration from Legacy Systems

### User Migration Strategy
1. Export existing user data
2. Map old roles to new 13-role system
3. Generate secure passwords
4. Send activation emails
5. Preserve user relationships

### Permission Migration
1. Map old permissions to new matrix
2. Validate access patterns
3. Test each role thoroughly
4. Document changes for users

## Future Enhancements

### Multi-Factor Authentication (MFA)
- SMS verification for management roles
- Authenticator app support
- Backup codes

### Single Sign-On (SSO)
- SAML integration
- OAuth providers
- Enterprise directory sync

### Advanced Session Management
- Device tracking
- Session history
- Force logout capabilities
- Concurrent session limits

## Common Patterns

### Protected Page Pattern
```typescript
export default function ProtectedPage() {
  return (
    <AuthGuard requiredPermission="projects.create">
      <MainLayout>
        {/* Page content */}
      </MainLayout>
    </AuthGuard>
  )
}
```

### API Route Pattern
```typescript
export const GET = withAuth(
  async (request) => {
    // Handler logic
  },
  { permission: 'reports.read.all' }
)
```

### Conditional Feature Pattern
```typescript
const FeatureComponent = () => {
  const { canEditScope } = usePermissions()
  
  return (
    <div>
      {canEditScope() && <EditButton />}
    </div>
  )
}
```

## Error Handling

### Authentication Errors
- Invalid credentials: Clear user message
- Account deactivated: Contact admin message
- Network errors: Retry mechanism
- Token expired: Auto-refresh or re-login

### Authorization Errors
- Insufficient permissions: Show fallback UI
- Role not allowed: Redirect to allowed area
- Feature locked: Show upgrade prompt

## Performance Considerations

### Client-Side
- Cache permission checks
- Minimize auth state changes
- Lazy load role-specific components

### Server-Side
- Cache user profiles in memory
- Batch permission checks
- Use database indexes for user queries

## Compliance & Audit

### Audit Trail
- Login/logout events tracked
- Permission changes logged
- Failed authentication attempts recorded
- Role assignments audited

### Data Privacy
- Minimal PII in JWT tokens
- Secure password storage
- Profile data encryption
- GDPR compliance ready