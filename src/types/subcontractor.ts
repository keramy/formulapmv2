/**
 * Subcontractor Access System Types
 * Simple types for minimal subcontractor functionality
 */

// ============================================================================
// ENUMS AND TYPES
// ============================================================================

export type ReportStatus = 'submitted' | 'reviewed' | 'approved';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface SubcontractorUser {
  id: string;
  user_profile_id: string;
  company_name: string;
  company_license: string;
  insurance_certificate: string;
  bonding_capacity?: number;
  primary_contact: Record<string, any>;
  field_supervisor: Record<string, any>;
  office_contact: Record<string, any>;
  access_level: string;
  portal_access_enabled: boolean;
  trade_specializations: Record<string, any>[];
  equipment_capabilities: Record<string, any>[];
  crew_size_range?: Record<string, any>;
  geographic_coverage: string[];
  safety_rating: number;
  quality_rating: number;
  timeliness_rating: number;
  communication_rating: number;
  overall_performance: number;
  insurance_valid: boolean;
  license_valid: boolean;
  safety_training_current: boolean;
  drug_testing_compliant: boolean;
  payment_terms?: string;
  preferred_payment_method?: string;
  w9_on_file: boolean;
  credit_approved: boolean;
  last_login: string;
  login_attempts: number;
  account_locked: boolean;
  two_factor_enabled: boolean;
  mobile_pin?: string;
  device_fingerprints: Record<string, any>[];
  created_by: string;
  created_at: string;
  last_activity: string;
  active_status: string;
}

export interface SubcontractorReport {
  id: string;
  subcontractor_id: string;
  project_id: string;
  
  // Report Content
  report_date: string;
  description: string;
  photos: string[];
  
  // Status
  status: ReportStatus;
  
  // Tracking
  created_at: string;
  updated_at: string;
}

export interface SubcontractorScopeAccess {
  id: string;
  subcontractor_id: string;
  scope_item_id: string;
  document_id: string;
  
  // Access Control
  can_download: boolean;
  
  // Tracking
  granted_by: string;
  granted_at: string;
  last_accessed?: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface SubcontractorLoginForm {
  email: string;
  password: string;
}

export interface SubcontractorReportForm {
  report_date: string;
  description: string;
  photos: File[];
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SubcontractorAuthResponse {
  user: SubcontractorUser;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface SubcontractorProfileResponse {
  user: SubcontractorUser;
  assigned_projects: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export interface SubcontractorDocumentResponse {
  id: string;
  name: string;
  type: string;
  url: string;
  scope_item: {
    id: string;
    name: string;
    category: string;
  };
  can_download: boolean;
}

export interface SubcontractorReportResponse {
  reports: SubcontractorReport[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface SubcontractorLoginProps {
  onLogin: (credentials: SubcontractorLoginForm) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export interface ReportSubmissionProps {
  projectId: string;
  onSubmit: (report: SubcontractorReportForm) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export interface DocumentListProps {
  documents: SubcontractorDocumentResponse[];
  onDownload: (documentId: string) => Promise<void>;
  isLoading: boolean;
}

export interface ReportsListProps {
  reports: SubcontractorReport[];
  isLoading: boolean;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface SubcontractorSession {
  user: SubcontractorUser;
  expires_at: number;
}

export interface SubcontractorContextType {
  user: SubcontractorUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: SubcontractorLoginForm) => Promise<void>;
  logout: () => Promise<void>;
  submitReport: (report: SubcontractorReportForm) => Promise<void>;
  getDocuments: () => Promise<SubcontractorDocumentResponse[]>;
  getReports: () => Promise<SubcontractorReport[]>;
}

// ============================================================================
// DATABASE TYPES (for API routes)
// ============================================================================

export interface SubcontractorUserInsert {
  user_profile_id: string;
  company_name: string;
  contact_person: string;
  phone?: string;
  email: string;
  created_by: string;
}

export interface SubcontractorReportInsert {
  subcontractor_id: string;
  project_id: string;
  report_date: string;
  description: string;
  photos: string[];
}

export interface SubcontractorScopeAccessInsert {
  subcontractor_id: string;
  scope_item_id: string;
  document_id: string;
  can_download?: boolean;
  granted_by: string;
}

// Additional types for comprehensive validation
export interface SubcontractorProjectAssignment {
  id: string;
  subcontractor_id: string;
  project_id: string;
  assigned_date: string;
  status: string;
  scope_items: string[];
  created_at: string;
  updated_at: string;
}

export interface SubcontractorTask {
  id: string;
  subcontractor_id: string;
  project_id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface DailyProgressReport {
  id: string;
  subcontractor_id: string;
  project_id: string;
  report_date: string;
  work_completed: string;
  challenges: string;
  next_steps: string;
  photos: string[];
  created_at: string;
  updated_at: string;
}

export interface SubcontractorPhoto {
  id: string;
  subcontractor_id: string;
  project_id: string;
  photo_url: string;
  photo_type: string;
  caption: string;
  location: string;
  created_at: string;
}

export interface SubcontractorNotification {
  id: string;
  subcontractor_id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubcontractorActivityLog {
  id: string;
  subcontractor_id: string;
  activity_type: string;
  description: string;
  metadata: Record<string, any>;
  created_at: string;
}