import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await  cookies();
    
    // Clear auth cookies
    cookieStore.delete('auth_token');
    cookieStore.delete('refresh_token');
    cookieStore.delete('user_session');
    
    return Response.json({
      success: true,
      message: 'Logged out successfully',
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    return Response.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}

// Also handle GET for browser navigation
export async function GET() {
  return Response.json({
    success: true,
    message: 'Send POST request to logout',
  });
}