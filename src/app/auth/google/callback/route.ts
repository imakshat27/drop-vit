import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';
import {
  GOOGLE_COOKIE,
  googleConfigured,
  matchingState,
  exchangeGoogleCode,
  googleAccount,
  type createGoogleFlow,
} from '@/lib/google-oauth';
import { VIT_ONLY_MESSAGE } from '@/lib/email-policy';
export async function GET(request: Request) {
  const jar = await cookies();
  const saved = jar.get(GOOGLE_COOKIE)?.value;
  jar.set(GOOGLE_COOKIE, '', {
    path: '/auth/google',
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  const url = new URL(request.url);
  const origin = process.env.APP_URL!;
  try {
    if (!googleConfigured() || !saved) throw new Error('Missing Google flow');
    const flow = JSON.parse(saved) as ReturnType<typeof createGoogleFlow>;
    if (!matchingState(flow.state, url.searchParams.get('state') || ''))
      throw new Error('Invalid Google state');
    if (url.searchParams.has('error'))
      return NextResponse.redirect(new URL('/signin?oauth=cancelled', origin));
    const code = url.searchParams.get('code');
    if (!code) throw new Error('Missing Google code');
    const profile = await exchangeGoogleCode(code, flow);
    const id = await googleAccount(profile);
    await createSession(id);
    return NextResponse.redirect(new URL('/me', origin));
  } catch (error) {
    const reason =
      error instanceof Error && error.message === VIT_ONLY_MESSAGE ? 'vit-only' : 'failed';
    return NextResponse.redirect(new URL(`/signin?oauth=${reason}`, origin));
  }
}
