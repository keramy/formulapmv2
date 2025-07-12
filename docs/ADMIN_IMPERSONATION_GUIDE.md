# Admin User Impersonation Feature

## Overview

The Admin User Impersonation feature allows administrators to temporarily switch to any user account without requiring passwords. This is essential for testing, troubleshooting, and demonstrating different user experiences.

## 🎭 Key Features

### Security & Access Control
- **Role-Based Access**: Only `company_owner` and `admin` roles can impersonate users
- **Hierarchy Protection**: Lower-level admins cannot impersonate higher-level users
- **Self-Protection**: Users cannot impersonate themselves
- **Session Timeout**: Automatic 4-hour timeout for security

### User Experience
- **Visual Indicators**: Clear banners and icons show impersonation status
- **Easy Navigation**: "Switch User" button in header dropdown
- **Quick Return**: "Return to Admin" buttons throughout interface
- **Search & Filter**: Modal with user search and role filtering

### Technical Implementation
- **Session Storage**: Temporary state management (clears on browser close)
- **JWT Preservation**: Original admin token maintained for API calls
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive validation and error recovery

## 🚀 How to Use

### 1. Access Impersonation
1. Login as an admin user (e.g., `admin@formulapm.com`)
2. Click the user dropdown in the top-right corner
3. Select **"Switch User"** option
4. The User Impersonation Modal will open

### 2. Select Target User
1. Browse available users by role categories
2. Use the search bar to find specific users by:
   - Name
   - Email
   - Role
   - Department
   - Company
3. Filter by role using the dropdown
4. Click **"Impersonate"** on the desired user

### 3. Impersonation Mode
- **Visual Indicators**: Blue banner at top shows current impersonation
- **User Context**: Experience the app exactly as the target user would
- **Original Identity**: Your admin privileges are preserved for API calls
- **Navigation**: All features work as if you are the target user

### 4. Return to Admin
- Click **"Return to Admin"** button in the blue banner
- Use the **"Return to Admin"** option in user dropdown
- Close browser (session storage clears automatically)
- Wait 4 hours (automatic timeout)

## 👥 Available Test Users

All test users have password: `testpass123`

### Management Level
- **Company Owner**: `owner.test@formulapm.com`
- **General Manager**: `gm.test@formulapm.com`
- **Deputy General Manager**: `deputy.test@formulapm.com`
- **Technical Director**: `tdirector.test@formulapm.com`

### Project Team
- **Project Manager**: `pm.test@formulapm.com`
- **Senior Architect**: `architect.test@formulapm.com`
- **Technical Engineer**: `engineer.test@formulapm.com`

### Procurement
- **Purchase Director**: `pdirector.test@formulapm.com`
- **Purchase Specialist**: `purchase.test@formulapm.com`

### Field Operations
- **Field Worker**: `field.test@formulapm.com`

### External Users
- **Client**: `client.test@formulapm.com`

### Admin Users
- **Primary Admin**: `admin@formulapm.com`

## 🔧 Technical Details

### Frontend Components

#### useImpersonation Hook
```typescript
const {
  isImpersonating,
  impersonatedUser,
  originalAdmin,
  impersonateUser,
  stopImpersonation,
  canImpersonate,
  getImpersonationInfo
} = useImpersonation()
```

#### useAuth Integration
```typescript
const {
  profile,           // Current effective profile (original or impersonated)
  isImpersonating,   // Boolean impersonation status
  impersonatedUser,  // Target user profile
  originalAdmin,     // Original admin profile
  stopImpersonation  // Function to return to admin
} = useAuth()
```

#### UserImpersonationModal Component
- User search and filtering
- Role-based categorization
- Security validation
- Error handling

### Backend API

#### Admin Users Endpoint
```
GET /api/admin/users
Authorization: Bearer <admin_jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available_for_impersonation": [...],
    "users_by_role": {...},
    "total_users": 12,
    "current_admin": {...}
  }
}
```

### Security Implementation

#### Role Validation
```typescript
const adminRoles: UserRole[] = ['company_owner', 'admin']
if (!adminRoles.includes(profile.role)) {
  return // Access denied
}
```

#### Hierarchy Enforcement
```typescript
// Company owners can impersonate anyone
// Admins cannot impersonate other admins/owners
const secureList = profile.role === 'company_owner' 
  ? availableForImpersonation 
  : availableForImpersonation.filter(u => !['company_owner', 'admin'].includes(u.role))
```

#### Session Management
```typescript
const IMPERSONATION_TIMEOUT = 4 * 60 * 60 * 1000 // 4 hours
sessionStorage.setItem(IMPERSONATION_KEY, JSON.stringify({
  originalAdmin,
  impersonatedUser: targetUser,
  timestamp: Date.now()
}))
```

## 🛠️ Development

### Adding New Impersonation Features

1. **Extend useImpersonation Hook**:
   ```typescript
   // Add new functionality to the hook
   const newFeature = useCallback(() => {
     // Implementation
   }, [impersonationState])
   ```

2. **Update Security Validation**:
   ```typescript
   // Add role checks in API routes
   if (!canImpersonate(profile.role, targetRole)) {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
   }
   ```

3. **Enhance UI Components**:
   ```typescript
   // Add visual indicators
   {isImpersonating && (
     <ImpersonationBanner 
       originalAdmin={originalAdmin}
       impersonatedUser={impersonatedUser}
     />
   )}
   ```

### Testing

#### Unit Tests
```bash
npm test -- --testNamePattern="impersonation"
```

#### Integration Tests
```bash
# Test impersonation flow
npm run test:e2e -- --grep "admin impersonation"
```

#### Manual Testing Checklist
- [ ] Admin can access Switch User option
- [ ] Non-admin users cannot see Switch User
- [ ] User list loads with proper filtering
- [ ] Search functionality works
- [ ] Impersonation starts successfully
- [ ] Visual indicators appear correctly
- [ ] Target user experience is authentic
- [ ] Return to admin works from all locations
- [ ] Session timeout functions properly
- [ ] Security validations prevent unauthorized access

## 🚨 Security Considerations

### Production Deployment
1. **Audit Logging**: Implement comprehensive audit trails
2. **Time Limits**: Consider shorter timeout periods
3. **IP Restrictions**: Limit to specific networks if needed
4. **Approval Workflow**: Add approval process for sensitive impersonations
5. **Monitoring**: Set up alerts for impersonation activities

### Security Best Practices
- Never log impersonation tokens
- Always validate roles on both frontend and backend
- Use HTTPS in production
- Implement rate limiting for impersonation attempts
- Regular security reviews of impersonation logs

## 📋 Troubleshooting

### Common Issues

#### "No users available for impersonation"
- Check user's role permissions
- Verify database contains active users
- Check API authentication

#### "Failed to start impersonation"
- Verify target user is active
- Check role hierarchy restrictions
- Confirm session storage is enabled

#### "Cannot return to admin"
- Refresh the page to clear session
- Check browser console for errors
- Verify original admin session is valid

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('impersonation_debug', 'true')
```

## 🔄 Updates and Maintenance

### Regular Tasks
- Review impersonation logs weekly
- Update test user passwords quarterly
- Validate security policies monthly
- Performance monitoring ongoing

### Feature Roadmap
- [ ] Audit trail dashboard
- [ ] Bulk user management
- [ ] Custom role permissions
- [ ] Advanced filtering options
- [ ] Mobile app support

---

**Last Updated**: July 12, 2025  
**Version**: 1.0.0  
**Author**: Formula PM Development Team