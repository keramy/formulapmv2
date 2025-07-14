import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const userId = '217af21a-6a43-4464-bb6d-696d1d2e88e7'
  
  console.log('🔍 Debug: Testing direct profile fetch')
  
  try {
    const result = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    console.log('🔍 Debug: Direct profile result', {
      hasData: !!result.data,
      error: result.error?.message,
      errorCode: result.error?.code,
      data: result.data
    })
    
    return NextResponse.json({
      success: true,
      hasData: !!result.data,
      error: result.error?.message,
      errorCode: result.error?.code,
      data: result.data
    })
  } catch (error) {
    console.error('🔍 Debug: Exception in profile fetch', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}