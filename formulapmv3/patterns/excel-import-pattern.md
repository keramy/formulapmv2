# Excel Import/Export Pattern (From V2)

## Working Pattern to Adapt for V3

The v2 Excel import/export system works well and should be adapted for v3 with new UI patterns.

### Key Components to Reference:
- `src/components/scope/ExcelImportDialog.tsx` - Dialog component with file upload
- `src/app/api/scope/excel/import/route.ts` - Server-side Excel processing  
- `src/app/api/scope/excel/export/route.ts` - Export functionality

### Business Logic to Keep:
- File validation and parsing
- Data preview before import
- Error handling and validation messages
- Batch import with progress tracking
- Export formatting and structure

### V3 Adaptations Needed:
- Use Shadcn/ui components instead of custom UI
- Add permission checks for import/export actions
- Integrate with React Query for better state management
- Improve mobile responsiveness for touch interactions

### Usage Pattern:
```tsx
// V3 implementation should follow this pattern
const { hasPermission } = usePermissions()

{hasPermission('import_export_excel') && (
  <ExcelImportDialog projectId={project.id} />
)}
```

This pattern works well in v2 and should be preserved with modern UI improvements.