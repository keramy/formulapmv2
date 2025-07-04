/**
 * Subcontractor Login Page
 * Entry point for subcontractor portal authentication
 */

import { SubcontractorAuth } from '@/components/subcontractor-access'

export default function SubcontractorLoginPage() {
  return <SubcontractorAuth />
}

export const metadata = {
  title: 'Subcontractor Login | Formula PM',
  description: 'Sign in to access your project reports and documents'
}