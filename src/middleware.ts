/**
 * Next.js middleware for authentication and editor mode routing.
 *
 * Handles session validation, editor subdomain/path detection,
 * and admin-only route protection.
 *
 * @module middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Editor host for subdomain-based access */
const EDITOR_HOST = process.env.HOST_URL || 'editor.localhost';
/** Path prefix for path-based editor access */
const EDITOR_PATH_PREFIX = '/editor';
/** Session cookie name */
const SESSION_COOKIE = 'duech_session';

/**
 * @internal
 * Determines if a path should bypass middleware checks.
 */
function shouldBypass(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/') || // Next.js internals
    pathname.startsWith('/api/') || // API routes
    pathname === '/login' || // Login page
    pathname === '/cambiar-contrasena' || // Password change page (needs token in URL, not session)
    /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i.test(pathname) // Static files
  );
}

function isEditorPathAccess(hostname: string | undefined, pathname: string): boolean {
  return pathname === EDITOR_PATH_PREFIX || pathname.startsWith(`${EDITOR_PATH_PREFIX}/`);
}

function normalizeEditorPath(pathname: string): string {
  if (pathname === EDITOR_PATH_PREFIX || pathname === `${EDITOR_PATH_PREFIX}/`) {
    return '/';
  }

  if (pathname.startsWith(`${EDITOR_PATH_PREFIX}/`)) {
    const normalized = pathname.slice(EDITOR_PATH_PREFIX.length);
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  return pathname;
}

/**
 * Main middleware function for request processing.
 *
 * Handles:
 * - Static file and API bypass
 * - Editor mode detection (subdomain or path-based)
 * - Session validation and login redirects
 * - Admin-only route protection
 *
 * Sets headers:
 * - x-editor-mode: 'true' or 'false'
 * - x-editor-base-path: '/editor' or ''
 */
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0];
  const originalPathname = request.nextUrl.pathname;
  const isEditorPath = isEditorPathAccess(hostname, originalPathname);
  const normalizedPathname = isEditorPath
    ? normalizeEditorPath(originalPathname)
    : originalPathname;
  const shouldRewrite = isEditorPath;
  const targetUrl = request.nextUrl.clone();
  const editorBasePathHeader = isEditorPath ? EDITOR_PATH_PREFIX : '';

  if (shouldRewrite) {
    targetUrl.pathname = normalizedPathname;
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isEditorMode = hostname === EDITOR_HOST || isEditorPath;

  // Skip middleware for bypass paths
  if (shouldBypass(normalizedPathname)) {
    const response = shouldRewrite ? NextResponse.rewrite(targetUrl) : NextResponse.next();
    response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
    response.headers.set('x-editor-base-path', editorBasePathHeader);
    return response;
  }

  // Helper function to create login redirect
  const createLoginRedirect = () => {
    const loginPath = isEditorPath ? `${EDITOR_PATH_PREFIX}/login` : '/login';
    const redirectTarget = isEditorPath ? originalPathname : normalizedPathname;
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirectTo', redirectTarget);
    return NextResponse.redirect(loginUrl);
  };

  // Redirect to login if accessing editor host without token
  if (isEditorMode && !token) {
    return createLoginRedirect();
  }

  // Admin-only routes: must be authenticated, in editor mode, and have admin role
  const adminOnlyRoutes = ['/usuarios'];
  const isAdminRoute = adminOnlyRoutes.some((route) => normalizedPathname.startsWith(route));

  if (isAdminRoute) {
    // Redirect to editor login if not in editor mode
    if (!isEditorMode) {
      const editorUrl = new URL(request.url);
      editorUrl.hostname = EDITOR_HOST;
      editorUrl.pathname = '/login';
      editorUrl.searchParams.set('redirectTo', '/usuarios');
      return NextResponse.redirect(editorUrl);
    }

    // Redirect to login if not authenticated
    if (!token) {
      return createLoginRedirect();
    }
  }

  const response = shouldRewrite ? NextResponse.rewrite(targetUrl) : NextResponse.next();
  response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
  response.headers.set('x-editor-base-path', editorBasePathHeader);
  return response;
}
