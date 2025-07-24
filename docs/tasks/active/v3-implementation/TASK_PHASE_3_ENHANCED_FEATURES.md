# Task: Phase 3 - Enhanced Features & Reports

## Type: New Feature
**Priority**: High
**Effort**: 1 week  
**Subagents**: 1 (focused execution)
**Approach**: Incremental

## Request Analysis
**Original Request**: "Implement reporting system, financial tracking, and dashboard refinements"
**Objective**: Add advanced analytics and reporting capabilities to the project management system
**Over-Engineering Check**: Using standard PDF libraries, leveraging existing financial fields

## Subagent Assignment

### Week 5: Reporting & Analytics Implementation

#### Subagent E: Reporting & Analytics Specialist
```
TASK_NAME: REPORTING_FINANCIAL_IMPLEMENTATION
TASK_GOAL: Complete reporting system with PDF generation and enhanced financial tracking
REQUIREMENTS:
1. Create database tables for reports system:
   - reports table with project relationships
   - report_lines for line-by-line entries
   - report_line_photos for attachments
   - report_shares for access control
2. Implement PDF generation functionality:
   - Use standard PDF library (e.g., jsPDF or puppeteer)
   - Include company branding/headers
   - Support tables, images, and charts
   - Generate shareable links
3. Build line-by-line progress reporting:
   - Granular progress tracking
   - Photo attachments per line
   - Notes and comments support
4. Add financial tracking enhancements:
   - Add sell_price column to scope_items
   - Add group_progress_percentage to scope_items
   - Implement cost variance calculations
   - Create profit margin tracking
5. Build Excel integration:
   - Import scope items from Excel
   - Export reports to Excel format
   - Maintain formulas and formatting
6. Enhance dashboards with real data:
   - Real-time financial metrics
   - Progress visualization charts
   - Role-based dashboard views
   - Interactive drill-down capabilities
7. Create financial calculation engine:
   - Automatic cost rollups
   - Variance analysis
   - Profitability calculations
8. Ensure compilation: npm run build && npm run type-check
CONSTRAINTS:
- Follow established PDF generation patterns
- Use Kiro's performance optimizations
- Implement calculations as SQL where possible
- Ensure Excel compatibility with formulas
- Maintain sub-2s dashboard load times
DEPENDENCIES:
- Phase 2 completion (core features working)
- PDF generation library selection
- Excel parsing library (e.g., xlsx)
OUTPUT_ARTIFACTS:
- Report generation system
- PDF templates and outputs
- Financial calculation logic
- Enhanced dashboard components
- Excel import/export functionality
```

## Technical Details

### Database Schema Implementation

```sql
-- Reports System Tables
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('progress', 'financial', 'summary')),
  report_date DATE DEFAULT CURRENT_DATE,
  generated_pdf_url TEXT,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  scope_item_id UUID REFERENCES scope_items(id),
  description TEXT,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  completed_quantity NUMERIC,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_line_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_line_id UUID REFERENCES report_lines(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  taken_date TIMESTAMP,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES user_profiles(id),
  share_link TEXT UNIQUE,
  permission_level TEXT DEFAULT 'read' CHECK (permission_level IN ('read', 'comment', 'edit')),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Financial Enhancement Columns
ALTER TABLE scope_items 
ADD COLUMN sell_price NUMERIC,
ADD COLUMN group_progress_percentage INTEGER DEFAULT 0 
  CHECK (group_progress_percentage >= 0 AND group_progress_percentage <= 100);

-- Add calculated columns for financial metrics
ALTER TABLE scope_items
ADD COLUMN profit_margin NUMERIC GENERATED ALWAYS AS 
  (CASE WHEN sell_price > 0 THEN ((sell_price - actual_cost) / sell_price * 100) ELSE 0 END) STORED;
```

### PDF Generation Implementation

```typescript
// Report PDF Generation Service
export class ReportPDFGenerator {
  async generateProgressReport(reportId: string): Promise<string> {
    // Fetch report data with all relationships
    const reportData = await supabase
      .from('reports')
      .select(`
        *,
        project:projects(*),
        report_lines(
          *,
          scope_item:scope_items(*),
          photos:report_line_photos(*)
        )
      `)
      .eq('id', reportId)
      .single();

    // Generate PDF using chosen library
    const pdf = new PDFDocument({
      title: reportData.name,
      author: 'Formula PM',
      subject: `${reportData.report_type} Report`
    });

    // Add company header
    pdf.addHeader({
      logo: '/assets/company-logo.png',
      title: reportData.project.name,
      subtitle: `${reportData.report_type} Report - ${reportData.report_date}`
    });

    // Add report content
    for (const line of reportData.report_lines) {
      pdf.addSection({
        title: `Line ${line.line_number}: ${line.description}`,
        progress: line.progress_percentage,
        notes: line.notes,
        photos: line.photos.map(p => ({
          url: p.photo_url,
          caption: p.caption
        }))
      });
    }

    // Add financial summary if applicable
    if (reportData.report_type === 'financial') {
      pdf.addFinancialSummary({
        totalBudget: reportData.project.budget,
        actualCost: reportData.project.actual_cost,
        variance: calculateVariance(reportData)
      });
    }

    // Save and return URL
    const pdfUrl = await pdf.save();
    
    // Update report with PDF URL
    await supabase
      .from('reports')
      .update({ generated_pdf_url: pdfUrl })
      .eq('id', reportId);

    return pdfUrl;
  }
}
```

### Excel Integration Service

```typescript
// Excel Import/Export Service
export class ExcelIntegrationService {
  async importScopeItems(file: File, projectId: string): Promise<ImportResult> {
    const workbook = await parseExcel(file);
    const worksheet = workbook.getWorksheet('Scope');
    
    const scopeItems = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) { // Skip header
        scopeItems.push({
          project_id: projectId,
          item_no: row.getCell(1).value,
          description: row.getCell(2).value,
          quantity: row.getCell(3).value,
          unit_price: row.getCell(4).value,
          total_price: row.getCell(5).value,
          // ... map other columns
        });
      }
    });

    // Batch insert with validation
    const result = await supabase
      .from('scope_items')
      .insert(scopeItems)
      .select();

    return {
      success: true,
      imported: result.data.length,
      errors: []
    };
  }

  async exportReport(reportId: string): Promise<Buffer> {
    // Fetch complete report data
    const report = await fetchCompleteReport(reportId);
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Report');

    // Add headers
    worksheet.columns = [
      { header: 'Line #', key: 'line_number', width: 10 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Progress %', key: 'progress', width: 12 },
      { header: 'Budget', key: 'budget', width: 15 },
      { header: 'Actual', key: 'actual', width: 15 },
      { header: 'Variance', key: 'variance', width: 15, 
        style: { numFmt: '$#,##0.00;[Red]-$#,##0.00' } }
    ];

    // Add data with formulas
    report.lines.forEach(line => {
      worksheet.addRow({
        line_number: line.line_number,
        description: line.description,
        progress: line.progress_percentage,
        budget: line.scope_item.total_price,
        actual: line.scope_item.actual_cost,
        variance: { formula: `D${worksheet.lastRow.number}-E${worksheet.lastRow.number}` }
      });
    });

    // Add summary row
    const lastRow = worksheet.lastRow.number;
    worksheet.addRow({
      description: 'TOTAL',
      budget: { formula: `SUM(D2:D${lastRow})` },
      actual: { formula: `SUM(E2:E${lastRow})` },
      variance: { formula: `SUM(F2:F${lastRow})` }
    });

    return await workbook.xlsx.writeBuffer();
  }
}
```

### Dashboard Enhancement Components

```typescript
// Financial Dashboard Component
export function FinancialDashboard({ projectId }: { projectId: string }) {
  const { data: metrics } = useFinancialMetrics(projectId);
  
  return (
    <DashboardGrid>
      <MetricCard
        title="Budget vs Actual"
        value={metrics?.actualCost}
        total={metrics?.budget}
        format="currency"
        trend={calculateTrend(metrics)}
      />
      
      <ProgressChart
        title="Project Progress"
        data={metrics?.progressByCategory}
        type="radial"
      />
      
      <VarianceTable
        title="Cost Variance Analysis"
        data={metrics?.varianceByScope}
        highlight="negative"
      />
      
      <ProfitabilityGauge
        title="Profit Margin"
        current={metrics?.currentMargin}
        target={metrics?.targetMargin}
      />
    </DashboardGrid>
  );
}
```

## Success Criteria

### Core Functionality
- [ ] All 4 report tables created and functional
- [ ] PDF generation producing professional reports
- [ ] Excel import successfully parsing scope items
- [ ] Excel export maintaining formulas
- [ ] Financial calculations accurate to 2 decimal places
- [ ] Dashboard loading in under 2 seconds

### Report Features
- [ ] Line-by-line progress tracking working
- [ ] Photo attachments uploading and displaying
- [ ] PDF includes all report elements
- [ ] Shareable links with expiration working
- [ ] Report templates customizable

### Financial Features
- [ ] Cost variance calculations accurate
- [ ] Profit margins auto-calculating
- [ ] Group progress percentages working
- [ ] Financial rollups at project level
- [ ] Historical tracking implemented

### Integration Points
- [ ] Reports pulling real project data
- [ ] Financial metrics in dashboards
- [ ] Excel round-trip working
- [ ] PDF generation async/queued
- [ ] Email notifications for shared reports

## Risk Management

### Performance Risks
- **Risk**: PDF generation blocking UI
- **Mitigation**: Implement async generation with progress indicator

### Data Integrity Risks
- **Risk**: Excel import corrupting data
- **Mitigation**: Validation layer, preview before import, rollback capability

### Calculation Risks
- **Risk**: Financial calculations inconsistent
- **Mitigation**: Use SQL generated columns, comprehensive test suite

## Status Tracking (For Coordinator)

### Daily Progress
- [ ] Day 1: Database schema implementation
- [ ] Day 2: PDF generation service
- [ ] Day 3: Excel integration
- [ ] Day 4: Financial calculations
- [ ] Day 5: Dashboard enhancements
- [ ] Day 6: Integration testing
- [ ] Day 7: Performance optimization

### Feature Status
- Reports System: ___% complete
- PDF Generation: ___% complete
- Excel Integration: ___% complete
- Financial Tracking: ___% complete
- Dashboard Updates: ___% complete

### Subagent Status
- [ ] Subagent E: Reporting & Analytics - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Quality Metrics
- Test Coverage: ___%
- Performance: ___ms average
- Calculation Accuracy: ___%
- User Acceptance: ___

### Phase Completion Criteria
- [ ] All report types generating successfully
- [ ] PDF output professionally formatted
- [ ] Excel import/export fully functional
- [ ] Financial calculations verified accurate
- [ ] Dashboard performance optimized
- [ ] All tests passing (90%+ coverage)
- [ ] Documentation complete
- [ ] User training materials ready