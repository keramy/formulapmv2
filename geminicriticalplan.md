**TO: AI Agent**
**FROM: Gemini CLI Agent**
**SUBJECT: Comprehensive Remediation Plan for Formula PM v2 Critical Issues**
**DATE: 8 Temmuz 2025 Salı**

**OVERVIEW:**
This document outlines a phased, systematic approach to resolve critical blocking issues in the Formula PM v2 application, identified during Wave 4 evaluation. The primary goal is to achieve a stable, maintainable, and deployable application by addressing TypeScript compilation errors, authentication incompatibility, incomplete deprecation cleanup, architectural over-engineering, and overall simplification.

**PRIORITIZATION:**
Strictly adhere to the following phase order. Do not proceed to a a subsequent phase until all objectives of the current phase are fully met and verified.

---

### **PHASE 1: TypeScript Compilation Errors (Priority 1)**

**OBJECTIVE:** Achieve a clean build with zero TypeScript errors, enabling successful compilation and deployment.

**AGENT TASKS:**

1.  **Task 1.1: Update Next.js 15 Import/Export Patterns**
    *   **Description:** Identify and modify all import and export statements in the affected files to conform to Next.js 15's module resolution and App Router conventions. This includes ensuring correct usage of `use client` directives and server component imports.
    *   **Affected Files:**
        *   `src/components/client-portal/dashboard/ClientDashboard.tsx`
        *   `src/components/client-portal/documents/ClientDocumentLibrary.tsx`
        *   `src/components/client-portal/communications/ClientCommunicationHub.tsx`
        *   `src/components/client-portal/navigation/ClientPortalNavigation.tsx`
        *   `src/components/client-portal/navigation/ClientPortalMobileNav.tsx`
        *   `src/components/subcontractor-access/SubcontractorDocumentViewer.tsx`
        *   `src/components/subcontractor-access/SubcontractorReportManager.tsx`
        *   `src/components/subcontractor-access/SubcontractorPortalCoordinator.tsx`
        *   `src/components/purchase/vendors/VendorDetails.tsx`
        *   `src/components/purchase/vendors/VendorEditForm.tsx`
        *   `src/components/purchase/approvals/ApprovalDetails.tsx`
        *   `src/components/purchase/orders/PurchaseOrderDetails.tsx`
        *   `src/components/purchase/deliveries/DeliveryConfirmationForm.tsx`
        *   `src/components/purchase/mobile/PurchaseMobileView.tsx`
        *   `src/components/purchase/shared/AdvancedFilters.tsx`
        *   `src/components/purchase/shared/ErrorBoundary.tsx`
    *   **Guidance:** Refer to official Next.js 15 migration guides for specific import/export changes. Use `search_file_content` to locate problematic patterns (e.g., `import { ... } from '...'` that might need to be `import ... from '...'` or vice-versa, or dynamic imports).

2.  **Task 1.2: Fix Missing or Incorrect Type Definitions**
    *   **Description:** Analyze the affected files for instances of `any` types, implicitly typed variables, or incorrect type annotations. Define or correct interfaces, types, and prop types for components, functions, and data structures.
    *   **Affected Files:** (Same as Task 1.1)
    *   **Guidance:** Enable stricter TypeScript compilation flags locally (e.g., `noImplicitAny`, `strictNullChecks`) to help identify all type-related issues. Create new `.d.ts` files for external libraries if type definitions are missing.

3.  **Task 1.3: Resolve Unresolved Module Dependencies**
    *   **Description:** Identify any modules that are imported but not found. This may involve missing entries in `package.json` or incorrect import paths. Install missing packages and correct import paths.
    *   **Affected Files:** (Likely across the entire `src` directory, especially those listed in Task 1.1)
    *   **Guidance:** Run `npm install` or `yarn install` to ensure all declared dependencies are present. Verify that relative and absolute import paths are correct and resolve to existing files.

4.  **Task 1.4: Address Component Prop Type Errors**
    *   **Description:** Ensure that the props being passed to components strictly adhere to their defined TypeScript interfaces or types. Correct any mismatches between expected and provided prop types.
    *   **Affected Files:** (Same as Task 1.1, and any components that consume them)
    *   **Guidance:** Pay close attention to how components are used throughout the application. Use TypeScript's error messages to pinpoint exact prop mismatches.

**VERIFICATION (Phase 1):**
*   Execute the project's build command (e.g., `npm run build` or `yarn build`).
*   Confirm that the build completes with **zero TypeScript compilation errors**.
*   Report any remaining errors or warnings.

---

### **PHASE 2: Authentication Middleware Incompatibility (Priority 2)**

**OBJECTIVE:** Implement a robust, unified, and Next.js 15 compatible authentication system, ensuring secure and consistent user access across the application.

**AGENT TASKS:**

1.  **Task 2.1: Research Next.js 15 Authentication Best Practices**
    *   **Description:** Conduct a thorough review of official Next.js 15 documentation and recommended patterns for authentication with the App Router. Focus on how to handle authentication in Server Components, Client Components, and API Routes.
    *   **Guidance:** Prioritize solutions that are officially supported or widely adopted (e.g., `next-auth` if not already in use, or adapting existing custom solutions to the new `middleware.ts` and `route.ts` paradigms).

2.  **Task 2.2: Refactor Authentication Middleware**
    *   **Description:** Replace the existing `withAuth` middleware pattern with a single, unified `middleware.ts` file that is fully compatible with Next.js 15's architecture. This middleware should handle authentication and authorization for all routes (main app, client portal, subcontractor).
    *   **Affected Files:**
        *   `src/lib/middleware/client-portal-auth.ts` (to be removed/replaced)
        *   `src/lib/middleware/subcontractor-auth.ts` (to be removed/replaced)
        *   `src/middleware.ts` (new or existing, to be updated)
    *   **Guidance:** The new middleware should centralize authentication logic, redirecting unauthenticated users and attaching user session data to requests.

3.  **Task 2.3: Unify Authentication Flows and API Endpoints**
    *   **Description:** Consolidate the multiple login/profile API routes into a single, consistent authentication API. All user types (main app, client portal, subcontractor) should authenticate through this unified system.
    *   **Affected Files:**
        *   `src/app/api/auth/login/route.ts`
        *   `src/app/api/auth/profile/route.ts`
        *   `src/app/api/client-portal/auth/login/route.ts` (to be removed/merged)
        *   `src/app/api/subcontractor/auth/login/route.ts` (to be removed/merged)
    *   **Guidance:** Design a single authentication entry point (e.g., `/api/auth/login`) that can handle different user roles or types based on credentials.

4.  **Task 2.4: Update Session and Cookie Handling**
    *   **Description:** Adapt the application's session management and cookie handling mechanisms to work seamlessly with the Next.js 15 App Router. Ensure secure storage and retrieval of authentication tokens.
    *   **Guidance:** Use `next/headers` for accessing cookies in Server Components and `cookies()` for setting them. Ensure `httpOnly` and `secure` flags are correctly set for sensitive cookies.

5.  **Task 2.5: Modernize JWT Verification Flow**
    *   **Description:** Review and update the JSON Web Token (JWT) verification process for enhanced security and efficiency. Implement robust token validation, expiration checks, and refresh mechanisms.
    *   **Guidance:** Ensure JWTs are signed and verified using strong cryptographic algorithms. Consider implementing token revocation if not already present.

**VERIFICATION (Phase 2):**
*   Thoroughly test login, logout, and access to protected routes for all user roles (e.g., main app user, client portal user, subcontractor user).
*   Verify that authentication works consistently across all parts of the application (client-side, server-side, API routes).
*   Confirm that no authentication-related runtime errors occur on route changes or page loads.

---

### **PHASE 3: Incomplete Deprecation Cleanup (Priority 3)**

**OBJECTIVE:** Permanently remove all remnants of deprecated features, eliminating dead code, broken references, and disabled migrations to achieve a clean and consistent codebase.

**AGENT TASKS:**

1.  **Task 3.1: Remove Shop Drawings System Remnants**
    *   **Description:** Delete the entire `src/components/shop-drawings/` directory. Remove all import statements and references to any shop drawing components or related logic in other files (e.g., `src/app/projects/[id]/page.tsx`, `src/components/projects/TabbedWorkspace.tsx`). Delete the associated disabled migration file.
    *   **Affected Files/Directories:**
        *   `src/components/shop-drawings/` (entire directory)
        *   `supabase/migrations/20250703000003_shop_drawings_mobile_integration.sql.disabled`
        *   Any files importing from `src/components/shop-drawings/`
    *   **Guidance:** Use `search_file_content` for `shop-drawings` or specific component names (e.g., `ShopDrawingViewer`) to ensure all references are removed.

2.  **Task 3.2: Remove Task Management System Remnants**
    *   **Description:** Delete the disabled SQL migration file related to the old task management system. Remove any remaining references in API routes, type definitions, or other parts of the codebase that pertain to the *deprecated* task management system.
    *   **Affected Files:**
        *   `supabase/migrations/20250703000001_task_management_system.sql.disabled`
        *   Any API routes, types, or components referencing the old task management system.
    *   **Guidance:** Be cautious not to remove any *new* or intended task management features. Focus specifically on the remnants of the *disabled/deprecated* system.

3.  **Task 3.3: Remove Document Approval Workflow Remnants**
    *   **Description:** Delete the disabled SQL migration file for the document approval workflow. Clean up any component imports, partially implemented API endpoints, or type definitions related to this *deprecated* workflow.
    *   **Affected Files:**
        *   `supabase/migrations/20250703000002_document_approval_workflow.sql.disabled`
        *   Any components, API routes, or types referencing the old document approval workflow.
    *   **Guidance:** Similar to task management, ensure only the *deprecated* workflow is targeted for removal.

4.  **Task 3.4: General Unused Code Cleanup**
    *   **Description:** After removing the major deprecated features, perform a general sweep to identify and remove any other unused imports, types, functions, or dead code that may have been left behind.
    *   **Guidance:** Utilize linting tools (e.g., ESLint with `eslint-plugin-unused-imports` or similar) to help identify and remove unused code.

**VERIFICATION (Phase 3):**
*   Execute the project's build command (`npm run build`).
*   Confirm that the application builds and runs without errors related to missing files or broken references from the removed features.
*   Manually inspect key areas to ensure no deprecated code is inadvertently called or rendered.

---

### **PHASE 4: Simplify Architecture (Priority 4)**

**OBJECTIVE:** Reduce complexity and technical debt by consolidating and standardizing architectural patterns, improving maintainability and development velocity.

**AGENT TASKS:**

1.  **Task 4.1: Consolidate Portal Systems**
    *   **Description:** Integrate functionality from the `client-portal` and `subcontractor` directories into the main application where appropriate. The goal is to move towards a single, flexible user interface that adapts based on user roles and permissions, rather than maintaining entirely separate portal applications.
    *   **Affected Directories:**
        *   `src/app/(client-portal)/`
        *   `src/app/client-portal/`
        *   `src/app/subcontractor/`
        *   `src/components/client-portal/`
        *   `src/components/subcontractor-access/`
    *   **Guidance:** Identify common UI components and logic that can be shared. Use conditional rendering or routing based on user roles to present different views within a unified application structure.

2.  **Task 4.2: Reduce Abstraction Layers**
    *   **Description:** Identify and simplify overly complex component hierarchies and excessive abstraction in API routes. Aim for a more direct and readable codebase.
    *   **Guidance:** Evaluate if a component or function adds unnecessary layers of indirection. Prioritize readability and maintainability over premature optimization or over-engineering.

3.  **Task 4.3: Standardize Component Patterns**
    *   **Description:** Ensure consistency in component design, naming conventions, file structure, and prop usage across the entire application.
    *   **Guidance:** Refer to `Patterns/ui-component-pattern.md` and other relevant pattern documents in the `Patterns/` directory. Apply these patterns consistently.

4.  **Task 4.4: Standardize API Structure**
    *   **Description:** Implement consistent naming conventions, request/response formats, and error handling across all API endpoints.
    *   **Guidance:** Define clear API versioning if necessary. Ensure all API routes follow a predictable and easy-to-understand structure.

**VERIFICATION (Phase 4):**
*   Conduct a code review focusing on architectural consistency and simplification.
*   Verify that the application's structure is more intuitive and easier to navigate.
*   Confirm that redundant code or excessive abstraction has been reduced.

---

### **PHASE 5: Testing and Validation (Priority 5)**

**OBJECTIVE:** Ensure the application is stable, functional, performs well, and meets quality and security standards before production deployment.

**AGENT TASKS:**

1.  **Task 5.1: Add Comprehensive Test Coverage**
    *   **Description:** Write unit, integration, and end-to-end tests for all critical paths, especially focusing on the refactored authentication system, core project management functionalities, and any business-critical logic.
    *   **Guidance:** Prioritize areas that have undergone significant changes or are identified as "critical" in the problem description. Use existing testing frameworks (e.g., Jest, React Testing Library).

2.  **Task 5.2: Validate All Critical User Paths**
    *   **Description:** Manually and/or automatically test all key user flows from end-to-end. This includes user registration, login, project creation, data entry, report generation, and any other core interactions.
    *   **Guidance:** Ensure all user roles can perform their intended actions without errors or unexpected behavior.

3.  **Task 5.3: Performance Testing**
    *   **Description:** Conduct basic performance tests to identify any regressions or bottlenecks introduced by the changes. Focus on page load times, API response times, and overall application responsiveness.
    *   **Guidance:** Use browser developer tools or simple load testing scripts to measure performance metrics.

4.  **Task 5.4: Security Audit (Basic)**
    *   **Description:** Review the application's authentication, authorization, and data handling mechanisms for common security vulnerabilities (e.g., Cross-Site Scripting (XSS), Cross-Site Request Forgery (CSRF), SQL injection, insecure direct object references).
    *   **Guidance:** Ensure proper input validation, output encoding, and adherence to security best practices.

**VERIFICATION (Phase 5):**
*   All automated tests pass with high confidence.
*   Manual testing confirms all critical user paths are functional and stable.
*   Performance metrics are acceptable and do not show regressions.
*   No obvious security vulnerabilities are identified.

---

**GENERAL INSTRUCTIONS FOR AI AGENT:**

*   **Incremental Changes:** Make small, focused changes. Each change should be testable and contribute directly to the current task's objective.
*   **Version Control:** Commit changes frequently with clear, descriptive commit messages that explain *what* was changed and *why*.
*   **Documentation:** Update relevant documentation (e.g., `README.md`, `Patterns/`, `GEMINI.md`) as significant architectural or functional changes are made.
*   **Communication:** If any task is blocked, requires clarification, or introduces unforeseen complexities, report back immediately with details.
*   **Self-Correction:** If a change introduces new errors or regressions, revert the change and re-evaluate the approach before proceeding.
*   **Tool Usage:** Utilize `read_file`, `search_file_content`, `replace`, `write_file`, and `run_shell_command` as necessary. When using `replace`, ensure the `old_string` parameter includes sufficient surrounding context to guarantee precise targeting.
*   **Build Verification:** After each significant change, run the project's build command (e.g., `npm run build`) and relevant tests to ensure stability and prevent accumulation of errors.

---