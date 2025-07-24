# Requirements Document

## Introduction

This feature addresses the critical foundation issue in the Formula PM v3 implementation where the database schema still uses a 13-role system (`user_role_old`) while the application code has already been converted to expect a 6-role system (`user_role`). This database-application mismatch is causing authentication failures and blocking all other development phases. The application code is ready - we just need to migrate the database to match.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to migrate from the 13-role system to the 6-role system, so that the database schema matches the application code and users can authenticate properly.

#### Acceptance Criteria

1. WHEN the migration is executed THEN the user_profiles table SHALL use the new 6-role enum
2. WHEN existing users log in THEN they SHALL be mapped to the correct new role based on the migration mapping
3. WHEN the migration completes THEN all RLS policies SHALL reference the new 6-role system
4. WHEN a user's role is checked THEN the system SHALL return one of the 6 new roles
5. IF a user had a legacy role THEN the system SHALL map it to the appropriate new role without data loss

### Requirement 2

**User Story:** As a developer, I want all mock data eliminated from the codebase, so that the application uses real database queries and provides accurate information.

#### Acceptance Criteria

1. WHEN the application loads data THEN it SHALL query the actual database instead of mock data
2. WHEN a user performs CRUD operations THEN the system SHALL persist changes to the database
3. WHEN the codebase is searched for mock data THEN zero mock data references SHALL be found
4. WHEN API endpoints are called THEN they SHALL return real data from the database
5. IF an API endpoint fails THEN it SHALL return proper error responses instead of mock success

### Requirement 3

**User Story:** As a user, I want the role migration to be seamless, so that I can continue working without interruption or data loss.

#### Acceptance Criteria

1. WHEN the migration runs THEN user sessions SHALL remain active
2. WHEN users access the application during migration THEN they SHALL not experience downtime
3. WHEN the migration completes THEN all user permissions SHALL work as expected
4. WHEN a user's role is migrated THEN their access level SHALL be equivalent or better than before
5. IF the migration fails THEN the system SHALL rollback to the previous state automatically

### Requirement 4

**User Story:** As a project manager, I want the seniority system to work properly, so that approval workflows and permissions reflect the organizational hierarchy.

#### Acceptance Criteria

1. WHEN a project manager is assigned a seniority level THEN their approval limits SHALL reflect that level
2. WHEN an approval request is submitted THEN it SHALL route to the correct approver based on seniority
3. WHEN seniority levels are checked THEN the system SHALL return 'executive', 'senior', or 'regular'
4. WHEN a senior PM approves a request THEN it SHALL not require additional management approval (within limits)
5. IF a PM's seniority changes THEN their permissions SHALL update immediately

### Requirement 5

**User Story:** As a system administrator, I want comprehensive rollback capabilities, so that I can safely revert the migration if issues occur.

#### Acceptance Criteria

1. WHEN a rollback is initiated THEN the system SHALL restore the original 13-role enum
2. WHEN users are rolled back THEN their original roles SHALL be restored exactly
3. WHEN RLS policies are rolled back THEN they SHALL reference the original role system
4. WHEN the rollback completes THEN the application SHALL function with the original role system
5. IF data was modified during migration THEN the rollback SHALL preserve all user data