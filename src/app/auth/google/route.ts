import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  createGoogleFlow,
  GOOGLE_COOKIE,
  googleAuthorizationUrl,
  googleConfigured,
} from '@/lib/google-oauth';
export async function GET() {
  if (!googleConfigured())
    return NextResponse.redirect(new URL('/signin?oauth=unavailable', process.env.APP_URL!));
  const flow = createGoogleFlow();
  (await cookies()).set(GOOGLE_COOKIE, JSON.stringify(flow), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth/google',
    maxAge: 600,
  });
  return NextResponse.redirect(googleAuthorizationUrl(flow));
}
