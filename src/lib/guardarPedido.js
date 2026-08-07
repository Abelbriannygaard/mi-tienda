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
  const payment = new Payment(client)
  const pago = await payment.get({ id: paymentId })

  const items = pago.additional_info?.items?.map((item) => ({
    nombre: item.title,
    cantidad: item.quantity,
    precio: item.unit_price,
  })) || []

  const datosCliente = pago.metadata?.datos_cliente || {}
  const zonaEnvio = pago.metadata?.zona_envio || null

  const { error } = await supabaseAdmin
    .from('pedidos')
    .upsert(
      {
        mercadopago_payment_id: String(paymentId),
        estado: pago.status,
        total: pago.transaction_amount,
        items: items,
        comprador_email: datosCliente.email || pago.payer?.email || null,
        cliente_nombre: datosCliente.nombre || null,
        cliente_dni: datosCliente.dni || null,
        cliente_telefono: datosCliente.telefono || null,
        direccion: datosCliente.calle
          ? {
              calle: datosCliente.calle,
              numero: datosCliente.numero,
              ciudad: datosCliente.ciudad,
              codigoPostal: datosCliente.codigoPostal,
            }
          : null,
        zona_envio: zonaEnvio?.nombre || null,
        costo_envio: zonaEnvio?.costo || 0,
        notas: datosCliente.notas || null,
      },
      { onConflict: 'mercadopago_payment_id' }
    )

  if (error) {
    console.error('Error al guardar el pedido:', error)
    throw new Error('Error al guardar el pedido')
  }

  return pago
}