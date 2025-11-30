/**
 * Authentication and session management module.
 *
 * Provides JWT-based session handling with cookie storage.
 * Sessions are validated against the database to prevent concurrent logins.
 *
 * @module lib/auth
 */

import { cookies } from 'next/headers';
import { getUserById } from '@/lib/queries';

/**
 * User session data stored in JWT token.
 */
export type SessionUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  sessionId?: string;
};

/** Name of the session cookie */
const SESSION_COOKIE = 'duech_session';

/** Default session expiration: 7 days */
const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 7;

/**
 * Gets the secret key for JWT signing from environment variables.
 * @internal
 */
function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-me';
  return secret;
}

/**
 * Encodes data to base64url format (URL-safe base64).
 * @internal
 */
function base64url(input: Uint8Array | string) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Decodes base64url data back to bytes.
 * @internal
 */
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

/**
 * Signs data using HMAC-SHA256.
 * @internal
 */
async function sign(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const algorithm = { name: 'HMAC', hash: 'SHA-256' };

  const key = await crypto.subtle.importKey('raw', keyData, algorithm, false, ['sign']);
  const signature = await crypto.subtle.sign(algorithm.name, key, encoder.encode(data));

  return base64url(new Uint8Array(signature));
}

/** JWT token payload structure */
type TokenPayload = SessionUser & { iat: number; exp: number; role?: string; sessionId?: string };

/**
 * Creates a JWT token for the given user.
 * @internal
 */
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

/**
 * Verifies and decodes a JWT token.
 * Returns null if token is invalid or expired.
 * @internal
 */
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

/**
 * Sets the session cookie with a JWT token for the user.
 *
 * @param user - The user session data to encode
 * @param maxAgeSeconds - Cookie expiration in seconds (default: 7 days)
 */
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

/**
 * Clears the session cookie to log the user out.
 * Deletes the cookie and sets it to expire immediately as a fallback.
 */
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

/**
 * Retrieves the current session user from the cookie.
 *
 * Validates the JWT token and checks the session ID against the database
 * to ensure the session is still valid (not logged out from another device).
 *
 * @returns The session user data, or null if not authenticated
 */
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
