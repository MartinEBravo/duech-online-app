import { cookies } from 'next/headers';
import { getUserById } from '@/lib/queries';

export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  sessionId?: string;
};

const SESSION_COOKIE = 'duech_session';
const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
  return secret;
}

function base64url(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64urlDecode(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binaryString = atob(paddedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['sign']);
  const signature = await crypto.subtle.sign(algorithm.name, key, encoder.encode(data));

  return base64url(new Uint8Array(signature));
}

type TokenPayload = SessionUser & { iat: number; exp: number; role?: string; sessionId?: string };

async function createToken(user: SessionUser, maxAgeSeconds = DEFAULT_EXP_SECONDS) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sessionId: user.sessionId,
    iat: now,
    exp: now + maxAgeSeconds,
  };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = await sign(`${encodedHeader}.${encodedPayload}`, getSecret());
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const [encodedHeader, encodedPayload, signature] = token.split('.');
  if (!encodedHeader || !encodedPayload || !signature) return null;

  const expected = await sign(`${encodedHeader}.${encodedPayload}`, getSecret());
  if (expected !== signature) return null;

  const payloadBytes = base64urlDecode(encodedPayload);
  const json = new TextDecoder().decode(payloadBytes);
  const payload = JSON.parse(json) as TokenPayload;

  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export async function setSessionCookie(user: SessionUser, maxAgeSeconds = DEFAULT_EXP_SECONDS) {
  const token = await createToken(user, maxAgeSeconds);

  // In development, don't set domain to allow cookie to work on any localhost subdomain
  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEFAULT_EXP_SECONDS,
    // Remove domain restriction in development to allow cookies on all subdomains
    ...(process.env.NODE_ENV === 'production' ? {} : {}),
  };

  (await cookies()).set(SESSION_COOKIE, token, cookieOptions);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();

  // Delete the cookie completely
  cookieStore.delete(SESSION_COOKIE);

  // Also set it to expire immediately as a fallback
  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return null;
  }

  const { id, email, name, role, sessionId } = payload;

  // If session ID exists in token, validate it against database
  if (sessionId) {
    try {
      const dbUser = await getUserById(Number(id));

      // If user not found or session IDs don't match, invalidate session
      if (!dbUser || dbUser.currentSessionId !== sessionId) {
        // Clear the invalid session cookie
        await clearSessionCookie();
        return null;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  const user = { id, email, name, role, sessionId };
  return user;
}
