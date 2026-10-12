import { NextResponse } from 'next/server'
import { esAdmin } from '@/lib/adminAuth'
import { confirmarPagoTransferencia } from '@/lib/transferencias'

export async function POST(request) {
  if (!(await esAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { pedidoId } = await request.json()

    if (!pedidoId) {
      return NextResponse.json({ error: 'Falta el ID del pedido' }, { status: 400 })
    }

    const resultado = await confirmarPagoTransferencia(pedidoId)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, ...resultado })
  } catch (error) {
    console.error('Error al confirmar pago por transferencia:', error)
    return NextResponse.json({ error: error.message || 'Error al confirmar el pago' }, { status: 500 })
  }
}