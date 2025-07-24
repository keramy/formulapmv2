#!/usr/bin/env node

/**
 * Check Build Errors and Code Issues
 * Comprehensive check for compilation errors, mixed patterns, and implementation implementations
 */

const fs = require('fs').promises;
const path = require('path');

class BuildErrorChecker {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.implementations = [];
        this.mixedPatterns = [];
        this.stats = {
            filesChecked: 0,
            errorsFound: 0,
            warningsFound: 0,
            implementationsFound: 0,
            mixedPatternsFound: 0
        };
    }

    /**
     * Check for TypeScript/JavaScript compilation errors
     */
    async checkCompilationErrors() {
        console.log('🔍 Checking for compilation errors...');
        
        try {
            // Try to run TypeScript check
            const { spawn } = require('child_process');
            
            return new Promise((resolve) => {
                const tsc = spawn('npx', ['tsc', '--noEmit'], { 
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: true 
                });

                let output = '';
                let errorOutput = '';

                tsc.stdout.on('data', (data) => {
                    output += data.toString();
                });

                tsc.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                tsc.on('close', (code) => {
                    if (code !== 0) {
                        console.log('❌ TypeScript compilation errors found:');
                        console.log(output);
                        console.log(errorOutput);
                        this.errors.push({
                            type: 'compilation',
                            message: 'TypeScript compilation failed',
                            details: output + errorOutput
                        });
                    } else {
                        console.log('✅ No TypeScript compilation errors');
                    }
                    resolve();
                });

                tsc.on('error', (error) => {
                    console.log('⚠️  Could not run TypeScript check:', error.message);
                    resolve();
                });
            });
        } catch (error) {
            console.log('⚠️  TypeScript check not available:', error.message);
        }
    }

    /**
     * Check for Next.js build errors
     */
    async checkNextJSBuild() {
        console.log('🔍 Checking Next.js build...');
        
        try {
            const { spawn } = require('child_process');
            
            return new Promise((resolve) => {
                const nextBuild = spawn('npm', ['run', 'build'], { 
                    stdio: ['pipe', 'pipe', 'pipe'],
                    shell: true 
                });

                let output = '';
                let errorOutput = '';

                nextBuild.stdout.on('data', (data) => {
                    output += data.toString();
                });

                nextBuild.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                nextBuild.on('close', (code) => {
                    if (code !== 0) {
                        console.log('❌ Next.js build errors found:');
                        console.log(output);
                        console.log(errorOutput);
                        this.errors.push({
                            type: 'build',
                            message: 'Next.js build failed',
                            details: output + errorOutput
                        });
                    } else {
                        console.log('✅ Next.js build successful');
                    }
                    resolve();
                });

                nextBuild.on('error', (error) => {
                    console.log('⚠️  Could not run Next.js build:', error.message);
                    resolve();
                });
            });
        } catch (error) {
            console.log('⚠️  Next.js build check not available:', error.message);
        }
    }

    /**
     * Find all source files to check
     */
    async findSourceFiles() {
        const sourceFiles = [];
        
        const searchDirs = [
            'src',
            'app',
            'pages',
            'components',
            'lib',
            'utils',
            'hooks',
            'types'
        ];

        for (const dir of searchDirs) {
            try {
                await this.findFilesRecursive(dir, sourceFiles);
            } catch (error) {
                // Directory doesn't exist, skip
            }
        }

        return sourceFiles;
    }

    /**
     * Recursively find files
     */
    async findFilesRecursive(dir, files) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await this.findFilesRecursive(fullPath, files);
                } else if (this.isSourceFile(entry.name)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories that can't be read
        }
    }

    /**
     * Check if file is a source file
     */
    isSourceFile(filename) {
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
        return extensions.some(ext => filename.endsWith(ext));
    }

    /**
     * Check individual file for issues
     */
    async checkFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            this.stats.filesChecked++;

            // Check for implementation implementations
            this.checkimplementations(filePath, content);
            
            // Check for mixed patterns
            this.checkMixedPatterns(filePath, content);
            
            // Check for common error patterns
            this.checkErrorPatterns(filePath, content);

        } catch (error) {
            this.errors.push({
                type: 'file_read',
                file: filePath,
                message: `Could not read file: ${error.message}`
            });
        }
    }

    /**
     * Check for implementation implementations
     */
    checkimplementations(filePath, content) {
        const implementationPatterns = [
            /// Implemented/gi,
            /// Fixed/gi,
            /HACK:/gi,
            /XXX:/gi,
            /implementation/gi,
            /mock.*data/gi,
            /dummy.*data/gi,
            /fake.*data/gi,
            /test.*data/gi,
            /return\s+null;?\s*\/\/.*implementation/gi,
            /throw new Error\(['"`]implemented['"`]\)/gi,
            /console\.log\(['"`]TODO/gi,
            /\/\*\s*TODO/gi,
            /\/\/\s*TODO/gi,
            /\/\*\s*FIXME/gi,
            /\/\/\s*FIXME/gi
        ];

        for (const pattern of implementationPatterns) {
            const matches = content.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    this.implementations.push({
                        file: filePath,
                        pattern: match.trim(),
                        line: this.getLineNumber(content, match)
                    });
                    this.stats.implementationsFound++;
                });
            }
        }
    }

    /**
     * Check for mixed patterns (old vs new role system)
     */
    checkMixedPatterns(filePath, content) {
        const oldRolePatterns = [
            /management/gi,
            /management/gi,
            /management/gi,
            /technical_lead/gi,
            /project_manager/gi,
            /project_manager/gi,
            /project_manager/gi,
            /purchase_manager/gi,
            /purchase_manager/gi,
            /project_manager/gi,
            /user_role_old/gi
        ];

        const newRolePatterns = [
            /management/gi,
            /technical_lead/gi,
            /project_manager/gi,
            /purchase_manager/gi,
            /client/gi,
            /admin/gi
        ];

        let hasOldRoles = false;
        let hasNewRoles = false;

        // Check for old role patterns
        for (const pattern of oldRolePatterns) {
            if (pattern.test(content)) {
                hasOldRoles = true;
                break;
            }
        }

        // Check for new role patterns
        for (const pattern of newRolePatterns) {
            if (pattern.test(content)) {
                hasNewRoles = true;
                break;
            }
        }

        // If file has both old and new patterns, it's mixed
        if (hasOldRoles && hasNewRoles) {
            this.mixedPatterns.push({
                file: filePath,
                issue: 'File contains both old and new role system references',
                hasOldRoles: true,
                hasNewRoles: true
            });
            this.stats.mixedPatternsFound++;
        } else if (hasOldRoles) {
            this.mixedPatterns.push({
                file: filePath,
                issue: 'File contains only old role system references',
                hasOldRoles: true,
                hasNewRoles: false
            });
            this.stats.mixedPatternsFound++;
        }
    }

    /**
     * Check for common error patterns
     */
    checkErrorPatterns(filePath, content) {
        const errorPatterns = [
            {
                pattern: /import.*from\s+['"`].*\.js['"`]/gi,
                message: 'Importing .js files in TypeScript (should be .ts/.tsx)'
            },
            {
                pattern: /any\s*\[\]/gi,
                message: 'Using any[] type (should be more specific)'
            },
            {
                pattern: /console\.log/gi,
                message: 'Console.log statements (should be removed for production)'
            },
            {
                pattern: /debugger;/gi,
                message: 'Debugger statements (should be removed for production)'
            },
            {
                pattern: /\.then\(\s*\)/gi,
                message: 'Empty .then() handlers'
            },
            {
                pattern: /catch\s*\(\s*\)\s*\{/gi,
                message: 'Empty catch blocks'
            }
        ];

        for (const errorPattern of errorPatterns) {
            const matches = content.match(errorPattern.pattern);
            if (matches) {
                this.warnings.push({
                    file: filePath,
                    message: errorPattern.message,
                    count: matches.length
                });
                this.stats.warningsFound++;
            }
        }
    }

    /**
     * Get line number for a match
     */
    getLineNumber(content, match) {
        const index = content.indexOf(match);
        if (index === -1) return 1;
        
        const beforeMatch = content.substring(0, index);
        return beforeMatch.split('\n').length;
    }

    /**
     * Check database connection and schema
     */
    async checkDatabaseConnection() {
        console.log('🔍 Checking database connection and schema...');
        
        try {
            const { Client } = require('pg');
            const client = new Client({
                host: '127.0.0.1',
                port: 54322,
                database: 'postgres',
                user: 'postgres',
                password: 'postgres'
            });

            await client.connect();
            
            // Check basic connection
            const result = await client.query('SELECT NOW()');
            console.log('✅ Database connection successful');

            // Check for schema issues
            const schemaCheck = await client.query(`
                SELECT 
                    COUNT(*) as table_count
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            `);

            console.log(`📊 Found ${schemaCheck.rows[0].table_count} tables in public schema`);

            // Check for enum consistency
            const enumCheck = await client.query(`
                SELECT 
                    t.typname as enum_name,
                    COUNT(e.enumlabel) as value_count
                FROM pg_type t 
                LEFT JOIN pg_enum e ON t.oid = e.enumtypid 
                WHERE t.typname LIKE '%role%'
                GROUP BY t.typname
                ORDER BY t.typname
            `);

            console.log('📊 Role-related enums:');
            console.table(enumCheck.rows);

            await client.end();
            
        } catch (error) {
            console.log('❌ Database connection failed:', error.message);
            this.errors.push({
                type: 'database',
                message: 'Database connection failed',
                details: error.message
            });
        }
    }

    /**
     * Generate comprehensive report
     */
    generateReport() {
        console.log('\n📊 BUILD ERROR CHECK REPORT');
        console.log('===========================');
        
        console.log('\n📈 Statistics:');
        console.table(this.stats);

        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS FOUND:');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. [${error.type}] ${error.message}`);
                if (error.file) console.log(`   File: ${error.file}`);
                if (error.details) console.log(`   Details: ${error.details.substring(0, 200)}...`);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS FOUND:');
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.message}`);
                console.log(`   File: ${warning.file}`);
                if (warning.count) console.log(`   Count: ${warning.count}`);
            });
        }

        if (this.implementations.length > 0) {
            console.log('\n🔧 implementation IMPLEMENTATIONS:');
            this.implementations.forEach((implementation, index) => {
                console.log(`${index + 1}. ${implementation.pattern}`);
                console.log(`   File: ${implementation.file}:${implementation.line}`);
            });
        }

        if (this.mixedPatterns.length > 0) {
            console.log('\n🔄 MIXED PATTERNS (Old/New Role System):');
            this.mixedPatterns.forEach((pattern, index) => {
                console.log(`${index + 1}. ${pattern.issue}`);
                console.log(`   File: ${pattern.file}`);
                console.log(`   Old roles: ${pattern.hasOldRoles ? 'Yes' : 'No'}`);
                console.log(`   New roles: ${pattern.hasNewRoles ? 'Yes' : 'No'}`);
            });
        }

        const hasIssues = this.errors.length > 0 || this.mixedPatterns.length > 0;
        
        console.log('\n🎯 SUMMARY:');
        if (hasIssues) {
            console.log('❌ Issues found that should be addressed before proceeding');
            console.log(`   - ${this.errors.length} errors`);
            console.log(`   - ${this.mixedPatterns.length} mixed patterns`);
            console.log(`   - ${this.implementations.length} implementations`);
            console.log(`   - ${this.warnings.length} warnings`);
        } else {
            console.log('✅ No critical issues found');
            console.log('✅ Safe to proceed with next task');
        }

        return !hasIssues;
    }

    /**
     * Main execution method
     */
    async execute() {
        console.log('🔍 COMPREHENSIVE BUILD ERROR CHECK');
        console.log('==================================');

        // Check compilation errors
        await this.checkCompilationErrors();

        // Check database
        await this.checkDatabaseConnection();

        // Check source files
        console.log('\n🔍 Checking source files...');
        const sourceFiles = await this.findSourceFiles();
        console.log(`📊 Found ${sourceFiles.length} source files to check`);

        for (const file of sourceFiles) {
            await this.checkFile(file);
        }

        // Generate report
        return this.generateReport();
    }
}

// Execute if run directly
if (require.main === module) {
    const checker = new BuildErrorChecker();
    
    checker.execute()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { BuildErrorChecker };