# Using Gemini MCP Tool for Large Codebase Analysis

When analyzing large codebases or multiple files that might exceed context limits, use the Gemini MCP Tool with its massive context window. This tool bridges Claude with Google Gemini's large context capacity through natural language commands.

## MCP Tool Overview

The `gemini-mcp-tool` is a Model Context Protocol server that allows Claude to interact with Gemini AI for powerful file and codebase analysis. It uses natural language commands with `@` syntax for file inclusion.

**Installation Status**: ✅ Installed as `gemini-mcp-tool@1.1.1`

## File and Directory Inclusion Syntax

Use natural language commands with the `@` syntax to include files and directories. The paths should be relative to your current working directory:

### Examples:

**Single file analysis:**
```
Ask gemini to analyze @src/main.py and explain this file's purpose and structure
```

**Multiple files:**
```
Use gemini to analyze @package.json and @src/index.js to understand the dependencies used in the code
```

**Entire directory:**
```
Ask gemini to summarize the architecture of @src/ directory
```

**Multiple directories:**
```
Use gemini to analyze @src/ and @tests/ directories for test coverage analysis
```

**Current directory and subdirectories:**
```
Ask gemini to give an overview of @./ entire project structure
```

## Implementation Verification Examples

**Check if a feature is implemented:**
```
Ask gemini to analyze @src/ and @lib/ directories to check if dark mode has been implemented and show me the relevant files and functions
```

**Verify authentication implementation:**
```
Use gemini to examine @src/ and @middleware/ to determine if JWT authentication is implemented and list all auth-related endpoints and middleware
```

**Check for specific patterns:**
```
Ask gemini to analyze @src/ directory and find any React hooks that handle WebSocket connections, listing them with file paths
```

**Verify error handling:**
```
Use gemini to examine @src/ and @api/ directories to check if proper error handling is implemented for all API endpoints and show examples of try-catch blocks
```

**Check for rate limiting:**
```
Ask gemini to analyze @backend/ and @middleware/ directories to determine if rate limiting is implemented for the API and show implementation details
```

**Verify caching strategy:**
```
Use gemini to examine @src/, @lib/, and @services/ directories to check if Redis caching is implemented and list all cache-related functions and their usage
```

**Check for specific security measures:**
```
Ask gemini to analyze @src/ and @api/ directories to verify if SQL injection protections are implemented and show how user inputs are sanitized
```

**Verify test coverage for features:**
```
Use gemini to examine @src/payment/ and @tests/ directories to check if the payment processing module is fully tested and list all test cases
```

## When to Use Gemini MCP Tool

Use Gemini MCP tool when:
- Analyzing entire codebases or large directories that exceed Claude's context window
- Comparing multiple large files simultaneously
- Need to understand project-wide patterns or architecture
- Working with files totaling more than 100KB
- Verifying if specific features, patterns, or security measures are implemented
- Checking for the presence of certain coding patterns across the entire codebase
- Performing comprehensive codebase analysis that requires Gemini's large context window

## Setup and Configuration

### Prerequisites
- Node.js (v16.0.0+)
- MCP tool installed: `npm install -g gemini-mcp-tool` ✅
- Google Gemini API access (configured automatically)

### MCP Server Status
The Gemini MCP tool is installed and ready to use. It runs as an MCP server that bridges Claude with Google Gemini's analysis capabilities.

### Usage Notes
- Paths in @ syntax are relative to your current working directory
- Use natural language commands to interact with the tool
- The MCP server includes file contents directly in the context
- Gemini's context window can handle entire codebases that would overflow Claude's context
- When checking implementations, be specific about what you're looking for to get accurate results
- The tool works within Claude's MCP environment for seamless integration

# SQL Migration Validation System

## Overview
The project includes a comprehensive SQL migration validation system to prevent database compatibility issues. This system was implemented to resolve PostgreSQL/Supabase migration errors and ensure future migrations are error-free.

## Validation Tool Usage

### Quick Validation
Run validation on all migrations:
```bash
npm run validate-migrations
```

### Command Line Options
```bash
# Validate specific file
npx tsx scripts/validate-migrations.ts supabase/migrations/migration.sql

# Validate entire directory
npx tsx scripts/validate-migrations.ts supabase/migrations/

# Auto-fix issues where possible
npx tsx scripts/validate-migrations.ts supabase/migrations/ --fix

# Get detailed output
npx tsx scripts/validate-migrations.ts supabase/migrations/ --verbose

# JSON output for CI/CD
npx tsx scripts/validate-migrations.ts supabase/migrations/ --format json
```

### Validation Rules
The validator checks for:
1. **Generated Column Syntax** - Proper GENERATED ALWAYS AS syntax
2. **Foreign Key References** - Ensures referenced tables exist
3. **Subqueries in Generated Columns** - Detects illegal SELECT statements
4. **Missing STORED Keywords** - Validates generated columns have STORED
5. **Comma Placement** - Checks for syntax errors in comma usage
6. **Table References** - Validates all table references exist
7. **Column Definitions** - Checks data types and constraints
8. **Index Creation** - Validates index naming conventions
9. **Constraint Naming** - Ensures proper constraint prefixes

### Integration Points
- **Pre-commit Hook**: Automatically runs on `git commit`
- **GitHub Actions**: Validates PRs with `/validate-sql` comment
- **NPM Scripts**: `npm run validate-migrations` for manual runs
- **CI/CD Pipeline**: Integrated into build process

### Key Files
- `scripts/validate-migrations.ts` - Main validation tool
- `POSTGRESQL_SUPABASE_MIGRATION_GUIDELINES.md` - Comprehensive migration guidelines
- `.github/workflows/validate-sql.yml` - GitHub Actions workflow
- `jest.config.js` - Test configuration with TypeScript support

## Migration Best Practices

### Generated Columns
```sql
-- ✅ Correct
price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,

-- ❌ Incorrect - missing STORED
price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price),

-- ❌ Incorrect - subquery not allowed
price DECIMAL(10,2) GENERATED ALWAYS AS (SELECT price FROM products WHERE id = product_id) STORED,
```

### Foreign Key References
```sql
-- ✅ Correct - table exists in same migration
CREATE TABLE projects (id UUID PRIMARY KEY);
CREATE TABLE tasks (
  project_id UUID REFERENCES projects(id)
);

-- ❌ Incorrect - referenced table not found
CREATE TABLE tasks (
  project_id UUID REFERENCES missing_table(id)
);
```

### Testing
Run the validation test suite:
```bash
npm test -- --testNamePattern="validate-migrations"
```

### Status
✅ **Fully Implemented** - All validation rules active
✅ **CI/CD Integrated** - GitHub Actions workflow ready
✅ **Developer Workflow** - Pre-commit hooks configured
✅ **Documentation** - Comprehensive guidelines available

### Troubleshooting

#### Windows Git Bash npm Error
If you get `npm: No such file or directory` error on Windows:
1. The pre-commit hook has been updated to handle Windows environments
2. Use `git commit --no-verify` to bypass temporarily
3. See `docs/GIT_BASH_NPM_TROUBLESHOOTING.md` for detailed solutions