// Check what users exist in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xrrrtwrfadcilwkgwacs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnJ0d3JmYWRjaWx3a2d3YWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2NDM1MSwiZXhwIjoyMDY3NjQwMzUxfQ.FHwH6p5CzouCCmNbihgBSEXyq9jW2C_INnj22TDZsVc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');
    
    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name, role, is_active')
      .order('email');

    if (profilesError) {
      console.error('❌ Error checking user_profiles:', profilesError);
      return;
    }

    console.log('👥 User profiles found:', profiles?.length || 0);
    
    if (profiles && profiles.length > 0) {
      profiles.forEach(profile => {
        console.log(`  📧 ${profile.email} (${profile.role}) - ${profile.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    // Also check if we can query projects with service role to confirm it works
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, is_active')
      .limit(3);

    if (projectsError) {
      console.error('❌ Error checking projects:', projectsError);
    } else {
      console.log('🏗️ Projects accessible via service role:', projects?.length || 0);
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

checkUsers();