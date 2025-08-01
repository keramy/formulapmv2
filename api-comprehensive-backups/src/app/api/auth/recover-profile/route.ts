import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const correlationId = Math.random().toString(36).substr(2, 9)
  const startTime = Date.now()

  try {
    console.log(`🔄 [recover-profile:${correlationId}] Starting profile recovery`, {
      timestamp: new Date().toISOString(),
      url: request.url,
      method: request.method
    })

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = createServerClient()
    
    // Verify token to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      console.error(`❌ [recover-profile:${correlationId}] Token verification failed`, {
        error: userError,
        duration: Date.now() - startTime
      })
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Use admin client to bypass RLS for recovery operations
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist - create it
      console.log(`🆕 [recover-profile:${correlationId}] Creating missing profile`, {
        userId: user.id,
        userEmail: user.email
      })

      // Extract name from email if available
      const emailParts = user.email?.split('@')[0].split('.')
      const firstName = emailParts?.[0] || 'User'
      const lastName = emailParts?.[1] || 'Unknown'

      const newProfile = {
        id: user.id,
        role: 'client' as const, // Default role
        first_name: firstName,
        last_name: lastName,
        email: user.email!,
        phone: user.phone || null,
        company: null,
        department: null,
        avatar_url: null,
        permissions: {},
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: createdProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert([newProfile])
        .select()
        .single()

      if (createError) {
        console.error(`❌ [recover-profile:${correlationId}] Failed to create profile`, {
          error: createError,
          userId: user.id,
          duration: Date.now() - startTime
        })
        return NextResponse.json(
          { success: false, error: 'Failed to create user profile' },
          { status: 500 }
        )
      }

      console.log(`✅ [recover-profile:${correlationId}] Profile created successfully`, {
        userId: user.id,
        profileRole: createdProfile.role,
        duration: Date.now() - startTime
      })

      return NextResponse.json({
        success: true,
        message: 'Profile created successfully',
        profile: createdProfile,
        recovered: true
      })
    }

    if (existingProfile) {
      // Profile exists - check for corruption and repair
      const repairs = []
      const updates: any = {}

      // Check for missing required fields
      if (!existingProfile.first_name || existingProfile.first_name.trim() === '') {
        const emailParts = user.email?.split('@')[0].split('.')
        updates.first_name = emailParts?.[0] || 'User'
        repairs.push('first_name')
      }

      if (!existingProfile.last_name || existingProfile.last_name.trim() === '') {
        const emailParts = user.email?.split('@')[0].split('.')
        updates.last_name = emailParts?.[1] || 'Unknown'
        repairs.push('last_name')
      }

      if (!existingProfile.email || existingProfile.email !== user.email) {
        updates.email = user.email!
        repairs.push('email')
      }

      if (!existingProfile.role || !['management', 'management', 'management', 'technical_lead', 'admin', 'project_manager', 'project_manager', 'project_manager', 'purchase_manager', 'purchase_manager', 'project_manager', 'client'].includes(existingProfile.role)) {
        updates.role = 'client'
        repairs.push('role')
      }

      if (existingProfile.permissions === null || existingProfile.permissions === undefined) {
        updates.permissions = {}
        repairs.push('permissions')
      }

      if (existingProfile.is_active !== true && existingProfile.is_active !== false) {
        updates.is_active = true
        repairs.push('is_active')
      }

      if (repairs.length > 0) {
        updates.updated_at = new Date().toISOString()

        const { data: repairedProfile, error: repairError } = await supabaseAdmin
          .from('user_profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single()

        if (repairError) {
          console.error(`❌ [recover-profile:${correlationId}] Failed to repair profile`, {
            error: repairError,
            userId: user.id,
            repairs,
            duration: Date.now() - startTime
          })
          return NextResponse.json(
            { success: false, error: 'Failed to repair user profile' },
            { status: 500 }
          )
        }

        console.log(`🔧 [recover-profile:${correlationId}] Profile repaired successfully`, {
          userId: user.id,
          repairs,
          duration: Date.now() - startTime
        })

        return NextResponse.json({
          success: true,
          message: 'Profile repaired successfully',
          profile: repairedProfile,
          recovered: true,
          repairs
        })
      }

      console.log(`✅ [recover-profile:${correlationId}] Profile is healthy`, {
        userId: user.id,
        duration: Date.now() - startTime
      })

      return NextResponse.json({
        success: true,
        message: 'Profile is healthy',
        profile: existingProfile,
        recovered: false
      })
    }

    // Other profile errors
    console.error(`❌ [recover-profile:${correlationId}] Profile access error`, {
      error: profileError,
      userId: user.id,
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      { success: false, error: 'Failed to access user profile' },
      { status: 500 }
    )

  } catch (error) {
    console.error(`❌ [recover-profile:${correlationId}] Recovery failed`, {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    })

    return NextResponse.json(
      { success: false, error: 'Profile recovery failed' },
      { status: 500 }
    )
  }
}