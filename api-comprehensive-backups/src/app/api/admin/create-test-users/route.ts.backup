import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface TestUser {
  email: string
  password: string
  role: string
  first_name: string
  last_name: string
  company?: string
  department?: string
}

const testUsers: TestUser[] = [
  {
    email: 'owner.test@formulapm.com',
    password: 'testpass123',
    role: 'management',
    first_name: 'David',
    last_name: 'Owner',
    company: 'Formula PM',
    department: 'Management'
  },
  {
    email: 'pm.test@formulapm.com',
    password: 'testpass123',
    role: 'project_manager',
    first_name: 'Sarah',
    last_name: 'Manager',
    company: 'Formula PM',
    department: 'Projects'
  },
  {
    email: 'gm.test@formulapm.com',
    password: 'testpass123',
    role: 'management',
    first_name: 'Michael',
    last_name: 'General',
    company: 'Formula PM',
    department: 'Operations'
  },
  {
    email: 'architect.test@formulapm.com',
    password: 'testpass123',
    role: 'project_manager',
    first_name: 'Emma',
    last_name: 'Architect',
    company: 'Formula PM',
    department: 'Design'
  },
  {
    email: 'client.test@formulapm.com',
    password: 'testpass123',
    role: 'client',
    first_name: 'John',
    last_name: 'Client',
    company: 'Client Corp',
    department: 'External'
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Starting test user creation process...')
    
    const results = []
    
    for (const userData of testUsers) {
      console.log(`👤 Processing user: ${userData.email}`)
      
      // First, try to create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role
        }
      })
      
      if (authError && !authError.message.includes('already been registered')) {
        console.error(`❌ Auth creation failed for ${userData.email}:`, authError)
        results.push({
          email: userData.email,
          success: false,
          error: `Auth creation failed: ${authError.message}`
        })
        continue
      }
      
      const userId = authData?.user?.id || 'existing-user'
      console.log(`✅ Auth user handled for ${userData.email}, ID: ${userId}`)
      
      // Get the actual user ID if it already exists
      let actualUserId = userId
      if (userId === 'existing-user') {
        const { data: users } = await supabase.auth.admin.listUsers()
        const existingUser = users.users.find(u => u.email === userData.email)
        actualUserId = existingUser?.id || userId
      }
      
      // Now create or update the user profile
      const profileData = {
        id: actualUserId,
        role: userData.role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        phone: null,
        company: userData.company || null,
        department: userData.department || null,
        permissions: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Use upsert to handle existing profiles
      const { data: profileResult, error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
      
      if (profileError) {
        console.error(`❌ Profile creation failed for ${userData.email}:`, profileError)
        results.push({
          email: userData.email,
          success: false,
          error: `Profile creation failed: ${profileError.message}`
        })
      } else {
        console.log(`✅ Profile created for ${userData.email}`)
        results.push({
          email: userData.email,
          success: true,
          userId: actualUserId,
          role: userData.role,
          profile: profileResult?.[0]
        })
      }
    }
    
    const successCount = results.filter(r => r.success).length
    console.log(`🎉 Test user creation complete: ${successCount}/${testUsers.length} successful`)
    
    return NextResponse.json({
      success: true,
      message: `Created ${successCount}/${testUsers.length} test users successfully`,
      results
    })
    
  } catch (error) {
    console.error('🚨 Test user creation failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}