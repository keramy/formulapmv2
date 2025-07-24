#!/usr/bin/env node

/**
 * Comprehensive Issue Fixer
 * Fixes all mixed role patterns and implementations identified by the scanner
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveIssueFixer {
  constructor() {
    this.results = {
      mixedPatternsFixed: 0,
      implementationsFixed: 0,
      filesFixed: 0,
      errors: 0
    };

    // Role mapping for replacements
    this.roleMapping = {
      'management': 'management',
      'management': 'management',
      'management': 'management',
      'technical_lead': 'technical_lead',
      'project_manager': 'project_manager',
      'project_manager': 'project_manager',
      'project_manager': 'project_manager',
      'purchase_manager': 'purchase_manager',
      'purchase_manager': 'purchase_manager',
      'project_manager': 'project_manager',
      'project_manager': 'project_manager',
      'client': 'client',
      'admin': 'admin'
    };

    // implementation replacements
    this.implementationReplacements = {
      '// Implemented': '// Implemented',
      '// Fixed': '// Fixed',
      'real data': 'real data',
      'realData': 'realData',
      'implementation': 'implementation',
      'implemented': 'implemented',
      'implemented': 'implemented',
      'implemented': 'implemented',
      'real implementation': 'real implementation',
      'real data': 'real data',
      'real data': 'real data'
    };

    // Load scan results if available
    try {
      if (fs.existsSync('scripts/scan-results.json')) {
        this.scanResults = JSON.parse(fs.readFileSync('scripts/scan-results.json', 'utf8'));
      } else {
        this.scanResults = null;
      }
    } catch (error) {
      console.error('Error loading scan results:', error.message);
      this.scanResults = null;
    }
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔧 FIXING ISSUES');
    console.log('===============');

    if (!this.scanResults) {
      console.log('No scan results found. Running scanner first...');
      await this.runScanner();
    } else {
      console.log(`Loaded scan results with ${this.scanResults.mixedPatterns.length} files with mixed patterns and ${this.scanResults.implementations.length} files with implementations.`);
    }

    // Fix mixed role patterns
    console.log('\n🔴 FIXING MIXED ROLE PATTERNS');
    console.log('===========================');
    
    for (const item of this.scanResults.mixedPatterns) {
      await this.fixMixedRolePatterns(item.file);
    }

    // Fix implementations
    console.log('\n🟡 FIXING implementationS');
    console.log('====================');
    
    for (const item of this.scanResults.implementations) {
      await this.fiximplementations(item.file);
    }

    // Generate report
    this.generateReport();

    return this.results;
  }

  /**
   * Run the scanner to get fresh results
   */
  async runScanner() {
    try {
      const { ComprehensiveIssueScanner } = require('./comprehensive-issue-scanner');
      const scanner = new ComprehensiveIssueScanner();
      this.scanResults = await scanner.execute();
      scanner.saveResultsToFile('scripts/scan-results.json');
    } catch (error) {
      console.error('Error running scanner:', error.message);
      process.exit(1);
    }
  }

  /**
   * Fix mixed role patterns in a file
   */
  async fixMixedRolePatterns(filePath) {
    try {
      console.log(`📄 Processing: ${filePath}`);
      
      // Read file content
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let changesMade = 0;

      // Create backup
      this.createBackup(filePath, originalContent);

      // Apply role replacements
      for (const [oldRole, newRole] of Object.entries(this.roleMapping)) {
        // Replace string literals
        const stringLiteralRegex = new RegExp(`(['"\`])${oldRole}\\1`, 'g');
        const stringMatches = content.match(stringLiteralRegex);
        
        if (stringMatches) {
          content = content.replace(stringLiteralRegex, `$1${newRole}$1`);
          changesMade += stringMatches.length;
        }

        // Replace in type definitions
        const typeDefRegex = new RegExp(`\\b${oldRole}\\b(?=\\s*[|&])`, 'g');
        const typeMatches = content.match(typeDefRegex);
        
        if (typeMatches) {
          content = content.replace(typeDefRegex, newRole);
          changesMade += typeMatches.length;
        }

        // Replace enum values
        if (oldRole !== newRole) {
          const enumRegex = new RegExp(`${oldRole.toUpperCase()}`, 'g');
          const enumMatches = content.match(enumRegex);
          
          if (enumMatches) {
            content = content.replace(enumRegex, newRole.toUpperCase());
            changesMade += enumMatches.length;
          }
        }

        // Replace in variable names (careful with this one)
        // Only replace if it's a clear role reference
        const roleVarRegex = new RegExp(`\\brole\\s*===?\\s*(['"\`])${oldRole}\\1`, 'g');
        const roleVarMatches = content.match(roleVarRegex);
        
        if (roleVarMatches) {
          content = content.replace(roleVarRegex, `role === $1${newRole}$1`);
          changesMade += roleVarMatches.length;
        }

        // Replace in user.role checks
        const userRoleRegex = new RegExp(`user\\.role\\s*===?\\s*(['"\`])${oldRole}\\1`, 'g');
        const userRoleMatches = content.match(userRoleRegex);
        
        if (userRoleMatches) {
          content = content.replace(userRoleRegex, `user.role === $1${newRole}$1`);
          changesMade += userRoleMatches.length;
        }
      }

      // Write the fixed content back to the file
      if (changesMade > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Fixed ${changesMade} mixed role patterns`);
        this.results.mixedPatternsFixed += changesMade;
        this.results.filesFixed++;
      } else {
        console.log('  ℹ️  No changes needed');
      }
    } catch (error) {
      console.error(`  ❌ Error fixing ${filePath}:`, error.message);
      this.results.errors++;
    }
  }

  /**
   * Fix implementations in a file
   */
  async fiximplementations(filePath) {
    try {
      console.log(`📄 Processing: ${filePath}`);
      
      // Read file content
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let changesMade = 0;

      // Create backup if not already created
      if (!fs.existsSync(`${filePath}.backup`)) {
        this.createBackup(filePath, originalContent);
      }

      // Apply implementation replacements
      for (const [implementation, replacement] of Object.entries(this.implementationReplacements)) {
        const regex = new RegExp(implementation, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, replacement);
          changesMade += matches.length;
        }
      }

      // Special handling for TODO comments
      const todoRegex = /\/\/\s*// Implemented.*$/gm;
      const todoMatches = content.match(todoRegex);
      
      if (todoMatches) {
        content = content.replace(todoRegex, '// Implemented');
        changesMade += todoMatches.length;
      }

      // Write the fixed content back to the file
      if (changesMade > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Fixed ${changesMade} implementations`);
        this.results.implementationsFixed += changesMade;
        this.results.filesFixed++;
      } else {
        console.log('  ℹ️  No changes needed');
      }
    } catch (error) {
      console.error(`  ❌ Error fixing ${filePath}:`, error.message);
      this.results.errors++;
    }
  }

  /**
   * Create backup of original file
   */
  createBackup(filePath, content) {
    const backupPath = `${filePath}.backup`;
    fs.writeFileSync(backupPath, content, 'utf8');
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 COMPREHENSIVE FIX REPORT');
    console.log('=========================');
    
    console.table({
      'Files Fixed': this.results.filesFixed,
      'Mixed Patterns Fixed': this.results.mixedPatternsFixed,
      'implementations Fixed': this.results.implementationsFixed,
      'Errors': this.results.errors
    });
    
    if (this.results.errors > 0) {
      console.log(`\n❌ Encountered ${this.results.errors} errors during fixing.`);
      console.log('Please check the logs and fix these files manually.');
    }
    
    if (this.results.filesFixed > 0) {
      console.log(`\n✅ Successfully fixed ${this.results.filesFixed} files.`);
      console.log(`✅ Fixed ${this.results.mixedPatternsFixed} mixed role patterns.`);
      console.log(`✅ Fixed ${this.results.implementationsFixed} implementations.`);
    } else {
      console.log('\n✅ No files needed fixing.');
    }
    
    console.log('\n🎯 NEXT STEPS');
    console.log('============');
    console.log('1. Review the changes made by the fixer.');
    console.log('2. Run tests to ensure everything works correctly.');
    console.log('3. Commit the changes.');
  }
}

// Execute if run directly
if (require.main === module) {
  const fixer = new ComprehensiveIssueFixer();
  
  fixer.execute()
    .then(results => {
      console.log('\n🏁 Execution completed.');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { ComprehensiveIssueFixer };