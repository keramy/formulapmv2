# Implementation Plan

- [x] 1. Create migration infrastructure and backup systems







  - Write comprehensive backup script for user_profiles table
  - Create migration logging table for tracking changes
  - Implement rollback script with full data restoration
  - Add migration validation functions
  - _Requirements: 3.1, 3.2, 5.1, 5.2_

- [x] 2. Implement database role migration script











  - Create SQL script to migrate user_profiles.role from user_role_old to user_role
  - Implement role mapping logic using CASE statements
  - Add seniority_level assignment based on original roles
  - Store original role in previous_role column for audit trail
  - Test migration script on backup database
  - _Requirements: 1.1, 1.2, 1.4, 4.1_

- [x] 3. Update all RLS policies for new role system






  - Identify all RLS policies referencing user_role_old
  - Create updated policies using new 6-role system
  - Replace old role names with new role mappings
  - Test each policy with sample users from each role
  - Verify no permission escalation or access loss
  - _Requirements: 1.3, 3.4, 4.2_

- [x] 4. Create migration execution script with safety checks




  - Implement pre-migration validation checks
  - Create transaction-wrapped migration execution
  - Add post-migration verification tests
  - Implement automatic rollback on failure
  - Create migration status monitoring
  - _Requirements: 1.1, 3.1, 3.3, 5.4_

- [ ] 5. Eliminate mock data from API endpoints
  - Audit all API routes in src/app/api/ for mock data usage
  - Replace mock responses with real database queries
  - Implement proper error handling for database failures
  - Add loading states and validation to all endpoints
  - Test CRUD operations for all entities
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 6. Update frontend components to use real data
  - Remove any remaining mock data imports from components
  - Update data fetching hooks to use real API endpoints
  - Implement proper loading and error states in UI
  - Add data validation for all form inputs
  - Test user interactions with real database
  - _Requirements: 2.1, 2.3, 2.4_

- [ ] 7. Implement seniority-based approval system
  - Create approval limits assignment based on role and seniority
  - Update permission checking functions to consider seniority
  - Implement approval workflow routing logic
  - Add seniority level management in user profiles
  - Test approval chains with different seniority levels
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [ ] 8. Execute migration in staging environment
  - Run complete migration process on staging database
  - Verify all users can authenticate with new roles
  - Test all major application workflows
  - Validate permission matrix for each role
  - Check API performance and response times
  - _Requirements: 1.1, 1.2, 1.3, 3.3, 3.4_

- [ ] 9. Create comprehensive test suite for migrated system
  - Write unit tests for role mapping functions
  - Create integration tests for authentication flow
  - Add permission testing for all user roles
  - Implement API endpoint testing with real data
  - Create rollback testing procedures
  - _Requirements: 1.4, 2.4, 3.4, 5.3_

- [ ] 10. Execute production migration with monitoring
  - Schedule maintenance window for migration
  - Execute migration with real-time monitoring
  - Verify user authentication immediately post-migration
  - Monitor system performance and error rates
  - Confirm all critical workflows are functional
  - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2_