import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

export async function POST(request) {
  try {
    const { items, zonaEnvio, datosCliente } = await request.json()

    const preference = new Preference(client)

    const itemsParaMP = items.map((item) => ({
      title: item.color ? `${item.nombre} (${item.color})` : item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: 'ARS',
    }))

    if (zonaEnvio && zonaEnvio.costo > 0) {
      itemsParaMP.push({
        title: `Envío - ${zonaEnvio.nombre}`,
        quantity: 1,
        unit_price: zonaEnvio.costo,
        currency_id: 'ARS',
      })
    }

    const resultado = await preference.create({
      body: {
        items: itemsParaMP,
        payer: {
          name: datosCliente?.nombre,
          email: datosCliente?.email,
        },
        metadata: {
          datos_cliente: datosCliente,
          zona_envio: zonaEnvio,
        },
        back_urls: {
          success: 'https://tienda.dimedetiambos.com.ar/pago-exitoso',
          failure: 'https://tienda.dimedetiambos.com.ar/pago-fallido',
          pending: 'https://tienda.dimedetiambos.com.ar/pago-pendiente',
        },
        auto_return: 'approved',
        notification_url: 'https://tienda.dimedetiambos.com.ar/api/webhook-mercadopago',
      },
    })

    return NextResponse.json({ id: resultado.id, init_point: resultado.init_point })
  } catch (error) {
    console.error('Error al crear preferencia:', error)
    return NextResponse.json({ error: 'Error al crear la preferencia de pago' }, { status: 500 })
  }
}