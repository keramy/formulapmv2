// Check Environment Variables
// Run with: node check-env.js

require('dotenv').config({ path: '.env.local' })

console.log('🔍 Environment Check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n❌ Missing environment variables!')
  console.log('Make sure your .env.local file contains:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
}
