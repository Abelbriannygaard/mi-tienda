import { NextResponse } from 'next/server'
import { guardarPedido } from '@/lib/guardarPedido'

export async function POST(request) {
  try {
    const body = await request.json()

    // MercadoPago manda distintos tipos de notificación, solo nos interesan los pagos
    if (body.type !== 'payment') {
      return NextResponse.json({ recibido: true })
    }

    const paymentId = body.data.id
    await guardarPedido(paymentId)

    return NextResponse.json({ recibido: true })
  } catch (error) {
    console.error('Error en webhook:', error)
    return NextResponse.json({ error: 'Error en webhook' }, { status: 500 })
  }
}