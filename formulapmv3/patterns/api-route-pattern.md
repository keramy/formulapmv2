# API Route Pattern (From V2)

## Working API Patterns to Adapt for V3

### V2 Pattern (Reference):
```typescript
// Current v2 pattern
import { withAPI } from '@/lib/enhanced-auth-middleware';

async function GET(req: NextRequest) {
  const user = (req as any).user;
  const profile = (req as any).profile;
  
  // Business logic
  const data = await fetchData(user.id);
  return createSuccessResponse(data);
}

export { withAPI(GET) as GET };
```

### V3 Pattern (Target):
```typescript
// New v3 pattern with simplified auth
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(
  async (request, { user, profile }) => {
    // Business logic
    const data = await fetchData(user.id);
    return NextResponse.json(data);
  },
  { 
    requireAuth: true,
    permission: 'view_scope_items'
  }
);
```

### Key Improvements for V3:
1. **Cleaner middleware** - Single withAuth wrapper
2. **Permission-based** - Check specific permissions, not roles
3. **Type safety** - Better TypeScript support
4. **Simpler error handling** - Standard Next.js responses

### Database Query Patterns to Keep:
- RLS policy optimization from v2
- Pagination patterns
- Search and filtering logic
- Join patterns for related data

### Business Logic to Preserve:
- Scope item management
- Project access control
- Data validation patterns
- Error handling approaches