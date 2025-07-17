import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    console.log('🔧 [create-test-profiles] Starting profile creation for test users')
    
    // Test user profiles to create
    const testProfiles = [
      {
        id: '4b7af6d4-97d3-4f3a-8f64-9d3bc26d8b39', // The user ID from the debug logs
        email: 'owner.test@formulapm.com',
        role: 'management',
        first_name: 'Owner',
        last_name: 'Test',
        company: 'Formula PM Test',
        department: 'Management',
        is_active: true
      },
      // We can add more test users here later
    ]

    const results = []

    for (const profile of testProfiles) {
      console.log(`🔧 [create-test-profiles] Creating profile for ${profile.email}`)
      
      // Check if profile already exists
      const { data: existing } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', profile.id)
        .single()

      if (existing) {
        console.log(`✅ [create-test-profiles] Profile already exists for ${profile.email}`)
        results.push({ email: profile.email, status: 'already_exists' })
        continue
      }

      // Create the profile
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          id: profile.id,
          role: profile.role,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          company: profile.company,
          department: profile.department,
          is_active: profile.is_active,
          permissions: {}, // Empty permissions object - will use role-based permissions
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error(`❌ [create-test-profiles] Failed to create profile for ${profile.email}:`, error)
        results.push({ 
          email: profile.email, 
          status: 'error', 
          error: error.message,
          code: error.code 
        })
      } else {
        console.log(`✅ [create-test-profiles] Successfully created profile for ${profile.email}`)
        results.push({ 
          email: profile.email, 
          status: 'created',
          profileId: data.id,
          role: data.role
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test profile creation completed',
      results
    })

  } catch (error) {
    console.error('❌ [create-test-profiles] Exception:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create test profiles', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}