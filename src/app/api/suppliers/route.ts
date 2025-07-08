import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get search parameter
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }
    
    const { data: suppliers, error } = await query;
    
    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error in suppliers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const body = await request.json();
    
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert([
        {
          name: body.name,
          contact_person: body.contact_person,
          email: body.email,
          phone: body.phone,
          address: body.address,
          specialties: body.specialties,
          description: body.description,
          status: 'active'
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error('Error in suppliers POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}