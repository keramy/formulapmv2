| tablename                    | policyname                                       | issue                    | policy_excerpt                                                                                          |
| ---------------------------- | ------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------- |
| activity_logs                | Users can view activity logs they have access to | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| activity_summary             | PM can view project activity                     | Still needs optimization | (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = activity_summary.project_id) AND (p.project_m... |
| activity_summary             | Users can view own activity                      | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| approval_requests            | Approval request access                          | Still needs optimization | (is_management() OR (requested_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (current_approv... |
| approval_workflows           | Approver workflow access                         | Still needs optimization | ((approver_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (delegated_to = ( SELECT ( SELECT a... |
| approval_workflows           | Purchase request workflow visibility             | Still needs optimization | (EXISTS ( SELECT 1
   FROM purchase_requests pr
  WHERE ((pr.id = approval_workflows.purchase_reques... |
| audit_logs                   | Users can view own audit logs                    | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| client_activity_log          | client_activity_log_internal_view                | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_activity_log          | client_activity_log_own_access                   | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_communication_threads | client_communication_threads_internal_manage     | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_communication_threads | client_communication_threads_participant_access  | Still needs optimization | ((client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile... |
| client_companies             | client_companies_client_access                   | Still needs optimization | (id IN ( SELECT client_users.client_company_id
   FROM client_users
  WHERE (client_users.user_profi... |
| client_companies             | client_companies_internal_access                 | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_document_access       | client_document_access_internal_manage           | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_document_access       | client_document_access_own_access                | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_document_approvals    | client_document_approvals_internal_view          | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_document_approvals    | client_document_approvals_own_access             | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_document_comments     | client_document_comments_internal_view           | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_document_comments     | client_document_comments_own_access              | Still needs optimization | ((client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile... |
| client_messages              | client_messages_participant_access               | Still needs optimization | (EXISTS ( SELECT 1
   FROM client_communication_threads cct
  WHERE ((cct.id = client_messages.threa... |
| client_notifications         | client_notifications_internal_manage             | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_notifications         | client_notifications_own_access                  | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_notifications         | client_notifications_own_update                  | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_permissions           | client_permissions_internal_manage               | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_permissions           | client_permissions_own_access                    | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_project_access        | client_project_access_internal_manage            | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_project_access        | client_project_access_own_access                 | Still needs optimization | (client_user_id IN ( SELECT client_users.id
   FROM client_users
  WHERE (client_users.user_profile_... |
| client_users                 | client_users_internal_access                     | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| client_users                 | client_users_own_access                          | Still needs optimization | (user_profile_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                     |
| clients                      | Client data access                               | Still needs optimization | (is_management() OR (is_project_manager() AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.clie... |
| delivery_confirmations       | Field worker delivery confirmation               | Still needs optimization | ((confirmed_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM (((user... |
| document_approvals           | Client approval access                           | Still needs optimization | ((approver_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM document... |
| documents                    | Field worker own documents                       | Still needs optimization | ((uploaded_by = ( SELECT auth.uid() AS uid)) AND ((( SELECT auth.jwt() AS jwt) ->> 'user_role'::text... |
| documents                    | Subcontractor document access                    | Still needs optimization | ((((( SELECT auth.jwt() AS jwt) ->> 'user_role'::text) = 'subcontractor'::text) AND (EXISTS ( SELECT... |
| field_photos                 | Field photo project access                       | Still needs optimization | (is_management_role() OR has_project_access(project_id) OR (uploaded_by = ( SELECT ( SELECT auth.uid... |
| field_reports                | Field worker own reports                         | Still needs optimization | (submitted_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                        |
| invoice_items                | Invoice items access follows invoice             | Still needs optimization | (EXISTS ( SELECT 1
   FROM invoices i
  WHERE ((i.id = invoice_items.invoice_id) AND (is_management_... |
| invoices                     | Client invoice access                            | Still needs optimization | ((invoice_type = 'client'::text) AND (EXISTS ( SELECT 1
   FROM clients c
  WHERE ((c.id = invoices.... |
| invoices                     | Finance team invoice access                      | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| invoices                     | PM invoice read access                           | Still needs optimization | (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = invoices.project_id) AND (p.project_manager_i... |
| messages                     | Users access own messages                        | Still needs optimization | ((sender_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (recipient_id = ( SELECT ( SELECT aut... |
| mobile_devices               | Admin manage all devices                         | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| mobile_devices               | Users manage own devices                         | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| mobile_sync_queue            | Users manage own sync queue                      | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| notifications                | Users manage own notifications                   | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| payments                     | Finance payment access                           | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| permission_templates         | Admin permission template access                 | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| project_assignments          | Assignment management                            | Still needs optimization | (is_management() OR (is_project_manager() AND ((user_id = ( SELECT ( SELECT auth.uid() AS uid) AS ui... |
| project_assignments          | User assignment access                           | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| project_budgets              | PM budget read access                            | Still needs optimization | (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = project_budgets.project_id) AND (p.project_ma... |
| project_budgets              | Technical budget access                          | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| projects                     | Client project access                            | Still needs optimization | (is_client() AND (client_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)))...                         |
| projects                     | PM project access                                | Still needs optimization | (is_project_manager() AND ((project_manager_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (E... |
| projects                     | projects_delete_optimized                        | Still needs optimization | ((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text,... |
| projects                     | projects_select_optimized                        | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| projects                     | projects_update_optimized                        | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| purchase_orders              | Project team purchase order read                 | Still needs optimization | (EXISTS ( SELECT 1
   FROM purchase_requests pr
  WHERE ((pr.id = purchase_orders.purchase_request_i... |
| purchase_orders              | Purchase order creator access                    | Still needs optimization | (created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                          |
| purchase_orders              | Purchase order modification protection           | Still needs optimization | (is_management_role() OR has_purchase_department_access() OR (created_by = ( SELECT ( SELECT auth.ui... |
| purchase_requests            | Field worker purchase request read               | Still needs optimization | (EXISTS ( SELECT 1
   FROM (user_profiles up
     JOIN project_assignments pa ON ((pa.user_id = up.i... |
| purchase_requests            | Project team purchase request read               | Still needs optimization | (has_project_access(project_id) AND (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles... |
| purchase_requests            | Purchase request deletion restriction            | Still needs optimization | ((is_management_role() OR (requester_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))) AND (status... |
| purchase_requests            | Purchase request status protection               | Still needs optimization | (is_management_role() OR has_purchase_department_access() OR ((requester_id = ( SELECT ( SELECT auth... |
| purchase_requests            | Requester own purchase request access            | Still needs optimization | ((requester_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) AND ((status = 'draft'::request_statu... |
| scope_items                  | Client scope access                              | Still needs optimization | (is_client() AND (EXISTS ( SELECT 1
   FROM projects p
  WHERE ((p.id = scope_items.project_id) AND ... |
| scope_items                  | PM scope access                                  | Still needs optimization | (is_project_manager() AND (EXISTS ( SELECT 1
   FROM project_assignments pa
  WHERE ((pa.project_id ... |
| scope_items                  | scope_items_delete_optimized                     | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| scope_items                  | scope_items_select_optimized                     | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| scope_items                  | scope_items_update_optimized                     | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| scope_material_links         | Project managers can update scope material links | Still needs optimization | (EXISTS ( SELECT 1
   FROM (scope_items si
     JOIN projects p ON ((si.project_id = p.id)))
  WHERE... |
| scope_material_links         | Project owners can delete scope material links   | Still needs optimization | (EXISTS ( SELECT 1
   FROM (scope_items si
     JOIN projects p ON ((si.project_id = p.id)))
  WHERE... |
| scope_material_links         | Users can view scope material links              | Still needs optimization | (EXISTS ( SELECT 1
   FROM (scope_items si
     JOIN projects p ON ((si.project_id = p.id)))
  WHERE... |
| shop_drawing_revisions       | Drawing revision access follows drawing          | Still needs optimization | (EXISTS ( SELECT 1
   FROM shop_drawings sd
  WHERE ((sd.id = shop_drawing_revisions.shop_drawing_id... |
| shop_drawings                | Architect shop drawing management                | Still needs optimization | ((assigned_architect = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (created_by = ( SELECT ( SEL... |
| subcontractor_assignments    | Subcontractor assignment access                  | Still needs optimization | (is_management() OR is_technical_lead() OR (is_project_manager() AND (EXISTS ( SELECT 1
   FROM proj... |
| subcontractor_reports        | Project managers can view project reports        | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| subcontractor_reports        | Subcontractors can view own reports              | Still needs optimization | (subcontractor_id IN ( SELECT subcontractor_users.id
   FROM subcontractor_users
  WHERE (subcontrac... |
| subcontractor_scope_access   | Project managers can manage scope access         | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| subcontractor_scope_access   | Subcontractors can view assigned documents       | Still needs optimization | (subcontractor_id IN ( SELECT subcontractor_users.id
   FROM subcontractor_users
  WHERE (subcontrac... |
| subcontractor_users          | Admins can update subcontractor profiles         | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| subcontractor_users          | Internal users can view subcontractor profiles   | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| subcontractor_users          | Subcontractors can view own profile              | Still needs optimization | (user_profile_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                     |
| subcontractors               | PM subcontractor access                          | Still needs optimization | (is_project_manager() AND (EXISTS ( SELECT 1
   FROM (subcontractor_assignments sa
     JOIN project... |
| suppliers                    | Management supplier access                       | Still needs optimization | (is_management_role() OR ((( SELECT auth.jwt() AS jwt) ->> 'user_role'::text) = ANY (ARRAY['purchase... |
| suppliers                    | Project managers can manage suppliers            | Still needs optimization | (( SELECT ( SELECT auth.uid() AS uid) AS uid) IN ( SELECT user_profiles.id
   FROM user_profiles
  W... |
| suppliers                    | Project team supplier read                       | Still needs optimization | ((( SELECT auth.jwt() AS jwt) ->> 'user_role'::text) = ANY (ARRAY['project_manager'::text, 'technica... |
| system_settings              | Admin settings access                            | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| task_comments                | Task comment access follows task access          | Still needs optimization | (EXISTS ( SELECT 1
   FROM tasks t
  WHERE ((t.id = task_comments.task_id) AND (is_management_role()... |
| tasks                        | Assigned user task access                        | Still needs optimization | ((assigned_to = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (assigned_by = ( SELECT ( SELECT au... |
| tasks                        | tasks_delete_optimized                           | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| tasks                        | tasks_select_optimized                           | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| tasks                        | tasks_update_optimized                           | Still needs optimization | (((( SELECT ( SELECT auth.jwt() AS jwt) AS jwt) ->> 'role'::text) = ANY (ARRAY['company_owner'::text... |
| tender_items                 | Tender items access follows tender               | Still needs optimization | (EXISTS ( SELECT 1
   FROM tenders t
  WHERE ((t.id = tender_items.tender_id) AND (is_management_rol... |
| tender_submissions           | Supplier own submission                          | Still needs optimization | (EXISTS ( SELECT 1
   FROM suppliers s
  WHERE ((s.id = tender_submissions.supplier_id) AND (s.creat... |
| tender_submissions           | Technical submission access                      | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| tenders                      | Technical tender access                          | Still needs optimization | (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELECT ( SELECT auth.uid() A... |
| user_dashboard_settings      | User dashboard settings                          | Still needs optimization | (user_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                             |
| user_profiles                | User profile access                              | Still needs optimization | ((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR (EXISTS ( SELECT 1
   FROM (project_assignme... |
| user_profiles                | user_profiles_select_optimized                   | Still needs optimization | ((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((( SELECT ( SELECT auth.jwt() AS jwt) AS jw... |
| user_profiles                | user_profiles_update_optimized                   | Still needs optimization | ((id = ( SELECT ( SELECT auth.uid() AS uid) AS uid)) OR ((( SELECT ( SELECT auth.jwt() AS jwt) AS jw... |
| vendor_ratings               | Project manager vendor rating                    | Still needs optimization | (EXISTS ( SELECT 1
   FROM (user_profiles up
     JOIN projects p ON ((p.project_manager_id = up.id)... |
| vendor_ratings               | Rater own vendor rating access                   | Still needs optimization | (rater_id = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                            |
| vendor_ratings               | Team member vendor rating read                   | Still needs optimization | (has_project_access(project_id) AND (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles... |
| vendors                      | Project team vendor read access                  | Still needs optimization | ((is_active = true) AND (EXISTS ( SELECT 1
   FROM user_profiles
  WHERE ((user_profiles.id = ( SELE... |
| vendors                      | Vendor creator access                            | Still needs optimization | (created_by = ( SELECT ( SELECT auth.uid() AS uid) AS uid))...                                          |
| vendors                      | Vendor deactivation restriction                  | Still needs optimization | (is_management_role() OR (has_purchase_department_access() AND (created_by = ( SELECT ( SELECT auth.... |