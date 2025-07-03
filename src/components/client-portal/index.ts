/**
 * Client Portal Components Index
 * Centralized exports for all client portal components
 */

// Core Coordinator
export { useClientPortalCoordinator } from './ClientPortalCoordinator'
export type { ClientPortalCoordinatorReturn } from './ClientPortalCoordinator'

// Authentication Components
export { ClientLoginForm } from './auth/ClientLoginForm'
export { ClientAuthGuard } from './auth/ClientAuthGuard'
export { ClientSessionManager } from './auth/ClientSessionManager'

// Dashboard Components
export { ClientDashboard } from './dashboard/ClientDashboard'
export { ProjectOverviewCards } from './dashboard/ProjectOverviewCards'
export { RecentActivityFeed } from './dashboard/RecentActivityFeed'

// Document Components
export { ClientDocumentLibrary } from './documents/ClientDocumentLibrary'
export { ClientDocumentApprovalInterface } from './documents/ClientDocumentApprovalInterface'

// Communication Components
export { ClientCommunicationHub } from './communications/ClientCommunicationHub'

// Notification Components
export { ClientNotificationCenter } from './notifications/ClientNotificationCenter'

// Navigation Components
export { ClientPortalNavigation } from './navigation/ClientPortalNavigation'