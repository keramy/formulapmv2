/**
 * Formula PM 2.0 Database Type Definitions
 * Generated from database schema - Wave 1 Foundation
 * 
 * This file contains all TypeScript type definitions for the database schema
 * ensuring type safety across the application.
 */

// ============================================================================
// ENUMS AND TYPES
// ============================================================================

export type UserRole = 
  | 'company_owner'
  | 'general_manager'
  | 'deputy_general_manager'
  | 'technical_director'
  | 'admin'
  | 'project_manager'
  | 'architect'
  | 'technical_engineer'
  | 'purchase_director'
  | 'purchase_specialist'
  | 'field_worker'
  | 'client'
  | 'subcontractor';

export type ProjectStatus = 
  | 'planning'
  | 'bidding'
  | 'active'
  | 'on_hold'
  | 'completed'
  | 'cancelled';

export type ScopeCategory = 
  | 'construction'
  | 'millwork'
  | 'electrical'
  | 'mechanical';

export type ScopeStatus = 
  | 'not_started'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export type DocumentType = 
  | 'shop_drawing'
  | 'material_spec'
  | 'contract'
  | 'report'
  | 'photo'
  | 'other';

export type DocumentStatus = 
  | 'draft'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'revision_required';

export type ApproverType = 'internal' | 'client';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type DependencyType = 'blocks' | 'requires' | 'related';

// Purchase Department Types
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'emergency';
export type RequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled';
export type PoStatus = 'draft' | 'sent' | 'confirmed' | 'delivered' | 'completed' | 'cancelled';
export type PurchaseApprovalStatus = 'pending' | 'approved' | 'rejected' | 'delegated';
export type DeliveryStatus = 'pending' | 'partial' | 'completed' | 'damaged' | 'rejected';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface UserProfile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  department?: string;
  hire_date?: string;
  is_active: boolean;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id?: string;
  company_name: string;
  contact_person: string;
  billing_address?: string;
  project_preferences: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  specializations: string[];
  performance_rating: number;
  is_approved: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  project_manager_id?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost: number;
  location?: string;
  project_type?: string;
  priority: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  responsibilities: string[];
  assigned_by?: string;
  assigned_at: string;
  is_active: boolean;
}

export interface ScopeItem {
  id: string;
  project_id: string;
  category: ScopeCategory;
  
  // Core Business Fields
  item_no: number;
  item_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number; // Computed field
  
  // Cost Tracking (Restricted Access)
  initial_cost?: number;
  actual_cost?: number;
  cost_variance?: number; // Computed field
  
  // Additional Fields
  title?: string;
  specifications?: string;
  unit_of_measure?: string;
  markup_percentage: number;
  final_price: number; // Computed field
  
  timeline_start?: string;
  timeline_end?: string;
  duration_days?: number;
  progress_percentage: number;
  status: ScopeStatus;
  assigned_to: string[];
  supplier_id?: string;
  dependencies: string[];
  priority: number;
  metadata: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScopeDependency {
  id: string;
  scope_item_id: string;
  depends_on_id: string;
  dependency_type: DependencyType;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  scope_item_id?: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  version: number;
  status: DocumentStatus;
  is_client_visible: boolean;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  approver_id?: string;
  approver_type: ApproverType;
  status: ApprovalStatus;
  comments?: string;
  approved_at?: string;
  version: number;
  created_at: string;
}

// ============================================================================
// PURCHASE DEPARTMENT INTERFACES
// ============================================================================

export interface Vendor {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
  performance_rating: number;
  specializations: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequest {
  id: string;
  project_id: string;
  requester_id: string;
  request_number: string;
  item_description: string;
  quantity: number;
  unit_of_measure: string;
  estimated_cost?: number;
  required_date: string;
  urgency_level: UrgencyLevel;
  justification?: string;
  status: RequestStatus;
  budget_code?: string;
  cost_center?: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  purchase_request_id: string;
  po_number: string;
  vendor_id: string;
  total_amount: number;
  po_date: string;
  expected_delivery_date?: string;
  status: PoStatus;
  terms_conditions?: string;
  email_sent_at?: string;
  phone_confirmed_at?: string;
  phone_confirmed_by?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VendorRating {
  id: string;
  vendor_id: string;
  project_id: string;
  purchase_order_id?: string;
  rater_id: string;
  quality_score: number;
  delivery_score: number;
  communication_score: number;
  overall_score: number;
  comments?: string;
  created_at: string;
}

export interface PurchaseApprovalWorkflow {
  id: string;
  purchase_request_id: string;
  approver_role: UserRole;
  approver_id?: string;
  approval_status: PurchaseApprovalStatus;
  approval_date?: string;
  comments?: string;
  sequence_order: number;
  delegated_to?: string;
  delegated_at?: string;
  created_at: string;
}

export interface DeliveryConfirmation {
  id: string;
  purchase_order_id: string;
  confirmed_by: string;
  delivery_date: string;
  quantity_received: number;
  quantity_ordered: number;
  condition_notes?: string;
  photos: string[];
  status: DeliveryStatus;
  quality_assessment?: string;
  damage_reported: boolean;
  rejection_reason?: string;
  created_at: string;
}

// ============================================================================
// CLIENT PORTAL INTERFACES
// ============================================================================

export interface ClientCompany {
  id: string;
  company_name: string;
  company_type: ClientCompanyType;
  contact_person?: string;
  primary_email?: string;
  primary_phone?: string;
  address?: string;
  billing_address?: string;
  tax_id?: string;
  is_active: boolean;
  logo_url?: string;
  brand_colors?: Record<string, any>;
  custom_domain?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientUser {
  id: string;
  user_profile_id: string;
  client_company_id: string;
  access_level: ClientAccessLevel;
  portal_access_enabled: boolean;
  last_login?: string;
  login_attempts: number;
  account_locked: boolean;
  password_reset_required: boolean;
  two_factor_enabled: boolean;
  notification_preferences: Record<string, any>;
  language: string;
  timezone: string;
  theme: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_activity?: string;
}

export interface ClientProjectAccess {
  id: string;
  client_user_id: string;
  project_id: string;
  access_level: ClientProjectAccessLevel;
  can_view_financials: boolean;
  can_approve_documents: boolean;
  can_view_schedules: boolean;
  can_access_reports: boolean;
  restricted_areas?: string[];
  access_start_date?: string;
  access_end_date?: string;
  granted_by: string;
  granted_at: string;
  last_accessed?: string;
}

export interface ClientPermission {
  id: string;
  client_user_id: string;
  permission_type: ClientPermissionType;
  resource_type: string;
  resource_id?: string;
  project_specific: boolean;
  allowed_actions: string[];
  conditions: Record<string, any>;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface ClientDocumentAccess {
  id: string;
  client_user_id: string;
  document_id: string;
  access_type: ClientDocumentAccessType;
  can_download: boolean;
  can_comment: boolean;
  can_approve: boolean;
  watermarked: boolean;
  first_accessed?: string;
  last_accessed?: string;
  view_count: number;
  download_count: number;
  granted_by: string;
  granted_at: string;
}

export interface ClientDocumentApproval {
  id: string;
  client_user_id: string;
  document_id: string;
  approval_decision: ClientApprovalDecision;
  approval_date: string;
  approval_comments?: string;
  approval_conditions?: string[];
  digital_signature?: Record<string, any>;
  document_version: number;
  revision_letter?: string;
  is_final: boolean;
  superseded_by?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export interface ClientDocumentComment {
  id: string;
  client_user_id: string;
  document_id: string;
  comment_text: string;
  comment_type: ClientCommentType;
  priority: ClientPriority;
  page_number?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  markup_data?: Record<string, any>;
  status: ClientCommentStatus;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface ClientNotification {
  id: string;
  client_user_id: string;
  project_id?: string;
  title: string;
  message: string;
  notification_type: ClientNotificationType;
  priority: ClientPriority;
  delivery_method: ClientDeliveryMethod[];
  email_sent: boolean;
  sms_sent: boolean;
  is_read: boolean;
  read_at?: string;
  dismissed: boolean;
  dismissed_at?: string;
  created_at: string;
  scheduled_for: string;
  sent_at?: string;
}

export interface ClientActivityLog {
  id: string;
  client_user_id: string;
  project_id?: string;
  activity_type: ClientActivityType;
  resource_type?: string;
  resource_id?: string;
  action_taken: string;
  description?: string;
  metadata: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
}

export interface ClientCommunicationThread {
  id: string;
  project_id: string;
  client_user_id: string;
  subject: string;
  thread_type: ClientThreadType;
  priority: ClientPriority;
  status: ClientThreadStatus;
  internal_participants: string[];
  client_participants: string[];
  auto_close_after_days?: number;
  requires_response: boolean;
  response_deadline?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  closed_at?: string;
  closed_by?: string;
}

export interface ClientMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message_body: string;
  message_type: ClientMessageType;
  attachments: Record<string, any>[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ============================================================================
// JOINED INTERFACES FOR COMPLEX QUERIES
// ============================================================================

export interface ProjectWithDetails extends Project {
  client?: Client;
  project_manager?: UserProfile;
  assignments?: ProjectAssignment[];
  scope_items_count?: number;
  documents_count?: number;
}

export interface ScopeItemWithDetails extends ScopeItem {
  project?: Project;
  supplier?: Supplier;
  assigned_users?: UserProfile[];
  documents?: Document[];
}

export interface DocumentWithDetails extends Document {
  project?: Project;
  scope_item?: ScopeItem;
  uploaded_by_user?: UserProfile;
  approvals?: DocumentApproval[];
}

export interface UserProfileWithDetails extends UserProfile {
  client_info?: Client;
  assigned_projects?: ProjectAssignment[];
  managed_projects?: Project[];
}

// Purchase Department Complex Interfaces
export interface PurchaseRequestWithDetails extends PurchaseRequest {
  project?: Project;
  requester?: UserProfile;
  approval_workflows?: PurchaseApprovalWorkflow[];
  purchase_order?: PurchaseOrder;
}

export interface PurchaseOrderWithDetails extends PurchaseOrder {
  purchase_request?: PurchaseRequestWithDetails;
  vendor?: Vendor;
  delivery_confirmations?: DeliveryConfirmation[];
  created_by_user?: UserProfile;
  phone_confirmed_by_user?: UserProfile;
}

export interface VendorWithDetails extends Vendor {
  ratings?: VendorRating[];
  purchase_orders?: PurchaseOrder[];
  created_by_user?: UserProfile;
  average_rating?: number;
  total_orders?: number;
}

export interface DeliveryConfirmationWithDetails extends DeliveryConfirmation {
  purchase_order?: PurchaseOrderWithDetails;
  confirmed_by_user?: UserProfile;
}

// Client Portal Complex Interfaces
export interface ClientUserWithDetails extends ClientUser {
  user_profile?: UserProfile;
  client_company?: ClientCompany;
  project_access?: ClientProjectAccess[];
  permissions?: ClientPermission[];
  recent_activity?: ClientActivityLog[];
}

export interface ClientProjectAccessWithDetails extends ClientProjectAccess {
  client_user?: ClientUserWithDetails;
  project?: Project;
  granted_by_user?: UserProfile;
}

export interface ClientDocumentAccessWithDetails extends ClientDocumentAccess {
  client_user?: ClientUserWithDetails;
  document?: DocumentWithDetails;
  granted_by_user?: UserProfile;
}

export interface ClientDocumentApprovalWithDetails extends ClientDocumentApproval {
  client_user?: ClientUserWithDetails;
  document?: DocumentWithDetails;
  superseded_by_approval?: ClientDocumentApproval;
}

export interface ClientDocumentCommentWithDetails extends ClientDocumentComment {
  client_user?: ClientUserWithDetails;
  document?: DocumentWithDetails;
  parent_comment?: ClientDocumentComment;
  replies?: ClientDocumentComment[];
  resolved_by_user?: UserProfile;
}

export interface ClientNotificationWithDetails extends ClientNotification {
  client_user?: ClientUserWithDetails;
  project?: Project;
}

export interface ClientCommunicationThreadWithDetails extends ClientCommunicationThread {
  client_user?: ClientUserWithDetails;
  project?: Project;
  messages?: ClientMessage[];
  internal_participant_users?: UserProfile[];
  client_participant_users?: ClientUser[];
  closed_by_user?: UserProfile;
}

export interface ClientMessageWithDetails extends ClientMessage {
  thread?: ClientCommunicationThreadWithDetails;
  sender_user?: UserProfile;
}

// ============================================================================
// CREATE/UPDATE INTERFACES
// ============================================================================

export interface CreateUserProfile {
  id: string; // From auth.users
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: string;
  department?: string;
  hire_date?: string;
  is_active?: boolean;
  permissions?: Record<string, any>;
}

export interface UpdateUserProfile {
  role?: UserRole;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  company?: string;
  department?: string;
  hire_date?: string;
  is_active?: boolean;
  permissions?: Record<string, any>;
}

export interface CreateProject {
  name: string;
  description?: string;
  client_id?: string;
  project_manager_id?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  location?: string;
  project_type?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UpdateProject {
  name?: string;
  description?: string;
  client_id?: string;
  project_manager_id?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
  location?: string;
  project_type?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface CreateScopeItem {
  project_id: string;
  category: ScopeCategory;
  item_code?: string;
  description: string;
  quantity: number;
  unit_price: number;
  initial_cost?: number;
  specifications?: string;
  unit_of_measure?: string;
  markup_percentage?: number;
  timeline_start?: string;
  timeline_end?: string;
  duration_days?: number;
  status?: ScopeStatus;
  assigned_to?: string[];
  supplier_id?: string;
  dependencies?: string[];
  priority?: number;
  metadata?: Record<string, any>;
}

export interface UpdateScopeItem {
  category?: ScopeCategory;
  item_code?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
  initial_cost?: number;
  actual_cost?: number;
  specifications?: string;
  unit_of_measure?: string;
  markup_percentage?: number;
  timeline_start?: string;
  timeline_end?: string;
  duration_days?: number;
  progress_percentage?: number;
  status?: ScopeStatus;
  assigned_to?: string[];
  supplier_id?: string;
  dependencies?: string[];
  priority?: number;
  metadata?: Record<string, any>;
}

export interface CreateDocument {
  project_id: string;
  scope_item_id?: string;
  document_type: DocumentType;
  title: string;
  description?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  version?: number;
  status?: DocumentStatus;
  is_client_visible?: boolean;
}

export interface UpdateDocument {
  scope_item_id?: string;
  document_type?: DocumentType;
  title?: string;
  description?: string;
  file_path?: string;
  file_size?: number;
  mime_type?: string;
  version?: number;
  status?: DocumentStatus;
  is_client_visible?: boolean;
}

// Purchase Department Create/Update Interfaces
export interface CreateVendor {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active?: boolean;
  specializations?: string[];
}

export interface UpdateVendor {
  company_name?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  is_active?: boolean;
  specializations?: string[];
}

export interface CreatePurchaseRequest {
  project_id: string;
  item_description: string;
  quantity: number;
  unit_of_measure: string;
  estimated_cost?: number;
  required_date: string;
  urgency_level?: UrgencyLevel;
  justification?: string;
  budget_code?: string;
  cost_center?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePurchaseRequest {
  item_description?: string;
  quantity?: number;
  unit_of_measure?: string;
  estimated_cost?: number;
  required_date?: string;
  urgency_level?: UrgencyLevel;
  justification?: string;
  status?: RequestStatus;
  budget_code?: string;
  cost_center?: string;
  metadata?: Record<string, any>;
}

export interface CreatePurchaseOrder {
  purchase_request_id: string;
  vendor_id: string;
  total_amount: number;
  po_date: string;
  expected_delivery_date?: string;
  terms_conditions?: string;
}

export interface UpdatePurchaseOrder {
  vendor_id?: string;
  total_amount?: number;
  po_date?: string;
  expected_delivery_date?: string;
  status?: PoStatus;
  terms_conditions?: string;
  email_sent_at?: string;
  phone_confirmed_at?: string;
  phone_confirmed_by?: string;
}

export interface CreateVendorRating {
  vendor_id: string;
  project_id: string;
  purchase_order_id?: string;
  quality_score: number;
  delivery_score: number;
  communication_score: number;
  overall_score: number;
  comments?: string;
}

export interface CreateDeliveryConfirmation {
  purchase_order_id: string;
  delivery_date: string;
  quantity_received: number;
  quantity_ordered: number;
  condition_notes?: string;
  photos?: string[];
  status?: DeliveryStatus;
  quality_assessment?: string;
  damage_reported?: boolean;
  rejection_reason?: string;
}

export interface UpdateDeliveryConfirmation {
  delivery_date?: string;
  quantity_received?: number;
  condition_notes?: string;
  photos?: string[];
  status?: DeliveryStatus;
  quality_assessment?: string;
  damage_reported?: boolean;
  rejection_reason?: string;
}

// Client Portal Create/Update Interfaces
export interface CreateClientCompany {
  company_name: string;
  company_type: ClientCompanyType;
  contact_person?: string;
  primary_email?: string;
  primary_phone?: string;
  address?: string;
  billing_address?: string;
  tax_id?: string;
  is_active?: boolean;
  logo_url?: string;
  brand_colors?: Record<string, any>;
  custom_domain?: string;
}

export interface UpdateClientCompany {
  company_name?: string;
  company_type?: ClientCompanyType;
  contact_person?: string;
  primary_email?: string;
  primary_phone?: string;
  address?: string;
  billing_address?: string;
  tax_id?: string;
  is_active?: boolean;
  logo_url?: string;
  brand_colors?: Record<string, any>;
  custom_domain?: string;
}

export interface CreateClientUser {
  user_profile_id: string;
  client_company_id: string;
  access_level?: ClientAccessLevel;
  portal_access_enabled?: boolean;
  password_reset_required?: boolean;
  two_factor_enabled?: boolean;
  notification_preferences?: Record<string, any>;
  language?: string;
  timezone?: string;
  theme?: string;
  created_by: string;
}

export interface UpdateClientUser {
  access_level?: ClientAccessLevel;
  portal_access_enabled?: boolean;
  login_attempts?: number;
  account_locked?: boolean;
  password_reset_required?: boolean;
  two_factor_enabled?: boolean;
  notification_preferences?: Record<string, any>;
  language?: string;
  timezone?: string;
  theme?: string;
  last_activity?: string;
}

export interface CreateClientProjectAccess {
  client_user_id: string;
  project_id: string;
  access_level?: ClientProjectAccessLevel;
  can_view_financials?: boolean;
  can_approve_documents?: boolean;
  can_view_schedules?: boolean;
  can_access_reports?: boolean;
  restricted_areas?: string[];
  access_start_date?: string;
  access_end_date?: string;
  granted_by: string;
}

export interface UpdateClientProjectAccess {
  access_level?: ClientProjectAccessLevel;
  can_view_financials?: boolean;
  can_approve_documents?: boolean;
  can_view_schedules?: boolean;
  can_access_reports?: boolean;
  restricted_areas?: string[];
  access_start_date?: string;
  access_end_date?: string;
  last_accessed?: string;
}

export interface CreateClientDocumentAccess {
  client_user_id: string;
  document_id: string;
  access_type?: ClientDocumentAccessType;
  can_download?: boolean;
  can_comment?: boolean;
  can_approve?: boolean;
  watermarked?: boolean;
  granted_by: string;
}

export interface UpdateClientDocumentAccess {
  access_type?: ClientDocumentAccessType;
  can_download?: boolean;
  can_comment?: boolean;
  can_approve?: boolean;
  watermarked?: boolean;
  first_accessed?: string;
  last_accessed?: string;
  view_count?: number;
  download_count?: number;
}

export interface CreateClientDocumentApproval {
  client_user_id: string;
  document_id: string;
  approval_decision: ClientApprovalDecision;
  approval_comments?: string;
  approval_conditions?: string[];
  digital_signature?: Record<string, any>;
  document_version: number;
  revision_letter?: string;
  is_final?: boolean;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
}

export interface CreateClientDocumentComment {
  client_user_id: string;
  document_id: string;
  comment_text: string;
  comment_type?: ClientCommentType;
  priority?: ClientPriority;
  page_number?: number;
  x_coordinate?: number;
  y_coordinate?: number;
  markup_data?: Record<string, any>;
  parent_comment_id?: string;
}

export interface UpdateClientDocumentComment {
  comment_text?: string;
  comment_type?: ClientCommentType;
  priority?: ClientPriority;
  status?: ClientCommentStatus;
  markup_data?: Record<string, any>;
}

export interface CreateClientNotification {
  client_user_id: string;
  project_id?: string;
  title: string;
  message: string;
  notification_type: ClientNotificationType;
  priority?: ClientPriority;
  delivery_method?: ClientDeliveryMethod[];
  scheduled_for?: string;
}

export interface UpdateClientNotification {
  is_read?: boolean;
  dismissed?: boolean;
  email_sent?: boolean;
  sms_sent?: boolean;
  sent_at?: string;
}

export interface CreateClientCommunicationThread {
  project_id: string;
  client_user_id: string;
  subject: string;
  thread_type?: ClientThreadType;
  priority?: ClientPriority;
  internal_participants?: string[];
  client_participants?: string[];
  auto_close_after_days?: number;
  requires_response?: boolean;
  response_deadline?: string;
}

export interface UpdateClientCommunicationThread {
  subject?: string;
  thread_type?: ClientThreadType;
  priority?: ClientPriority;
  status?: ClientThreadStatus;
  internal_participants?: string[];
  client_participants?: string[];
  auto_close_after_days?: number;
  requires_response?: boolean;
  response_deadline?: string;
  closed_by?: string;
}

export interface CreateClientMessage {
  thread_id: string;
  sender_id: string;
  message_body: string;
  message_type?: ClientMessageType;
  attachments?: Record<string, any>[];
}

export interface UpdateClientMessage {
  message_body?: string;
  attachments?: Record<string, any>[];
  is_read?: boolean;
}

// ============================================================================
// PERMISSION AND SECURITY TYPES
// ============================================================================

export interface UserPermissions {
  // Project permissions
  'projects.create'?: boolean;
  'projects.read.all'?: boolean;
  'projects.read.assigned'?: boolean;
  'projects.read.own'?: boolean;
  'projects.update'?: boolean;
  'projects.delete'?: boolean;
  'projects.archive'?: boolean;
  
  // Scope permissions
  'scope.create'?: boolean;
  'scope.read.full'?: boolean;
  'scope.read.limited'?: boolean;
  'scope.update'?: boolean;
  'scope.pricing.set'?: boolean;
  'scope.supplier.assign'?: boolean;
  
  // Document permissions
  'documents.create'?: boolean;
  'documents.read.all'?: boolean;
  'documents.read.project'?: boolean;
  'documents.read.client_visible'?: boolean;
  'documents.approve.internal'?: boolean;
  'documents.approve.client'?: boolean;
  'documents.version.manage'?: boolean;
  
  // Client portal permissions
  'client_portal.access'?: boolean;
  'client_portal.admin'?: boolean;
  'client_companies.create'?: boolean;
  'client_companies.read'?: boolean;
  'client_companies.update'?: boolean;
  'client_users.create'?: boolean;
  'client_users.read'?: boolean;
  'client_users.update'?: boolean;
  'client_users.manage_access'?: boolean;
  'client_communications.read'?: boolean;
  'client_communications.moderate'?: boolean;
  'client_activity.monitor'?: boolean;
  
  // Additional permissions
  [key: string]: boolean | undefined;
}

export interface RoleCapabilities {
  role: UserRole;
  permissions: UserPermissions;
  dashboard_widgets: string[];
  access_level: 'full' | 'limited' | 'restricted';
  cost_data_access: boolean;
  can_manage_users: boolean;
  can_approve_budgets: boolean;
  can_create_projects: boolean;
}

// ============================================================================
// FILTER AND QUERY TYPES
// ============================================================================

export interface ProjectFilters {
  status?: ProjectStatus[];
  client_id?: string;
  project_manager_id?: string;
  start_date_from?: string;
  start_date_to?: string;
  budget_min?: number;
  budget_max?: number;
  search?: string;
}

export interface ScopeItemFilters {
  project_id?: string;
  category?: ScopeCategory[];
  status?: ScopeStatus[];
  assigned_to?: string;
  supplier_id?: string;
  price_min?: number;
  price_max?: number;
  search?: string;
}

export interface DocumentFilters {
  project_id?: string;
  document_type?: DocumentType[];
  status?: DocumentStatus[];
  is_client_visible?: boolean;
  uploaded_by?: string;
  search?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================================================
// DASHBOARD AND ANALYTICS TYPES
// ============================================================================

export interface ProjectMetrics {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  projects_on_hold: number;
  total_budget: number;
  total_actual_cost: number;
  budget_variance: number;
}

export interface ScopeMetrics {
  total_scope_items: number;
  completed_scope_items: number;
  in_progress_scope_items: number;
  blocked_scope_items: number;
  total_scope_value: number;
  cost_variance: number;
}

export interface DashboardData {
  project_metrics: ProjectMetrics;
  scope_metrics: ScopeMetrics;
  recent_projects: ProjectWithDetails[];
  pending_approvals: DocumentWithDetails[];
  user_tasks: ScopeItemWithDetails[];
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DatabaseTable = 
  | 'user_profiles'
  | 'clients'
  | 'suppliers'
  | 'projects'
  | 'project_assignments'
  | 'scope_items'
  | 'scope_dependencies'
  | 'documents'
  | 'document_approvals'
  | 'vendors'
  | 'purchase_requests'
  | 'purchase_orders'
  | 'vendor_ratings'
  | 'approval_workflows'
  | 'delivery_confirmations'
  | 'client_companies'
  | 'client_users'
  | 'client_project_access'
  | 'client_permissions'
  | 'client_document_access'
  | 'client_document_approvals'
  | 'client_document_comments'
  | 'client_notifications'
  | 'client_activity_log'
  | 'client_communication_threads'
  | 'client_messages';

export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: string;
  direction: SortDirection;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: SortOption[];
}

// Management role check helper type
export const MANAGEMENT_ROLES: UserRole[] = [
  'company_owner',
  'general_manager',
  'deputy_general_manager',
  'technical_director',
  'admin'
];

// Cost tracking access roles
export const COST_TRACKING_ROLES: UserRole[] = [
  'company_owner',
  'general_manager',
  'deputy_general_manager',
  'technical_director',
  'admin',
  'technical_engineer',
  'purchase_director',
  'purchase_specialist'
];

// Client Portal Types
export type ClientAccessLevel = 'view_only' | 'reviewer' | 'approver' | 'project_owner';
export type ClientCompanyType = 'individual' | 'corporation' | 'partnership' | 'government' | 'non_profit';
export type ClientProjectAccessLevel = 'viewer' | 'reviewer' | 'approver' | 'stakeholder';
export type ClientPermissionType = 'document_access' | 'project_access' | 'communication' | 'reporting' | 'financial';
export type ClientDocumentAccessType = 'view' | 'download' | 'comment' | 'approve';
export type ClientApprovalDecision = 'approved' | 'approved_with_conditions' | 'rejected' | 'requires_revision';
export type ClientCommentType = 'general' | 'revision_request' | 'question' | 'approval_condition' | 'concern';
export type ClientCommentStatus = 'open' | 'addressed' | 'resolved' | 'closed';
export type ClientPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ClientNotificationType = 
  | 'document_submitted' | 'approval_required' | 'approval_received' | 'project_milestone'
  | 'schedule_change' | 'budget_update' | 'quality_issue' | 'delivery_notification'
  | 'message_received' | 'system_announcement';
export type ClientDeliveryMethod = 'in_app' | 'email' | 'sms' | 'push';
export type ClientActivityType = 
  | 'login' | 'logout' | 'document_view' | 'document_download' | 'document_approve'
  | 'comment_add' | 'message_send' | 'project_access' | 'profile_update';
export type ClientThreadType = 'general' | 'technical' | 'commercial' | 'quality' | 'schedule' | 'support';
export type ClientThreadStatus = 'open' | 'pending_response' | 'resolved' | 'closed';
export type ClientMessageType = 'text' | 'file' | 'image' | 'system';

// External user roles
export const EXTERNAL_ROLES: UserRole[] = [
  'client',
  'subcontractor'
];

// Field operation roles
export const FIELD_ROLES: UserRole[] = [
  'field_worker',
  'subcontractor'
];

// Type guards
export const isManagementRole = (role: UserRole): boolean => 
  MANAGEMENT_ROLES.includes(role);

export const hasCostTrackingAccess = (role: UserRole): boolean => 
  COST_TRACKING_ROLES.includes(role);

export const isExternalRole = (role: UserRole): boolean => 
  EXTERNAL_ROLES.includes(role);

export const isFieldRole = (role: UserRole): boolean => 
  FIELD_ROLES.includes(role);

// ============================================================================
// SUPABASE DATABASE TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: CreateUserProfile;
        Update: UpdateUserProfile;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'created_at' | 'updated_at'>>;
      };
      suppliers: {
        Row: Supplier;
        Insert: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Supplier, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: CreateProject;
        Update: UpdateProject;
      };
      project_assignments: {
        Row: ProjectAssignment;
        Insert: Omit<ProjectAssignment, 'id' | 'assigned_at'>;
        Update: Partial<Omit<ProjectAssignment, 'id' | 'assigned_at'>>;
      };
      scope_items: {
        Row: ScopeItem;
        Insert: CreateScopeItem;
        Update: UpdateScopeItem;
      };
      scope_dependencies: {
        Row: ScopeDependency;
        Insert: Omit<ScopeDependency, 'id' | 'created_at'>;
        Update: never;
      };
      documents: {
        Row: Document;
        Insert: CreateDocument;
        Update: UpdateDocument;
      };
      document_approvals: {
        Row: DocumentApproval;
        Insert: Omit<DocumentApproval, 'id' | 'created_at'>;
        Update: Partial<Omit<DocumentApproval, 'id' | 'created_at'>>;
      };
      vendors: {
        Row: Vendor;
        Insert: CreateVendor;
        Update: UpdateVendor;
      };
      purchase_requests: {
        Row: PurchaseRequest;
        Insert: CreatePurchaseRequest;
        Update: UpdatePurchaseRequest;
      };
      purchase_orders: {
        Row: PurchaseOrder;
        Insert: CreatePurchaseOrder;
        Update: UpdatePurchaseOrder;
      };
      vendor_ratings: {
        Row: VendorRating;
        Insert: CreateVendorRating;
        Update: never;
      };
      approval_workflows: {
        Row: PurchaseApprovalWorkflow;
        Insert: Omit<PurchaseApprovalWorkflow, 'id' | 'created_at'>;
        Update: Partial<Omit<PurchaseApprovalWorkflow, 'id' | 'created_at'>>;
      };
      delivery_confirmations: {
        Row: DeliveryConfirmation;
        Insert: CreateDeliveryConfirmation;
        Update: UpdateDeliveryConfirmation;
      };
      client_companies: {
        Row: ClientCompany;
        Insert: CreateClientCompany;
        Update: UpdateClientCompany;
      };
      client_users: {
        Row: ClientUser;
        Insert: CreateClientUser;
        Update: UpdateClientUser;
      };
      client_project_access: {
        Row: ClientProjectAccess;
        Insert: CreateClientProjectAccess;
        Update: UpdateClientProjectAccess;
      };
      client_permissions: {
        Row: ClientPermission;
        Insert: Omit<ClientPermission, 'id' | 'granted_at'>;
        Update: Partial<Omit<ClientPermission, 'id' | 'granted_at'>>;
      };
      client_document_access: {
        Row: ClientDocumentAccess;
        Insert: CreateClientDocumentAccess;
        Update: UpdateClientDocumentAccess;
      };
      client_document_approvals: {
        Row: ClientDocumentApproval;
        Insert: CreateClientDocumentApproval;
        Update: never;
      };
      client_document_comments: {
        Row: ClientDocumentComment;
        Insert: CreateClientDocumentComment;
        Update: UpdateClientDocumentComment;
      };
      client_notifications: {
        Row: ClientNotification;
        Insert: CreateClientNotification;
        Update: UpdateClientNotification;
      };
      client_activity_log: {
        Row: ClientActivityLog;
        Insert: Omit<ClientActivityLog, 'id' | 'created_at'>;
        Update: never;
      };
      client_communication_threads: {
        Row: ClientCommunicationThread;
        Insert: CreateClientCommunicationThread;
        Update: UpdateClientCommunicationThread;
      };
      client_messages: {
        Row: ClientMessage;
        Insert: CreateClientMessage;
        Update: UpdateClientMessage;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      project_status: ProjectStatus;
      scope_category: ScopeCategory;
      scope_status: ScopeStatus;
      document_type: DocumentType;
      document_status: DocumentStatus;
      urgency_level: UrgencyLevel;
      request_status: RequestStatus;
      po_status: PoStatus;
      approval_status: PurchaseApprovalStatus;
      delivery_status: DeliveryStatus;
      client_access_level: ClientAccessLevel;
      client_company_type: ClientCompanyType;
      client_project_access_level: ClientProjectAccessLevel;
      client_permission_type: ClientPermissionType;
      client_document_access_type: ClientDocumentAccessType;
      client_approval_decision: ClientApprovalDecision;
      client_comment_type: ClientCommentType;
      client_comment_status: ClientCommentStatus;
      client_priority: ClientPriority;
      client_notification_type: ClientNotificationType;
      client_delivery_method: ClientDeliveryMethod;
      client_activity_type: ClientActivityType;
      client_thread_type: ClientThreadType;
      client_thread_status: ClientThreadStatus;
      client_message_type: ClientMessageType;
    };
  };
}