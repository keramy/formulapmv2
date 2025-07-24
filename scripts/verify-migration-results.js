#!/usr/bin/env node

/**
 * Verify RLS Migration Results
 * Check the final state of RLS policies after migration
 */

const { Client } = require('pg');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

async function verifyResults() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('🔍 Verifying RLS Migration Results');
        console.log('=====================================');
        
        // Check 1: Policies that still reference user_role_old (should be 0)
        const oldRoleCheck = await client.query(`
            SELECT 
                schemaname,
                tablename,
                policyname
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND (qual LIKE '%user_role_old%' OR with_check LIKE '%user_role_old%')
            ORDER BY tablename, policyname;
        `);
        
        console.log(`\n❌ Policies still referencing user_role_old: ${oldRoleCheck.rows.length}`);
        if (oldRoleCheck.rows.length > 0) {
            console.table(oldRoleCheck.rows);
        } else {
            console.log('✅ No policies reference user_role_old');
        }
        
        // Check 2: Policies using new role system
        const newRoleCheck = await client.query(`
            SELECT 
                tablename,
                policyname,
                cmd,
                CASE 
                    WHEN qual LIKE '%user_role::%' THEN 'Uses new enum'
                    WHEN qual LIKE '%user_role%' THEN 'Uses role reference'
                    ELSE 'Other'
                END as role_reference_type
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND (qual LIKE '%user_role%' OR with_check LIKE '%user_role%')
            AND qual NOT LIKE '%user_role_old%'
            AND with_check NOT LIKE '%user_role_old%'
            ORDER BY tablename, policyname;
        `);
        
        console.log(`\n✅ Policies using new role system: ${newRoleCheck.rows.length}`);
        console.table(newRoleCheck.rows);
        
        // Check 3: Helper functions status
        const functionCheck = await client.query(`
            SELECT 
                routine_name,
                CASE 
                    WHEN routine_definition LIKE '%user_role_old%' THEN 'Still uses old roles'
                    WHEN routine_definition LIKE '%management%' AND routine_definition LIKE '%user_role%' THEN 'Updated to new roles'
                    WHEN routine_definition LIKE '%project_manager%' AND routine_definition LIKE '%user_role%' THEN 'Updated to new roles'
                    WHEN routine_definition LIKE '%purchase_manager%' AND routine_definition LIKE '%user_role%' THEN 'Updated to new roles'
                    ELSE 'Other'
                END as status
            FROM information_schema.routines 
            WHERE routine_schema = 'public'
            AND routine_type = 'FUNCTION'
            AND (
                routine_name LIKE '%management%' 
                OR routine_name LIKE '%project%'
                OR routine_name LIKE '%purchase%'
                OR routine_name LIKE '%role%'
            )
            ORDER BY routine_name;
        `);
        
        console.log(`\n🔧 Helper functions status:`);
        console.table(functionCheck.rows);
        
        // Check 4: Role distribution in user_profiles
        const roleDistribution = await client.query(`
            SELECT 
                role,
                COUNT(*) as user_count
            FROM public.user_profiles 
            GROUP BY role
            ORDER BY user_count DESC;
        `);
        
        console.log(`\n👥 Current role distribution in user_profiles:`);
        console.table(roleDistribution.rows);
        
        // Check 5: Sample policy details for verification
        const samplePolicies = await client.query(`
            SELECT 
                tablename,
                policyname,
                cmd,
                LEFT(qual, 100) as policy_condition_preview
            FROM pg_policies 
            WHERE schemaname = 'public'
            AND policyname IN (
                'Admin manage all devices',
                'Project managers can manage suppliers',
                'Field worker document create',
                'Management supplier access'
            )
            ORDER BY tablename, policyname;
        `);
        
        console.log(`\n🔍 Sample migrated policies:`);
        console.table(samplePolicies.rows);
        
        console.log('\n📊 MIGRATION SUMMARY');
        console.log('=====================================');
        console.log(`✅ Policies using new role system: ${newRoleCheck.rows.length}`);
        console.log(`❌ Policies still using old roles: ${oldRoleCheck.rows.length}`);
        console.log(`🔧 Helper functions checked: ${functionCheck.rows.length}`);
        console.log(`👥 Active user roles: ${roleDistribution.rows.length}`);
        
        if (oldRoleCheck.rows.length === 0) {
            console.log('\n🎉 MIGRATION VERIFICATION PASSED!');
            console.log('All RLS policies successfully migrated to new role system.');
        } else {
            console.log('\n⚠️  MIGRATION INCOMPLETE!');
            console.log('Some policies still reference the old role system.');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    verifyResults().catch(console.error);
}

module.exports = { verifyResults };