import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

export async function POST(request) {
  try {
    const { items, zonaEnvio } = await request.json()

    const preference = new Preference(client)

    const itemsParaMP = items.map((item) => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precio,
      currency_id: 'ARS',
    }))

    // Si hay envío con costo, lo agregamos como un item más
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
        back_urls: {
          success: 'https://mi-tienda-henna.vercel.app/pago-exitoso',
          failure: 'https://mi-tienda-henna.vercel.app/pago-fallido',
          pending: 'https://mi-tienda-henna.vercel.app/pago-pendiente',
        },
        auto_return: 'approved',
        notification_url: 'https://mi-tienda-henna.vercel.app/api/webhook-mercadopago',
      },
    })

    return NextResponse.json({ id: resultado.id, init_point: resultado.init_point })
  } catch (error) {
    console.error('Error al crear preferencia:', error)
    return NextResponse.json({ error: 'Error al crear la preferencia de pago' }, { status: 500 })
  }
}