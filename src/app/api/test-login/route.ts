import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, createUser } = await request.json();
    
    const supabase = await createClient();
    
    // Create user if requested
    if (createUser) {
      // First create the auth user
      const { data: createData, error: createError } = await supabase.rpc('create_test_admin', {
        user_email: email,
        user_password: password
      });
      
      if (createError) {
        return NextResponse.json({
          success: false,
          error: `Create user error: ${createError.message}`,
          createError: createError
        });
      }
      
      return NextResponse.json({
        success: true,
        created: true,
        data: createData
      });
    }
    
    // Test authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.name
      }, { status: 400 });
    }

    // Test user profile fetch
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    return NextResponse.json({
      success: true,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
      profile: profile,
      profileError: profileError?.message
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check if users exist
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email')
      .ilike('email', '%admin%');
    
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, role')
      .ilike('email', '%admin%');
    
    return NextResponse.json({
      authUsers: authUsers || [],
      authError: authError?.message,
      profiles: profiles || [],
      profileError: profileError?.message
    });
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}