# Formula PM 2.0 Analysis Infrastructure

This directory contains automated analysis tools for the Formula PM 2.0 construction project management system. The analysis infrastructure provides comprehensive code quality, security, performance, and maintainability assessments.

## Overview

The analysis system consists of five main components:

1. **TypeScript Analyzer** - Detects TypeScript compilation errors and type issues
2. **Bundle Analyzer** - Analyzes bundle size and identifies optimization opportunities
3. **Database Analyzer** - Monitors database query performance and RLS policies
4. **Security Analyzer** - Scans for security vulnerabilities in authentication and API endpoints
5. **Code Quality Analyzer** - Assesses code complexity, test coverage, and maintainability

## Quick Start

### Run Full Analysis
```bash
npm run analyze:full
```

### Run Individual Analyzers
```bash
npm run analyze:typescript    # TypeScript error detection
npm run analyze:bundle       # Bundle size analysis
npm run analyze:database     # Database performance monitoring
npm run analyze:security     # Security vulnerability scanning
npm run analyze:quality      # Code quality assessment
```

## Analysis Components

### 1. TypeScript Analyzer (`typescript-analyzer.js`)

**Purpose**: Identifies TypeScript compilation errors and type inconsistencies

**Features**:
- Compilation error detection and categorization
- TypeScript configuration validation
- Type safety analysis (any usage detection)
- Import/export validation

**Key Checks**:
- Critical compilation errors that prevent builds
- Missing type definitions
- Weak TypeScript configuration
- Usage of `any` type

### 2. Bundle Analyzer (`bundle-analyzer.js`)

**Purpose**: Analyzes bundle size and composition for performance optimization

**Features**:
- Bundle size analysis using webpack-bundle-analyzer
- Dependency optimization recommendations
- Code splitting opportunities
- Large chunk identification

**Key Checks**:
- Oversized bundles (>2MB total, >500KB per chunk)
- Heavy dependencies (moment, lodash, etc.)
- Duplicate functionality detection
- Missing optimization configurations

### 3. Database Analyzer (`database-analyzer.js`)

**Purpose**: Monitors database query performance and identifies optimization opportunities

**Features**:
- Migration analysis and validation
- RLS policy complexity assessment
- N+1 query problem detection
- Missing index identification

**Key Checks**:
- Complex RLS policies that may impact performance
- Potential N+1 query patterns in React components
- Missing indexes on foreign keys
- Database connection patterns

### 4. Security Analyzer (`security-analyzer.js`)

**Purpose**: Comprehensive security vulnerability assessment

**Features**:
- Authentication system security audit
- API endpoint authorization validation
- Input validation and sanitization checks
- Data exposure risk assessment

**Key Checks**:
- SQL injection vulnerabilities
- Missing authentication on API endpoints
- Hardcoded secrets and credentials
- Missing Row Level Security (RLS) policies
- XSS and path traversal vulnerabilities

### 5. Code Quality Analyzer (`code-quality-analyzer.js`)

**Purpose**: Assesses code maintainability and technical debt

**Features**:
- Cyclomatic complexity analysis
- Test coverage assessment
- Code duplication detection
- Documentation quality evaluation

**Key Checks**:
- High complexity functions (>20 cyclomatic complexity)
- Low test coverage (<70%)
- Long functions and large files
- Code smells and technical debt

## Configuration

The analysis system can be configured via `analysis-config.json`:

```json
{
  "analysis": {
    "typescript": { "enabled": true, "strictMode": true },
    "bundle": { "enabled": true, "maxBundleSize": 2000000 },
    "database": { "enabled": true, "checkRLSPolicies": true },
    "security": { "enabled": true, "checkSQLInjection": true },
    "codeQuality": { "enabled": true, "minTestCoverage": 70 }
  }
}
```

## Output Reports

The analysis generates three types of reports:

### 1. JSON Report (`analysis-report.json`)
- Machine-readable format for CI/CD integration
- Complete analysis results with metadata
- Suitable for automated processing

### 2. HTML Report (`analysis-report.html`)
- Interactive web-based report
- Visual charts and graphs
- Detailed issue breakdown with navigation

### 3. Markdown Summary (`analysis-summary.md`)
- Human-readable summary
- Production blocker identification
- High-level recommendations

## Issue Severity Levels

- **Critical**: Production blockers that must be fixed before deployment
- **High**: Significant issues that should be addressed soon
- **Medium**: Important improvements that can be planned
- **Low**: Minor issues and code quality improvements

## Production Blockers

Issues marked as production blockers include:
- Critical security vulnerabilities (SQL injection, hardcoded secrets)
- TypeScript compilation errors
- Missing authentication on sensitive endpoints
- Tables without Row Level Security

## Integration with CI/CD

The analysis system can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions integration
- name: Run Security Analysis
  run: npm run analyze:security
  
- name: Check for Production Blockers
  run: |
    if [ $(jq '.summary.productionBlockers | length' analysis-reports/analysis-report.json) -gt 0 ]; then
      echo "Production blockers found!"
      exit 1
    fi
```

## Troubleshooting

### Common Issues

1. **Build failures during bundle analysis**
   - Ensure all dependencies are installed: `npm install`
   - Check for TypeScript errors: `npm run type-check`

2. **Missing migration files**
   - Ensure Supabase is initialized: `supabase init`
   - Check migration directory exists: `supabase/migrations/`

3. **Test coverage analysis fails**
   - Verify Jest configuration: `jest.config.js`
   - Run tests manually: `npm test`

### Performance Considerations

- Full analysis may take 2-5 minutes depending on codebase size
- Individual analyzers can be run separately for faster feedback
- Consider running full analysis in CI/CD and individual analyzers during development

## Contributing

To add new analysis rules or improve existing ones:

1. Modify the appropriate analyzer file
2. Add configuration options to `analysis-config.json`
3. Update tests and documentation
4. Test with `node scripts/analysis/cli-runners.js <analyzer>`

## Architecture

```
analysis-orchestrator.js     # Main coordinator
├── typescript-analyzer.js   # TypeScript analysis
├── bundle-analyzer.js       # Bundle size analysis
├── database-analyzer.js     # Database performance
├── security-analyzer.js     # Security vulnerabilities
├── code-quality-analyzer.js # Code quality metrics
├── cli-runners.js          # Individual CLI runners
├── analysis-config.json    # Configuration
└── README.md              # This file
```

Each analyzer follows a consistent interface:
- `analyze()` method returns standardized results
- Issues categorized by severity and type
- Recommendations provided for each issue
- Metadata included for programmatic processing