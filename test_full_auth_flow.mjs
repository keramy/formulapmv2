import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUser(email, password, expectedRole) {
  console.log(`\n🧪 Testing user: ${email}`)
  console.log('=' .repeat(50))
  
  try {
    // Sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (error) {
      console.error('❌ Login error:', error.message)
      return
    }
    
    console.log('✅ Login successful')
    
    // Test profile access
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()
      
    if (profileError) {
      console.error('❌ Profile fetch error:', profileError.message)
      return
    }
    
    console.log('✅ Profile access successful:', {
      email: profile.email,
      role: profile.role,
      name: `${profile.first_name} ${profile.last_name}`
    })
    
    // Test access to other tables that use is_management_role()
    console.log('\n📋 Testing table access...')
    
    // Test clients table
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .limit(5)
      
    if (clientsError) {
      console.log('❌ Clients table error:', clientsError.message)
    } else {
      console.log('✅ Clients table accessible:', clients?.length || 0, 'records')
    }
    
    // Test projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5)
      
    if (projectsError) {
      console.log('❌ Projects table error:', projectsError.message)
    } else {
      console.log('✅ Projects table accessible:', projects?.length || 0, 'records')
    }
    
    // Test suppliers table
    const { data: suppliers, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .limit(5)
      
    if (suppliersError) {
      console.log('❌ Suppliers table error:', suppliersError.message)
    } else {
      console.log('✅ Suppliers table accessible:', suppliers?.length || 0, 'records')
    }
    
    // Test material_specs table
    const { data: materials, error: materialsError } = await supabase
      .from('material_specs')
      .select('*')
      .limit(5)
      
    if (materialsError) {
      console.log('❌ Material specs table error:', materialsError.message)
    } else {
      console.log('✅ Material specs table accessible:', materials?.length || 0, 'records')
    }
    
    console.log('\n🎯 Test completed for', email)
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
  
  // Sign out
  await supabase.auth.signOut()
}

async function runAllTests() {
  console.log('🚀 Testing Full Authentication Flow')
  console.log('Checking if the infinite recursion in RLS policies is fixed')
  
  // Test management user
  await testUser('manager.test@formulapm.com', 'testpass123', 'management')
  
  // Test client user (if exists)
  await testUser('owner.test@formulapm.com', 'testpass123', 'client')
  
  console.log('\n🏁 All tests completed!')
}

runAllTests()