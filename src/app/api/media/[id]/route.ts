import { sql } from 'drizzle-orm';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { MEDIA_ID } from '@/lib/project-media';
import { imageOwnedBy, storageRequest } from '@/lib/image-storage';
async function projectUsing(url: string) {
  return db()
    .select({ status: projects.status, ownerId: projects.ownerId })
    .from(projects)
    .where(sql`${projects.details}->'media' ? ${url}`);
}
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!MEDIA_ID.test(id)) return new Response(null, { status: 404 });
  const references = await projectUsing('/api/media/' + id);
  const approved = references.some((p) => p.status === 'approved');
  if (!approved) {
    const user = await currentUser();
    if (!user || !(imageOwnedBy(id, user.id) || (user.role === 'admin' && references.length)))
      return new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    let result = await storageRequest(id);
    if (result.status === 404 && !approved) result = await storageRequest(id, {}, '', true);
    if (!result.ok) return new Response(null, { status: 404 });
    return new Response(result.body, {
      headers: {
        'Content-Type': 'image/webp',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline',
        'Cache-Control': approved ? 'public, max-age=300, s-maxage=86400' : 'private, no-store',
        Vary: 'Cookie',
      },
    });
  } catch {
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (request.headers.get('origin') !== new URL(process.env.APP_URL!).origin)
    return new Response(null, { status: 403 });
  const user = await currentUser();
  const { id } = await params;
  if (!user) return new Response(null, { status: 401 });
  if (!MEDIA_ID.test(id) || !imageOwnedBy(id, user.id)) return new Response(null, { status: 404 });
  if ((await projectUsing('/api/media/' + id)).length)
    return Response.json(
      { error: 'Remove the image from your submission before deleting it.' },
      { status: 409 },
    );
  await storageRequest(id, { method: 'DELETE' }, '', true);
  const result = await storageRequest(id, { method: 'DELETE' });
  return new Response(null, { status: result.ok ? 204 : 503 });
}
