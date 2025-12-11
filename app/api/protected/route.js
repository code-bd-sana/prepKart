import { authenticate, requireTier } from '@/middleware';

export async function GET(request) {
  // Authenticate user
  const auth = await authenticate(request);
  if (!auth.success) {
    return Response.json(
      { error: auth.error, message: auth.message },
      { status: auth.status }
    );
  }
  
  //Check tier if needed
  if (!requireTier(auth.userTier, 'tier2')) {
    return Response.json(
      {
        success: false,
        error: 'Insufficient permissions',
        message: 'This feature requires tier2 or higher',
      },
      { status: 403 }
    );
  }
  
  // Your protected logic
  return Response.json({
    success: true,
    message: 'Protected route accessed',
    user: {
      id: auth.userId,
      email: auth.userEmail,
      tier: auth.userTier,
    },
  });
}