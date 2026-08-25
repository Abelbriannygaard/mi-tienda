import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createClient } from '@supabase/supabase-js'
import { enviarEmailConfirmacionCliente, enviarEmailNotificacionVenta } from './enviarEmails'

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
              pisoDepto: datosCliente.pisoDepto || datosCliente.piso_depto || null,
              ciudad: datosCliente.ciudad,
              codigoPostal: datosCliente.codigoPostal || datosCliente.codigo_postal || null,
            }
          : null,
        zona_envio: zonaEnvio?.nombre || null,
        costo_envio: zonaEnvio?.costo || 0,
        envio_carrier: zonaEnvio?.envioCarrier || zonaEnvio?.envio_carrier || null,
        envio_service_code: zonaEnvio?.envioServiceCode || zonaEnvio?.envio_service_code || null,
        notas: datosCliente.notas || null,
      },
      { onConflict: 'mercadopago_payment_id' }
    )

  if (error) {
    console.error('Error al guardar el pedido:', error)
    throw new Error('Error al guardar el pedido')
  }

  // Enviar emails solo si el pago quedó aprobado (evita mails por pagos pendientes/rechazados)
  if (pago.status === 'approved') {
    const pedidoGuardado = {
      cliente_nombre: datosCliente.nombre || null,
      comprador_email: datosCliente.email || pago.payer?.email || null,
      cliente_telefono: datosCliente.telefono || null,
      cliente_dni: datosCliente.dni || null,
      items,
      total: pago.transaction_amount,
      zona_envio: zonaEnvio?.nombre || null,
      costo_envio: zonaEnvio?.costo || 0,
      direccion: datosCliente.calle
        ? {
            calle: datosCliente.calle,
            numero: datosCliente.numero,
            pisoDepto: datosCliente.pisoDepto || datosCliente.piso_depto || null,
            ciudad: datosCliente.ciudad,
            codigoPostal: datosCliente.codigoPostal || datosCliente.codigo_postal || null,
          }
        : null,
      notas: datosCliente.notas || null,
      mercadopago_payment_id: String(paymentId),
    }

    await enviarEmailConfirmacionCliente(pedidoGuardado)
    await enviarEmailNotificacionVenta(pedidoGuardado)
  }

  return pago
}