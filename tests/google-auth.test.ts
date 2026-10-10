import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { eq } from 'drizzle-orm';
import { isVitEmail } from '../src/lib/email-policy';
import {
  createGoogleFlow,
  matchingState,
  googleAuthorizationUrl,
  verifyGoogleIdToken,
  googleAccount,
} from '../src/lib/google-oauth';
import { db, database } from '../src/lib/db';
import { users, sessions } from '../src/lib/schema';
import { hashPassword, verifyPassword } from '../src/lib/password';
process.env.LOCAL_DB_PATH = 'memory://';
process.env.GOOGLE_CLIENT_ID = 'test-client';
process.env.APP_URL = 'http://localhost:3000';
before(async () => {
  for (const f of ['0001_core', '0002_period_integrity', '0003_google_identity'])
    await database().executeScript(await readFile(`migrations/${f}.sql`, 'utf8'));
});
after(async () => {
  await database().close();
});
test('VIT restriction rejects lookalike domains and OAuth protects browser state with PKCE', () => {
  assert.equal(isVitEmail('student@VITSTUDENT.AC.IN'), true);
  for (const e of [
    'student@gmail.com',
    'student@vitstudent.ac.in.evil.test',
    'student@evilvitstudent.ac.in',
    'x@@vitstudent.ac.in',
  ])
    assert.equal(isVitEmail(e), false);
  const flow = createGoogleFlow(),
    second = createGoogleFlow();
  assert.equal(matchingState(flow.state, second.state), false);
  assert.equal(matchingState(flow.state, flow.state), true);
  assert.equal(matchingState('', ''), false);
  const url = googleAuthorizationUrl(flow);
  assert.equal(url.searchParams.get('hd'), 'vitstudent.ac.in');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.notEqual(url.searchParams.get('code_challenge'), flow.verifier);
});
test('Google tokens require valid signatures, audience, issuer, expiry, nonce and verified Workspace email', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const key = await exportJWK(publicKey);
  key.kid = 'test';
  const resolver = createLocalJWKSet({ keys: [key] });
  const claims = {
    sub: 'google-123',
    nonce: 'expected',
    email: 'student@vitstudent.ac.in',
    email_verified: true,
    hd: 'vitstudent.ac.in',
    name: 'Student',
  };
  async function token(
    overrides = {},
    audience = 'test-client',
    issuer = 'https://accounts.google.com',
    expiry = '1h',
  ) {
    return new SignJWT({ ...claims, ...overrides })
      .setProtectedHeader({ alg: 'RS256', kid: 'test' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiry)
      .sign(privateKey);
  }
  assert.equal(
    (await verifyGoogleIdToken(await token(), 'expected', resolver)).email,
    claims.email,
  );
  for (const overrides of [
    { email: 'student@gmail.com' },
    { hd: 'other.test' },
    { email_verified: false },
    { nonce: 'wrong' },
  ])
    await assert.rejects(verifyGoogleIdToken(await token(overrides), 'expected', resolver));
  await assert.rejects(verifyGoogleIdToken(await token({}, 'other-client'), 'expected', resolver));
  await assert.rejects(
    verifyGoogleIdToken(await token({}, 'test-client', 'https://evil.test'), 'expected', resolver),
  );
  await assert.rejects(
    verifyGoogleIdToken(
      await token({}, 'test-client', 'https://accounts.google.com', '-1m'),
      'expected',
      resolver,
    ),
  );
  const foreign = await generateKeyPair('RS256');
  const invalid = await new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test' })
    .setIssuer('https://accounts.google.com')
    .setAudience('test-client')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(foreign.privateKey);
  await assert.rejects(verifyGoogleIdToken(invalid, 'expected', resolver));
});
test('Google signup verifies ownership, preserves identity, and removes access from pre-registered unverified accounts', async () => {
  const profile = { subject: 'google-account', email: 'owner@vitstudent.ac.in', name: 'Owner' };
  const first = await googleAccount(profile);
  assert.equal(await googleAccount(profile), first);
  assert.equal((await db().select().from(users).where(eq(users.id, first)))[0].verified, true);
  const id = randomUUID();
  await db()
    .insert(users)
    .values({
      id,
      name: 'Pre-registered',
      email: 'claimed@vitstudent.ac.in',
      passwordHash: await hashPassword('Attacker-password-2026!'),
    });
  await db()
    .insert(sessions)
    .values({ tokenHash: 'old-session', userId: id, expiresAt: new Date(Date.now() + 60000) });
  assert.equal(
    await googleAccount({
      subject: 'right-owner',
      email: 'claimed@vitstudent.ac.in',
      name: 'Right owner',
    }),
    id,
  );
  const [updated] = await db().select().from(users).where(eq(users.id, id));
  assert.equal(await verifyPassword('Attacker-password-2026!', updated.passwordHash), false);
  assert.equal((await db().select().from(sessions).where(eq(sessions.userId, id))).length, 0);
  await assert.rejects(
    googleAccount({ subject: 'other-owner', email: 'claimed@vitstudent.ac.in', name: 'Other' }),
  );
});
test('multiple authorized curators are promoted without granting other students access', async () => {
  const previous = process.env.CURATOR_EMAIL;
  try {
    process.env.CURATOR_EMAIL = ' first@vitstudent.ac.in, SECOND@vitstudent.ac.in ';
    for (const [email, role] of [
      ['first@vitstudent.ac.in', 'admin'],
      ['second@vitstudent.ac.in', 'admin'],
      ['third@vitstudent.ac.in', 'user'],
    ]) {
      const id = await googleAccount({ subject: email, email, name: 'Student' });
      assert.equal((await db().select().from(users).where(eq(users.id, id)))[0].role, role);
      assert.equal(await googleAccount({ subject: email, email, name: 'Student' }), id);
    }
  } finally {
    if (previous === undefined) delete process.env.CURATOR_EMAIL;
    else process.env.CURATOR_EMAIL = previous;
  }
});
