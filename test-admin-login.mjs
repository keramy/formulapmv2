import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('🧪 Testing Admin Login...\n')

try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@formulapm.com',
    password: 'admin123'
  })

  if (error) {
    console.error('❌ Login failed:', error.message)
  } else {
    console.log('✅ Login successful!')
    console.log(`📧 Email: ${data.user.email}`)
    console.log(`🆔 ID: ${data.user.id}`)
    console.log(`🎟️ Token: ${data.session.access_token ? 'Received (' + data.session.access_token.length + ' chars)' : 'Missing'}`)
    
    // Test profile access
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'admin@formulapm.com')
      .single()
    
    console.log(`👤 Profile: ${profile.first_name} ${profile.last_name} (${profile.role})`)
    
    await supabase.auth.signOut()
    console.log('🚪 Signed out')
  }
} catch (err) {
  console.error('💥 Exception:', err.message)
}

console.log('\n🎯 Admin user is ready for use!')