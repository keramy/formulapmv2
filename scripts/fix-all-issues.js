#!/usr/bin/env node

/**
 * Fix All Issues
 * Runs the comprehensive scanner and fixer to address all issues in the codebase
 */

const { ComprehensiveIssueScanner } = require('./comprehensive-issue-scanner');
const { ComprehensiveIssueFixer } = require('./comprehensive-issue-fixer');

async function main() {
  console.log('🚀 COMPREHENSIVE ISSUE RESOLUTION');
  console.log('================================');
  console.log('This script will scan the entire codebase for issues and fix them.');
  console.log('It will address both mixed role patterns and implementations.');
  console.log('\n⚠️  IMPORTANT NOTES:');
  console.log('• Backup files will be created automatically');
  console.log('• This will modify your source code');
  console.log('• Review changes before committing');
  console.log('• Test thoroughly after completion');
  
  console.log('\n🔍 PHASE 1: SCANNING FOR ISSUES');
  console.log('=============================');
  
  const scanner = new ComprehensiveIssueScanner();
  const scanResults = await scanner.execute();
  
  console.log('\n🔧 PHASE 2: FIXING ISSUES');
  console.log('=======================');
  
  const fixer = new ComprehensiveIssueFixer();
  const fixResults = await fixer.execute();
  
  console.log('\n📊 FINAL REPORT');
  console.log('=============');
  
  console.table({
    'Files Scanned': scanResults.filesScanned,
    'Files with Issues': scanResults.mixedPatterns.length + scanResults.implementations.length,
    'Files Fixed': fixResults.filesFixed,
    'Mixed Patterns Fixed': fixResults.mixedPatternsFixed,
    'implementations Fixed': fixResults.implementationsFixed,
    'Errors': fixResults.errors
  });
  
  if (fixResults.errors > 0) {
    console.log('\n⚠️  Some files could not be fixed automatically.');
    console.log('Please check the logs and fix these files manually.');
    process.exit(1);
  } else {
    console.log('\n✅ All issues have been addressed successfully.');
    process.exit(0);
  }
}

// Execute the main function
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});