import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAIL } from '../types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth');
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin');
  const isRootPath = request.nextUrl.pathname === '/';

  // If user is not authenticated and trying to access protected routes
  if (!user && (isDashboardRoute || isAdminRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // If user is authenticated and on login page, redirect to dashboard
  if (user && isRootPath) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If non-admin user tries to access admin routes
  const hasAdminRole = user?.app_metadata?.role === 'admin';
  
  if (user && isAdminRoute && !hasAdminRole) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
