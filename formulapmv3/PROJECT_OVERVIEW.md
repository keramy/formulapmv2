# Formula PM 3.0 - Project Overview

## 📋 Project Context

Formula PM 3.0 is a complete rebuild focusing on simplicity, performance, and flexibility. We're keeping the excellent database schema from v2 but rebuilding the application layer with clean, modern patterns.

**Key Problems We're Solving:**
- V2's over-engineering issues (448-line useAuth hook, complex abstractions)
- Inflexible role-based permissions requiring code deployments
- Slow navigation between features
- Complex codebase that's hard to maintain

**Target Users:**
- Construction teams in the field
- Project managers
- Architects and engineers  
- Clients needing project visibility
- Company administrators

## 🎯 Success Criteria

- **Performance**: Navigation < 500ms between pages, initial load < 2 seconds
- **Flexibility**: Admin-configurable permissions without code changes
- **Usability**: Professional UI for clients, mobile-ready for field workers
- **Maintainability**: Simple codebase (no function > 50 lines)
- **Reliability**: Works on construction site internet connections

## ✨ Core Features

### Must Have (v3.0)
1. **Dashboard** - Role-specific dashboards with key metrics
2. **Projects** - Project workspace foundation
3. **Scope Management** - Scope items with subcontractor assignments + Excel import/export
4. **Shop Drawings** - Complete approval workflow system
5. **Material Specs** - Material specifications with approval workflow
6. **Tasks** - Task management with comments
7. **Timeline/Gantt** - Visual timeline creation and tracking
8. **Milestones** - Project milestone tracking
9. **RFIs** - Request for Information workflow
10. **Change Orders** - Change order management
11. **QC/Punch Lists** - Quality control and punch list tracking
12. **Subcontractors/Suppliers** - Manage and assign to scope items
13. **Clients** - Client management and portal access
14. **Notifications** - System notifications for workflow updates
15. **Activity Logs** - Complete audit trail
16. **Reports** - Project and construction reports

### Future (v3.1+)
- Invoicing and Billing
- Purchase Orders
- Advanced Analytics

### NOT Building
- Labor/timesheet tracking
- Safety/incident management
- Equipment tracking
- Complex third-party integrations
- Offline mode

## 🚀 Development Principles

1. **SIMPLE over complex** - If it takes more than 50 lines, it's too complex
2. **FAST navigation** - Every page transition under 500ms
3. **FLEXIBLE permissions** - Admins configure access without touching code
4. **CONSTRUCTION-FOCUSED** - Built for real construction workflows
5. **MOBILE-FIRST** - Field workers are primary users

## 📊 Key Innovation

**Dynamic Permission System**: Revolutionary approach where job titles are descriptive text only, while a permissions array controls actual access. This gives construction companies ultimate flexibility to customize access patterns without code changes.

Example:
- Same "Project Manager" title can have different permissions per company
- Admins can create custom permission sets through UI
- No more fixed roles that require development work to modify

## 🎯 What Makes v3 Different

- **From v2's Complexity**: 448-line hooks → Multiple focused 30-line hooks
- **From Generic PM Tools**: Construction-specific workflows built-in
- **From Fixed Systems**: Complete permission flexibility via admin panel
- **From Slow Navigation**: Instant tab switching with smart caching
- **From Desktop-First**: Mobile-optimized for construction sites

---

*Last Updated: January 2025*
*Status: Planning Phase*
*Next Step: Architecture & Technology Stack*