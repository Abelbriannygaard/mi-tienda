// DESTINO: src/app/api/validar-cupon/route.js  (reemplaza el archivo actual)
import { NextResponse } from 'next/server'
import { buscarCuponValido, usuarioDesdeRequest, MENSAJE_LOGIN } from '@/lib/cupones'

// Confirma que el cupón existe, está vigente y que esta cuenta todavía no lo usó,
// y devuelve lo mínimo para mostrar el descuento.
// Hay que haber ingresado con Google. El descuento definitivo siempre se vuelve a calcular
// en el servidor al crear el pedido.
export async function POST(request) {
  try {
    const usuario = await usuarioDesdeRequest(request)
    if (!usuario) {
      return NextResponse.json({ error: MENSAJE_LOGIN, login_requerido: true }, { status: 401 })
    }

    const { codigo } = await request.json()
    const resultado = await buscarCuponValido(codigo, usuario.id)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    const { codigo: codigoCupon, tipo, valor, compra_minima } = resultado.cupon
    return NextResponse.json({
      cupon: {
        codigo: codigoCupon,
        tipo,
        valor: Number(valor),
        compra_minima: Number(compra_minima) || 0,
      },
    })
  } catch (error) {
    console.error('Error al validar el cupón:', error)
    return NextResponse.json({ error: 'No pudimos verificar el cupón. Probá de nuevo.' }, { status: 500 })
  }
}