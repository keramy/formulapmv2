# V3 Shop Drawings & Testing Guide

## Overview
This guide covers the V3 implementation testing strategy and provides comprehensive test coverage for all new features.

## Test Coverage Summary

### ✅ API Tests
- **Shop Drawings API** (`v3-shop-drawings.test.ts`)
  - GET /api/shop-drawings - List with filters
  - GET /api/shop-drawings/:id - Single drawing details
  - POST /api/shop-drawings - Create with file upload
  - PATCH /api/shop-drawings/:id/status - Update status
  - DELETE /api/shop-drawings/:id - Soft delete

- **Reports API** (`v3-reports.test.ts`)
  - GET /api/reports - List with pagination
  - GET /api/reports/:id - Single report
  - POST /api/reports - Create from template
  - PATCH /api/reports/:id - Update draft
  - POST /api/reports/:id/publish - Publish report
  - GET /api/reports/:id/pdf - Generate PDF
  - DELETE /api/reports/:id - Delete report

### ✅ Integration Tests
- **V3 Features Integration** (`v3-features.integration.test.ts`)
  - Navigation flow with role-based access
  - Dashboard rendering for different user roles
  - Shop drawing submission workflow
  - Report creation and publishing workflow
  - Security and permission validation

### ✅ Component Tests
- **PM Dashboard Components** (`pm-dashboard.test.tsx`)
  - CriticalAlerts with filtering and actions
  - MyProjectsOverview with navigation
  - MyTasksAndActions with status updates
  - RecentProjectActivity with real-time updates

- **Reports UI Components** (`reports-ui.test.tsx`)
  - ReportList with filtering and sorting
  - ReportBuilder with validation
  - ReportViewer with PDF generation
  - ReportTemplateSelector with search

- **V3 Navigation** (`v3-navigation.test.tsx`)
  - Sidebar with role-based filtering
  - Badge display for new features
  - Navigation item activation

### ✅ Hook Tests
- **V3 Hooks** (`v3-hooks.test.ts`)
  - useReports - CRUD operations with PDF generation
  - useShopDrawings - Submission and review workflow
  - useProjectTeam - Team management with permissions
  - useDashboardData - Real-time dashboard data hooks

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test Suites
```bash
# API tests only
npm run test:api

# Component tests only  
npm run test:components

# Integration tests only
npm run test:integration

# Watch mode for development
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Environment Setup

### Mock Data
All tests use consistent mock data that matches the production schema:
- User roles: owner, project_manager, general_manager, architect, client
- Project statuses: planning, in_progress, on_hold, completed
- Shop drawing statuses: draft, pending_review, approved, rejected, revision_requested
- Report types: progress, financial, compliance, quality

### Authentication Mocking
Tests mock the authentication flow with:
```typescript
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    profile: { id: 'test-user', role: 'project_manager' },
    loading: false,
    error: null,
    getAccessToken: () => 'mock-token',
  }),
}))
```

### API Mocking
All API calls are mocked using vi.fn():
```typescript
global.fetch = vi.fn()
vi.mocked(fetch).mockResolvedValueOnce({
  ok: true,
  json: async () => ({ success: true, data: mockData }),
})
```

## Key Testing Patterns

### 1. DataStateWrapper Testing
All components using DataStateWrapper are tested for:
- Loading states
- Error states with retry
- Empty states
- Successful data rendering

### 2. Role-Based Access Testing
Navigation and features are tested with different user roles:
```typescript
const roles = ['owner', 'project_manager', 'general_manager', 'architect', 'client']
roles.forEach(role => {
  it(`renders correctly for ${role}`, () => {
    // Test role-specific behavior
  })
})
```

### 3. Optimistic Updates
Hooks implement optimistic updates tested with:
```typescript
await act(async () => {
  await result.current.updateStatus('id', 'approved')
})
// Verify immediate UI update before API response
```

### 4. Real-Time Features
Dashboard components test auto-refresh:
```typescript
vi.advanceTimersByTime(30000) // 30 second refresh
expect(fetch).toHaveBeenCalledTimes(2)
```

## V3 Feature Test Checklist

### Shop Drawings
- [x] File upload validation (PDF, DWG, image formats)
- [x] Status workflow (draft → review → approved/rejected)
- [x] Version history tracking
- [x] Review comments and annotations
- [x] Email notifications on status change
- [x] Role-based actions (submit, review, approve)

### Reports
- [x] Template selection and customization
- [x] Rich text editing with formatting
- [x] File attachment support
- [x] Draft saving and auto-save
- [x] PDF generation with styling
- [x] Publishing workflow
- [x] Access control for published reports

### Team Management
- [x] Add/remove team members
- [x] Role assignment with validation
- [x] Permission management
- [x] Activity tracking
- [x] Email invitations

### Dashboard
- [x] Real-time critical alerts
- [x] Project progress visualization
- [x] Task prioritization
- [x] Activity feed with filters
- [x] Performance metrics

## Common Test Scenarios

### Error Handling
```typescript
it('handles API errors gracefully', async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
  
  const { result } = renderHook(() => useShopDrawings())
  
  await waitFor(() => {
    expect(result.current.error).toBe('Network error')
    expect(result.current.loading).toBe(false)
  })
})
```

### Permission Testing
```typescript
it('restricts actions based on permissions', () => {
  const { rerender } = render(<ShopDrawingActions drawing={mockDrawing} />)
  
  // Test as architect (can submit)
  expect(screen.getByText('Submit for Review')).toBeInTheDocument()
  
  // Test as client (view only)
  rerender(<ShopDrawingActions drawing={mockDrawing} userRole="client" />)
  expect(screen.queryByText('Submit for Review')).not.toBeInTheDocument()
})
```

### Pagination Testing
```typescript
it('loads more items on scroll', async () => {
  const { result } = renderHook(() => useShopDrawings())
  
  // Initial load
  expect(result.current.data).toHaveLength(20)
  
  // Trigger pagination
  await act(async () => {
    await result.current.loadMore()
  })
  
  expect(result.current.data).toHaveLength(40)
})
```

## Debugging Test Failures

### Common Issues
1. **Timing Issues**: Use `waitFor()` for async operations
2. **Mock Data Mismatch**: Ensure mock data matches schema
3. **Missing Mocks**: Check all external dependencies are mocked
4. **State Updates**: Wrap state changes in `act()`

### Debug Commands
```bash
# Run single test file
npm test -- v3-shop-drawings.test.ts

# Run with verbose output
npm test -- --verbose

# Debug specific test
npm test -- -t "submits shop drawing"
```

## Test Maintenance

### Adding New Tests
1. Follow existing patterns in test files
2. Use consistent mock data structure
3. Test both success and error paths
4. Include edge cases and validation

### Updating Tests
When modifying features:
1. Update relevant test files
2. Add new test cases for new functionality
3. Ensure coverage remains above 75%
4. Run full test suite before committing

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-commit hooks (fast tests only)

### GitHub Actions Workflow
```yaml
- name: Run V3 Tests
  run: |
    npm run test:api
    npm run test:components
    npm run test:integration
    npm run test:coverage
```

## Performance Testing

### Load Testing Patterns
```typescript
it('handles large datasets efficiently', async () => {
  const largeDataset = Array(1000).fill(null).map((_, i) => ({
    id: String(i),
    title: `Drawing ${i}`,
  }))
  
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data: largeDataset }),
  })
  
  const { result } = renderHook(() => useShopDrawings())
  
  const startTime = performance.now()
  await waitFor(() => {
    expect(result.current.data).toHaveLength(1000)
  })
  const endTime = performance.now()
  
  expect(endTime - startTime).toBeLessThan(1000) // Under 1 second
})
```

## Summary

The V3 testing implementation provides:
- **100% API endpoint coverage** for new features
- **Component tests** for all UI elements
- **Integration tests** for complete workflows
- **Hook tests** for data management
- **Performance benchmarks** for large datasets
- **Security validation** for role-based access

All tests follow established patterns using:
- Jest + Vitest for test runner
- React Testing Library for components
- Mock Service Worker patterns
- Consistent mock data structures
- Comprehensive error scenarios

This ensures V3 features are production-ready with confidence in:
- Functionality correctness
- Performance standards
- Security compliance
- User experience quality