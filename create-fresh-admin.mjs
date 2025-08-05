import pg from 'pg';
import { randomUUID } from 'crypto';

const { Client } = pg;

async function createFreshAdmin() {
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔧 Creating fresh admin user via Supabase auth...\n');

    // First delete existing admin if exists
    await client.query(`DELETE FROM auth.users WHERE email = 'test.admin@formulapm.com'`);
    await client.query(`DELETE FROM user_profiles WHERE email = 'test.admin@formulapm.com'`);

    console.log('✅ Cleaned up any existing test.admin@formulapm.com user');

    // Use Supabase auth to create user (this handles password encryption properly)
    const supabaseResponse = await fetch('http://127.0.0.1:54321/auth/v1/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        email: 'test.admin@formulapm.com',
        password: 'testpass123',
        data: {
          first_name: 'Test',
          last_name: 'Admin'
        }
      })
    });

    const signupResult = await supabaseResponse.json();
    
    if (supabaseResponse.ok) {
      console.log('✅ Successfully created auth user via Supabase API');
      console.log(`   User ID: ${signupResult.user.id}`);
      
      // Now create the profile
      await client.query(`
        INSERT INTO user_profiles (id, email, role, first_name, last_name)
        VALUES ($1, $2, 'admin', 'Test', 'Admin')
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name
      `, [signupResult.user.id, 'test.admin@formulapm.com']);
      
      console.log('✅ Created user profile for admin');
      
      // Confirm the user (since it's local dev)
      await client.query(`
        UPDATE auth.users 
        SET email_confirmed_at = NOW()
        WHERE email = 'test.admin@formulapm.com'
      `);
      
      console.log('✅ Confirmed user email');
      
    } else {
      console.log('❌ Signup failed:', signupResult);
    }

    // Test login with the new user
    console.log('\n🧪 Testing login with new admin user...');
    
    const loginResponse = await fetch('http://127.0.0.1:54321/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({
        email: 'test.admin@formulapm.com',
        password: 'testpass123'
      })
    });

    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('🎉 LOGIN SUCCESSFUL!');
      console.log('   New admin credentials:');
      console.log('   Email: test.admin@formulapm.com');
      console.log('   Password: testpass123');
      console.log(`   Access Token: ${loginResult.access_token ? 'Received (' + loginResult.access_token.length + ' chars)' : 'Missing'}`);
    } else {
      const loginError = await loginResponse.json();
      console.log('❌ Login failed:', loginError);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

createFreshAdmin();