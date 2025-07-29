import pg from 'pg';

const { Client } = pg;

async function checkAdminUsers() {
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔍 Checking admin users in database...\n');

    // Check auth.users table
    const authUsers = await client.query(`
      SELECT id, email, email_confirmed_at, created_at 
      FROM auth.users 
      WHERE email LIKE '%admin%' OR email LIKE '%management%'
      ORDER BY email
    `);

    console.log('📧 Admin users in auth.users:');
    if (authUsers.rows.length === 0) {
      console.log('  ❌ No admin users found in auth.users table');
    } else {
      authUsers.rows.forEach(user => {
        console.log(`  • ${user.email} (confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'})`);
      });
    }

    // Check user_profiles table
    const profiles = await client.query(`
      SELECT id, email, role, first_name, last_name 
      FROM user_profiles 
      WHERE role IN ('admin', 'management')
      ORDER BY role, email
    `);

    console.log('\n👤 Admin profiles in user_profiles:');
    if (profiles.rows.length === 0) {
      console.log('  ❌ No admin profiles found');
    } else {
      profiles.rows.forEach(profile => {
        console.log(`  • ${profile.email} - ${profile.role} (${profile.first_name} ${profile.last_name})`);
      });
    }

    // Show all test users for reference
    const allTestUsers = await client.query(`
      SELECT up.email, up.role, up.first_name, up.last_name,
             au.email_confirmed_at IS NOT NULL as confirmed
      FROM user_profiles up
      LEFT JOIN auth.users au ON up.id = au.id
      WHERE up.email LIKE '%.test@%'
      ORDER BY up.role, up.email
    `);

    console.log('\n📋 All test users:');
    allTestUsers.rows.forEach(user => {
      console.log(`  • ${user.email} - ${user.role} (${user.confirmed ? 'CONFIRMED' : 'NOT CONFIRMED'})`);
    });

    console.log('\n🔑 Expected password for all test users: testpass123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAdminUsers();