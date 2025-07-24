#!/usr/bin/env node

/**
 * Comprehensive Issue Scanner
 * Scans the entire codebase for mixed role patterns and implementations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComprehensiveIssueScanner {
  constructor() {
    this.results = {
      mixedPatterns: [],
      implementations: [],
      filesScanned: 0
    };

    // Old role patterns to search for
    this.oldRolePatterns = [
      'management',
      'management',
      'management',
      'technical_lead',
      'project_manager',
      'project_manager',
      'project_manager',
      'purchase_manager',
      'purchase_manager',
      'project_manager'
    ];

    // implementation patterns to search for
    this.implementationPatterns = [
      '// Implemented',
      '// Fixed',
      'real data',
      'realData',
      'implementation',
      'implemented',
      'implemented',
      'implemented',
      'real implementation',
      'real data',
      'real data'
    ];

    // File extensions to scan
    this.fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

    // Directories to exclude
    this.excludeDirs = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔍 SCANNING FOR ISSUES');
    console.log('======================');
    console.log('Scanning entire codebase for mixed role patterns and implementations...');

    // Get all source files
    const sourceFiles = this.getAllSourceFiles('.');
    this.results.filesScanned = sourceFiles.length;

    console.log(`Found ${sourceFiles.length} source files to scan.`);
    console.log('Scanning files for issues...');

    // Scan each file
    for (const file of sourceFiles) {
      await this.scanFile(file);
    }

    // Generate report
    this.generateReport();

    return this.results;
  }

  /**
   * Get all source files in the project
   */
  getAllSourceFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    for (const file of list) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!this.excludeDirs.includes(file)) {
          results = results.concat(this.getAllSourceFiles(filePath));
        }
      } else {
        const ext = path.extname(file);
        if (this.fileExtensions.includes(ext)) {
          results.push(filePath);
        }
      }
    }

    return results;
  }

  /**
   * Scan a file for issues
   */
  async scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for mixed role patterns
      const mixedPatterns = this.findMixedRolePatterns(content, filePath);
      if (mixedPatterns.length > 0) {
        this.results.mixedPatterns.push({
          file: filePath,
          patterns: mixedPatterns
        });
      }

      // Check for implementations
      const implementations = this.findimplementations(content, filePath);
      if (implementations.length > 0) {
        this.results.implementations.push({
          file: filePath,
          implementations: implementations
        });
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
    }
  }

  /**
   * Find mixed role patterns in content
   */
  findMixedRolePatterns(content, filePath) {
    const patterns = [];

    for (const oldRole of this.oldRolePatterns) {
      // Look for string literals with old roles
      const stringLiteralRegex = new RegExp(`['"\`]${oldRole}['"\`]`, 'g');
      const stringMatches = content.match(stringLiteralRegex);
      
      if (stringMatches) {
        patterns.push({
          type: 'string_literal',
          role: oldRole,
          count: stringMatches.length
        });
      }

      // Look for role in type definitions
      const typeDefRegex = new RegExp(`\\b${oldRole}\\b(?=\\s*[|&])`, 'g');
      const typeMatches = content.match(typeDefRegex);
      
      if (typeMatches) {
        patterns.push({
          type: 'type_definition',
          role: oldRole,
          count: typeMatches.length
        });
      }

      // Look for role in enum values
      const enumRegex = new RegExp(`${oldRole.toUpperCase()}`, 'g');
      const enumMatches = content.match(enumRegex);
      
      if (enumMatches) {
        patterns.push({
          type: 'enum_value',
          role: oldRole,
          count: enumMatches.length
        });
      }

      // Look for role in variable names
      const varRegex = new RegExp(`\\b${oldRole}\\b`, 'g');
      const varMatches = content.match(varRegex);
      
      if (varMatches) {
        patterns.push({
          type: 'variable',
          role: oldRole,
          count: varMatches ? varMatches.length : 0
        });
      }
    }

    return patterns;
  }

  /**
   * Find implementations in content
   */
  findimplementations(content, filePath) {
    const implementations = [];

    for (const pattern of this.implementationPatterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        implementations.push({
          pattern: pattern,
          count: matches.length
        });
      }
    }

    return implementations;
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 COMPREHENSIVE ISSUE SCAN REPORT');
    console.log('================================');
    
    console.log(`\n📈 Files scanned: ${this.results.filesScanned}`);
    console.log(`📈 Files with mixed role patterns: ${this.results.mixedPatterns.length}`);
    console.log(`📈 Files with implementations: ${this.results.implementations.length}`);
    
    console.log('\n🔴 MIXED ROLE PATTERNS');
    console.log('====================');
    
    if (this.results.mixedPatterns.length === 0) {
      console.log('✅ No mixed role patterns found.');
    } else {
      console.log(`Found mixed role patterns in ${this.results.mixedPatterns.length} files:`);
      
      for (const item of this.results.mixedPatterns) {
        console.log(`\n📄 ${item.file}`);
        
        for (const pattern of item.patterns) {
          console.log(`  - ${pattern.role} (${pattern.type}): ${pattern.count} occurrences`);
        }
      }
    }
    
    console.log('\n🟡 implementationS');
    console.log('==============');
    
    if (this.results.implementations.length === 0) {
      console.log('✅ No implementations found.');
    } else {
      console.log(`Found implementations in ${this.results.implementations.length} files:`);
      
      for (const item of this.results.implementations) {
        console.log(`\n📄 ${item.file}`);
        
        for (const implementation of item.implementations) {
          console.log(`  - ${implementation.pattern}: ${implementation.count} occurrences`);
        }
      }
    }
    
    console.log('\n🎯 SUMMARY');
    console.log('=========');
    
    if (this.results.mixedPatterns.length === 0 && this.results.implementations.length === 0) {
      console.log('✅ No issues found in the codebase.');
    } else {
      console.log(`❌ Found issues in ${this.results.mixedPatterns.length + this.results.implementations.length} files.`);
      console.log('Run the comprehensive-issue-fixer.js script to fix these issues.');
    }
  }

  /**
   * Save results to file
   */
  saveResultsToFile(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
    console.log(`\nResults saved to ${filePath}`);
  }
}

// Execute if run directly
if (require.main === module) {
  const scanner = new ComprehensiveIssueScanner();
  
  scanner.execute()
    .then(results => {
      // Save results to file for the fixer to use
      scanner.saveResultsToFile('scripts/scan-results.json');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { ComprehensiveIssueScanner };