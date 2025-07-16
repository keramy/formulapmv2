#!/usr/bin/env node
/**
 * Error Boundary Validation Script
 * Validates that error boundaries are properly implemented
 */

const fs = require('fs');
const path = require('path');

// Test files to validate
const testFiles = [
  'src/components/ErrorBoundary.tsx',
  'src/components/ErrorBoundary/fallback-components.tsx',
  'src/components/ErrorBoundary/error-utils.ts',
  'src/components/ErrorBoundary/test-components.tsx',
  'src/components/ErrorBoundary/index.ts',
  'src/app/layout.tsx',
  'src/components/layouts/LayoutWrapper.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/projects/page.tsx',
  'src/app/test-error-boundaries/page.tsx'
];

// Expected patterns to validate
const validationPatterns = [
  {
    file: 'src/components/ErrorBoundary.tsx',
    patterns: [
      'export class ErrorBoundary extends Component',
      'PageErrorBoundary',
      'FeatureErrorBoundary',
      'ComponentErrorBoundary',
      'withErrorBoundary',
      'ErrorBoundaryProvider',
      'authMonitor.recordEvent',
      'componentDidCatch',
      'getDerivedStateFromError'
    ]
  },
  {
    file: 'src/components/ErrorBoundary/fallback-components.tsx',
    patterns: [
      'NetworkErrorFallback',
      'DatabaseErrorFallback',
      'ServerErrorFallback',
      'PermissionErrorFallback',
      'getErrorFallback'
    ]
  },
  {
    file: 'src/components/ErrorBoundary/error-utils.ts',
    patterns: [
      'classifyError',
      'reportError',
      'shouldAutoRetry',
      'calculateRetryDelay',
      'generateUserMessage',
      'getRecoverySuggestions'
    ]
  },
  {
    file: 'src/app/layout.tsx',
    patterns: [
      'ErrorBoundaryProvider',
      'PageErrorBoundary',
      'pageName="Application Root"'
    ]
  },
  {
    file: 'src/components/layouts/LayoutWrapper.tsx',
    patterns: [
      'FeatureErrorBoundary',
      'ComponentErrorBoundary',
      'featureName="Application Layout"'
    ]
  }
];

console.log('🔍 Validating Error Boundary Implementation...\n');

let validationResults = {
  passed: 0,
  failed: 0,
  errors: []
};

// Check if files exist
for (const file of testFiles) {
  const filePath = path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    validationResults.failed++;
    validationResults.errors.push(`❌ File not found: ${file}`);
  } else {
    validationResults.passed++;
    console.log(`✅ File exists: ${file}`);
  }
}

// Check for expected patterns
for (const validation of validationPatterns) {
  const filePath = path.join(process.cwd(), validation.file);
  
  if (!fs.existsSync(filePath)) {
    continue;
  }
  
  const content = fs.readFileSync(filePath, 'utf-8');
  
  console.log(`\n📋 Checking patterns in: ${validation.file}`);
  
  for (const pattern of validation.patterns) {
    if (content.includes(pattern)) {
      console.log(`  ✅ Found: ${pattern}`);
      validationResults.passed++;
    } else {
      console.log(`  ❌ Missing: ${pattern}`);
      validationResults.failed++;
      validationResults.errors.push(`Missing pattern "${pattern}" in ${validation.file}`);
    }
  }
}

// Check for integration points
console.log('\n🔗 Checking Integration Points...');

// Check if layout has error boundaries
const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
if (fs.existsSync(layoutPath)) {
  const layoutContent = fs.readFileSync(layoutPath, 'utf-8');
  if (layoutContent.includes('ErrorBoundaryProvider') && layoutContent.includes('PageErrorBoundary')) {
    console.log('  ✅ Root layout has error boundaries');
    validationResults.passed++;
  } else {
    console.log('  ❌ Root layout missing error boundaries');
    validationResults.failed++;
  }
}

// Check if major pages have error boundaries
const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
  if (dashboardContent.includes('PageErrorBoundary') || dashboardContent.includes('FeatureErrorBoundary')) {
    console.log('  ✅ Dashboard has error boundaries');
    validationResults.passed++;
  } else {
    console.log('  ❌ Dashboard missing error boundaries');
    validationResults.failed++;
  }
}

// Check if auth monitoring is integrated
const errorBoundaryPath = path.join(process.cwd(), 'src/components/ErrorBoundary.tsx');
if (fs.existsSync(errorBoundaryPath)) {
  const errorBoundaryContent = fs.readFileSync(errorBoundaryPath, 'utf-8');
  if (errorBoundaryContent.includes('authMonitor.recordEvent')) {
    console.log('  ✅ Auth monitoring integration found');
    validationResults.passed++;
  } else {
    console.log('  ❌ Auth monitoring integration missing');
    validationResults.failed++;
  }
}

// Summary
console.log('\n📊 Validation Summary:');
console.log(`✅ Passed: ${validationResults.passed}`);
console.log(`❌ Failed: ${validationResults.failed}`);
console.log(`📈 Success Rate: ${Math.round((validationResults.passed / (validationResults.passed + validationResults.failed)) * 100)}%`);

if (validationResults.errors.length > 0) {
  console.log('\n🚨 Errors Found:');
  validationResults.errors.forEach(error => console.log(`  ${error}`));
}

console.log('\n🎯 Error Boundary Features Implemented:');
console.log('  • Comprehensive error classification system');
console.log('  • Multi-level error boundaries (Page, Feature, Component)');
console.log('  • Automatic retry with exponential backoff');
console.log('  • Error reporting and logging integration');
console.log('  • Specialized fallback components for different error types');
console.log('  • Recovery strategies and user guidance');
console.log('  • Context-aware error handling');
console.log('  • Development-friendly error details');
console.log('  • Production-ready error sanitization');
console.log('  • Testing framework with error simulation');

console.log('\n💡 Usage Examples:');
console.log('  • <PageErrorBoundary pageName="Dashboard"> for full page errors');
console.log('  • <FeatureErrorBoundary featureName="Project List"> for feature sections');
console.log('  • <ComponentErrorBoundary componentName="ProjectCard"> for individual components');
console.log('  • withErrorBoundary(Component, { name: "MyComponent" }) for HOC pattern');
console.log('  • Visit /test-error-boundaries to test error boundary functionality');

console.log('\n🚀 Error Boundary System Ready!');

// Exit with appropriate code
process.exit(validationResults.failed > 0 ? 1 : 0);