# Refactoring Action Plan - Phase 1 (Non-UI Work)

**Status**: 🚀 **ACTIVE - Non-UI Refactoring in Progress**  
**Timeline**: 4 weeks (while color system is being completed)  
**Focus**: Backend, Logic, Security, Performance - No UI conflicts  

## Phase 1A: Critical Security & Stability (Week 1)

### 🚨 IMMEDIATE START - Security Vulnerabilities
**Priority**: CRITICAL | **No UI Impact** | **Safe to Execute**

#### Day 1-2: Fix Hardcoded Secrets (8 hours)
- [ ] **Task 1.1**: Environment Configuration System
  - [ ] Create `src/lib/env-config.ts` with validation
  - [ ] Move all secrets from `src/lib/config.ts` to environment variables
  - [ ] Update `.env.example` with required variables
  - [ ] Test environment variable loading

#### Day 3-4: Update Vulnerable Dependencies (8 hours)  
- [ ] **Task 1.2**: Security Updates
  - [ ] Update lodash: 4.17.15 → 4.17.21 (CRITICAL: Prototype Pollution)
  - [ ] Update axios: 0.21.1 → 1.6.0 (HIGH: SSRF)
  - [ ] Update remaining 10 outdated packages
  - [ ] Run `npm audit` and verify all fixes

#### Day 5: Authentication Security (8 hours)
- [ ] **Task 1.3**: Secure Session Management  
  - [ ] Implement secure JWT handling in `src/lib/auth/session-manager.ts`
  - [ ] Add input sanitization in `src/lib/auth/input-sanitizer.ts`
  - [ ] Update authentication middleware
  - [ ] Test authentication flows

**Week 1 Deliverables**:
- ✅ Zero critical security vulnerabilities
- ✅ All dependencies updated and secure
- ✅ Secure authentication system

## Phase 1B: Core Logic Refactoring (Week 2)

### 🔧 Workflow Engine Refactoring
**Priority**: HIGH | **Pure Logic** | **No UI Dependencies**

#### Task 2.1: Strategy Pattern Implementation (16 hours)
- [ ] Create workflow interfaces in `src/lib/workflow/types.ts`
- [ ] Create `BaseWorkflowStrategy` class
- [ ] Implement `MaterialSpecApprovalStrategy`
- [ ] Implement `DocumentApprovalStrategy`  
- [ ] Implement `PaymentApprovalStrategy`
- [ ] Create `WorkflowStrategyRegistry`

#### Task 2.2: State Management Extraction (12 hours)
- [ ] Create `WorkflowStateManager` class
- [ ] Create `WorkflowValidator` class
- [ ] Create `WorkflowNotifier` class
- [ ] Implement state transition validation

#### Task 2.3: New Engine Architecture (12 hours)
- [ ] Create new `WorkflowEngine` class
- [ ] Implement dependency injection
- [ ] Create unit tests for all workflow strategies
- [ ] Update API endpoints to use new engine

**Week 2 Deliverables**:
- ✅ Workflow engine complexity: 28 → <8 per class
- ✅ Testable, maintainable workflow system
- ✅ Easy to extend with new workflow types

## Phase 1C: API Routes & Services (Week 3)

### 🌐 Service Layer Implementation
**Priority**: HIGH | **Backend Only** | **No UI Impact**

#### Task 3.1: Service Layer Infrastructure (8 hours)
- [ ] Create `BaseService` class in `src/lib/services/base-service.ts`
- [ ] Create error handling system in `src/lib/errors/`
- [ ] Create validation system with Zod schemas
- [ ] Create API error handler middleware

#### Task 3.2: High-Complexity API Routes (32 hours)
- [ ] **Projects API** (10h): Create `ProjectService` + refactor `/api/projects/[id]/route.ts`
- [ ] **Admin Users API** (8h): Create `UserManagementService` + refactor `/api/admin/users/route.ts`  
- [ ] **Scope API** (10h): Create `ScopeService` + refactor `/api/scope/route.ts`
- [ ] **Remaining Routes** (4h): Apply service pattern to 7 other routes

**Week 3 Deliverables**:
- ✅ All API routes use service layer pattern
- ✅ Consistent error handling and validation
- ✅ API complexity reduced from 18 average to <8

## Phase 1D: Business Logic & Database (Week 4)

### 📊 Business Logic Services (20 hours)
- [ ] **Permission Manager** (8h): Refactor `src/lib/permission-manager.ts` (complexity 22 → <8)
- [ ] **Cost Calculator** (6h): Refactor `src/lib/cost-calculator.ts` (complexity 19 → <8)  
- [ ] **Report Generator** (6h): Refactor `src/lib/report-generator.ts` (complexity 21 → <8)

### 🗄️ Database Optimization (20 hours)
- [ ] **Query Optimization** (8h): Fix N+1 queries, add indexes
- [ ] **Repository Pattern** (6h): Create base repository and specific repositories
- [ ] **Connection Pooling** (4h): Implement database connection optimization
- [ ] **Caching Layer** (2h): Basic Redis integration for query caching

**Week 4 Deliverables**:
- ✅ All business logic services refactored
- ✅ Database performance optimized
- ✅ Repository pattern implemented

## What We're NOT Touching (Waiting for Colors)

### 🎨 UI Components (Weeks 8-10 in original plan)
- ❌ `ScopeManagement.tsx` refactoring - **PAUSED**
- ❌ `AdminPanel.tsx` refactoring - **PAUSED**  
- ❌ `MaterialSpecForm.tsx` refactoring - **PAUSED**
- ❌ `TaskBoard.tsx` refactoring - **PAUSED**
- ❌ All React component work - **PAUSED**

### 🎨 UI-Related Performance (Part of Week 11)
- ❌ Bundle optimization - **PAUSED** (affects UI)
- ❌ Component rendering optimization - **PAUSED**
- ❌ React.memo implementations - **PAUSED**

## Progress Tracking

### Week 1: Security & Stability
- [ ] Task 1.1: Environment Configuration ⏳
- [ ] Task 1.2: Dependency Updates ⏳  
- [ ] Task 1.3: Authentication Security ⏳

### Week 2: Workflow Engine  
- [ ] Task 2.1: Strategy Pattern ⏳
- [ ] Task 2.2: State Management ⏳
- [ ] Task 2.3: New Architecture ⏳

### Week 3: API Routes
- [ ] Task 3.1: Service Infrastructure ⏳
- [ ] Task 3.2: Route Refactoring ⏳

### Week 4: Business Logic & Database
- [ ] Business Logic Services ⏳
- [ ] Database Optimization ⏳

## After Color System Completion

Once the other agent finishes the color system:

1. **Integration Review** (2 hours)
   - Review their color token structure
   - Update our component refactoring guides
   - Plan UI component integration

2. **Resume UI Refactoring** (Weeks 5-8 adjusted)
   - Execute all paused UI component refactoring
   - Integrate color system from day 1
   - Complete remaining performance optimizations

3. **Final Phases** (Weeks 9-12 adjusted)
   - Testing & Quality Assurance
   - Infrastructure & Production

## Current Status

**✅ Ready to Start**: Week 1 - Security fixes  
**🎯 Next**: Fix hardcoded secrets in `src/lib/config.ts`  
**⏸️ Paused**: All UI-related work until color system completion  
**📅 Timeline**: 4 weeks of backend/logic work, then resume full plan  

---

**Let's begin with Task 1.1 - Environment Configuration System!** 🚀