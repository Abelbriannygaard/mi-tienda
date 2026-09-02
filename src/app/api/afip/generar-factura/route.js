import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Afip from '@afipsdk/afip.js'
import { generarFacturaPdf } from '@/lib/generarFacturaPdf'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PUNTO_VENTA = 8
const TIPO_COMPROBANTE = 11 // Factura C (Monotributo)

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

    if (pedido.factura_cae) {
      return NextResponse.json(
        { error: 'Este pedido ya tiene una factura generada.' },
        { status: 400 }
      )
    }

    const afip = new Afip({
      CUIT: Number(process.env.AFIP_CUIT),
      cert: process.env.AFIP_CERT,
      key: process.env.AFIP_KEY,
      access_token: process.env.AFIP_ACCESS_TOKEN,
      production: true,
    })

    const ultimoAutorizado = await afip.ElectronicBilling.getLastVoucher(PUNTO_VENTA, TIPO_COMPROBANTE)
    const proximoNumero = ultimoAutorizado + 1

    // Determinar tipo y número de documento del cliente
    const dni = (pedido.cliente_dni || '').replace(/\D/g, '')
    const docTipo = dni.length >= 7 ? 96 : 99 // 96 = DNI, 99 = Consumidor Final sin identificar
    const docNro = dni.length >= 7 ? Number(dni) : 0

    const hoy = new Date()
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`

    const total = Number(pedido.total) || 0

    const data = {
      CantReg: 1,
      PtoVta: PUNTO_VENTA,
      CbteTipo: TIPO_COMPROBANTE,
      Concepto: 1, // Productos
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
    }

    console.log('=== SOLICITANDO FACTURA AFIP ===', JSON.stringify(data, null, 2))

    const resultado = await afip.ElectronicBilling.createVoucher(data)

    console.log('=== RESPUESTA AFIP ===', JSON.stringify(resultado, null, 2))

    const pdfBytes = await generarFacturaPdf({
      pedido,
      resultado,
      puntoVenta: PUNTO_VENTA,
      tipoComprobante: TIPO_COMPROBANTE,
    })

    const nombreArchivo = `factura-${PUNTO_VENTA}-${proximoNumero}.pdf`

    const { error: errorSubida } = await supabaseAdmin.storage
      .from('facturas')
      .upload(nombreArchivo, pdfBytes, { contentType: 'application/pdf', upsert: true })

    let facturaUrl = null
    if (!errorSubida) {
      const { data: urlData } = supabaseAdmin.storage.from('facturas').getPublicUrl(nombreArchivo)
      facturaUrl = urlData.publicUrl
    } else {
      console.error('Error al subir PDF a Supabase Storage:', errorSubida)
    }

    const { error: errorGuardar } = await supabaseAdmin
      .from('pedidos')
      .update({
        factura_cae: resultado.CAE,
        factura_vencimiento_cae: resultado.CAEFchVto,
        factura_numero: `${PUNTO_VENTA}-${proximoNumero}`,
        factura_pdf_url: facturaUrl,
      })
      .eq('id', pedidoId)

    if (errorGuardar) {
      console.error('Error al guardar factura en Supabase:', errorGuardar)
    }

    return NextResponse.json({ success: true, resultado })
  } catch (error) {
    console.error('Error al generar factura:', error)
    return NextResponse.json(
      { error: error.message || 'Error al generar la factura' },
      { status: 500 }
    )
  }
}