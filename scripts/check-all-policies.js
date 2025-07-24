#!/usr/bin/env node

const { Client } = require('pg');

const dbConfig = {
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres'
};

async function checkAllPolicies() {
    const client = new Client(dbConfig);
    
    try {
        await client.connect();
        
        // Get all policies in public schema
        const allPolicies = await client.query(`
            SELECT 
                tablename,
                policyname,
                cmd,
                CASE 
                    WHEN qual LIKE '%user_role%' THEN 'Has role reference'
                    ELSE 'No role reference'
                END as has_role_ref,
                LEFT(qual, 150) as condition_preview
            FROM pg_policies 
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
        `);
        
        console.log(`\n📋 All RLS policies in public schema (${allPolicies.rows.length} total):`);
        console.table(allPolicies.rows);
        
        // Check specific tables that should have role-based policies
        const roleBasedTables = [
            'mobile_devices', 'subcontractor_users', 'delivery_confirmations',
            'purchase_requests', 'vendor_ratings', 'subcontractor_scope_access',
            'suppliers', 'subcontractor_reports', 'documents'
        ];
        
        for (const table of roleBasedTables) {
            const tablePolicies = await client.query(`
                SELECT policyname, cmd, qual
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = $1
                ORDER BY policyname;
            `, [table]);
            
            console.log(`\n🔍 Policies for ${table} (${tablePolicies.rows.length}):`);
            if (tablePolicies.rows.length > 0) {
                console.table(tablePolicies.rows);
            } else {
                console.log('   No policies found');
            }
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    } finally {
        await client.end();
    }
}

if (require.main === module) {
    checkAllPolicies().catch(console.error);
}