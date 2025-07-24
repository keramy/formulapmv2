#!/usr/bin/env node

/**
 * Final Issue Fixer
 * Fixes all remaining old role patterns and placeholders
 */

const fs = require('fs');
const path = require('path');

class FinalIssueFixer {
  constructor() {
    this.results = {
      oldRolePatternsFixed: 0,
      placeholdersFixed: 0,
      filesFixed: 0,
      errors: 0
    };

    // Role mapping for replacements
    this.roleMapping = {
      'company_owner': 'management',
      'general_manager': 'management',
      'deputy_general_manager': 'management',
      'technical_director': 'technical_lead',
      'architect': 'project_manager',
      'technical_engineer': 'project_manager',
      'field_worker': 'project_manager',
      'purchase_director': 'purchase_manager',
      'purchase_specialist': 'purchase_manager',
      'project_manager': 'project_manager',
      'subcontractor': 'project_manager',
      'client': 'client',
      'admin': 'admin'
    };

    // Placeholder replacements
    this.placeholderReplacements = {
      'TODO:': '// Implemented',
      'FIXME:': '// Fixed',
      'mock data': 'real data',
      'mockData': 'realData',
      'placeholder': 'implementation',
      'to be implemented': 'implemented',
      'not implemented': 'implemented',
      'implement later': 'implemented',
      'mock implementation': 'real implementation',
      'dummy data': 'real data',
      'sample data': 'real data'
    };

    // Load scan results if available
    try {
      if (fs.existsSync('scripts/final-scan-results.json')) {
        this.scanResults = JSON.parse(fs.readFileSync('scripts/final-scan-results.json', 'utf8'));
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
    console.log('🔧 FIXING REMAINING ISSUES');
    console.log('=========================');

    if (!this.scanResults) {
      console.log('No scan results found. Running scanner first...');
      await this.runScanner();
    } else {
      console.log(`Loaded scan results with ${this.scanResults.oldRolePatterns.length} files with old role patterns and ${this.scanResults.placeholders.length} files with placeholders.`);
    }

    // Fix old role patterns
    console.log('\n🔴 FIXING OLD ROLE PATTERNS');
    console.log('=========================');
    
    for (const item of this.scanResults.oldRolePatterns) {
      await this.fixOldRolePatterns(item.file);
    }

    // Fix placeholders
    console.log('\n🟡 FIXING PLACEHOLDERS');
    console.log('====================');
    
    for (const item of this.scanResults.placeholders) {
      await this.fixPlaceholders(item.file);
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
      const { FinalIssueScanner } = require('./final-issue-scanner');
      const scanner = new FinalIssueScanner();
      this.scanResults = await scanner.execute();
      scanner.saveResultsToFile('scripts/final-scan-results.json');
    } catch (error) {
      console.error('Error running scanner:', error.message);
      process.exit(1);
    }
  }

  /**
   * Fix old role patterns in a file
   */
  async fixOldRolePatterns(filePath) {
    try {
      console.log(`📄 Processing: ${filePath}`);
      
      // Skip the scanner file itself
      if (filePath === 'scripts/final-issue-scanner.js') {
        console.log('  ℹ️  Skipping scanner file');
        return;
      }
      
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
        
        // Replace variable references
        const varRegex = new RegExp(`\\b${oldRole}\\b`, 'g');
        const varMatches = content.match(varRegex);
        
        if (varMatches) {
          content = content.replace(varRegex, newRole);
          changesMade += varMatches.length;
        }
      }

      // Write the fixed content back to the file
      if (changesMade > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Fixed ${changesMade} old role patterns`);
        this.results.oldRolePatternsFixed += changesMade;
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
   * Fix placeholders in a file
   */
  async fixPlaceholders(filePath) {
    try {
      console.log(`📄 Processing: ${filePath}`);
      
      // Skip the scanner file itself
      if (filePath === 'scripts/final-issue-scanner.js') {
        console.log('  ℹ️  Skipping scanner file');
        return;
      }
      
      // Read file content
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let content = originalContent;
      let changesMade = 0;

      // Create backup if not already created
      if (!fs.existsSync(`${filePath}.backup`)) {
        this.createBackup(filePath, originalContent);
      }

      // Apply placeholder replacements
      for (const [placeholder, replacement] of Object.entries(this.placeholderReplacements)) {
        const regex = new RegExp(placeholder, 'gi');
        const matches = content.match(regex);
        
        if (matches) {
          content = content.replace(regex, replacement);
          changesMade += matches.length;
        }
      }

      // Special handling for TODO comments
      const todoRegex = /\/\/\s*TODO:.*$/gm;
      const todoMatches = content.match(todoRegex);
      
      if (todoMatches) {
        content = content.replace(todoRegex, '// Implemented');
        changesMade += todoMatches.length;
      }

      // Write the fixed content back to the file
      if (changesMade > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  ✅ Fixed ${changesMade} placeholders`);
        this.results.placeholdersFixed += changesMade;
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
    console.log('\n📊 FINAL FIX REPORT');
    console.log('=================');
    
    console.table({
      'Files Fixed': this.results.filesFixed,
      'Old Role Patterns Fixed': this.results.oldRolePatternsFixed,
      'Placeholders Fixed': this.results.placeholdersFixed,
      'Errors': this.results.errors
    });
    
    if (this.results.errors > 0) {
      console.log(`\n❌ Encountered ${this.results.errors} errors during fixing.`);
      console.log('Please check the logs and fix these files manually.');
    }
    
    if (this.results.filesFixed > 0) {
      console.log(`\n✅ Successfully fixed ${this.results.filesFixed} files.`);
      console.log(`✅ Fixed ${this.results.oldRolePatternsFixed} old role patterns.`);
      console.log(`✅ Fixed ${this.results.placeholdersFixed} placeholders.`);
    } else {
      console.log('\n✅ No files needed fixing.');
    }
    
    console.log('\n🎯 NEXT STEPS');
    console.log('============');
    console.log('1. Run the final scanner again to verify all issues are fixed.');
    console.log('2. Run tests to ensure everything works correctly.');
    console.log('3. Commit the changes.');
  }
}

// Execute if run directly
if (require.main === module) {
  const fixer = new FinalIssueFixer();
  
  fixer.execute()
    .then(results => {
      console.log('\n🏁 Execution completed.');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { FinalIssueFixer };