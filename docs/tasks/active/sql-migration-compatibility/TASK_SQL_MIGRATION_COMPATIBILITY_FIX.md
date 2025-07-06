# Task: Fix SQL Migration Compatibility Issues and Create Validation System

## Type: Improvement/Documentation
**Priority**: High
**Effort**: 1-2 days  
**Subagents**: 4
**Approach**: Hybrid (Sequential foundation, then parallel improvements)

## Request Analysis
**Original Request**: "analyse this error and possible future errors like this. we need to understand how to connect our sql with supabase. Use context7 to improve yourself if needed. ERROR: syntax error at or near 'AS' (SQLSTATE 42601)"
**Objective**: Fix current SQL migration errors and create comprehensive solution to prevent future PostgreSQL/Supabase compatibility issues
**Over-Engineering Check**: Focused on practical fixes and reusable validation tooling - minimum viable approach

## Subagent Assignments

### Wave 1: Foundation (Sequential)
#### Subagent 1: debug - Fix Current SQL Migration Errors
```
TASK_NAME: fix_sql_migration_errors
TASK_GOAL: Fix all current SQL migration syntax errors preventing Supabase from starting locally
REQUIREMENTS:
1. Fix syntax error in 20250702000005_financial_tender_system.sql (comma before GENERATED ALWAYS)
2. Fix generated column issues across all migration files
3. Resolve foreign key constraint issues in sample data
4. Ensure all migrations follow PostgreSQL 15+ syntax rules
5. Test that Supabase starts successfully with fixed migrations
6. Document each fix with explanation of the issue
CONSTRAINTS:
- Maintain data integrity and relationships
- Follow PostgreSQL generated column rules (no subqueries, no referencing other generated columns)
- Always include STORED keyword for generated columns
- Keep fixes minimal and focused
DEPENDENCIES: None
```

### Wave 2: Documentation & Tooling (Parallel)
#### Subagent 2: docs - Create SQL Migration Guidelines
```
TASK_NAME: create_sql_migration_guidelines
TASK_GOAL: Create comprehensive documentation for PostgreSQL/Supabase migration best practices
REQUIREMENTS:
1. Document PostgreSQL generated column rules and limitations
2. Create Supabase-specific migration guidelines
3. Provide examples of common patterns and anti-patterns
4. Include troubleshooting guide for common errors
5. Create migration file naming conventions
6. Document testing procedures with supabase db reset
7. Include performance considerations for large tables
CONSTRAINTS:
- Focus on practical, actionable guidelines
- Include real examples from the project
- Make it accessible for developers new to PostgreSQL
- Structure for easy reference during development
DEPENDENCIES: Wave 1 insights about common issues
```

#### Subagent 3: code - Build SQL Migration Validation Tool
```
TASK_NAME: build_sql_migration_validator
TASK_GOAL: Create TypeScript/Node.js tool to validate SQL migrations before applying them
REQUIREMENTS:
1. Parse SQL migration files and detect common issues
2. Check for generated column syntax errors
3. Validate foreign key references exist
4. Detect subqueries in generated columns
5. Check for missing STORED keywords
6. Validate proper comma placement
7. Create CLI tool with clear error messages
8. Add --fix option for auto-fixing common issues
9. Generate detailed validation reports
CONSTRAINTS:
- Use TypeScript for consistency with project stack
- Keep dependencies minimal (use built-in Node.js where possible)
- Make it fast enough for pre-commit hooks
- Provide helpful error messages with line numbers
DEPENDENCIES: None (can work in parallel with docs)
```

### Wave 3: Integration (Sequential)
#### Subagent 4: integration - Integrate Validator into Development Workflow
```
TASK_NAME: integrate_sql_validator_workflow
TASK_GOAL: Seamlessly integrate SQL validation into the development and deployment workflow
REQUIREMENTS:
1. Add npm scripts for migration validation
2. Create pre-commit hook for SQL validation
3. Add validation step to supabase start process
4. Create GitHub Action for PR validation
5. Document usage in project README
6. Add validation to existing setup scripts
7. Create migration template generator command
8. Test complete workflow end-to-end
CONSTRAINTS:
- Don't break existing workflows
- Keep it optional initially (warnings not errors)
- Ensure fast execution for developer experience
- Make it easy to bypass when needed
DEPENDENCIES: Wave 1 & 2 completed (validator tool ready)
```

## Technical Details
**Files to modify**: 
- `/supabase/migrations/20250702000005_financial_tender_system.sql` - Fix syntax error
- `/supabase/migrations/20250702000001_initial_schema.sql` - Fix generated column reference
- `/supabase/migrations/20250702000003_sample_data.sql` - Fix or disable sample data

**New files to create**:
- `/docs/SQL_MIGRATION_GUIDELINES.md` - Comprehensive guidelines
- `/scripts/validate-migrations.ts` - Validation tool
- `/scripts/templates/migration-template.sql` - Template file
- `/.husky/pre-commit` - Git hook for validation

**Patterns to use**: 
- PostgreSQL 15+ generated column syntax
- Supabase migration best practices
- Node.js CLI tool patterns
- TypeScript for type safety

## Success Criteria
- All SQL migrations execute without errors
- Supabase starts successfully locally
- Comprehensive documentation prevents future issues
- Validation tool catches common errors before they occur
- Integrated workflow improves developer experience
- Team can add new features without SQL compatibility issues

## Status Tracking (For Coordinator)

### Wave 1: Foundation
- [ ] Subagent 1: fix_sql_migration_errors - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 2: Documentation & Tooling
- [ ] Subagent 2: create_sql_migration_guidelines - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________
- [ ] Subagent 3: build_sql_migration_validator - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Wave 3: Integration
- [ ] Subagent 4: integrate_sql_validator_workflow - Status: ⟳ IN_PROGRESS | 📊 AWAITING_EVALUATION | ✓ APPROVED | 🔄 RE-DELEGATED
  - Score: __/100 | Notes: ____________

### Overall Progress
- **Progress**: ___% (X/4 tasks approved)
- **Blocked**: ___
- **Re-delegated**: ___
- **Current Wave**: ___
- **Next Action**: ____________

### Decisions Made
- [Decision 1]: [Rationale and impact]
- [Decision 2]: [Rationale and impact]

## Common PostgreSQL Generated Column Rules (Quick Reference)

### ✅ Valid Generated Column Syntax
```sql
-- Direct calculation from same row
total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

-- Using SQL functions
full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,

-- Complex calculations (but no subqueries)
final_price DECIMAL(12,2) GENERATED ALWAYS AS (
  quantity * unit_price * (1 + COALESCE(tax_rate, 0) / 100)
) STORED
```

### ❌ Invalid Generated Column Patterns
```sql
-- Missing STORED keyword
total DECIMAL GENERATED ALWAYS AS (a + b), -- ERROR!

-- Referencing another generated column
final_price DECIMAL GENERATED ALWAYS AS (total_price * 1.1) STORED, -- ERROR!

-- Using subqueries
total DECIMAL GENERATED ALWAYS AS (
  (SELECT SUM(amount) FROM payments WHERE order_id = id)
) STORED, -- ERROR!

-- Comma before GENERATED
total DECIMAL(12,2), GENERATED ALWAYS AS (a + b) STORED -- ERROR!
```

## Expected Validation Tool Usage
```bash
# Validate all migrations
npm run validate:migrations

# Validate specific file
npm run validate:migrations -- supabase/migrations/20250702000005_financial_tender_system.sql

# Auto-fix common issues
npm run validate:migrations -- --fix

# Generate new migration from template
npm run migration:new -- create_users_table
```