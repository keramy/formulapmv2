#!/usr/bin/env node

/**
 * Migration Helper Script
 * Helps identify and migrate files to use optimization patterns
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'src'),
  apiDir: path.join(__dirname, '..', 'src', 'app', 'api'),
  hooksDir: path.join(__dirname, '..', 'src', 'hooks'),
  componentsDir: path.join(__dirname, '..', 'src', 'components'),
  patterns: {
    verifyAuth: /verifyAuth/g,
    withAuth: /withAuth/g,
    useState: /useState.*loading/g,
    useApiQuery: /useApiQuery/g,
    loadingCheck: /if.*loading.*return/g,
    DataStateWrapper: /DataStateWrapper/g,
    inlineSchema: /z\.object\(/g,
    centralizedValidation: /validateData/g
  }
};

// Utilities
function findFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(dir);
  return files;
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return '';
  }
}

function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

function countMatches(content, pattern) {
  return (content.match(pattern) || []).length;
}

// Analysis functions
function analyzeApiRoutes() {
  console.log('🔍 Analyzing API Routes...');
  
  const apiFiles = findFiles(CONFIG.apiDir, ['.ts']);
  const results = {
    total: apiFiles.length,
    needsMigration: [],
    alreadyMigrated: []
  };
  
  apiFiles.forEach(file => {
    const content = readFile(file);
    const hasVerifyAuth = countMatches(content, CONFIG.patterns.verifyAuth) > 0;
    const hasWithAuth = countMatches(content, CONFIG.patterns.withAuth) > 0;
    
    if (hasVerifyAuth && !hasWithAuth) {
      results.needsMigration.push({
        file: file.replace(CONFIG.srcDir, ''),
        verifyAuthCount: countMatches(content, CONFIG.patterns.verifyAuth)
      });
    } else if (hasWithAuth) {
      results.alreadyMigrated.push({
        file: file.replace(CONFIG.srcDir, ''),
        withAuthCount: countMatches(content, CONFIG.patterns.withAuth)
      });
    }
  });
  
  return results;
}

function analyzeHooks() {
  console.log('🔍 Analyzing Hooks...');
  
  const hookFiles = findFiles(CONFIG.hooksDir, ['.ts', '.tsx']);
  const results = {
    total: hookFiles.length,
    needsMigration: [],
    alreadyMigrated: []
  };
  
  hookFiles.forEach(file => {
    const content = readFile(file);
    const hasManualLoading = countMatches(content, CONFIG.patterns.useState) > 0;
    const hasUseApiQuery = countMatches(content, CONFIG.patterns.useApiQuery) > 0;
    
    if (hasManualLoading && !hasUseApiQuery) {
      results.needsMigration.push({
        file: file.replace(CONFIG.srcDir, ''),
        loadingStates: countMatches(content, CONFIG.patterns.useState)
      });
    } else if (hasUseApiQuery) {
      results.alreadyMigrated.push({
        file: file.replace(CONFIG.srcDir, ''),
        useApiQueryCount: countMatches(content, CONFIG.patterns.useApiQuery)
      });
    }
  });
  
  return results;
}

function analyzeComponents() {
  console.log('🔍 Analyzing Components...');
  
  const componentFiles = findFiles(CONFIG.componentsDir, ['.tsx']);
  const results = {
    total: componentFiles.length,
    needsMigration: [],
    alreadyMigrated: []
  };
  
  componentFiles.forEach(file => {
    const content = readFile(file);
    const hasLoadingCheck = countMatches(content, CONFIG.patterns.loadingCheck) > 0;
    const hasDataStateWrapper = countMatches(content, CONFIG.patterns.DataStateWrapper) > 0;
    
    if (hasLoadingCheck && !hasDataStateWrapper) {
      results.needsMigration.push({
        file: file.replace(CONFIG.srcDir, ''),
        loadingChecks: countMatches(content, CONFIG.patterns.loadingCheck)
      });
    } else if (hasDataStateWrapper) {
      results.alreadyMigrated.push({
        file: file.replace(CONFIG.srcDir, ''),
        dataStateWrapperCount: countMatches(content, CONFIG.patterns.DataStateWrapper)
      });
    }
  });
  
  return results;
}

function analyzeForms() {
  console.log('🔍 Analyzing Forms...');
  
  const componentFiles = findFiles(CONFIG.componentsDir, ['.tsx']);
  const results = {
    total: 0,
    needsMigration: [],
    alreadyMigrated: []
  };
  
  componentFiles.forEach(file => {
    const content = readFile(file);
    const hasInlineSchema = countMatches(content, CONFIG.patterns.inlineSchema) > 0;
    const hasCentralizedValidation = countMatches(content, CONFIG.patterns.centralizedValidation) > 0;
    
    if (hasInlineSchema || hasCentralizedValidation) {
      results.total++;
      
      if (hasInlineSchema && !hasCentralizedValidation) {
        results.needsMigration.push({
          file: file.replace(CONFIG.srcDir, ''),
          inlineSchemas: countMatches(content, CONFIG.patterns.inlineSchema)
        });
      } else if (hasCentralizedValidation) {
        results.alreadyMigrated.push({
          file: file.replace(CONFIG.srcDir, ''),
          centralizedValidationCount: countMatches(content, CONFIG.patterns.centralizedValidation)
        });
      }
    }
  });
  
  return results;
}

// Migration functions
function generateMigrationPlan(analysis) {
  console.log('\n📋 Migration Plan Generated:');
  console.log('============================');
  
  // API Routes
  console.log(`\n🚀 API Routes (${analysis.apiRoutes.needsMigration.length} files need migration):`);
  analysis.apiRoutes.needsMigration.forEach(item => {
    console.log(`  - ${item.file} (${item.verifyAuthCount} verifyAuth calls)`);
  });
  
  // Hooks
  console.log(`\n🎯 Hooks (${analysis.hooks.needsMigration.length} files need migration):`);
  analysis.hooks.needsMigration.forEach(item => {
    console.log(`  - ${item.file} (${item.loadingStates} loading states)`);
  });
  
  // Components
  console.log(`\n🎨 Components (${analysis.components.needsMigration.length} files need migration):`);
  analysis.components.needsMigration.forEach(item => {
    console.log(`  - ${item.file} (${item.loadingChecks} loading checks)`);
  });
  
  // Forms
  console.log(`\n📝 Forms (${analysis.forms.needsMigration.length} files need migration):`);
  analysis.forms.needsMigration.forEach(item => {
    console.log(`  - ${item.file} (${item.inlineSchemas} inline schemas)`);
  });
  
  return {
    totalFiles: analysis.apiRoutes.needsMigration.length + 
               analysis.hooks.needsMigration.length + 
               analysis.components.needsMigration.length + 
               analysis.forms.needsMigration.length,
    categories: {
      apiRoutes: analysis.apiRoutes.needsMigration.length,
      hooks: analysis.hooks.needsMigration.length,
      components: analysis.components.needsMigration.length,
      forms: analysis.forms.needsMigration.length
    }
  };
}

function validateMigration() {
  console.log('\n🔍 Validating Migration...');
  
  try {
    // TypeScript compilation check
    console.log('  ✅ Checking TypeScript compilation...');
    execSync('npm run type-check', { stdio: 'pipe' });
    
    // Build check
    console.log('  ✅ Checking build...');
    execSync('npm run build', { stdio: 'pipe' });
    
    // Lint check
    console.log('  ✅ Checking lint...');
    execSync('npm run lint', { stdio: 'pipe' });
    
    console.log('  ✅ All validation checks passed!');
    return true;
  } catch (error) {
    console.log('  ❌ Validation failed:', error.message);
    return false;
  }
}

function generateProgressReport(analysis) {
  const apiProgress = analysis.apiRoutes.alreadyMigrated.length / 
                     (analysis.apiRoutes.alreadyMigrated.length + analysis.apiRoutes.needsMigration.length) * 100;
  
  const hookProgress = analysis.hooks.alreadyMigrated.length / 
                      (analysis.hooks.alreadyMigrated.length + analysis.hooks.needsMigration.length) * 100;
  
  const componentProgress = analysis.components.alreadyMigrated.length / 
                           (analysis.components.alreadyMigrated.length + analysis.components.needsMigration.length) * 100;
  
  const formProgress = analysis.forms.alreadyMigrated.length / 
                      (analysis.forms.alreadyMigrated.length + analysis.forms.needsMigration.length) * 100;
  
  console.log('\n📊 Migration Progress Report:');
  console.log('==============================');
  console.log(`🚀 API Routes: ${apiProgress.toFixed(1)}% complete`);
  console.log(`🎯 Hooks: ${hookProgress.toFixed(1)}% complete`);
  console.log(`🎨 Components: ${componentProgress.toFixed(1)}% complete`);
  console.log(`📝 Forms: ${formProgress.toFixed(1)}% complete`);
  
  const overallProgress = (apiProgress + hookProgress + componentProgress + formProgress) / 4;
  console.log(`\n🎯 Overall Progress: ${overallProgress.toFixed(1)}% complete`);
  
  return {
    apiRoutes: apiProgress,
    hooks: hookProgress,
    components: componentProgress,
    forms: formProgress,
    overall: overallProgress
  };
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  console.log('🔧 Formula PM Migration Helper');
  console.log('===============================');
  
  switch (command) {
    case 'analyze':
      const analysis = {
        apiRoutes: analyzeApiRoutes(),
        hooks: analyzeHooks(),
        components: analyzeComponents(),
        forms: analyzeForms()
      };
      
      const migrationPlan = generateMigrationPlan(analysis);
      const progress = generateProgressReport(analysis);
      
      console.log(`\n📈 Summary: ${migrationPlan.totalFiles} files need migration`);
      console.log(`📊 Overall progress: ${progress.overall.toFixed(1)}%`);
      break;
      
    case 'validate':
      const isValid = validateMigration();
      process.exit(isValid ? 0 : 1);
      break;
      
    case 'progress':
      const progressAnalysis = {
        apiRoutes: analyzeApiRoutes(),
        hooks: analyzeHooks(),
        components: analyzeComponents(),
        forms: analyzeForms()
      };
      generateProgressReport(progressAnalysis);
      break;
      
    default:
      console.log('Usage:');
      console.log('  node migration-helper.js analyze   - Analyze codebase for migration opportunities');
      console.log('  node migration-helper.js validate  - Validate migration (TypeScript, build, lint)');
      console.log('  node migration-helper.js progress  - Show migration progress');
      break;
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  analyzeApiRoutes,
  analyzeHooks,
  analyzeComponents,
  analyzeForms,
  generateMigrationPlan,
  validateMigration,
  generateProgressReport
};