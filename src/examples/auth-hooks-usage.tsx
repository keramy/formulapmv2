/**
 * Example Component - Usage of Specialized Auth Hooks
 * 
 * This file demonstrates how to use the new useRoleChecks and usePMSeniority hooks
 * in real components. These hooks provide focused, reusable role management logic.
 */

'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRoleChecks } from '@/hooks/auth/useRoleChecks'
import { usePMSeniority } from '@/hooks/auth/usePMSeniority'
import { UserProfile } from '@/types/auth'

/**
 * Component that shows role-based UI using the useRoleChecks hook
 */
const RoleBasedNavigation: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const { isManagement, isProjectRole, isPurchaseRole, isExternalRole } = useRoleChecks(profile)

  return (
    <nav className="role-based-navigation">
      <ul>
        {isManagement && (
          <>
            <li><a href="/dashboard/management">Management Dashboard</a></li>
            <li><a href="/reports/company">Company Reports</a></li>
            <li><a href="/users/manage">User Management</a></li>
          </>
        )}
        
        {isProjectRole && (
          <>
            <li><a href="/projects">My Projects</a></li>
            <li><a href="/tasks">Task Management</a></li>
            <li><a href="/milestones">Project Milestones</a></li>
          </>
        )}
        
        {isPurchaseRole && (
          <>
            <li><a href="/purchase-orders">Purchase Orders</a></li>
            <li><a href="/vendors">Vendor Management</a></li>
            <li><a href="/materials">Material Specs</a></li>
          </>
        )}
        
        {isExternalRole && (
          <>
            <li><a href="/client-dashboard">Project Overview</a></li>
            <li><a href="/documents">Project Documents</a></li>
            <li><a href="/updates">Status Updates</a></li>
          </>
        )}
      </ul>
    </nav>
  )
}

/**
 * Component that shows PM seniority-based features using the usePMSeniority hook
 */
const PMSeniorityFeatures: React.FC<{ profile: UserProfile | null }> = ({ profile }) => {
  const { 
    isPM, 
    seniority, 
    displayName, 
    canApproveShopDrawings,
    canPerformAction,
    hasMinimumSeniority,
    isExecutivePM,
    isSeniorPM
  } = usePMSeniority(profile)

  if (!isPM) {
    return <p>This section is only available for Project Managers.</p>
  }

  return (
    <div className="pm-seniority-features">
      <h3>Project Manager Features - {displayName}</h3>
      <p>Your seniority level: <strong>{seniority}</strong></p>
      
      <div className="features-grid">
        {/* Basic PM features - available to all PMs */}
        <div className="feature-card">
          <h4>Basic Project Management</h4>
          <ul>
            <li>✅ View assigned projects</li>
            <li>✅ Update task progress</li>
            <li>✅ Communicate with team</li>
          </ul>
        </div>

        {/* Senior PM features */}
        {hasMinimumSeniority('senior') && (
          <div className="feature-card">
            <h4>Senior PM Capabilities</h4>
            <ul>
              <li>✅ Approve shop drawings</li>
              <li>✅ Mentor junior PMs</li>
              <li>✅ Handle client escalations</li>
            </ul>
          </div>
        )}

        {/* Executive PM features */}
        {isExecutivePM && (
          <div className="feature-card">
            <h4>Executive PM Authority</h4>
            <ul>
              <li>✅ Approve all shop drawings</li>
              <li>✅ Manage PM team</li>
              <li>✅ Strategic project decisions</li>
            </ul>
          </div>
        )}
      </div>

      {/* Action buttons based on capabilities */}
      <div className="action-buttons">
        {canApproveShopDrawings && (
          <button className="btn-primary">
            Approve Shop Drawings
          </button>
        )}
        
        {canPerformAction('senior') && (
          <button className="btn-secondary">
            Review Junior PM Work
          </button>
        )}
        
        {canPerformAction('executive') && (
          <button className="btn-executive">
            Executive Dashboard
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Main example component demonstrating integrated usage
 */
const AuthHooksExample: React.FC = () => {
  // Get user data from main auth hook
  const { user, profile, loading } = useAuth()
  
  // Use specialized hooks for focused logic
  const roleChecks = useRoleChecks(profile)
  const pmSeniority = usePMSeniority(profile)

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || !profile) {
    return <div>Please log in to see role-based features.</div>
  }

  return (
    <div className="auth-hooks-example">
      <header>
        <h1>Welcome, {profile.first_name} {profile.last_name}</h1>
        <p>Role: <strong>{profile.role}</strong></p>
        {pmSeniority.isPM && (
          <p>PM Seniority: <strong>{pmSeniority.displayName}</strong></p>
        )}
      </header>

      <main>
        <section>
          <h2>Role-Based Navigation</h2>
          <RoleBasedNavigation profile={profile} />
        </section>

        {pmSeniority.isPM && (
          <section>
            <h2>PM Seniority Features</h2>
            <PMSeniorityFeatures profile={profile} />
          </section>
        )}

        {/* Debug information */}
        <section>
          <h2>Debug Information</h2>
          <details>
            <summary>Role Checks</summary>
            <pre>{JSON.stringify(roleChecks, null, 2)}</pre>
          </details>
          
          {pmSeniority.isPM && (
            <details>
              <summary>PM Seniority Info</summary>
              <pre>{JSON.stringify({
                seniority: pmSeniority.seniority,
                displayName: pmSeniority.displayName,
                canApproveShopDrawings: pmSeniority.canApproveShopDrawings,
                seniorityLevel: pmSeniority.seniorityLevel,
                comparisons: {
                  regular: pmSeniority.compareSeniority('regular'),
                  senior: pmSeniority.compareSeniority('senior'),
                  executive: pmSeniority.compareSeniority('executive')
                }
              }, null, 2)}</pre>
            </details>
          )}
        </section>
      </main>
    </div>
  )
}

export default AuthHooksExample

/**
 * Usage in other components:
 * 
 * // Simple role checking
 * const { isManagement } = useRoleChecks(userProfile)
 * if (isManagement) {
 *   // Show management features
 * }
 * 
 * // PM seniority checking
 * const { canPerformAction } = usePMSeniority(userProfile)
 * if (canPerformAction('senior')) {
 *   // Show senior PM features
 * }
 * 
 * // Multiple role types
 * const hasProjectAccess = hasAnyRoleType(userProfile, ['project', 'management'])
 * 
 * // Filter PMs by seniority
 * const seniorPMs = filterPMsBySeniority(allPMs, 'senior')
 * 
 * // Sort PMs by seniority
 * const sortedPMs = sortPMsBySeniority(allPMs)
 */