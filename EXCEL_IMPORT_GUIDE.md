# Excel Import for Scope Items - Implementation Guide

## Overview

The Excel import functionality allows users to bulk import scope items from Excel files (.xlsx, .xls) into the Formula PM v2 system. This feature includes comprehensive validation, error reporting, and automatic data processing.

## Implementation Status

✅ **FULLY IMPLEMENTED** - Ready for production use

### Components Implemented:

1. **API Endpoint**: `/api/scope/excel/import` (POST)
2. **React Hook**: `useScopeExcel` in `src/hooks/useScope.ts`
3. **Validation System**: Comprehensive row-by-row validation
4. **Error Reporting**: Detailed error messages with row/field information
5. **Database Integration**: Transaction-safe batch inserts
6. **Auto-numbering**: Automatic item_no generation per project

## Excel Template Structure

### Column Layout (A-L):

| Column | Field | Required | Description | Valid Values |
|--------|--------|----------|------------|--------------|
| A | Item No | Optional | Per-project sequential number | Auto-generated if empty |
| B | Category | **Required** | Item category | `structural`, `mechanical`, `electrical`, `architectural`, `civil` |
| C | Item Code | Optional | Unique item identifier | Any text (auto-generated if empty) |
| D | Item Name | **Required** | Display name for item | Any text |
| E | Unit | **Required** | Unit of measurement | Any text (e.g., `pcs`, `m`, `m2`, `kg`) |
| F | Qty | **Required** | Quantity (must be > 0) | Positive numbers only |
| G | Specification | Optional | Technical specifications | Any text |
| H | Location | Optional | Physical location | Any text |
| I | Supplier | Optional | Supplier name | Must match existing supplier or left empty |
| J | Description | **Required** | Detailed description | Any text |
| K | Status | Optional | Item status | `pending`, `approved`, `in_progress`, `completed`, `cancelled` |
| L | Update | Optional | Update notes | Any text |

### Sample Data:
```
Item No | Category   | Item Code | Item Name  | Unit | Qty | Specification | Location    | Supplier      | Description           | Status  | Update
1       | structural | STR-001   | Steel Beam | pcs  | 10  | Grade A steel | Warehouse A | Steel Co      | Main frame beam       | pending | Initial
2       | electrical | ELE-001   | LED Light  | pcs  | 50  | 40W LED      | Floor 1     | Electric Ltd  | Ceiling lighting      | pending | Bulk order
        | civil      | CIV-001   | Concrete   | m3   | 100 | C25 mix      | Site        |               | Foundation concrete   | pending | Auto-numbered
```

## API Usage

### Endpoint
```
POST /api/scope/excel/import
```

### Request Format
```javascript
const formData = new FormData();
formData.append('file', excelFile);
formData.append('projectId', 'project-uuid-here');

const response = await fetch('/api/scope/excel/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  },
  body: formData
});
```

### Response Format

#### Success Response:
```json
{
  "success": true,
  "data": {
    "message": "Successfully imported 5 scope items",
    "imported": 5,
    "errors": [],
    "warnings": [
      "Row 4: Item Code not provided, will use auto-generated code"
    ],
    "suppliers": {
      "Steel Supply Co": "uuid-1",
      "Electric Parts Ltd": "uuid-2"
    }
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "error": "Import failed with validation errors",
  "data": {
    "errors": [
      {
        "row": 2,
        "field": "category",
        "message": "Invalid category. Must be one of: structural, mechanical, electrical, architectural, civil",
        "value": "invalid_category"
      },
      {
        "row": 3,
        "field": "quantity",
        "message": "Quantity must be greater than 0",
        "value": -5
      }
    ],
    "warnings": []
  }
}
```

## React Hook Usage

### Using the Hook:
```javascript
import { useScopeExcel } from '@/hooks/useScope';

function ExcelImportComponent({ projectId }) {
  const {
    importing,
    error,
    importFromExcel,
    canImport
  } = useScopeExcel(projectId);

  const handleFileImport = async (file) => {
    if (!canImport) {
      alert('Insufficient permissions');
      return;
    }

    try {
      const result = await importFromExcel(file);
      console.log('Import successful:', result);
      // Handle success - show success message, refresh data, etc.
    } catch (error) {
      console.error('Import failed:', error.message);
      // Handle error - show error message to user
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".xlsx,.xls"
        onChange={(e) => handleFileImport(e.target.files[0])}
        disabled={importing || !canImport}
      />
      {importing && <p>Importing...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
```

## Validation Rules

### Required Fields:
- **Category**: Must be one of the valid enum values
- **Item Name**: Cannot be empty
- **Unit**: Cannot be empty  
- **Quantity**: Must be greater than 0
- **Description**: Cannot be empty

### Optional Fields:
- **Item No**: Auto-generated if not provided
- **Item Code**: Auto-generated if not provided
- **Specification**: Can be empty
- **Location**: Can be empty
- **Supplier**: Must match existing supplier name or be empty
- **Status**: Defaults to 'pending' if not provided or invalid
- **Update**: Can be empty

### Auto-Generation:
- **Item No**: Sequential numbering per project (1, 2, 3, etc.)
- **Item Code**: Format: `ITEM-0001`, `ITEM-0002`, etc.

## Error Handling

### Validation Errors:
- Row-by-row validation with specific field errors
- File-level errors (invalid format, corrupted file)
- Project access errors (project not found, insufficient permissions)

### Error Types:
1. **File Errors**: Invalid file type, corrupted file, no worksheets
2. **Permission Errors**: Insufficient permissions, project access denied
3. **Validation Errors**: Missing required fields, invalid enum values, invalid data types
4. **Database Errors**: Transaction failures, constraint violations

## Performance Considerations

### Large File Handling:
- ✅ Supports files with 100+ rows efficiently
- ✅ Memory-efficient streaming processing
- ✅ Transaction-safe batch inserts
- ✅ Progress tracking capabilities

### Optimization Features:
- Batch database inserts for performance
- Early validation to fail fast on errors
- Supplier lookup caching
- Auto-numbering optimization

## Security Features

### Access Control:
- Role-based permissions (management, project_manager, technical_lead, purchase_manager)
- Project-level access validation
- JWT token authentication required

### Data Validation:
- File type validation (Excel files only)
- SQL injection prevention
- Input sanitization
- Transaction rollback on errors

## Testing

### Test Files Available:
1. **valid-scope-items.xlsx** - 5 valid items for successful import testing
2. **invalid-scope-items.xlsx** - 5 invalid items for validation testing  
3. **mixed-scope-items.xlsx** - Mix of valid/invalid for partial import testing
4. **large-scope-items.xlsx** - 100 items for performance testing

### Test Commands:
```bash
node create-test-excel-files.js  # Create test files
node test-excel-import.js        # Test Excel parsing
```

## Integration Points

### Database Tables:
- **scope_items**: Main scope items table
- **suppliers**: Supplier lookup table
- **projects**: Project validation
- **user_profiles**: User permissions

### Related Components:
- **ExcelImportDialog**: UI component for file upload
- **ScopeList**: Displays imported items
- **ProjectDashboard**: Shows import statistics

## Future Enhancements

### Planned Features:
- [ ] Excel template download endpoint
- [ ] Import progress tracking with WebSockets
- [ ] Undo/rollback functionality for imports
- [ ] Advanced validation rules configuration
- [ ] Bulk edit capabilities post-import

### Performance Improvements:
- [ ] Background job processing for very large files
- [ ] Import queue management
- [ ] Real-time import status updates

## Troubleshooting

### Common Issues:

1. **"Invalid file type" Error**
   - Ensure file has .xlsx or .xls extension
   - Check file is not corrupted

2. **"Project not found" Error**  
   - Verify project ID is correct
   - Check user has access to project

3. **Validation Errors**
   - Check required fields are not empty
   - Verify category/status values match enum values
   - Ensure quantities are positive numbers

4. **"Insufficient permissions" Error**
   - User must have project update permissions
   - Check user role allows scope item creation

### Debug Steps:
1. Check browser console for detailed error messages
2. Verify JWT token is valid and not expired
3. Test with smaller file first
4. Check database connectivity
5. Verify project exists and user has access

## Implementation Notes

The Excel import functionality is fully implemented and production-ready. It follows enterprise-grade patterns with:

- ✅ Comprehensive error handling
- ✅ Transaction safety
- ✅ Performance optimization
- ✅ Security best practices
- ✅ Type-safe validation
- ✅ Detailed logging and monitoring

The implementation can handle real-world usage scenarios and is ready for deployment.