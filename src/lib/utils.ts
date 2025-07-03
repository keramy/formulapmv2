import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { UserRole } from "@/types/auth"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getRoleColorClass(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    company_owner: 'border-l-management',
    general_manager: 'border-l-management', 
    deputy_general_manager: 'border-l-management',
    technical_director: 'border-l-management',
    admin: 'border-l-management',
    project_manager: 'border-l-project',
    architect: 'border-l-project',
    technical_engineer: 'border-l-technical',
    purchase_director: 'border-l-purchase',
    purchase_specialist: 'border-l-purchase',
    field_worker: 'border-l-field',
    client: 'border-l-client',
    subcontractor: 'border-l-external',
  }
  return roleColors[role] || 'border-l-gray-300'
}

export function formatUserRole(role: UserRole): string {
  return role.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getUserInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Get role-based background color for badges and indicators
 */
export function getRoleBadgeClass(role: UserRole): string {
  const roleColors: Record<UserRole, string> = {
    company_owner: 'bg-management/10 text-management border-management/20',
    general_manager: 'bg-management/10 text-management border-management/20',
    deputy_general_manager: 'bg-management/10 text-management border-management/20',
    technical_director: 'bg-management/10 text-management border-management/20',
    admin: 'bg-management/10 text-management border-management/20',
    project_manager: 'bg-project/10 text-project border-project/20',
    architect: 'bg-project/10 text-project border-project/20',
    technical_engineer: 'bg-technical/10 text-technical border-technical/20',
    purchase_director: 'bg-purchase/10 text-purchase border-purchase/20',
    purchase_specialist: 'bg-purchase/10 text-purchase border-purchase/20',
    field_worker: 'bg-field/10 text-field border-field/20',
    client: 'bg-client/10 text-client border-client/20',
    subcontractor: 'bg-external/10 text-external border-external/20',
  }
  return roleColors[role] || 'bg-muted text-muted-foreground'
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format date in a consistent way
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return formatDate(dateObj)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}