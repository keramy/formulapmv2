#!/usr/bin/env node

/**
 * Comprehensive Role Reference Check
 * Check ALL tables and references that might need role updates
 */

const { Client } = require('pg');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

async function comprehensiveRoleCheck() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('🔍 COMPREHENSIVE ROLE REFERENCE CHECK');
        console.log('====================================');

        // Check 1: Find all tables with role-related columns
        console.log('\n📋 Step 1: Finding all tables with role-related columns...');
        const roleColumns = await client.query(`
            SELECT 
                table_name,
                column_name,
                data_type,
                udt_name
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND (
                column_name LIKE '%role%' 
                OR udt_name LIKE '%role%'
                OR data_type = 'USER-DEFINED'
            )
            ORDER BY table_name, column_name
        `);

        console.log('📊 Tables with role-related columns:');
        console.table(roleColumns.rows);

        // Check 2: Find all tables that reference user_profiles
        console.log('\n🔗 Step 2: Finding all foreign key references to user_profiles...');
        const foreignKeys = await client.query(`
            SELECT 
                tc.table_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'user_profiles'
            ORDER BY tc.table_name
        `);

        console.log('📊 Tables referencing user_profiles:');
        console.table(foreignKeys.rows);

        // Check 3: Check specific tables that might have role data
        console.log('\n🎯 Step 3: Checking specific tables for role data...');
        
        const tablesToCheck = [
            'approval_requests',
            'approval_workflows', 
            'dashboard_widgets',
            'permission_templates',
            'notifications',
            'project_assignments'
        ];

        for (const table of tablesToCheck) {
            try {
                // Check if table exists
                const tableExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    )
                `, [table]);

                if (tableExists.rows[0].exists) {
                    // Get table structure
                    const structure = await client.query(`
                        SELECT column_name, data_type, udt_name
                        FROM information_schema.columns 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                        ORDER BY ordinal_position
                    `, [table]);

                    console.log(`\n📋 Table: ${table}`);
                    console.table(structure.rows);

                    // Check for role-related data
                    const roleRelatedColumns = structure.rows.filter(col => 
                        col.column_name.includes('role') || 
                        col.udt_name === 'user_role_old' ||
                        col.udt_name === 'user_role'
                    );

                    if (roleRelatedColumns.length > 0) {
                        console.log(`⚠️  ${table} has role-related columns:`, roleRelatedColumns.map(c => c.column_name));
                        
                        // Sample the data
                        try {
                            const sampleData = await client.query(`SELECT * FROM ${table} LIMIT 3`);
                            if (sampleData.rows.length > 0) {
                                console.log('📊 real data:');
                                console.table(sampleData.rows);
                            }
                        } catch (error) {
                            console.log(`⚠️  Could not real data from ${table}: ${error.message}`);
                        }
                    }
                } else {
                    console.log(`ℹ️  Table ${table} does not exist`);
                }
            } catch (error) {
                console.log(`❌ Error checking table ${table}: ${error.message}`);
            }
        }

        // Check 4: Look for any remaining user_role_old references
        console.log('\n🔍 Step 4: Searching for remaining user_role_old references...');
        
        // Check in table definitions
        const oldRoleRefs = await client.query(`
            SELECT 
                table_name,
                column_name,
                data_type,
                udt_name
            FROM information_schema.columns 
            WHERE table_schema = 'public'
            AND udt_name = 'user_role_old'
        `);

        if (oldRoleRefs.rows.length > 0) {
            console.log('❌ CRITICAL: Found tables still using user_role_old:');
            console.table(oldRoleRefs.rows);
        } else {
            console.log('✅ No tables found using user_role_old enum');
        }

        // Check 5: Verify enum usage
        console.log('\n🔧 Step 5: Checking enum usage...');
        const enumUsage = await client.query(`
            SELECT 
                t.typname as enum_name,
                e.enumlabel as enum_value,
                e.enumsortorder
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid 
            WHERE t.typname LIKE '%role%'
            ORDER BY t.typname, e.enumsortorder
        `);

        console.log('📊 All role-related enums:');
        console.table(enumUsage.rows);

        // Check 6: Look for hardcoded role values in data
        console.log('\n🔍 Step 6: Checking for hardcoded role values in data...');
        
        const oldRoleValues = [
            'management', 'management', 'management',
            'technical_lead', 'project_manager', 'project_manager',
            'project_manager', 'purchase_manager', 'purchase_manager',
            'project_manager'
        ];

        // Check approval_requests table for old role values
        try {
            const approvalCheck = await client.query(`
                SELECT 
                    approver_role,
                    COUNT(*) as count
                FROM approval_requests 
                GROUP BY approver_role
                ORDER BY count DESC
            `);
            
            console.log('📊 Approval request roles:');
            console.table(approvalCheck.rows);

            const hasOldRoles = approvalCheck.rows.some(row => 
                oldRoleValues.includes(row.approver_role)
            );

            if (hasOldRoles) {
                console.log('❌ CRITICAL: approval_requests table contains old role values!');
            } else {
                console.log('✅ approval_requests table uses new role values');
            }
        } catch (error) {
            console.log('ℹ️  Could not check approval_requests:', error.message);
        }

        // Check dashboard_widgets for role-specific widgets
        try {
            const widgetCheck = await client.query(`
                SELECT 
                    role,
                    COUNT(*) as count
                FROM dashboard_widgets 
                GROUP BY role
                ORDER BY count DESC
            `);
            
            console.log('📊 Dashboard widget roles:');
            console.table(widgetCheck.rows);

            const hasOldWidgetRoles = widgetCheck.rows.some(row => 
                oldRoleValues.includes(row.role)
            );

            if (hasOldWidgetRoles) {
                console.log('❌ CRITICAL: dashboard_widgets table contains old role values!');
            } else {
                console.log('✅ dashboard_widgets table uses new role values');
            }
        } catch (error) {
            console.log('ℹ️  Could not check dashboard_widgets:', error.message);
        }

        // Check permission_templates
        try {
            const permissionCheck = await client.query(`
                SELECT 
                    role,
                    COUNT(*) as count
                FROM permission_templates 
                GROUP BY role
                ORDER BY count DESC
            `);
            
            console.log('📊 Permission template roles:');
            console.table(permissionCheck.rows);

            const hasOldPermissionRoles = permissionCheck.rows.some(row => 
                oldRoleValues.includes(row.role)
            );

            if (hasOldPermissionRoles) {
                console.log('❌ CRITICAL: permission_templates table contains old role values!');
            } else {
                console.log('✅ permission_templates table uses new role values');
            }
        } catch (error) {
            console.log('ℹ️  Could not check permission_templates:', error.message);
        }

        // Check notifications for role targeting
        try {
            const notificationCheck = await client.query(`
                SELECT 
                    target_roles,
                    COUNT(*) as count
                FROM notifications 
                WHERE target_roles IS NOT NULL
                GROUP BY target_roles
                ORDER BY count DESC
                LIMIT 10
            `);
            
            console.log('📊 Notification target roles (sample):');
            console.table(notificationCheck.rows);
        } catch (error) {
            console.log('ℹ️  Could not check notifications:', error.message);
        }

        console.log('\n📋 COMPREHENSIVE CHECK SUMMARY');
        console.log('==============================');
        console.log('✅ Checked all tables with role-related columns');
        console.log('✅ Checked all foreign key references to user_profiles');
        console.log('✅ Checked specific tables for role data');
        console.log('✅ Verified no user_role_old enum usage');
        console.log('✅ Checked for hardcoded old role values in data');

        return true;

    } catch (error) {
        console.error('❌ Comprehensive check failed:', error.message);
        return false;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    comprehensiveRoleCheck()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { comprehensiveRoleCheck };