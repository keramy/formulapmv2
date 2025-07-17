# API Route Migration Guide

## 5-Role Structure Updates

### Old Roles → New Roles
- `company_owner` → `management`\n- `general_manager` → `management`\n- `deputy_general_manager` → `management`\n- `technical_director` → `technical_lead`\n- `architect` → `project_manager`\n- `technical_engineer` → `project_manager`\n- `field_worker` → `project_manager`\n- `purchase_director` → `purchase_manager`\n- `purchase_specialist` → `purchase_manager`\n- `client` → `client`\n- `admin` → `admin`

### Updated Permission Checks

Instead of:
```typescript
if (!['company_owner', 'general_manager', 'deputy_general_manager'].includes(profile.role)) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 })
}
```

Use:
```typescript
if (!hasPermission(profile.role, 'specific.permission')) {
  return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
}
```

### PM Hierarchy Support

Check seniority level:
```typescript
if (profile.role === 'project_manager' && profile.seniority_level === 'senior') {
  // Senior PM logic
}
```

Check approval limits:
```typescript
if (profile.approval_limits?.budget && requestAmount <= profile.approval_limits.budget) {
  // Can approve
}
```

### Cost Visibility

Use the new cost access function:
```typescript
import { hasCostAccess } from '@/lib/permissions'

if (hasCostAccess(profile.role, profile.seniority_level)) {
  // Include cost data
}
```

## Files Updated
- src/app/api/auth/profile/route.ts\n- src/app/api/projects/route.ts\n- src/app/api/reports/route.ts\n- src/app/api/scope/route.ts\n- src/app/api/tasks/route.ts

## Next Steps
1. Test updated API routes
2. Update remaining API routes using templates
3. Update frontend components to use new roles
4. Test end-to-end workflows
