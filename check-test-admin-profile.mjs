import pg from 'pg';

const { Client } = pg;

async function checkTestAdminProfile() {
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔍 Checking test.admin profile...\n');

    // Check auth.users table for test.admin
    const authUser = await client.query(`
      SELECT id, email, email_confirmed_at, created_at 
      FROM auth.users 
      WHERE email = 'test.admin@formulapm.com'
    `);

    console.log('📧 Auth user for test.admin@formulapm.com:');
    if (authUser.rows.length === 0) {
      console.log('  ❌ No auth user found');
    } else {
      const user = authUser.rows[0];
      console.log(`  • ID: ${user.id}`);
      console.log(`  • Email: ${user.email}`);
      console.log(`  • Confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'}`);
      console.log(`  • Created: ${user.created_at}`);

      // Check user_profiles table for this user
      const profile = await client.query(`
        SELECT id, email, role, first_name, last_name, is_active 
        FROM user_profiles 
        WHERE id = $1
      `, [user.id]);

      console.log('\n👤 Profile for test.admin:');
      if (profile.rows.length === 0) {
        console.log('  ❌ NO PROFILE FOUND - This is the issue!');
        console.log('  🔧 Creating profile now...');

        // Create the missing profile
        const createProfile = await client.query(`
          INSERT INTO user_profiles (id, email, role, first_name, last_name, is_active, company, department, permissions)
          VALUES ($1, $2, 'admin', 'Test', 'Admin', true, 'Formula PM', 'Administration', '{}')
          RETURNING *
        `, [user.id, user.email]);

        if (createProfile.rows.length > 0) {
          console.log('  ✅ Profile created successfully!');
          console.log(`  • Role: ${createProfile.rows[0].role}`);
          console.log(`  • Name: ${createProfile.rows[0].first_name} ${createProfile.rows[0].last_name}`);
          console.log(`  • Active: ${createProfile.rows[0].is_active}`);
        }
      } else {
        const userProfile = profile.rows[0];
        console.log(`  ✅ Profile found`);
        console.log(`  • Role: ${userProfile.role}`);
        console.log(`  • Name: ${userProfile.first_name} ${userProfile.last_name}`);
        console.log(`  • Active: ${userProfile.is_active}`);
      }
    }

    console.log('\n🎯 Try logging in now with:');
    console.log('   Email: test.admin@formulapm.com');
    console.log('   Password: testpass123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkTestAdminProfile();