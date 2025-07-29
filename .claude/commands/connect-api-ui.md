# /connect-api-ui

Connects API endpoints to UI components by generating hooks, forms, and data display components.

## Usage

```bash
/connect-api-ui --api /api/tasks --page /tasks
```

## Options

- `--api` (required): API route path to connect (e.g., `/api/tasks`)
- `--page`: Page component path (defaults to matching API path)
- `--operations`: CRUD operations to support (default: 'crud')
  - `c` - Create
  - `r` - Read  
  - `u` - Update
  - `d` - Delete
- `--component`: Generate specific component type only
  - `list` - List/table component
  - `form` - Create/edit form
  - `detail` - Detail view
  - `all` - All components (default)
- `--realtime`: Enable real-time updates (default: false)
- `--cache-ttl`: Cache time-to-live in ms (default: 30000)

## Examples

### Basic usage (generates all components)
```bash
/connect-api-ui --api /api/tasks --page /tasks
```

### Generate only list component
```bash
/connect-api-ui --api /api/tasks --component list
```

### Generate with specific operations
```bash
/connect-api-ui --api /api/tasks --operations cr  # Only create and read
```

### Enable real-time updates
```bash
/connect-api-ui --api /api/tasks --realtime true
```

## Generated Files

```
src/
├── types/api/tasks.ts         # TypeScript types
├── hooks/api/useTasksApi.ts   # API hook with CRUD operations
├── components/tasks/
│   ├── TasksList.tsx          # List/table component
│   └── TaskForm.tsx           # Create/edit form
└── app/tasks/page.tsx         # Updated page component
```

## Features

- **Type Safety**: Generates TypeScript types from API analysis
- **CRUD Operations**: Full Create, Read, Update, Delete support
- **Error Handling**: Built-in error handling with toast notifications
- **Loading States**: Proper loading states for all operations
- **Caching**: Request deduplication and caching
- **Form Validation**: Zod schema validation for forms
- **Responsive UI**: Mobile-friendly components
- **Role-Based Access**: Respects 6-role permission system

## Requirements

- API route must exist at specified path
- API should follow Formula PM V2 patterns
- Uses existing UI components (shadcn/ui)
- Requires authentication setup