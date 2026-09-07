import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Afip from '@afipsdk/afip.js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PUNTO_VENTA = 8
const TIPO_FACTURA = 11 // Factura C
const TIPO_NOTA_CREDITO = 13 // Nota de Crédito C

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

    if (!pedido.factura_cae) {
      return NextResponse.json({ error: 'Este pedido no tiene factura para anular.' }, { status: 400 })
    }

    if (pedido.factura_anulada) {
      return NextResponse.json({ error: 'Esta factura ya fue anulada antes.' }, { status: 400 })
    }

    // Extraer el número de comprobante original desde factura_numero (formato "8-3")
    const numeroFacturaOriginal = Number(pedido.factura_numero.split('-')[1])

    const afip = new Afip({
      CUIT: Number(process.env.AFIP_CUIT),
      cert: process.env.AFIP_CERT,
      key: process.env.AFIP_KEY,
      access_token: process.env.AFIP_ACCESS_TOKEN,
      production: true,
    })

    const ultimoAutorizado = await afip.ElectronicBilling.getLastVoucher(PUNTO_VENTA, TIPO_NOTA_CREDITO)
    const proximoNumero = ultimoAutorizado + 1

    const dni = (pedido.cliente_dni || '').replace(/\D/g, '')
    const docTipo = dni.length >= 7 ? 96 : 99
    const docNro = dni.length >= 7 ? Number(dni) : 0

    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
    const total = Number(pedido.total) || 0

    const data = {
      CantReg: 1,
      PtoVta: PUNTO_VENTA,
      CbteTipo: TIPO_NOTA_CREDITO,
      Concepto: 1,
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: proximoNumero,
      CbteHasta: proximoNumero,
      CbteFch: fecha,
      ImpTotal: total,
      ImpTotConc: 0,
      ImpNeto: total,
      ImpOpEx: 0,
      ImpTrib: 0,
      ImpIVA: 0,
      MonId: 'PES',
      MonCotiz: 1,
      CbtesAsoc: [
        {
          Tipo: TIPO_FACTURA,
          PtoVta: PUNTO_VENTA,
          Nro: numeroFacturaOriginal,
        },
      ],
    }

    console.log('=== SOLICITANDO NOTA DE CREDITO AFIP ===', JSON.stringify(data, null, 2))

    const resultado = await afip.ElectronicBilling.createVoucher(data)

    console.log('=== RESPUESTA NOTA DE CREDITO AFIP ===', JSON.stringify(resultado, null, 2))

    await supabaseAdmin
      .from('pedidos')
      .update({
        nota_credito_numero: `${PUNTO_VENTA}-${proximoNumero}`,
        nota_credito_cae: resultado.CAE,
        factura_anulada: true,
      })
      .eq('id', pedidoId)

    return NextResponse.json({ success: true, resultado })
  } catch (error) {
    console.error('Error al anular factura:', error)
    return NextResponse.json({ error: error.message || 'Error al generar la nota de crédito' }, { status: 500 })
  }
}