import { NextResponse } from 'next/server'

export async function POST() {
  const respuesta = NextResponse.json({ ok: true })

  respuesta.cookies.set('admin_sesion', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })

  return respuesta
}