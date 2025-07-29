import pg from 'pg';

const { Client } = pg;

async function debugAuthDetailed() {
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔍 DETAILED AUTH DEBUG...\n');

    // Check auth.users table structure and data
    const authUsersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'auth' AND table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('📋 auth.users table structure:');
    authUsersStructure.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    // Check all users in auth.users
    const allAuthUsers = await client.query(`
      SELECT id, email, email_confirmed_at, created_at, 
             encrypted_password IS NOT NULL as has_password,
             confirmation_token IS NOT NULL as has_confirmation_token,
             confirmed_at
      FROM auth.users 
      ORDER BY email
    `);

    console.log('\n📧 ALL users in auth.users:');
    if (allAuthUsers.rows.length === 0) {
      console.log('  ❌ NO USERS FOUND in auth.users table!');
    } else {
      allAuthUsers.rows.forEach(user => {
        console.log(`  • ${user.email}`);
        console.log(`    - ID: ${user.id}`);
        console.log(`    - Created: ${user.created_at}`);
        console.log(`    - Confirmed: ${user.confirmed_at ? 'YES' : 'NO'}`);
        console.log(`    - Email Confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'}`);
        console.log(`    - Has Password: ${user.has_password ? 'YES' : 'NO'}`);
        console.log(`    - Has Confirmation Token: ${user.has_confirmation_token ? 'YES' : 'NO'}`);
        console.log('');
      });
    }

    // Check user_profiles table
    const allProfiles = await client.query(`
      SELECT id, email, role, first_name, last_name 
      FROM user_profiles 
      ORDER BY email
    `);

    console.log('👤 ALL profiles in user_profiles:');
    if (allProfiles.rows.length === 0) {
      console.log('  ❌ NO PROFILES FOUND!');
    } else {
      allProfiles.rows.forEach(profile => {
        console.log(`  • ${profile.email} - ${profile.role} (${profile.first_name} ${profile.last_name})`);
      });
    }

    // Check for orphaned records
    const orphanedProfiles = await client.query(`
      SELECT up.email, up.role 
      FROM user_profiles up
      LEFT JOIN auth.users au ON up.id = au.id
      WHERE au.id IS NULL
    `);

    if (orphanedProfiles.rows.length > 0) {
      console.log('\n⚠️  ORPHANED PROFILES (no auth.users record):');
      orphanedProfiles.rows.forEach(profile => {
        console.log(`  • ${profile.email} - ${profile.role}`);
      });
    }

    const orphanedAuth = await client.query(`
      SELECT au.email 
      FROM auth.users au
      LEFT JOIN user_profiles up ON au.id = up.id
      WHERE up.id IS NULL
    `);

    if (orphanedAuth.rows.length > 0) {
      console.log('\n⚠️  ORPHANED AUTH USERS (no user_profiles record):');
      orphanedAuth.rows.forEach(user => {
        console.log(`  • ${user.email}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugAuthDetailed();