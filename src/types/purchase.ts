/**
 * Purchase Department Workflow Types
 * Following Formula PM's type definition patterns
 */

// Enums for purchase system
export type UrgencyLevel = 'low' | 'normal' | 'high' | 'emergency'
export type RequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'cancelled'
export type POStatus = 'draft' | 'sent' | 'confirmed' | 'delivered' | 'completed' | 'cancelled'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'delegated'
export type DeliveryStatus = 'pending' | 'partial' | 'completed' | 'damaged' | 'rejected'

// Purchase Request Types
export interface PurchaseRequest {
  id: string
  project_id: string
  requester_id: string
  request_number: string
  item_description: string
  quantity: number
  unit_of_measure: string
  estimated_cost?: number
  required_date: string
  urgency_level: UrgencyLevel
  justification?: string
  status: RequestStatus
  created_at: string
  updated_at: string
  
  // Relations
  project?: {
    id: string
    name: string
    status: string
  }
  requester?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  purchase_orders?: PurchaseOrder[]
  approvals?: ApprovalWorkflow[]
}

// Purchase Order Types
export interface PurchaseOrder {
  id: string
  purchase_request_id: string
  po_number: string
  vendor_id: string
  total_amount: number
  po_date: string
  expected_delivery_date?: string
  status: POStatus
  terms_conditions?: string
  created_by: string
  created_at: string
  
  // Relations
  purchase_request?: PurchaseRequest
  vendor?: Vendor
  creator?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
  delivery_confirmations?: DeliveryConfirmation[]
}

// Vendor Types
export interface Vendor {
  id: string
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
  is_active: boolean
  created_at: string
  
  // Relations
  purchase_orders?: PurchaseOrder[]
  ratings?: VendorRating[]
  average_rating?: number
}

// Vendor Rating Types
export interface VendorRating {
  id: string
  vendor_id: string
  project_id: string
  rater_id: string
  quality_score: number
  delivery_score: number
  communication_score: number
  overall_score: number
  comments?: string
  created_at: string
  
  // Relations
  vendor?: Vendor
  project?: {
    id: string
    name: string
  }
  rater?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
}

// Approval Workflow Types
export interface ApprovalWorkflow {
  id: string
  purchase_request_id: string
  approver_role: string
  approver_id?: string
  approval_status: ApprovalStatus
  approval_date?: string
  comments?: string
  created_at: string
  
  // Relations
  purchase_request?: PurchaseRequest
  approver?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
}

// Delivery Confirmation Types
export interface DeliveryConfirmation {
  id: string
  purchase_order_id: string
  confirmed_by: string
  delivery_date: string
  quantity_received: number
  quantity_ordered: number
  condition_notes?: string
  photos?: string[]
  status: DeliveryStatus
  created_at: string
  
  // Relations
  purchase_order?: PurchaseOrder
  confirmer?: {
    id: string
    first_name: string
    last_name: string
    role: string
  }
}

// API Request/Response Types
export interface PurchaseRequestCreateData {
  project_id: string
  item_description: string
  quantity: number
  unit_of_measure: string
  estimated_cost?: number
  required_date: string
  urgency_level: UrgencyLevel
  justification?: string
}

export interface PurchaseRequestUpdateData {
  item_description?: string
  quantity?: number
  unit_of_measure?: string
  estimated_cost?: number
  required_date?: string
  urgency_level?: UrgencyLevel
  justification?: string
  status?: RequestStatus
}

export interface PurchaseOrderCreateData {
  purchase_request_id: string
  vendor_id: string
  total_amount: number
  po_date: string
  expected_delivery_date?: string
  terms_conditions?: string
}

export interface PurchaseOrderUpdateData {
  vendor_id?: string
  total_amount?: number
  po_date?: string
  expected_delivery_date?: string
  terms_conditions?: string
  status?: POStatus
}

export interface VendorCreateData {
  company_name: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
}

export interface VendorUpdateData {
  company_name?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms?: string
  is_active?: boolean
}

export interface VendorRatingCreateData {
  vendor_id: string
  project_id: string
  quality_score: number
  delivery_score: number
  communication_score: number
  overall_score: number
  comments?: string
}

export interface ApprovalAction {
  approval_status: ApprovalStatus
  comments?: string
}

export interface DeliveryConfirmationData {
  delivery_date: string
  quantity_received: number
  quantity_ordered: number
  condition_notes?: string
  photos?: string[]
  status: DeliveryStatus
}

// API Response Types
export interface PurchaseApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PurchaseListResponse<T = any> {
  items: T[]
  total_count: number
  page: number
  limit: number
  has_more: boolean
}

export interface PurchaseStatistics {
  total_requests: number
  pending_approvals: number
  active_orders: number
  pending_deliveries: number
  total_spent: number
  average_approval_time: number
  by_status: {
    [key in RequestStatus]: number
  }
  by_urgency: {
    [key in UrgencyLevel]: number
  }
}

// Filter and Search Types
export interface PurchaseRequestFilters {
  project_id?: string
  status?: RequestStatus[]
  urgency_level?: UrgencyLevel[]
  requester_id?: string
  date_range?: {
    start: string
    end: string
  }
  cost_range?: {
    min: number
    max: number
  }
  search?: string
}

export interface PurchaseOrderFilters {
  vendor_id?: string
  status?: POStatus[]
  date_range?: {
    start: string
    end: string
  }
  amount_range?: {
    min: number
    max: number
  }
  search?: string
}

export interface VendorFilters {
  is_active?: boolean
  rating_min?: number
  search?: string
}

// Pagination Types
export interface PaginationParams {
  page?: number
  limit?: number
  sort_field?: string
  sort_direction?: 'asc' | 'desc'
}

// Email Integration Types
export interface EmailNotification {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

export interface POEmailData {
  po_number: string
  vendor_name: string
  total_amount: number
  items: string
  delivery_date?: string
  terms_conditions?: string
}