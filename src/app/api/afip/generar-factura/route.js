import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generarFactura } from '@/lib/generarFactura'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { pedidoId } = await request.json()

    if (!pedidoId) {
      return NextResponse.json({ error: 'Falta el ID del pedido' }, { status: 400 })
    }

    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single()

    if (errorPedido || !pedido) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    const resultado = await generarFactura(pedido)

    if (resultado.yaExistia) {
      return NextResponse.json({ error: 'Este pedido ya tiene una factura generada.' }, { status: 400 })
    }

    await supabaseAdmin
      .from('pedidos')
      .update({
        factura_cae: resultado.cae,
        factura_vencimiento_cae: resultado.vencimiento,
        factura_numero: resultado.numero,
        factura_pdf_url: resultado.pdfUrl,
      })
      .eq('id', pedidoId)

    return NextResponse.json({ success: true, resultado })
  } catch (error) {
    console.error('Error al generar factura:', error)
    return NextResponse.json({ error: error.message || 'Error al generar la factura' }, { status: 500 })
  }
}