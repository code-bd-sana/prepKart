import { authenticate } from '@/middleware';

export async function GET(request) {
  const auth = await authenticate(request);
  
  if (!auth.success) {
    return Response.json(
      { error: auth.error, message: auth.message },
      { status: auth.status }
    );
  }
  
  return Response.json({
    success: true,
    message: '✅ Protected route accessed successfully',
    user: {
      id: auth.userId,
      email: auth.userEmail,
      tier: auth.userTier,
      name: auth.userName,
    },
    timestamp: new Date().toISOString(),
  });
}