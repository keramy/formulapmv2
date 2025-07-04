/**
 * Subcontractor Portal Dashboard Page
 * Main dashboard for subcontractor portal
 */

import { SubcontractorPortalCoordinator } from '@/components/subcontractor-access'

export default function SubcontractorPortalPage() {
  return <SubcontractorPortalCoordinator initialTab="dashboard" />
}

export const metadata = {
  title: 'Subcontractor Portal | Formula PM',
  description: 'Access your project reports and documents'
}