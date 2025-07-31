# Excel Export for Scope Items - Usage Guide

## 🎯 Overview
The Excel export functionality allows users to export scope items data in a professional Excel format with advanced filtering, formatting, and multi-sheet structure.

## 📍 API Endpoint
```
GET /api/scope/excel/export
```

## 🔐 Authentication & Permissions
- **Required Permission**: `scope.read.full`
- **Allowed Roles**: management, technical_lead, purchase_manager, admin
- **Authentication**: Bearer token in Authorization header

## 🔧 Query Parameters (All Optional)

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `project_id` | UUID | Filter by specific project | `?project_id=123e4567-e89b-12d3-a456-426614174000` |
| `status` | String | Filter by scope item status | `?status=in_progress` |
| `category` | String | Filter by scope category | `?category=millwork` |
| `location` | String | Filter by location | `?location=Kitchen` |

## 📊 Excel File Structure

### Sheet 1: "Scope Items"
Professional data table with the following columns:

| Column | Description | Format |
|--------|-------------|--------|
| Item No | Sequential item number | Number |
| Category | Scope category (uppercase) | Text |
| Item Code | Item code identifier | Text |
| Item Name | Display name | Text |
| Unit | Unit of measurement | Text |
| Qty | Quantity | Number (3 decimals) |
| Specification | Technical specifications | Text (wrapped) |
| Location | Physical location | Text |
| Description | Detailed description | Text (wrapped) |
| Status | Item status (uppercase) | Text (centered) |
| Unit Price | Price per unit | Currency ($#,##0.00) |
| Total Price | Total price (calculated) | Currency ($#,##0.00) |
| Update Notes | Latest update notes | Text (wrapped) |

**Features:**
- ✅ Professional blue header with white text
- ✅ Alternating row colors (gray/white)
- ✅ All borders and proper cell formatting
- ✅ Auto-width columns optimized for readability
- ✅ Currency and number formatting
- ✅ Text wrapping for long content

### Sheet 2: "Summary"
Project overview with:
- Export date and user information
- Total item count
- Project name and details
- Total value calculation
- Status breakdown (count by status)

## 🌐 Usage Examples

### Basic Export (All Items)
```bash
curl -X GET "http://localhost:3003/api/scope/excel/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "scope_items_export.xlsx"
```

### Export by Project
```bash
curl -X GET "http://localhost:3003/api/scope/excel/export?project_id=123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "project_scope_items.xlsx"
```

### Export by Status
```bash
curl -X GET "http://localhost:3003/api/scope/excel/export?status=in_progress" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "active_scope_items.xlsx"
```

### Combined Filters
```bash
curl -X GET "http://localhost:3003/api/scope/excel/export?project_id=123&status=pending&category=electrical" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o "filtered_scope_items.xlsx"
```

## 📁 File Naming Convention
Generated files use the format:
```
Scope_Items_{PROJECT_NAME}_{YYYY-MM-DD}.xlsx
```

Examples:
- `Scope_Items_Luxury_Beverly_Hills_Estate_2025-07-31.xlsx`
- `Scope_Items_All_Projects_2025-07-31.xlsx` (when no specific project)

## ⚡ Performance Notes
- Handles large datasets efficiently with streaming
- Optimized database queries with proper indexing
- Minimal memory footprint during generation

## 🛡️ Security Features
- Full authentication and authorization
- RLS (Row Level Security) policy enforcement
- Input validation and sanitization
- Secure file generation

## 🎨 Excel Formatting Details
- **Font**: Calibri (professional standard)
- **Header**: Blue background (#4472C4), white text, bold
- **Data Rows**: 20px height, alternating colors
- **Borders**: Thin borders on all cells
- **Currency**: Proper $ formatting with thousands separator
- **Numbers**: 3-decimal precision for quantities
- **Text**: Wrapped text for long content

## 📱 Frontend Integration
To use from JavaScript/TypeScript:

```typescript
const exportScopeItems = async (filters?: {
  project_id?: string;
  status?: string;
  category?: string;
  location?: string;
}) => {
  const { getAccessToken } = useAuth();
  const token = await getAccessToken();
  
  const params = new URLSearchParams();
  if (filters?.project_id) params.append('project_id', filters.project_id);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.location) params.append('location', filters.location);
  
  const response = await fetch(`/api/scope/excel/export?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'scope_items.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } else {
    throw new Error('Export failed');
  }
};
```

## 🔍 Error Handling
The API returns appropriate HTTP status codes:

- **200**: Success - Excel file generated
- **401**: Unauthorized - Invalid or missing token
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - No scope items match filters
- **500**: Internal Server Error - Generation failed

Error responses include JSON with details:
```json
{
  "success": false,
  "error": "Failed to generate Excel export",
  "details": "Specific error message"
}
```

## ✅ Testing
The implementation has been tested with:
- ✅ Mock data generation
- ✅ Professional Excel formatting
- ✅ Multi-sheet structure
- ✅ Currency and number formatting
- ✅ File download mechanics
- ✅ Permission validation

---

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**
**Location**: `src/app/api/scope/excel/export/route.ts`
**Dependencies**: ExcelJS (already installed)
**Performance**: Optimized for production use