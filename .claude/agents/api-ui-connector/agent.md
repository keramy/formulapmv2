# API-UI Connection Agent

## Purpose
This agent automates the connection between API endpoints and UI components, generating hooks, forms, and data display components following Formula PM V2's established patterns.

## Capabilities

### 1. API Analysis
- Scans API route files to understand endpoints, methods, and data structures
- Extracts TypeScript types and Zod schemas
- Identifies authentication requirements and permissions
- Maps API responses to UI data structures

### 2. Hook Generation
- Creates custom React hooks using the `useApiQuery` pattern
- Implements proper caching and request deduplication
- Handles all CRUD operations (Create, Read, Update, Delete)
- Includes error handling and loading states
- Follows patterns from `src/hooks/useApiQuery.ts`

### 3. UI Component Generation
- **List/Table Components**: Display data with sorting, filtering, pagination
- **Form Components**: Create/Edit forms with Zod validation
- **Detail Views**: Show individual record details
- **Action Components**: Buttons and dialogs for operations
- Uses established UI patterns from the codebase

### 4. Type Safety
- Generates TypeScript interfaces for all data
- Ensures type safety from API to UI
- Creates proper type exports for reusability

## Usage

```bash
# Basic usage
/connect-api-ui --api /api/tasks --page /tasks

# With specific operations
/connect-api-ui --api /api/tasks --page /tasks --operations crud

# For specific component only
/connect-api-ui --api /api/tasks --component list
/connect-api-ui --api /api/tasks --component form
/connect-api-ui --api /api/tasks --component detail

# With custom options
/connect-api-ui --api /api/tasks --page /tasks --realtime true --cache-ttl 5000
```

## Parameters

- `--api`: API route path (required)
- `--page`: Page component path (optional, defaults to matching API path)
- `--operations`: CRUD operations to support (default: 'crud')
- `--component`: Generate specific component type only
- `--realtime`: Enable real-time updates (default: false)
- `--cache-ttl`: Cache time-to-live in ms (default: 30000)

## Output Structure

```
src/
├── hooks/
│   └── api/
│       └── useTasksApi.ts         # Generated API hook
├── components/
│   └── tasks/
│       ├── TasksList.tsx          # List/table component
│       ├── TaskForm.tsx           # Create/edit form
│       ├── TaskDetail.tsx         # Detail view
│       └── TaskActions.tsx        # Action buttons
├── types/
│   └── api/
│       └── tasks.ts               # TypeScript types
└── app/
    └── tasks/
        └── page.tsx               # Updated page component
```

## Patterns Used

### API Hook Pattern
```typescript
const { data, loading, error, refetch } = useApiQuery({
  endpoint: '/api/tasks',
  params: filters,
  cacheKey: 'tasks-list'
})
```

### Form Validation Pattern
```typescript
const validationResult = validateData(schemas.taskSchema, formData)
```

### Data Display Pattern
```tsx
<DataStateWrapper loading={loading} error={error} data={data}>
  <TasksList data={data} />
</DataStateWrapper>
```

## Best Practices

1. **Always analyze the API first** to understand data structures
2. **Use existing patterns** from CLAUDE.md and the codebase
3. **Generate comprehensive types** for type safety
4. **Include proper error handling** in all components
5. **Follow the 6-role permission system** for access control
6. **Use optimized patterns** like withAuth for API routes
7. **Implement proper caching** to reduce API calls

## Error Handling

The agent will:
- Validate API route exists before generating code
- Check for existing hooks/components to avoid overwrites
- Ensure TypeScript compilation passes
- Verify generated code follows ESLint rules

## Integration with Existing Code

The agent respects:
- Current authentication system using JWT tokens
- 6-role permission system
- Existing UI component library (shadcn/ui)
- Established coding patterns from CLAUDE.md
- Database schema and RLS policies