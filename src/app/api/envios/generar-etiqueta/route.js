import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { pedidoId } = await request.json()

    if (!pedidoId) {
      return NextResponse.json(
        { error: 'Falta el ID del pedido' },
        { status: 400 }
      )
    }

    // Traer el pedido completo desde Supabase
    const { data: pedido, error: errorPedido } = await supabaseAdmin
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .single()

    if (errorPedido || !pedido) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    if (!pedido.envio_carrier || !pedido.envio_service_code) {
      return NextResponse.json(
        {
          error:
            'Este pedido no tiene guardado el carrier/servicio de envío (pedidos antiguos no lo tienen).',
        },
        { status: 400 }
      )
    }

    if (!pedido.direccion) {
      return NextResponse.json(
        {
          error:
            'Este pedido no tiene dirección de envío (puede ser retiro en persona).',
        },
        { status: 400 }
      )
    }

    const itemsSinEnvio = (pedido.items || []).filter(
      (item) => !item.nombre?.toLowerCase().startsWith('envío')
    )

    const totalItems =
      itemsSinEnvio.reduce(
        (acc, item) => acc + (parseInt(item.cantidad, 10) || 1),
        0
      ) || 1

    const weight = totalItems * 0.8
    const height = 8 * Math.min(totalItems, 3)

    // Determinar si el envío es a sucursal
    const esSucursal = Boolean(pedido.envio_branch_code)

    console.log('=== GENERANDO ETIQUETA ===', {
      pedidoId,
      carrier: pedido.envio_carrier,
      service: pedido.envio_service_code,
      branchCode: pedido.envio_branch_code || null,
      esSucursal,
      weight,
      totalItems,
    })

    // DESTINO
    // Siempre enviamos la dirección completa.
    // Si es sucursal, además agregamos branchCode.
    const destination = {
      name: pedido.cliente_nombre || 'Cliente',
      company: 'Particular',
      email:
        pedido.comprador_email ||
        'sin-email@dimedetiambos.com.ar',
      phone: pedido.cliente_telefono || '1100000000',

      street: pedido.direccion.calle,
      number: pedido.direccion.numero,
      district: pedido.direccion.ciudad,
      city: pedido.direccion.ciudad,
      state: 'B',
      country: 'AR',
      postalCode: pedido.direccion.codigoPostal,

      ...(esSucursal
        ? {
            branchCode: pedido.envio_branch_code,
          }
        : {}),
    }

    const payload = {
      origin: {
        name: 'Dimedeti Ambos',
        company: 'Dimedeti Ambos',
        email: 'dimedetiambos@gmail.com',
        phone: '1112345678',
        street: 'Posadas',
        number: '2646',
        district: 'Villa Libertad',
        city: 'General San Martín',
        state: 'B',
        country: 'AR',
        postalCode: '1650',
      },

      destination,

      packages: [
        {
          content: 'Indumentaria Medica',
          amount: 1,
          type: 'box',
          dimensions: {
            length: 18,
            width: 20,
            height,
          },
          weight,
        },
      ],

      shipment: {
        carrier: pedido.envio_carrier,
        type: 1,
        service: pedido.envio_service_code,
      },

      settings: {
        printFormat: 'PDF',
        printSize: 'STOCK_4X6',
        currency: 'ARS',
      },
    }

    console.log(
      '=== PAYLOAD GENERAR ETIQUETA ===',
      JSON.stringify(payload, null, 2)
    )

    const res = await fetch(
      'https://api-test.envia.com/ship/generate/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ENVIA_TOKEN.trim()}`,
        },
        body: JSON.stringify(payload),
      }
    )

    const responseText = await res.text()

    let data = {}

    try {
      data = JSON.parse(responseText)
    } catch {
      console.error(
        'Respuesta no-JSON al generar etiqueta:',
        responseText.slice(0, 500)
      )

      return NextResponse.json(
        {
          error: 'Envia no devolvió una respuesta válida.',
        },
        { status: 500 }
      )
    }

    console.log(
      '=== RESPUESTA GENERAR ETIQUETA ===',
      JSON.stringify(data, null, 2)
    )

    if (!res.ok || data.meta === 'error') {
      return NextResponse.json(
        {
          error:
            data.error?.message ||
            'Error al generar la etiqueta en Envia.',
        },
        { status: 400 }
      )
    }

    const resultado = data.data?.[0] || {}

    const { error: errorGuardar } = await supabaseAdmin
      .from('pedidos')
      .update({
        tracking_envio: resultado.trackingNumber || null,
        etiqueta_url: resultado.label || null,
        estado_envio: 'etiqueta_generada',
      })
      .eq('id', pedidoId)

    if (errorGuardar) {
      console.error(
        'Error al guardar etiqueta en Supabase:',
        errorGuardar
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error al generar etiqueta:', error)

    return NextResponse.json(
      {
        error: 'Error interno al generar la etiqueta',
      },
      { status: 500 }
    )
  }
}