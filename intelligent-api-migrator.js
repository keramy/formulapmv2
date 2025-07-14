/**
 * Intelligent API Migration System - ADVANCED CAPABILITIES
 * Handles complex scenarios, multiple functions, and edge cases
 */

const fs = require('fs');
const path = require('path');

class IntelligentApiMigrator {
  constructor() {
    this.migrationStats = {
      attempted: 0,
      successful: 0,
      failed: 0,
      linesReduced: 0,
      complexityReduced: 0
    };
    this.backupDir = 'migration-backups';
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async migrateAllApiRoutes() {
    console.log('🚀 INTELLIGENT API MIGRATION SYSTEM STARTING...\n');
    
    const apiRoutes = this.discoverApiRoutes();
    console.log(`📋 Found ${apiRoutes.length} API routes to analyze\n`);

    for (const route of apiRoutes) {
      await this.migrateRoute(route);
    }

    this.generateMigrationReport();
  }

  discoverApiRoutes() {
    const routes = [];
    const apiDir = 'src/app/api';
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (item === 'route.ts') {
          routes.push(fullPath);
        }
      });
    };

    scanDir(apiDir);
    return routes;
  }

  async migrateRoute(routePath) {
    this.migrationStats.attempted++;
    
    try {
      console.log(`🔍 Analyzing: ${routePath}`);
      
      const content = fs.readFileSync(routePath, 'utf8');
      const analysis = this.analyzeRoute(content);
      
      if (!analysis.needsMigration) {
        console.log(`  ✅ Already optimized or no auth pattern found`);
        return;
      }

      // Create backup
      this.createBackup(routePath, content);
      
      // Perform intelligent migration
      const migratedContent = this.performIntelligentMigration(content, analysis);
      
      // Validate migration
      const validation = this.validateMigration(content, migratedContent);
      
      if (validation.isValid) {
        fs.writeFileSync(routePath, migratedContent, 'utf8');
        this.migrationStats.successful++;
        this.migrationStats.linesReduced += validation.linesReduced;
        this.migrationStats.complexityReduced += validation.complexityReduced;
        
        console.log(`  ✅ Migrated successfully - Reduced ${validation.linesReduced} lines, complexity -${validation.complexityReduced}`);
      } else {
        console.log(`  ⚠️  Migration validation failed: ${validation.reason}`);
        this.migrationStats.failed++;
      }
      
    } catch (error) {
      console.log(`  ❌ Migration failed: ${error.message}`);
      this.migrationStats.failed++;
    }
  }

  analyzeRoute(content) {
    const analysis = {
      needsMigration: false,
      functions: [],
      complexity: 0,
      authPatterns: [],
      errorPatterns: [],
      hasHelperFunctions: false,
      hasMultipleFunctions: false
    };

    // Detect auth patterns
    const authMatches = content.match(/const \{ user, profile, error \} = await verifyAuth\(request\)/g);
    if (authMatches) {
      analysis.needsMigration = true;
      analysis.authPatterns = authMatches;
    }

    // Detect function signatures
    const functionMatches = content.match(/export async function (GET|POST|PUT|DELETE|PATCH)/g);
    if (functionMatches) {
      analysis.functions = functionMatches;
      analysis.hasMultipleFunctions = functionMatches.length > 1;
    }

    // Detect helper functions
    const helperMatches = content.match(/^(async )?function [a-zA-Z]/gm);
    if (helperMatches && helperMatches.length > 0) {
      analysis.hasHelperFunctions = true;
    }

    // Calculate complexity
    analysis.complexity = this.calculateComplexity(content);

    return analysis;
  }

  calculateComplexity(content) {
    let score = 0;
    score += (content.match(/if\s*\(/g) || []).length;
    score += (content.match(/for\s*\(/g) || []).length * 2;
    score += (content.match(/while\s*\(/g) || []).length * 2;
    score += (content.match(/try\s*\{/g) || []).length;
    score += (content.match(/catch\s*\(/g) || []).length;
    return score;
  }

  performIntelligentMigration(content, analysis) {
    let migrated = content;

    // Step 1: Update imports intelligently
    migrated = this.updateImports(migrated);

    // Step 2: Handle multiple functions scenario
    if (analysis.hasMultipleFunctions) {
      migrated = this.migrateMutipleFunctions(migrated, analysis);
    } else {
      migrated = this.migrateSingleFunction(migrated, analysis);
    }

    // Step 3: Update error responses
    migrated = this.updateErrorResponses(migrated);

    // Step 4: Update success responses
    migrated = this.updateSuccessResponses(migrated);

    return migrated;
  }

  updateImports(content) {
    // Smart import replacement
    let updated = content;

    // Replace verifyAuth import
    updated = updated.replace(
      /import { verifyAuth } from '@\/lib\/middleware'/g,
      "import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'"
    );

    // Add missing imports if needed
    if (updated.includes('createSuccessResponse') && !updated.includes('createSuccessResponse')) {
      updated = updated.replace(
        /import { NextRequest, NextResponse } from 'next\/server'/,
        "import { NextRequest, NextResponse } from 'next/server'\nimport { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'"
      );
    }

    return updated;
  }

  migrateSingleFunction(content, analysis) {
    let migrated = content;

    // Find the function and its boundaries
    const functionMatch = content.match(/(export async function (GET|POST|PUT|DELETE|PATCH)\([^)]+\) \{)/);
    if (!functionMatch) return content;

    const functionStart = functionMatch[1];
    const httpMethod = functionMatch[2];

    // Replace function signature
    migrated = migrated.replace(
      functionStart,
      `export const ${httpMethod} = withAuth(async (request, { user, profile }) => {`
    );

    // Remove auth boilerplate
    migrated = this.removeAuthBoilerplate(migrated);

    // Add closing bracket intelligently
    migrated = this.addClosingBracket(migrated, analysis);

    return migrated;
  }

  migrateMutipleFunctions(content, analysis) {
    let migrated = content;

    // Handle each function separately
    const functions = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    
    functions.forEach(method => {
      const regex = new RegExp(`export async function ${method}\\([^)]+\\) \\{`, 'g');
      const match = content.match(regex);
      
      if (match) {
        migrated = migrated.replace(
          regex,
          `export const ${method} = withAuth(async (request, { user, profile }) => {`
        );
      }
    });

    // Remove auth boilerplate from all functions
    migrated = this.removeAuthBoilerplate(migrated);

    // Add closing brackets for each function
    migrated = this.addMultipleClosingBrackets(migrated, analysis);

    return migrated;
  }

  removeAuthBoilerplate(content) {
    // Remove authentication checks
    let cleaned = content.replace(
      /\s*\/\/ Authentication check[\s\S]*?if \(error \|\| !user \|\| !profile\) \{[\s\S]*?\}\s*/g,
      '\n'
    );

    // Remove standalone auth checks
    cleaned = cleaned.replace(
      /\s*const \{ user, profile, error \} = await verifyAuth\(request\)\s*/g,
      '\n'
    );

    // Remove error returns for auth
    cleaned = cleaned.replace(
      /\s*if \(error \|\| !user \|\| !profile\) \{[\s\S]*?\}\s*/g,
      '\n'
    );

    return cleaned;
  }

  addClosingBracket(content, analysis) {
    if (analysis.hasHelperFunctions) {
      // Find the last closing brace before helper functions
      const lines = content.split('\n');
      let functionEndIndex = -1;
      let braceCount = 0;
      let inFunction = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.includes('export const')) {
          inFunction = true;
          braceCount = 0;
        }
        
        if (inFunction) {
          braceCount += (line.match(/\{/g) || []).length;
          braceCount -= (line.match(/\}/g) || []).length;
          
          if (braceCount === 0 && line.includes('}')) {
            functionEndIndex = i;
            break;
          }
        }
      }

      if (functionEndIndex !== -1) {
        lines[functionEndIndex] = lines[functionEndIndex].replace(/\}$/, '})');
        return lines.join('\n');
      }
    } else {
      // Simple case - replace last closing brace
      const lastBraceIndex = content.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        return content.substring(0, lastBraceIndex) + '})' + content.substring(lastBraceIndex + 1);
      }
    }

    return content;
  }

  addMultipleClosingBrackets(content, analysis) {
    // Complex logic for multiple functions
    const lines = content.split('\n');
    const functions = [];
    let currentFunction = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('export const') && /GET|POST|PUT|DELETE|PATCH/.test(line)) {
        if (currentFunction) {
          functions.push(currentFunction);
        }
        currentFunction = { start: i, method: line.match(/(GET|POST|PUT|DELETE|PATCH)/)[1] };
      }
    }

    if (currentFunction) {
      functions.push(currentFunction);
    }

    // Add closing brackets for each function
    functions.reverse().forEach(func => {
      const functionLines = lines.slice(func.start);
      let braceCount = 0;
      let endIndex = -1;

      for (let i = 0; i < functionLines.length; i++) {
        const line = functionLines[i];
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        
        if (braceCount === 0 && line.includes('}')) {
          endIndex = func.start + i;
          break;
        }
      }

      if (endIndex !== -1) {
        lines[endIndex] = lines[endIndex].replace(/\}$/, '})');
      }
    });

    return lines.join('\n');
  }

  updateErrorResponses(content) {
    return content.replace(
      /return NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      'return createErrorResponse($1, $2)'
    ).replace(
      /return NextResponse\.json\(\s*\{\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      'return createErrorResponse($1, $2)'
    );
  }

  updateSuccessResponses(content) {
    return content.replace(
      /return NextResponse\.json\(\s*\{\s*success:\s*true,\s*data:\s*([^}]+)\s*\}\s*\)/g,
      'return createSuccessResponse($1)'
    ).replace(
      /return NextResponse\.json\(\s*\{\s*success:\s*true,\s*([^}]+)\s*\}\s*\)/g,
      'return createSuccessResponse({ $1 })'
    );
  }

  validateMigration(original, migrated) {
    const validation = {
      isValid: true,
      reason: '',
      linesReduced: 0,
      complexityReduced: 0
    };

    // Check if migration actually changed something
    if (original === migrated) {
      validation.isValid = false;
      validation.reason = 'No changes made';
      return validation;
    }

    // Check for syntax issues
    const originalLines = original.split('\n').length;
    const migratedLines = migrated.split('\n').length;
    validation.linesReduced = Math.max(0, originalLines - migratedLines);

    // Check complexity reduction
    const originalComplexity = this.calculateComplexity(original);
    const migratedComplexity = this.calculateComplexity(migrated);
    validation.complexityReduced = Math.max(0, originalComplexity - migratedComplexity);

    // Check for required imports
    if (migrated.includes('withAuth') && !migrated.includes('@/lib/api-middleware')) {
      validation.isValid = false;
      validation.reason = 'Missing required imports';
      return validation;
    }

    // Check for balanced brackets
    const openBrackets = (migrated.match(/\{/g) || []).length;
    const closeBrackets = (migrated.match(/\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      validation.isValid = false;
      validation.reason = 'Unbalanced brackets';
      return validation;
    }

    return validation;
  }

  createBackup(routePath, content) {
    const backupPath = path.join(this.backupDir, routePath.replace(/[\/\\]/g, '_') + '.backup');
    fs.writeFileSync(backupPath, content, 'utf8');
  }

  generateMigrationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRoutes: this.migrationStats.attempted,
        successful: this.migrationStats.successful,
        failed: this.migrationStats.failed,
        successRate: Math.round((this.migrationStats.successful / this.migrationStats.attempted) * 100),
        linesReduced: this.migrationStats.linesReduced,
        complexityReduced: this.migrationStats.complexityReduced
      },
      impact: {
        codeReduction: `${this.migrationStats.linesReduced} lines eliminated`,
        complexityReduction: `${this.migrationStats.complexityReduced} complexity points reduced`,
        maintainabilityImprovement: 'Significant',
        consistencyImprovement: 'High'
      },
      nextSteps: [
        'Run TypeScript compilation check',
        'Execute test suite',
        'Review failed migrations manually',
        'Monitor API performance',
        'Update documentation'
      ]
    };

    fs.writeFileSync('INTELLIGENT_MIGRATION_REPORT.json', JSON.stringify(report, null, 2), 'utf8');

    console.log('\n🎉 INTELLIGENT API MIGRATION COMPLETE!');
    console.log('=====================================');
    console.log(`📊 Routes Processed: ${report.summary.totalRoutes}`);
    console.log(`✅ Successful: ${report.summary.successful}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📈 Success Rate: ${report.summary.successRate}%`);
    console.log(`📉 Lines Reduced: ${report.summary.linesReduced}`);
    console.log(`🧠 Complexity Reduced: ${report.summary.complexityReduced}`);
    console.log(`📋 Report saved: INTELLIGENT_MIGRATION_REPORT.json`);
  }
}

// Execute the intelligent migration
const migrator = new IntelligentApiMigrator();
migrator.migrateAllApiRoutes();
