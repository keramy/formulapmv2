import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';

export const GET = withAuth(async (request: NextRequest, { user, profile, supabase }) => {
  try {
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
      return createErrorResponse('Failed to fetch suppliers', 500);
    }

    return createSuccessResponse(suppliers);
  } catch (error) {
    console.error('Error in suppliers API:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'suppliers.read' });

export const POST = withAuth(async (request: NextRequest, { user, profile, supabase }) => {
  try {
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
          status: 'active',
          created_by: user.id
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return createErrorResponse('Failed to create supplier', 500);
    }

    return createSuccessResponse(supplier, 201);
  } catch (error) {
    console.error('Error in suppliers POST API:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'suppliers.create' });