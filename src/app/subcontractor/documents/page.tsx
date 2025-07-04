/**
 * Subcontractor Documents Page
 * Dedicated page for accessing project documents
 */

import { SubcontractorPortalCoordinator } from '@/components/subcontractor-access'

export default function SubcontractorDocumentsPage() {
  return <SubcontractorPortalCoordinator initialTab="documents" />
}

export const metadata = {
  title: 'Project Documents | Subcontractor Portal',
  description: 'Access and download your assigned project documents'
}