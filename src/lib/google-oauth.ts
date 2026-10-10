import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import { eq, or, sql } from 'drizzle-orm';
import { db } from './db';
import { users, sessions } from './schema';
import { isVitEmail, VIT_DOMAIN, VIT_ONLY_MESSAGE } from './email-policy';
const keys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
export const GOOGLE_COOKIE = 'drop_google_flow';
export function googleConfigured() {
  return !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
}
export function googleCallbackUrl() {
  if (!process.env.APP_URL) throw new Error('APP_URL is required');
  return new URL('/auth/google/callback', process.env.APP_URL).toString();
}
export function createGoogleFlow() {
  return {
    state: randomBytes(32).toString('base64url'),
    nonce: randomBytes(32).toString('base64url'),
    verifier: randomBytes(32).toString('base64url'),
  };
}
export function matchingState(expected: string, actual: string) {
  const a = Buffer.from(expected),
    b = Buffer.from(actual);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b);
}
export function googleAuthorizationUrl(flow: ReturnType<typeof createGoogleFlow>) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleCallbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: createHash('sha256').update(flow.verifier).digest('base64url'),
    code_challenge_method: 'S256',
    hd: VIT_DOMAIN,
    prompt: 'select_account',
  }).toString();
  return url;
}
export function validatedGoogleProfile(payload: JWTPayload, nonce: string) {
  if (payload.azp && payload.azp !== process.env.GOOGLE_CLIENT_ID)
    throw new Error('Invalid Google authorized party');
  if (
    payload.nonce !== nonce ||
    typeof payload.sub !== 'string' ||
    !payload.sub ||
    payload.sub.length > 255
  )
    throw new Error('Invalid Google identity');
  if (
    payload.email_verified !== true ||
    payload.hd !== VIT_DOMAIN ||
    typeof payload.email !== 'string' ||
    !isVitEmail(payload.email)
  )
    throw new Error(VIT_ONLY_MESSAGE);
  return {
    subject: payload.sub,
    email: payload.email.toLowerCase(),
    name: typeof payload.name === 'string' ? payload.name.slice(0, 80) : 'VIT builder',
  };
}
export async function exchangeGoogleCode(code: string, flow: ReturnType<typeof createGoogleFlow>) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: googleCallbackUrl(),
      grant_type: 'authorization_code',
      code_verifier: flow.verifier,
    }),
    signal: AbortSignal.timeout(15000),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Google token exchange failed');
  const token = (await response.json()) as { id_token?: string };
  if (!token.id_token) throw new Error('Missing Google identity');
  return verifyGoogleIdToken(token.id_token, flow.nonce);
}
export async function verifyGoogleIdToken(
  token: string,
  nonce: string,
  resolver: JWTVerifyGetKey = keys,
) {
  const { payload } = await jwtVerify(token, resolver, {
    issuer: ['https://accounts.google.com', 'accounts.google.com'],
    audience: process.env.GOOGLE_CLIENT_ID!,
    algorithms: ['RS256'],
    maxTokenAge: '10m',
    clockTolerance: 5,
    requiredClaims: ['exp', 'iat', 'sub', 'nonce', 'email', 'email_verified'],
  });
  return validatedGoogleProfile(payload, nonce);
}

export async function googleAccount(profile: ReturnType<typeof validatedGoogleProfile>) {
  if (!isVitEmail(profile.email)) throw new Error(VIT_ONLY_MESSAGE);
  // No password exists for Google-only accounts. This marker cannot pass password
  // verification, so there is no reason to run an expensive password KDF here.
  const unusablePassword = `!google-only!${randomBytes(32).toString('hex')}`;
  return db().transaction(async (tx) => {
    // Serialize callbacks for the same email, including first sign-in in two tabs.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${profile.email}))`);
    const matches = await tx
      .select()
      .from(users)
      .where(or(eq(users.googleSubject, profile.subject), eq(users.email, profile.email)));
    if (matches.length > 1) throw new Error('Google account conflict');
    const existing = matches[0];
    if (existing?.googleSubject && existing.googleSubject !== profile.subject)
      throw new Error('Google account conflict');
    const curator = (process.env.CURATOR_EMAIL || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .includes(profile.email);
    if (existing) {
      // Google owns this Workspace email. Discard an unverified account's old password
      // so someone who pre-registered that address cannot retain access.
      await tx
        .update(users)
        .set({
          googleSubject: profile.subject,
          email: profile.email,
          verified: true,
          ...(!existing.verified ? { passwordHash: unusablePassword } : {}),
          ...(curator ? { role: 'admin' } : {}),
        })
        .where(eq(users.id, existing.id));
      if (!existing.verified) {
        await tx.delete(sessions).where(eq(sessions.userId, existing.id));
      }
      return existing.id;
    }
    const id = randomUUID();
    await tx.insert(users).values({
      id,
      name: profile.name || 'VIT builder',
      email: profile.email,
      passwordHash: unusablePassword,
      googleSubject: profile.subject,
      verified: true,
      role: curator ? 'admin' : 'user',
    });
    return id;
  });
}
