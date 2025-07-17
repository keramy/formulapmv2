# Role Migration Mapping

## 13-Role System → 5-Role Optimized System


### company_owner → management
- **Seniority Level**: executive
- **Approval Limits**: {
  "budget": "unlimited",
  "scope_changes": "all",
  "timeline_extensions": "unlimited",
  "resource_allocation": "unlimited"
}



### general_manager → management
- **Seniority Level**: executive
- **Approval Limits**: {
  "budget": "unlimited",
  "scope_changes": "all",
  "timeline_extensions": "unlimited",
  "resource_allocation": "unlimited"
}



### deputy_general_manager → management
- **Seniority Level**: executive
- **Approval Limits**: {
  "budget": "unlimited",
  "scope_changes": "all",
  "timeline_extensions": "unlimited",
  "resource_allocation": "unlimited"
}



### purchase_director → purchase_manager
- **Seniority Level**: senior
- **Approval Limits**: {
  "budget": 100000,
  "vendor_management": "all",
  "purchase_orders": "unlimited"
}
- **Special Permissions**: vendor_management, cost_tracking, purchase_approval


### purchase_specialist → purchase_manager
- **Seniority Level**: regular
- **Approval Limits**: {
  "budget": 25000,
  "vendor_management": "assigned",
  "purchase_orders": "standard"
}
- **Special Permissions**: purchase_processing, vendor_coordination


### technical_director → technical_lead
- **Seniority Level**: senior
- **Approval Limits**: {
  "budget": 75000,
  "scope_changes": "technical",
  "subcontractor_assignment": "all"
}
- **Special Permissions**: scope_upload, subcontractor_assignment, technical_oversight, cost_tracking


### project_manager → project_manager
- **Seniority Level**: senior
- **Approval Limits**: {
  "budget": 50000,
  "scope_changes": "major",
  "timeline_extensions": 30,
  "team_management": "full"
}
- **Special Permissions**: project_management, team_coordination, client_communication


### architect → project_manager
- **Seniority Level**: regular
- **Approval Limits**: {
  "budget": 15000,
  "scope_changes": "minor",
  "timeline_extensions": 7,
  "design_approval": "assigned_projects"
}
- **Special Permissions**: architectural_review, design_coordination, drawing_approval


### technical_engineer → project_manager
- **Seniority Level**: regular
- **Approval Limits**: {
  "budget": 15000,
  "scope_changes": "minor",
  "timeline_extensions": 7,
  "technical_specs": "assigned_projects"
}
- **Special Permissions**: technical_specs, quality_control, progress_tracking


### field_worker → project_manager
- **Seniority Level**: regular
- **Approval Limits**: {
  "budget": 5000,
  "scope_changes": "none",
  "timeline_extensions": 3,
  "field_updates": "assigned_tasks"
}
- **Special Permissions**: field_updates, photo_upload, progress_reporting, task_management


### client → client
- **Seniority Level**: standard
- **Approval Limits**: {
  "document_approval": "assigned_projects",
  "report_access": "assigned_projects"
}
- **Special Permissions**: project_visibility, document_review, progress_view


### subcontractor → DATABASE_ENTITY
- **Seniority Level**: undefined
- **Approval Limits**: undefined

- **Conversion Type**: user_to_entity

### admin → admin
- **Seniority Level**: system
- **Approval Limits**: {
  "system_admin": "unlimited",
  "user_management": "all",
  "technical_support": "all"
}
- **Special Permissions**: system_admin, user_management, technical_support



## Migration Statistics
- **Total Role Reduction**: 13 → 5 (62% reduction)
- **Management Consolidation**: 3 → 1
- **Purchase Consolidation**: 2 → 1  
- **Project Management Consolidation**: 4 → 1 (with hierarchy)
- **Subcontractor Conversion**: Users → Database Entities
- **Client Simplification**: Maintained but simplified

## Expected Performance Improvements
- **Response Time**: 262ms → 180ms (31% improvement)
- **RLS Policies**: 45 → 15 (67% reduction)
- **Field Worker Performance**: 542ms → ~200ms (63% improvement)
