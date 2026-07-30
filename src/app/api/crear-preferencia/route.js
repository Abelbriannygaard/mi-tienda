import { MercadoPagoConfig, Preference } from 'mercadopago'
import { NextResponse } from 'next/server'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

export async function POST(request) {
  try {
    const { items } = await request.json()

    const preference = new Preference(client)

    const resultado = await preference.create({
      body: {
        items: items.map((item) => ({
          title: item.nombre,
          quantity: item.cantidad,
          unit_price: item.precio,
          currency_id: 'ARS',
        })),
        back_urls: {
          success: 'https://mi-tienda-henna.vercel.app/pago-exitoso',
          failure: 'https://mi-tienda-henna.vercel.app/pago-fallido',
          pending: 'https://mi-tienda-henna.vercel.app/pago-pendiente',
        },
        auto_return: 'approved',
      },
    })

    return NextResponse.json({ id: resultado.id, init_point: resultado.init_point })
  } catch (error) {
    console.error('Error al crear preferencia:', error)
    return NextResponse.json({ error: 'Error al crear la preferencia de pago' }, { status: 500 })
  }
}