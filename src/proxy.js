import { NextResponse } from 'next/server'

export default function proxy(request) {
  const { pathname } = request.nextUrl

  // Permitir acceso a la página de login
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Proteger todas las rutas /admin
  if (pathname.startsWith('/admin')) {
    const cookie = request.cookies.get('admin_sesion')

    if (!cookie || cookie.value !== process.env.ADMIN_PASSWORD) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}