import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function guardarPedido(paymentId) {
  // Le preguntamos a MercadoPago los detalles reales de ese pago
  const payment = new Payment(client)
  const pago = await payment.get({ id: paymentId })

  // Armamos la lista de productos comprados en un formato simple
  const items = pago.additional_info?.items?.map((item) => ({
    nombre: item.title,
    cantidad: item.quantity,
    precio: item.unit_price,
  })) || []

  // Guardamos (o actualizamos si ya existía) el pedido en Supabase
  const { error } = await supabaseAdmin
    .from('pedidos')
    .upsert(
      {
        mercadopago_payment_id: String(paymentId),
        estado: pago.status,
        total: pago.transaction_amount,
        items: items,
        comprador_email: pago.payer?.email || null,
      },
      { onConflict: 'mercadopago_payment_id' }
    )

  if (error) {
    console.error('Error al guardar el pedido:', error)
    throw new Error('Error al guardar el pedido')
  }

  return pago
}