import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const EDITOR_HOST = process.env.HOST_URL || 'editor.localhost';
const EDITOR_PATH_PREFIX = '/editor';
const SESSION_COOKIE = 'duech_session';

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

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')?.split(':')[0];
  const originalPathname = request.nextUrl.pathname;
  const isEditorPath = isEditorPathAccess(hostname, originalPathname);
  const normalizedPathname = isEditorPath
    ? normalizeEditorPath(originalPathname)
    : originalPathname;

  const isEditorMode = hostname === EDITOR_HOST || isEditorPath;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const editorBasePathHeader = isEditorPath ? EDITOR_PATH_PREFIX : '';

  // Helper to generate response with headers
  const createResponse = (rewrite: boolean = false) => {
    const targetUrl = request.nextUrl.clone();
    if (rewrite) {
      targetUrl.pathname = normalizedPathname;
    }
    const response = rewrite ? NextResponse.rewrite(targetUrl) : NextResponse.next();
    response.headers.set('x-editor-mode', isEditorMode ? 'true' : 'false');
    response.headers.set('x-editor-base-path', editorBasePathHeader);
    return response;
  };

  // 1. Assets and Next.js internals - Always allow
  if (
    normalizedPathname.startsWith('/_next/') ||
    /\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff|woff2|ttf|eot)$/i.test(normalizedPathname)
  ) {
    return createResponse(isEditorPath);
  }

  // 2. API Routes - Always allow (auth handled by endpoints)
  if (normalizedPathname.startsWith('/api/')) {
    return createResponse(isEditorPath);
  }

  // 3. Public Auth Pages - Always allow
  if (normalizedPathname === '/login' || normalizedPathname === '/cambiar-contrasena') {
    return createResponse(isEditorPath);
  }

  // 4. Editor Mode Protection - Redirect if not logged in
  if (isEditorMode && !token) {
    const loginPath = isEditorPath ? `${EDITOR_PATH_PREFIX}/login` : '/login';
    const redirectTarget = isEditorPath ? originalPathname : normalizedPathname;
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set('redirectTo', redirectTarget);
    return NextResponse.redirect(loginUrl);
  }

  // 5. Admin Routes Protection
  const adminOnlyRoutes = ['/usuarios'];
  const isAdminRoute = adminOnlyRoutes.some((route) => normalizedPathname.startsWith(route));

  if (isAdminRoute) {
    // If we are here, we have a token (checked in step 4 if editor mode)
    // But if we are NOT in editor mode, we should redirect to editor login
    if (!isEditorMode) {
      const editorUrl = new URL(request.url);
      editorUrl.hostname = EDITOR_HOST;
      editorUrl.pathname = '/login';
      editorUrl.searchParams.set('redirectTo', '/usuarios');
      return NextResponse.redirect(editorUrl);
    }
    // If in editor mode and have token, we let it pass (page will check role)
  }

  // 6. Default - Allow access
  return createResponse(isEditorPath);
}
