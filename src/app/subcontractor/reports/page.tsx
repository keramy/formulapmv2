/**
 * Subcontractor Reports Page
 * Dedicated page for managing site reports
 */

import { SubcontractorPortalCoordinator } from '@/components/subcontractor-access'

export default function SubcontractorReportsPage() {
  return <SubcontractorPortalCoordinator initialTab="reports" />
}

export const metadata = {
  title: 'Site Reports | Subcontractor Portal',
  description: 'Submit and manage your project site reports'
}