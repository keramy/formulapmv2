#!/usr/bin/env node

/**
 * Check Current Database State
 * Verify what's actually in the database before migration
 */

const { Client } = require('pg');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

async function checkCurrentState() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        console.log('✅ Connected to database');

        // Check 1: user_profiles table structure
        console.log('\n📋 USER_PROFILES TABLE STRUCTURE:');
        const columns = await client.query(`
            SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles'
            ORDER BY ordinal_position
        `);
        console.table(columns.rows);

        // Check 2: Current role values
        console.log('\n📊 CURRENT ROLE DISTRIBUTION:');
        const roles = await client.query(`
            SELECT 
                role,
                COUNT(*) as count
            FROM user_profiles 
            GROUP BY role
            ORDER BY count DESC
        `);
        console.table(roles.rows);

        // Check 3: user_role enum values
        console.log('\n🔧 USER_ROLE ENUM VALUES:');
        const enumValues = await client.query(`
            SELECT enumlabel as role_value
            FROM pg_enum 
            WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
            ORDER BY enumsortorder
        `);
        console.table(enumValues.rows);

        // Check 4: Sample user data
        console.log('\n👥 SAMPLE USER DATA:');
        const users = await client.query(`
            SELECT 
                id,
                first_name,
                last_name,
                role,
                email
            FROM user_profiles 
            LIMIT 5
        `);
        console.table(users.rows);

        // Check 5: Missing columns check
        console.log('\n🔍 CHECKING FOR MIGRATION COLUMNS:');
        const migrationColumns = ['role_migrated_at', 'previous_role', 'seniority_level'];
        for (const col of migrationColumns) {
            const exists = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'user_profiles'
                    AND column_name = $1
                )
            `, [col]);
            
            console.log(`${col}: ${exists.rows[0].exists ? '✅ EXISTS' : '❌ MISSING'}`);
        }

        return true;

    } catch (error) {
        console.error('❌ Error checking database state:', error.message);
        return false;
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    checkCurrentState()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected error:', error);
            process.exit(1);
        });
}

module.exports = { checkCurrentState };