import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware';

export const GET = withAuth(async (
  request: NextRequest,
  { user, profile, supabase },
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching supplier:', error);
      return createErrorResponse('Failed to fetch supplier', 500);
    }

    if (!supplier) {
      return createErrorResponse('Supplier not found', 404);
    }

    return createSuccessResponse(supplier);
  } catch (error) {
    console.error('Error in supplier GET API:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'suppliers.read' });

export const PUT = withAuth(async (
  request: NextRequest,
  { user, profile, supabase },
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .update({
        name: body.name,
        contact_person: body.contact_person,
        email: body.email,
        phone: body.phone,
        address: body.address,
        specialties: body.specialties,
        description: body.description,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      return createErrorResponse('Failed to update supplier', 500);
    }

    return createSuccessResponse(supplier);
  } catch (error) {
    console.error('Error in supplier PUT API:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'suppliers.update' });

export const DELETE = withAuth(async (
  request: NextRequest,
  { user, profile, supabase },
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { id } = await context.params;

    // Soft delete by updating status instead of hard delete
    const { error } = await supabase
      .from('suppliers')
      .update({
        status: 'deleted',
        deleted_by: user.id,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error deleting supplier:', error);
      return createErrorResponse('Failed to delete supplier', 500);
    }

    return createSuccessResponse({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error in supplier DELETE API:', error);
    return createErrorResponse('Internal server error', 500);
  }
}, { permission: 'suppliers.delete' });