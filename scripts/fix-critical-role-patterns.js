#!/usr/bin/env node

/**
 * Fix Critical Role Patterns
 * Automatically fix the most critical mixed role patterns in the application
 */

const fs = require('fs').promises;
const path = require('path');

class RolePatternFixer {
    constructor() {
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

        this.criticalFiles = [
            'src/types/auth.ts',
            'src/types/database.ts',
            'src/lib/permissions.ts',
            'src/components/auth/LoginForm.tsx',
            'src/app/auth/login/page.tsx'
        ];

        this.highPriorityFiles = [
            'src/app/api/projects/[id]/shop-drawings/route.ts',
            'src/app/api/scope/route.optimized.ts',
            'src/app/api/shop-drawings/[id]/route.ts',
            'src/app/dashboard/dashboard-server.tsx',
            'src/app/dashboard/components/client/ClientDashboardActions.tsx',
            'src/app/dashboard/components/server/ServerProjectsOverview.tsx',
            'src/hooks/useImpersonation.ts',
            'src/hooks/useShopDrawings.ts',
            'src/lib/enhanced-middleware.ts',
            'src/lib/form-validation.ts'
        ];

        this.stats = {
            filesProcessed: 0,
            filesFixed: 0,
            replacementsMade: 0,
            errors: 0
        };
    }

    /**
     * Main execution method
     */
    async execute() {
        console.log('🔧 FIXING CRITICAL ROLE PATTERNS');
        console.log('================================');

        // Phase 1: Fix critical files
        console.log('\n🔴 Phase 1: Fixing Critical Files');
        await this.fixFileList(this.criticalFiles, 'CRITICAL');

        // Phase 2: Fix high priority files
        console.log('\n🟡 Phase 2: Fixing High Priority Files');
        await this.fixFileList(this.highPriorityFiles, 'HIGH');

        // Generate report
        this.generateReport();

        return this.stats.errors === 0;
    }

    /**
     * Fix a list of files
     */
    async fixFileList(fileList, priority) {
        for (const filePath of fileList) {
            try {
                const exists = await this.fileExists(filePath);
                if (!exists) {
                    console.log(`⚠️  File not found: ${filePath}`);
                    continue;
                }

                console.log(`🔧 Processing ${priority}: ${filePath}`);
                await this.fixFile(filePath);
                
            } catch (error) {
                console.error(`❌ Error processing ${filePath}:`, error.message);
                this.stats.errors++;
            }
        }
    }

    /**
     * Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Fix individual file
     */
    async fixFile(filePath) {
        try {
            // Read file content
            const originalContent = await fs.readFile(filePath, 'utf8');
            let content = originalContent;
            let changesMade = 0;

            this.stats.filesProcessed++;

            // Apply role replacements
            for (const [oldRole, newRole] of Object.entries(this.roleMapping)) {
                const replacements = this.replaceRoleReferences(content, oldRole, newRole);
                content = replacements.content;
                changesMade += replacements.count;
            }

            // Apply specific fixes based on file type
            const specificFixes = this.applySpecificFixes(filePath, content);
            content = specificFixes.content;
            changesMade += specificFixes.count;

            // Write back if changes were made
            if (changesMade > 0) {
                // Create backup
                await this.createBackup(filePath, originalContent);
                
                // Write updated content
                await fs.writeFile(filePath, content, 'utf8');
                
                console.log(`  ✅ Fixed ${changesMade} issues in ${filePath}`);
                this.stats.filesFixed++;
                this.stats.replacementsMade += changesMade;
            } else {
                console.log(`  ℹ️  No changes needed in ${filePath}`);
            }

        } catch (error) {
            console.error(`  ❌ Failed to fix ${filePath}:`, error.message);
            this.stats.errors++;
        }
    }

    /**
     * Replace role references in content
     */
    replaceRoleReferences(content, oldRole, newRole) {
        let updatedContent = content;
        let count = 0;

        // Different patterns to replace
        const patterns = [
            // String literals
            new RegExp(`'${oldRole}'`, 'g'),
            new RegExp(`"${oldRole}"`, 'g'),
            new RegExp(`\`${oldRole}\``, 'g'),
            
            // Type definitions
            new RegExp(`\\b${oldRole}\\b(?=\\s*[|&])`, 'g'),
            
            // Enum values
            new RegExp(`${oldRole.toUpperCase()}`, 'g'),
            
            // Comments and documentation
            new RegExp(`\\b${oldRole}\\b(?=.*(?://|/\\*))`, 'g')
        ];

        for (const pattern of patterns) {
            const matches = updatedContent.match(pattern);
            if (matches) {
                updatedContent = updatedContent.replace(pattern, newRole);
                count += matches.length;
            }
        }

        return { content: updatedContent, count };
    }

    /**
     * Apply file-specific fixes
     */
    applySpecificFixes(filePath, content) {
        let updatedContent = content;
        let count = 0;

        // Type definition files
        if (filePath.includes('types/auth.ts') || filePath.includes('types/database.ts')) {
            const typeFixes = this.fixTypeDefinitions(updatedContent);
            updatedContent = typeFixes.content;
            count += typeFixes.count;
        }

        // Permission files
        if (filePath.includes('permissions.ts')) {
            const permissionFixes = this.fixPermissions(updatedContent);
            updatedContent = permissionFixes.content;
            count += permissionFixes.count;
        }

        // API files
        if (filePath.includes('/api/')) {
            const apiFixes = this.fixApiEndpoints(updatedContent);
            updatedContent = apiFixes.content;
            count += apiFixes.count;
        }

        // Component files
        if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
            const componentFixes = this.fixComponents(updatedContent);
            updatedContent = componentFixes.content;
            count += componentFixes.count;
        }

        return { content: updatedContent, count };
    }

    /**
     * Fix type definitions
     */
    fixTypeDefinitions(content) {
        let updatedContent = content;
        let count = 0;

        // Update union types
        const oldRoleUnion = Object.keys(this.roleMapping).map(role => `'${role}'`).join(' | ');
        const newRoleUnion = [...new Set(Object.values(this.roleMapping))].map(role => `'${role}'`).join(' | ');
        
        if (updatedContent.includes(oldRoleUnion)) {
            updatedContent = updatedContent.replace(oldRoleUnion, newRoleUnion);
            count++;
        }

        // Update enum definitions
        const enumPattern = /enum\s+\w*Role\w*\s*{[^}]+}/g;
        const enumMatches = updatedContent.match(enumPattern);
        if (enumMatches) {
            for (const enumMatch of enumMatches) {
                let updatedEnum = enumMatch;
                for (const [oldRole, newRole] of Object.entries(this.roleMapping)) {
                    const enumValuePattern = new RegExp(`${oldRole.toUpperCase()}\\s*=\\s*['"]${oldRole}['"]`, 'g');
                    if (enumValuePattern.test(updatedEnum)) {
                        updatedEnum = updatedEnum.replace(enumValuePattern, `${newRole.toUpperCase()} = '${newRole}'`);
                        count++;
                    }
                }
                updatedContent = updatedContent.replace(enumMatch, updatedEnum);
            }
        }

        return { content: updatedContent, count };
    }

    /**
     * Fix permission logic
     */
    fixPermissions(content) {
        let updatedContent = content;
        let count = 0;

        // Update permission mappings
        const permissionMappingPattern = /const\s+\w*[Pp]ermission\w*\s*=\s*{[^}]+}/g;
        const mappingMatches = updatedContent.match(permissionMappingPattern);
        
        if (mappingMatches) {
            for (const mapping of mappingMatches) {
                let updatedMapping = mapping;
                for (const [oldRole, newRole] of Object.entries(this.roleMapping)) {
                    if (updatedMapping.includes(oldRole)) {
                        updatedMapping = updatedMapping.replace(new RegExp(oldRole, 'g'), newRole);
                        count++;
                    }
                }
                updatedContent = updatedContent.replace(mapping, updatedMapping);
            }
        }

        return { content: updatedContent, count };
    }

    /**
     * Fix API endpoints
     */
    fixApiEndpoints(content) {
        let updatedContent = content;
        let count = 0;

        // Update role checks in API routes
        const roleCheckPattern = /user\.role\s*===?\s*['"`][^'"`]+['"`]/g;
        const roleChecks = updatedContent.match(roleCheckPattern);
        
        if (roleChecks) {
            for (const check of roleChecks) {
                let updatedCheck = check;
                for (const [oldRole, newRole] of Object.entries(this.roleMapping)) {
                    if (updatedCheck.includes(oldRole)) {
                        updatedCheck = updatedCheck.replace(oldRole, newRole);
                        count++;
                    }
                }
                updatedContent = updatedContent.replace(check, updatedCheck);
            }
        }

        return { content: updatedContent, count };
    }

    /**
     * Fix React components
     */
    fixComponents(content) {
        let updatedContent = content;
        let count = 0;

        // Update role-based conditional rendering
        const conditionalPattern = /\{[^}]*role[^}]*\}/g;
        const conditionals = updatedContent.match(conditionalPattern);
        
        if (conditionals) {
            for (const conditional of conditionals) {
                let updatedConditional = conditional;
                for (const [oldRole, newRole] of Object.entries(this.roleMapping)) {
                    if (updatedConditional.includes(`'${oldRole}'`) || updatedConditional.includes(`"${oldRole}"`)) {
                        updatedConditional = updatedConditional.replace(new RegExp(oldRole, 'g'), newRole);
                        count++;
                    }
                }
                updatedContent = updatedContent.replace(conditional, updatedConditional);
            }
        }

        return { content: updatedContent, count };
    }

    /**
     * Create backup of original file
     */
    async createBackup(filePath, content) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.writeFile(backupPath, content, 'utf8');
    }

    /**
     * Generate report
     */
    generateReport() {
        console.log('\n📊 ROLE PATTERN FIX REPORT');
        console.log('=========================');
        
        console.table(this.stats);

        if (this.stats.filesFixed > 0) {
            console.log(`\n✅ Successfully fixed ${this.stats.filesFixed} files`);
            console.log(`✅ Made ${this.stats.replacementsMade} role pattern replacements`);
        }

        if (this.stats.errors > 0) {
            console.log(`\n❌ Encountered ${this.stats.errors} errors`);
        }

        const success = this.stats.errors === 0 && this.stats.filesFixed > 0;
        
        console.log(`\n🎯 Result: ${success ? '✅ SUCCESS' : '❌ ISSUES FOUND'}`);
        
        if (success) {
            console.log('✅ Critical role patterns have been fixed');
            console.log('✅ Ready to proceed with testing');
        } else {
            console.log('❌ Some issues remain - manual review needed');
        }

        return success;
    }
}

// Execute if run directly
if (require.main === module) {
    const fixer = new RolePatternFixer();
    
    fixer.execute()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { RolePatternFixer };