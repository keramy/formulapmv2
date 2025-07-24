# Application Code Migration Plan

## 🚨 CRITICAL ISSUES IDENTIFIED

Based on the build error check, we have **16 files with mixed role patterns** and **123 placeholder implementations** that need to be addressed before proceeding with the role system migration.

## 📋 PRIORITY CLASSIFICATION

### 🔴 **CRITICAL PRIORITY** - Must Fix Before Proceeding
These files contain core authentication, authorization, and type definitions that affect the entire application.

### 🟡 **HIGH PRIORITY** - Fix Soon  
These files affect user-facing functionality and API endpoints.

### 🟢 **MEDIUM PRIORITY** - Fix When Convenient
These are mostly UI components and non-critical features.

---

## 🔴 CRITICAL PRIORITY FIXES

### 1. **Core Type Definitions** (HIGHEST PRIORITY)
**Impact**: Affects entire application - all role checking will fail

#### Files to Fix:
- `src/types/auth.ts` - Authentication types
- `src/types/database.ts` - Database type definitions

#### Issues:
- Mixed old/new role references
- Type inconsistencies between old and new role systems

#### Action Plan:
1. **Update all role type definitions** to use new 6-role system
2. **Remove all old role references** (company_owner, technical_director, etc.)
3. **Add proper TypeScript types** for new roles
4. **Update role mapping utilities**

### 2. **Permission System** (CRITICAL)
**Impact**: Authorization will be broken - security risk

#### Files to Fix:
- `src/lib/permissions.ts` - Core permission checking logic

#### Issues:
- Mixed role references in permission checking
- Inconsistent role validation

#### Action Plan:
1. **Update all permission checks** to use new role system
2. **Remove old role permission mappings**
3. **Add new role permission mappings** based on design document
4. **Test all permission scenarios**

### 3. **Authentication System** (CRITICAL)
**Impact**: Users cannot log in or role checking fails

#### Files to Fix:
- `src/hooks/useAuth.ts` (if it has mixed patterns)
- `src/components/auth/LoginForm.tsx`
- `src/app/auth/login/page.tsx`

#### Issues:
- Mixed role references in authentication flow
- Inconsistent role assignment after login

#### Action Plan:
1. **Update authentication hooks** to return new role format
2. **Fix login form** to handle new roles
3. **Update session management** for new role system
4. **Test authentication flow** with all new roles

---

## 🟡 HIGH PRIORITY FIXES

### 4. **API Endpoints** (HIGH)
**Impact**: Backend API inconsistencies, data corruption risk

#### Files to Fix:
- `src/app/api/projects/[id]/shop-drawings/route.ts`
- `src/app/api/scope/route.optimized.ts`
- `src/app/api/shop-drawings/[id]/route.ts`

#### Issues:
- API endpoints using mixed role references
- Inconsistent role-based filtering

#### Action Plan:
1. **Update all API role checks** to new system
2. **Fix role-based data filtering**
3. **Update API response types**
4. **Test API endpoints** with new roles

### 5. **Dashboard Components** (HIGH)
**Impact**: Users see incorrect data or broken dashboards

#### Files to Fix:
- `src/app/dashboard/dashboard-server.tsx`
- `src/app/dashboard/components/client/ClientDashboardActions.tsx`
- `src/app/dashboard/components/server/ServerProjectsOverview.tsx`

#### Issues:
- Dashboard showing wrong data for roles
- Role-based UI components broken

#### Action Plan:
1. **Update dashboard role logic**
2. **Fix role-based data queries**
3. **Update UI components** for new roles
4. **Test dashboard** for each role type

### 6. **Core Business Logic** (HIGH)
**Impact**: Business rules and workflows broken

#### Files to Fix:
- `src/hooks/useImpersonation.ts`
- `src/hooks/useShopDrawings.ts`
- `src/lib/enhanced-middleware.ts`
- `src/lib/form-validation.ts`

#### Issues:
- Business logic using old role references
- Workflow validation broken

#### Action Plan:
1. **Update business rule logic**
2. **Fix workflow validations**
3. **Update middleware** for new roles
4. **Test critical workflows**

---

## 🔴 CRITICAL PLACEHOLDER FIXES

### 1. **Authentication Placeholders** (CRITICAL)
**Files**: 
- `src/components/auth/LoginForm.tsx` (line 59, 265)
- `src/hooks/useAuth.ts` (if has placeholders)

**Impact**: Users cannot authenticate properly

### 2. **Permission/Authorization Placeholders** (CRITICAL)
**Files**:
- `src/lib/permissions.ts` (if has placeholders)
- `src/lib/auth-helpers.ts` (if has placeholders)

**Impact**: Security vulnerabilities, unauthorized access

### 3. **API Endpoint Placeholders** (HIGH)
**Files**:
- `src/app/api/clients/route.ts` (line 2 - mock data)
- `src/app/api/projects/[id]/stats/route.ts` (line 2 - mockStats)

**Impact**: API returns fake data instead of real data

### 4. **Core Hook Placeholders** (HIGH)
**Files**:
- `src/hooks/useClients.ts` (line 2 - mock data)
- `src/hooks/useNotifications.ts` (line 2 - mock data)
- `src/hooks/useReports.ts` (line 229 - placeholder)

**Impact**: Components show fake data

---

## 📋 EXECUTION PLAN

### Phase 1: **Core System Fixes** (Day 1)
1. ✅ **Fix type definitions** (`types/auth.ts`, `types/database.ts`)
2. ✅ **Fix permission system** (`lib/permissions.ts`)
3. ✅ **Fix authentication system** (auth-related files)
4. ✅ **Remove critical placeholders** in auth/permission files

### Phase 2: **API and Business Logic** (Day 2)
1. ✅ **Fix API endpoints** with mixed patterns
2. ✅ **Fix core hooks** and business logic
3. ✅ **Remove API placeholders** (mock data)
4. ✅ **Update middleware** and validation

### Phase 3: **UI Components** (Day 3)
1. ✅ **Fix dashboard components**
2. ✅ **Fix form components** with placeholders
3. ✅ **Update UI role logic**
4. ✅ **Test user interfaces**

### Phase 4: **Testing and Validation** (Day 4)
1. ✅ **Run comprehensive tests**
2. ✅ **Validate all role scenarios**
3. ✅ **Check for remaining issues**
4. ✅ **Performance testing**

### Phase 5: **Comprehensive Fix** (Day 5)
1. 🔄 **Scan entire codebase** for mixed role patterns and placeholders
2. 🔄 **Fix all remaining issues** automatically
3. 🔄 **Validate fixes** with comprehensive testing
4. 🔄 **Final review** of all changes

---

## 🛠️ IMPLEMENTATION STRATEGY

### 1. **Role Mapping Reference**
```typescript
// OLD ROLES → NEW ROLES
const ROLE_MIGRATION_MAP = {
  'company_owner': 'management',
  'general_manager': 'management', 
  'deputy_general_manager': 'management',
  'technical_director': 'technical_lead',
  'architect': 'project_manager',
  'technical_engineer': 'project_manager',
  'field_worker': 'project_manager',
  'purchase_director': 'purchase_manager',
  'purchase_specialist': 'purchase_manager',
  'project_manager': 'project_manager',
  'subcontractor': 'project_manager',
  'client': 'client',
  'admin': 'admin'
};
```

### 2. **Search and Replace Strategy**
For each file with mixed patterns:
1. **Backup the file**
2. **Replace old role references** with new ones
3. **Update type annotations**
4. **Test the changes**
5. **Verify no old references remain**

### 3. **Placeholder Replacement Strategy**
For critical placeholders:
1. **Identify the intended functionality**
2. **Implement real data fetching**
3. **Add proper error handling**
4. **Add loading states**
5. **Test with real data**

---

## 🧪 TESTING STRATEGY

### 1. **Role-Based Testing**
Test each new role:
- ✅ `admin` - Full system access
- ✅ `management` - Executive level access  
- ✅ `technical_lead` - Technical oversight
- ✅ `project_manager` - Project management
- ✅ `purchase_manager` - Purchase operations
- ✅ `client` - Client portal access

### 2. **Critical Path Testing**
- ✅ **Authentication flow**
- ✅ **Permission checking**
- ✅ **API data access**
- ✅ **Dashboard functionality**
- ✅ **Core business workflows**

### 3. **Regression Testing**
- ✅ **Existing functionality still works**
- ✅ **No unauthorized access**
- ✅ **Data integrity maintained**
- ✅ **Performance not degraded**

---

## 📊 SUCCESS CRITERIA

### ✅ **Completion Checklist**
- [ ] **0 mixed role patterns** in codebase
- [ ] **0 critical placeholders** remaining
- [ ] **All authentication flows** working with new roles
- [ ] **All API endpoints** using new role system
- [ ] **All permission checks** updated
- [ ] **All UI components** showing correct data
- [ ] **Comprehensive testing** completed
- [ ] **No compilation errors**
- [ ] **No runtime errors** in critical paths

### 🔄 **Comprehensive Fix Verification**
- [ ] **Scan results** show 0 remaining issues
- [ ] **All files** successfully fixed
- [ ] **No errors** during fix process
- [ ] **All tests** pass after fixes

### 📈 **Quality Metrics**
- **Code consistency**: 100% new role system usage
- **Test coverage**: All role scenarios tested
- **Performance**: No degradation from changes
- **Security**: All permission checks validated

---

## 🚀 NEXT STEPS

1. ✅ **Complete Phase 1-4** (Core System, API, UI, and Testing)
2. 🔄 **Execute Comprehensive Fix** using the new scripts:
   ```bash
   # Run the scanner to identify all issues
   node scripts/comprehensive-issue-scanner.js
   
   # Run the fixer to address all identified issues
   node scripts/comprehensive-issue-fixer.js
   
   # Or run both in sequence
   node scripts/fix-all-issues.js
   ```
3. **Create automated tests** for role scenarios
4. **Set up monitoring** for role-related errors
5. **Document changes** for team review
6. **Plan deployment strategy** for production

This plan ensures we fix the most critical issues first while maintaining system stability and security throughout the migration process.