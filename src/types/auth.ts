import { User as SupabaseUser } from '@supabase/supabase-js'

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

// Re-export Supabase User as our User type
export interface User extends SupabaseUser {
  // Add any custom user properties here if needed
}

export interface UserProfile {
  id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  department?: string
  avatar_url?: string
  permissions: Record<string, boolean>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AuthContextType {
  user: SupabaseUser | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData: Partial<UserProfile>) => Promise<any>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  refreshProfile: () => Promise<void>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  company?: string
  department?: string
}

export interface ResetPasswordData {
  email: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface AuthError {
  message: string
  code?: string
  details?: string
}