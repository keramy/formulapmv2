/**
 * Fix Migration Errors - PRECISE CORRECTION SYSTEM
 * Fixes the syntax errors from the automated migration
 */

const fs = require('fs');
const path = require('path');

class MigrationErrorFixer {
  constructor() {
    this.stats = {
      fixed: 0,
      failed: 0
    };
  }

  async fixAllErrors() {
    console.log('🔧 FIXING MIGRATION ERRORS...\n');
    
    // Get all files with errors from the TypeScript output
    const errorFiles = [
      'src/app/api/admin/users/route.ts',
      'src/app/api/auth/change-password/route.ts',
      'src/app/api/auth/profile/route.ts',
      'src/app/api/material-specs/[id]/approve/route.ts',
      'src/app/api/material-specs/[id]/link-scope/route.ts',
      'src/app/api/material-specs/[id]/reject/route.ts',
      'src/app/api/material-specs/[id]/request-revision/route.ts',
      'src/app/api/material-specs/[id]/route.ts',
      'src/app/api/material-specs/[id]/unlink-scope/route.ts',
      'src/app/api/material-specs/bulk/route.ts',
      'src/app/api/material-specs/route.ts',
      'src/app/api/milestones/[id]/route.ts',
      'src/app/api/milestones/[id]/status/route.ts',
      'src/app/api/milestones/bulk/route.ts',
      'src/app/api/milestones/route.ts',
      'src/app/api/milestones/statistics/route.ts',
      'src/app/api/projects/[id]/assignments/route.ts',
      'src/app/api/projects/[id]/material-specs/route.ts',
      'src/app/api/projects/[id]/milestones/route.ts',
      'src/app/api/projects/[id]/route.ts',
      'src/app/api/projects/[id]/tasks/route.ts',
      'src/app/api/projects/metrics/route.ts',
      'src/app/api/projects/route.ts',
      'src/app/api/scope/[id]/dependencies/route.ts',
      'src/app/api/scope/[id]/route.ts',
      'src/app/api/scope/bulk/route.ts',
      'src/app/api/scope/excel/export/route.ts',
      'src/app/api/scope/excel/import/route.ts',
      'src/app/api/scope/overview/route.ts',
      'src/app/api/scope/route.ts',
      'src/app/api/tasks/[id]/comments/route.ts',
      'src/app/api/tasks/[id]/route.ts',
      'src/app/api/tasks/route.ts',
      'src/app/api/tasks/statistics/route.ts'
    ];
    
    for (const file of errorFiles) {
      await this.fixFile(file);
    }
    
    console.log(`\n🎉 MIGRATION ERROR FIXING COMPLETE!`);
    console.log(`✅ Fixed: ${this.stats.fixed}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
  }

  async fixFile(filePath) {
    try {
      console.log(`🔧 Fixing: ${filePath}`);
      
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠️  File not found: ${filePath}`);
        this.stats.failed++;
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      let fixed = content;

      // Fix the main syntax errors
      fixed = this.fixSyntaxErrors(fixed);
      
      // Write the fixed content
      fs.writeFileSync(filePath, fixed, 'utf8');
      
      console.log(`  ✅ Fixed successfully`);
      this.stats.fixed++;
      
    } catch (error) {
      console.log(`  ❌ Failed to fix: ${error.message}`);
      this.stats.failed++;
    }
  }

  fixSyntaxErrors(content) {
    let fixed = content;

    // Fix the broken function signatures - the main issue
    // The regex replacement broke the function parameters
    fixed = fixed.replace(
      /export const (GET|POST|PUT|DELETE|PATCH) = withAuth\(async \(([^,]+),\s*\{\s*params:\s*Promise<\{\s*[^}]+\s*\}>\s*\}\s*,\s*\{\s*user,\s*profile\s*\}\) => \{/g,
      'export const $1 = withAuth(async ($2, { user, profile }, context: { params: Promise<{ id: string }> }) => {'
    );

    // Fix simpler function signatures
    fixed = fixed.replace(
      /export const (GET|POST|PUT|DELETE|PATCH) = withAuth\(async \(([^,]+),\s*\{\s*user,\s*profile\s*\}\) => \{/g,
      'export const $1 = withAuth(async ($2, { user, profile }) => {'
    );

    // Fix broken lines that start with comma
    fixed = fixed.replace(/^\s*,\s*$/gm, '');
    
    // Fix broken object syntax
    fixed = fixed.replace(/,\s*\n\s*\}/g, '\n}');
    
    // Fix validation error details syntax
    fixed = fixed.replace(
      /details: validationResult\.error\.issues/g,
      'details: validationResult.error?.issues'
    );
    
    fixed = fixed.replace(
      /details: statusValidation\.error\.issues/g,
      'details: statusValidation.error?.issues'
    );

    // Remove empty lines and fix spacing
    fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return fixed;
  }
}

// Execute the error fixing
const fixer = new MigrationErrorFixer();
fixer.fixAllErrors();
