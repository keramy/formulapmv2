import pg from 'pg';
import bcrypt from 'bcrypt';

const { Client } = pg;

async function resetAdminPassword() {
  const client = new Client({
    host: '127.0.0.1',
    port: 54322,
    database: 'postgres',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    await client.connect();
    console.log('🔑 Resetting admin password...\n');

    // Generate new password hash for 'testpass123'
    const newPassword = 'testpass123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    console.log(`🔐 Generated password hash for: ${newPassword}`);

    // Also update ALL test users for consistency
    const allUpdate = await client.query(`
      UPDATE auth.users 
      SET encrypted_password = $1,
          updated_at = NOW()
      WHERE email LIKE '%.test@formulapm.com'
      RETURNING email
    `, [hashedPassword]);

    console.log(`\n🔄 Updated ${allUpdate.rows.length} test user passwords:`);
    allUpdate.rows.forEach(user => {
      console.log(`  • ${user.email}`);
    });

    console.log('\n🎯 All test users now have password: testpass123');
    console.log('\n🔓 Try logging in with:');
    console.log('   Email: admin.test@formulapm.com');
    console.log('   Password: testpass123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

resetAdminPassword();