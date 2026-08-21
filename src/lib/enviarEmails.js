import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatearItems(items) {
  return items
    .map((item) => `${item.cantidad} x ${item.nombre} — $${item.precio * item.cantidad}`)
    .join('<br>')
}

function formatearDireccion(direccion) {
  if (!direccion) return ''
  const partes = [
    `${direccion.calle} ${direccion.numero}`,
    direccion.pisoDepto ? direccion.pisoDepto : null,
    direccion.ciudad,
    direccion.codigoPostal ? `CP ${direccion.codigoPostal}` : null,
  ].filter(Boolean)
  return partes.join(', ')
}

export async function enviarEmailConfirmacionCliente(pedido) {
  if (!pedido.comprador_email) return

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: pedido.comprador_email,
      subject: '¡Gracias por tu compra! - dimedetiambos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #009ee3;">¡Gracias por tu compra, ${pedido.cliente_nombre || ''}!</h2>
          <p>Recibimos tu pedido y ya está siendo procesado.</p>

          <div style="background-color: #f7f7f7; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px; font-weight: bold;">Resumen del pedido</p>
            <p style="margin: 0;">${formatearItems(pedido.items)}</p>
            ${pedido.zona_envio ? `<p style="margin: 10px 0 0;">Envío (${pedido.zona_envio}): $${pedido.costo_envio}</p>` : ''}
            <p style="margin: 10px 0 0; font-weight: bold; font-size: 18px;">Total: $${pedido.total}</p>
          </div>

          ${pedido.direccion ? `<p><strong>Dirección de envío:</strong><br>${formatearDireccion(pedido.direccion)}</p>` : ''}

          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            Cualquier consulta, respondé este mail o escribinos por WhatsApp.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error al enviar email de confirmación al cliente:', error)
  }
}

export async function enviarEmailNotificacionVenta(pedido) {
  const emailAdmin = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!emailAdmin) return

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: emailAdmin,
      subject: `Nueva venta 💰 - $${pedido.total}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #15803d;">Nueva venta aprobada</h2>

          <p><strong>Cliente:</strong> ${pedido.cliente_nombre || 'Sin nombre'}</p>
          <p><strong>Email:</strong> ${pedido.comprador_email || '-'}</p>
          <p><strong>Teléfono:</strong> ${pedido.cliente_telefono || '-'}</p>
          <p><strong>DNI:</strong> ${pedido.cliente_dni || '-'}</p>

          <div style="background-color: #f7f7f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0;">${formatearItems(pedido.items)}</p>
            ${pedido.zona_envio ? `<p style="margin: 10px 0 0;">Envío (${pedido.zona_envio}): $${pedido.costo_envio}</p>` : ''}
            <p style="margin: 10px 0 0; font-weight: bold; font-size: 18px;">Total: $${pedido.total}</p>
          </div>

          ${pedido.direccion ? `<p><strong>Dirección:</strong><br>${formatearDireccion(pedido.direccion)}</p>` : ''}
          ${pedido.notas ? `<p><strong>Notas:</strong> ${pedido.notas}</p>` : ''}

          <p style="margin-top: 20px; font-size: 13px; color: #888;">
            Pago #${pedido.mercadopago_payment_id}
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error al enviar email de notificación de venta:', error)
  }
}