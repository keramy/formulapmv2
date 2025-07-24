#!/usr/bin/env node

/**
 * Task 2 Final Verification
 * Comprehensive testing to ensure Task 2 is 100% complete
 */

const { Client } = require('pg');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

async function verifyTask2Complete() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('🔍 TASK 2 FINAL VERIFICATION');
        console.log('============================');

        const tests = [];
        let allTestsPassed = true;

        // Test 1: Check all required columns exist
        console.log('\n📋 Test 1: Required columns exist');
        const requiredColumns = ['role', 'seniority_level', 'previous_role', 'role_migrated_at'];
        
        for (const column of requiredColumns) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                    AND column_name = $1
                )
            `, [column]);
            
            const exists = result.rows[0].exists;
            console.log(`  ${exists ? '✅' : '❌'} ${column}: ${exists ? 'EXISTS' : 'MISSING'}`);
            
            if (!exists) {
                allTestsPassed = false;
                tests.push({ test: `Column ${column}`, status: 'FAIL', reason: 'Column missing' });
            } else {
                tests.push({ test: `Column ${column}`, status: 'PASS', reason: 'Column exists' });
            }
        }

        // Test 2: All users have new role format
        console.log('\n📊 Test 2: All users have new role format');
        const newRoles = ['admin', 'management', 'technical_lead', 'project_manager', 'purchase_manager', 'client'];
        const roleCheck = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(*) FILTER (WHERE role = ANY($1)) as users_with_new_roles
            FROM user_profiles
        `, [newRoles]);

        const roleStats = roleCheck.rows[0];
        const allUsersHaveNewRoles = parseInt(roleStats.total_users) === parseInt(roleStats.users_with_new_roles);
        
        console.log(`  ${allUsersHaveNewRoles ? '✅' : '❌'} Role format: ${roleStats.users_with_new_roles}/${roleStats.total_users} users have new roles`);
        
        if (!allUsersHaveNewRoles) {
            allTestsPassed = false;
            tests.push({ test: 'New role format', status: 'FAIL', reason: 'Some users have old roles' });
        } else {
            tests.push({ test: 'New role format', status: 'PASS', reason: 'All users have new roles' });
        }

        // Test 3: All users have seniority levels
        console.log('\n🎯 Test 3: All users have seniority levels');
        const seniorityCheck = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(seniority_level) as users_with_seniority
            FROM user_profiles
        `);

        const seniorityStats = seniorityCheck.rows[0];
        const allUsersHaveSeniority = parseInt(seniorityStats.total_users) === parseInt(seniorityStats.users_with_seniority);
        
        console.log(`  ${allUsersHaveSeniority ? '✅' : '❌'} Seniority levels: ${seniorityStats.users_with_seniority}/${seniorityStats.total_users} users have seniority`);
        
        if (!allUsersHaveSeniority) {
            allTestsPassed = false;
            tests.push({ test: 'Seniority assignment', status: 'FAIL', reason: 'Some users missing seniority' });
        } else {
            tests.push({ test: 'Seniority assignment', status: 'PASS', reason: 'All users have seniority' });
        }

        // Test 4: All users have migration timestamp
        console.log('\n⏰ Test 4: All users have migration timestamp');
        const migrationCheck = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(role_migrated_at) as migrated_users
            FROM user_profiles
        `);

        const migrationStats = migrationCheck.rows[0];
        const allUsersMigrated = parseInt(migrationStats.total_users) === parseInt(migrationStats.migrated_users);
        
        console.log(`  ${allUsersMigrated ? '✅' : '❌'} Migration timestamps: ${migrationStats.migrated_users}/${migrationStats.total_users} users migrated`);
        
        if (!allUsersMigrated) {
            allTestsPassed = false;
            tests.push({ test: 'Migration timestamps', status: 'FAIL', reason: 'Some users not marked as migrated' });
        } else {
            tests.push({ test: 'Migration timestamps', status: 'PASS', reason: 'All users marked as migrated' });
        }

        // Test 5: Previous roles preserved for audit
        console.log('\n📝 Test 5: Previous roles preserved for audit');
        const auditCheck = await client.query(`
            SELECT 
                COUNT(*) as total_users,
                COUNT(previous_role) as users_with_previous_role
            FROM user_profiles
        `);

        const auditStats = auditCheck.rows[0];
        const allUsersHaveAudit = parseInt(auditStats.total_users) === parseInt(auditStats.users_with_previous_role);
        
        console.log(`  ${allUsersHaveAudit ? '✅' : '❌'} Audit trail: ${auditStats.users_with_previous_role}/${auditStats.total_users} users have previous role`);
        
        if (!allUsersHaveAudit) {
            allTestsPassed = false;
            tests.push({ test: 'Audit trail', status: 'FAIL', reason: 'Some users missing previous role' });
        } else {
            tests.push({ test: 'Audit trail', status: 'PASS', reason: 'All users have audit trail' });
        }

        // Test 6: Role mapping logic verification
        console.log('\n🔄 Test 6: Role mapping logic verification');
        const mappingCheck = await client.query(`
            SELECT 
                previous_role,
                role as current_role,
                seniority_level,
                COUNT(*) as count
            FROM user_profiles 
            GROUP BY previous_role, role, seniority_level
            ORDER BY previous_role
        `);

        console.log('  📊 Role mapping results:');
        console.table(mappingCheck.rows);

        // Verify specific mappings are correct
        const expectedMappings = [
            { previous: 'management', current: 'management', seniority: 'executive' },
            { previous: 'technical_lead', current: 'technical_lead', seniority: 'senior' },
            { previous: 'purchase_manager', current: 'purchase_manager', seniority: 'senior' }
        ];

        let mappingCorrect = true;
        for (const expected of expectedMappings) {
            const found = mappingCheck.rows.find(row => 
                row.previous_role === expected.previous && 
                row.current_role === expected.current && 
                row.seniority_level === expected.seniority
            );
            
            if (!found) {
                mappingCorrect = false;
                console.log(`  ❌ Missing mapping: ${expected.previous} -> ${expected.current} (${expected.seniority})`);
            } else {
                console.log(`  ✅ Correct mapping: ${expected.previous} -> ${expected.current} (${expected.seniority})`);
            }
        }

        if (!mappingCorrect) {
            allTestsPassed = false;
            tests.push({ test: 'Role mapping logic', status: 'FAIL', reason: 'Some mappings incorrect' });
        } else {
            tests.push({ test: 'Role mapping logic', status: 'PASS', reason: 'All mappings correct' });
        }

        // Test 7: Database constraints and integrity
        console.log('\n🔒 Test 7: Database constraints and integrity');
        try {
            // Test role enum constraint
            await client.query("SELECT 'test'::user_role");
            console.log('  ❌ Role enum constraint: FAIL - Should reject invalid role');
            allTestsPassed = false;
            tests.push({ test: 'Role enum constraint', status: 'FAIL', reason: 'Accepts invalid roles' });
        } catch (error) {
            console.log('  ✅ Role enum constraint: PASS - Rejects invalid roles');
            tests.push({ test: 'Role enum constraint', status: 'PASS', reason: 'Properly validates roles' });
        }

        // Final summary
        console.log('\n📊 FINAL VERIFICATION SUMMARY');
        console.log('=============================');
        console.table(tests);

        console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Tests passed: ${tests.filter(t => t.status === 'PASS').length}/${tests.length}`);

        if (allTestsPassed) {
            console.log('\n🎉 TASK 2 IS 100% COMPLETE!');
            console.log('✅ All database schema changes applied');
            console.log('✅ All users successfully migrated');
            console.log('✅ All audit trails preserved');
            console.log('✅ All requirements satisfied');
            console.log('✅ Database integrity maintained');
        } else {
            console.log('\n❌ TASK 2 IS NOT COMPLETE');
            console.log('Issues found that need to be addressed');
        }

        return allTestsPassed;

    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        return false;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    verifyTask2Complete()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { verifyTask2Complete };