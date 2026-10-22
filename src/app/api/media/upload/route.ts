import { currentUser, rateLimit } from '@/lib/auth';
import { uploadTicket } from '@/lib/image-storage';
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(process.env.APP_URL!).origin)
    return new Response('Invalid origin', { status: 403 });
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Sign in to upload project images.' }, { status: 401 });
  try {
    await rateLimit(`image-upload:${user.id}`, 16);
    return Response.json(uploadTicket(user.id), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Could not start upload.' },
      { status: 400 },
    );
  }
}
