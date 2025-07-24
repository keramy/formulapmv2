#!/usr/bin/env node

/**
 * Check Specific Role Tables
 * Check tables that might have role data that needs updating
 */

const { Client } = require('pg');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

async function checkSpecificRoleTables() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('🔍 CHECKING SPECIFIC ROLE TABLES');
        console.log('================================');

        // Check project_assignments table
        console.log('\n📋 PROJECT_ASSIGNMENTS TABLE:');
        
        const projectAssignments = await client.query(`
            SELECT 
                role,
                COUNT(*) as count
            FROM project_assignments 
            GROUP BY role
            ORDER BY count DESC
        `);
        
        console.log('📊 Role distribution in project_assignments:');
        console.table(projectAssignments.rows);

        // Check if these are old or new role values
        const oldRoleValues = [
            'management', 'management', 'management',
            'technical_lead', 'project_manager', 'project_manager',
            'project_manager', 'purchase_manager', 'purchase_manager',
            'project_manager'
        ];

        const newRoleValues = [
            'admin', 'management', 'technical_lead', 'project_manager', 'purchase_manager', 'client'
        ];

        let hasOldRoles = false;
        let hasNewRoles = false;
        let hasOtherRoles = false;

        for (const row of projectAssignments.rows) {
            if (oldRoleValues.includes(row.role)) {
                hasOldRoles = true;
                console.log(`❌ Found old role: ${row.role} (${row.count} records)`);
            } else if (newRoleValues.includes(row.role)) {
                hasNewRoles = true;
                console.log(`✅ Found new role: ${row.role} (${row.count} records)`);
            } else {
                hasOtherRoles = true;
                console.log(`⚠️  Found other role: ${row.role} (${row.count} records)`);
            }
        }

        // Sample some records to see the data
        console.log('\n📊 Sample project_assignments records:');
        const sampleData = await client.query(`
            SELECT 
                id,
                project_id,
                user_id,
                role,
                assigned_at,
                is_active
            FROM project_assignments 
            LIMIT 5
        `);
        console.table(sampleData.rows);

        // Check if we need to update this table
        if (hasOldRoles) {
            console.log('\n❌ CRITICAL: project_assignments table contains old role values!');
            console.log('This table needs to be updated as part of Task 2.');
            
            // Show the mapping that would be needed
            console.log('\n🔄 Required role mapping for project_assignments:');
            const mappingQuery = await client.query(`
                SELECT 
                    role as current_role,
                    CASE 
                        WHEN role = 'management' THEN 'management'
                        WHEN role = 'management' THEN 'management'
                        WHEN role = 'management' THEN 'management'
                        WHEN role = 'technical_lead' THEN 'technical_lead'
                        WHEN role = 'project_manager' THEN 'project_manager'
                        WHEN role = 'project_manager' THEN 'project_manager'
                        WHEN role = 'project_manager' THEN 'project_manager'
                        WHEN role = 'purchase_manager' THEN 'purchase_manager'
                        WHEN role = 'purchase_manager' THEN 'purchase_manager'
                        WHEN role = 'project_manager' THEN 'project_manager'
                        WHEN role = 'project_manager' THEN 'project_manager'
                        WHEN role = 'client' THEN 'client'
                        WHEN role = 'admin' THEN 'admin'
                        ELSE role
                    END as new_role,
                    COUNT(*) as count
                FROM project_assignments 
                GROUP BY role
                ORDER BY count DESC
            `);
            console.table(mappingQuery.rows);
            
            return false; // Task 2 is not complete
        } else {
            console.log('\n✅ project_assignments table uses correct role values');
        }

        // Check other potential tables
        const otherTablesToCheck = [
            { table: 'approval_requests', column: 'approver_role' },
            { table: 'dashboard_widgets', column: 'role' },
            { table: 'permission_templates', column: 'role' },
            { table: 'notifications', column: 'target_roles' }
        ];

        for (const tableInfo of otherTablesToCheck) {
            try {
                const tableExists = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    )
                `, [tableInfo.table]);

                if (tableExists.rows[0].exists) {
                    const columnExists = await client.query(`
                        SELECT EXISTS (
                            SELECT FROM information_schema.columns 
                            WHERE table_schema = 'public' 
                            AND table_name = $1
                            AND column_name = $2
                        )
                    `, [tableInfo.table, tableInfo.column]);

                    if (columnExists.rows[0].exists) {
                        console.log(`\n📋 Checking ${tableInfo.table}.${tableInfo.column}:`);
                        
                        const roleData = await client.query(`
                            SELECT 
                                ${tableInfo.column},
                                COUNT(*) as count
                            FROM ${tableInfo.table} 
                            WHERE ${tableInfo.column} IS NOT NULL
                            GROUP BY ${tableInfo.column}
                            ORDER BY count DESC
                            LIMIT 10
                        `);
                        
                        if (roleData.rows.length > 0) {
                            console.table(roleData.rows);
                        } else {
                            console.log('  No data found');
                        }
                    } else {
                        console.log(`ℹ️  ${tableInfo.table}.${tableInfo.column} column does not exist`);
                    }
                } else {
                    console.log(`ℹ️  ${tableInfo.table} table does not exist`);
                }
            } catch (error) {
                console.log(`⚠️  Error checking ${tableInfo.table}: ${error.message}`);
            }
        }

        return !hasOldRoles;

    } catch (error) {
        console.error('❌ Check failed:', error.message);
        return false;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    checkSpecificRoleTables()
        .then(success => {
            if (success) {
                console.log('\n✅ All role tables are properly updated');
            } else {
                console.log('\n❌ Some role tables need updates - Task 2 is not complete');
            }
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { checkSpecificRoleTables };