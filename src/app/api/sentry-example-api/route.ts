import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This will trigger an error that Sentry will capture
    throw new Error('This is a test error from the API route!');
    
  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { error: 'Test error occurred', message: (error as Error).message },
      { status: 500 }
    );
  }
}