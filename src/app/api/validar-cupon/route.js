// Archivo: src/app/api/validar-cupon/route.js
import { NextResponse } from 'next/server'
import { buscarCuponValido } from '@/lib/cupones'

// Solo confirma que el cupón existe y está vigente, y devuelve lo mínimo para mostrar el descuento.
// El descuento definitivo siempre se vuelve a calcular en el servidor al crear el pedido.
export async function POST(request) {
  try {
    const { codigo } = await request.json()
    const resultado = await buscarCuponValido(codigo)

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
