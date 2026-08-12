import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { usuario, contrasena } = await request.json()

    const usuarioValido = usuario === process.env.ADMIN_USER
    const contrasenaValida = contrasena === process.env.ADMIN_PASSWORD

    if (!usuarioValido || !contrasenaValida) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    const respuesta = NextResponse.json({ ok: true })

    respuesta.cookies.set('admin_sesion', process.env.ADMIN_PASSWORD, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    })

    return respuesta
  } catch (error) {
    console.error('Error en login admin:', error)
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}