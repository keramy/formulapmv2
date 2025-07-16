#!/usr/bin/env node

/**
 * CLI Runners for Individual Analysis Tools
 * Allows running each analyzer independently for testing and debugging
 */

const path = require('path');

// Individual analyzer runners
async function runTypeScriptAnalyzer() {
  const TypeScriptAnalyzer = require('./typescript-analyzer');
  const analyzer = new TypeScriptAnalyzer();
  
  console.log('🔍 Running TypeScript Analysis...\n');
  const results = await analyzer.analyze();
  
  console.log('📊 TypeScript Analysis Results:');
  console.log(`- Total Issues: ${results.issues.length}`);
  console.log(`- Critical Issues: ${results.summary.criticalIssues}`);
  console.log(`- Type Errors: ${results.summary.typeErrors}`);
  console.log(`- Import Errors: ${results.summary.importErrors}`);
  
  if (results.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    results.recommendations.forEach(rec => {
      console.log(`- ${rec.title}: ${rec.description}`);
    });
  }
  
  return results;
}

async function runBundleAnalyzer() {
  const BundleAnalyzer = require('./bundle-analyzer');
  const analyzer = new BundleAnalyzer();
  
  console.log('📦 Running Bundle Analysis...\n');
  const results = await analyzer.analyze();
  
  console.log('📊 Bundle Analysis Results:');
  console.log(`- Total Issues: ${results.issues.length}`);
  console.log(`- Total Bundle Size: ${formatBytes(results.summary.totalBundleSize)}`);
  console.log(`- JavaScript Size: ${formatBytes(results.summary.javascriptSize)}`);
  console.log(`- CSS Size: ${formatBytes(results.summary.cssSize)}`);
  
  if (results.summary.largestChunks.length > 0) {
    console.log('\n📈 Largest Chunks:');
    results.summary.largestChunks.forEach(chunk => {
      console.log(`- ${chunk.name}: ${chunk.formattedSize}`);
    });
  }
  
  return results;
}

async function runDatabaseAnalyzer() {
  const DatabaseAnalyzer = require('./database-analyzer');
  const analyzer = new DatabaseAnalyzer();
  
  console.log('🗄️  Running Database Analysis...\n');
  const results = await analyzer.analyze();
  
  console.log('📊 Database Analysis Results:');
  console.log(`- Total Issues: ${results.issues.length}`);
  console.log(`- Performance Issues: ${results.summary.performanceIssues}`);
  console.log(`- RLS Policy Issues: ${results.summary.rlsPolicies}`);
  console.log(`- Missing Indexes: ${results.summary.missingIndexes}`);
  console.log(`- N+1 Problems: ${results.summary.n1Problems}`);
  
  return results;
}

async function runSecurityAnalyzer() {
  const SecurityAnalyzer = require('./security-analyzer');
  const analyzer = new SecurityAnalyzer();
  
  console.log('🔒 Running Security Analysis...\n');
  const results = await analyzer.analyze();
  
  console.log('📊 Security Analysis Results:');
  console.log(`- Total Vulnerabilities: ${results.summary.totalVulnerabilities}`);
  console.log(`- Critical Vulnerabilities: ${results.summary.criticalVulnerabilities}`);
  console.log(`- Authentication Issues: ${results.summary.authenticationIssues}`);
  console.log(`- Authorization Issues: ${results.summary.authorizationIssues}`);
  console.log(`- Input Validation Issues: ${results.summary.inputValidationIssues}`);
  
  return results;
}

async function runCodeQualityAnalyzer() {
  const CodeQualityAnalyzer = require('./code-quality-analyzer');
  const analyzer = new CodeQualityAnalyzer();
  
  console.log('📊 Running Code Quality Analysis...\n');
  const results = await analyzer.analyze();
  
  console.log('📊 Code Quality Analysis Results:');
  console.log(`- Total Issues: ${results.issues.length}`);
  console.log(`- Complex Files: ${results.summary.complexFiles}`);
  console.log(`- Test Coverage: ${results.summary.testCoverage}%`);
  console.log(`- Code Smells: ${results.summary.codeSmells}`);
  console.log(`- Technical Debt: ${results.summary.technicalDebtHours} hours`);
  console.log(`- Maintainability Index: ${results.summary.maintainabilityIndex}/100`);
  
  return results;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const runners = {
    'typescript': runTypeScriptAnalyzer,
    'bundle': runBundleAnalyzer,
    'database': runDatabaseAnalyzer,
    'security': runSecurityAnalyzer,
    'quality': runCodeQualityAnalyzer
  };
  
  if (!command || !runners[command]) {
    console.log('Usage: node cli-runners.js <command>');
    console.log('Commands:', Object.keys(runners).join(', '));
    process.exit(1);
  }
  
  runners[command]().catch(error => {
    console.error(`❌ ${command} analysis failed:`, error);
    process.exit(1);
  });
}

module.exports = {
  runTypeScriptAnalyzer,
  runBundleAnalyzer,
  runDatabaseAnalyzer,
  runSecurityAnalyzer,
  runCodeQualityAnalyzer
};