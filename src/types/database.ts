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
  | 'delivery_confirmations';

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
    };
  };
}