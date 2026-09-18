import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function formatearItems(items) {
  return items
    .map((item) => {
      const foto = item.imagen_url
        ? `<td style="width: 64px; padding-right: 12px; vertical-align: top;">
             <table role="presentation" width="64" height="64" style="width: 64px; height: 64px; background-color: #FAF6F0; border: 1px solid #E4DCCF; border-radius: 8px;">
               <tr>
                 <td align="center" valign="middle" style="text-align: center; vertical-align: middle;">
                   <img src="${item.imagen_url}" alt="${item.nombre}" width="56" style="max-width: 56px; max-height: 56px; display: block; margin: 0 auto;" />
                 </td>
               </tr>
             </table>
           </td>`
        : ''

      return `
        <table role="presentation" width="100%" style="margin-bottom: 10px;">
          <tr>
            ${foto}
            <td style="vertical-align: top; font-size: 14px; color: #2E2A26;">
              <div>${item.nombre}</div>
              <div style="color: #8A8378;">Cantidad: ${item.cantidad} — $${item.precio * item.cantidad}</div>
            </td>
          </tr>
        </table>
      `
    })
    .join('')
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
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: pedido.comprador_email,
      replyTo: 'abel.nygaard@gmail.com',
      subject: '¡Gracias por tu compra! - dimedetiambos',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #FAF6F0; padding: 24px;">
          <h2 style="color: #2F6B63; font-weight: bold;">¡Gracias por tu compra, ${pedido.cliente_nombre || ''}!</h2>
          <p style="color: #2E2A26;">Recibimos tu pedido y ya está siendo procesado.</p>

          <div style="background-color: #ffffff; border: 1px solid #E4DCCF; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; color: #2E2A26;">Resumen del pedido</p>
            ${formatearItems(pedido.items)}
            ${pedido.zona_envio ? `<p style="margin: 10px 0 0; color: #2E2A26;">Envío (${pedido.zona_envio}): $${pedido.costo_envio}</p>` : ''}
            <p style="margin: 10px 0 0; font-weight: bold; font-size: 18px; color: #2F6B63;">Total: $${pedido.total}</p>
          </div>

          ${pedido.direccion ? `<p style="color: #2E2A26;"><strong>Dirección de envío:</strong><br>${formatearDireccion(pedido.direccion)}</p>` : ''}
          ${pedido.factura_pdf_url ? `<p><a href="${pedido.factura_pdf_url}" style="color: #2F6B63;">📄 Ver tu factura</a></p>` : ''}

          <p style="margin-top: 24px; color: #8A8378; font-size: 14px;">
            Cualquier consulta, respondé este mail o escribinos por WhatsApp.
          </p>
        </div>
      `,
    })
      if (error) {
      console.error('Resend devolvió un error:', error)
    } else {
      console.log('Email enviado OK:', data)
    }
  } catch (error) {
    console.error('Error al enviar email de confirmación al cliente:', error)
  }
}

export async function enviarEmailNotificacionVenta(pedido) {
  const emailAdmin = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!emailAdmin) return

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: emailAdmin,
      subject: `Nueva venta 💰 - $${pedido.total}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #FAF6F0; padding: 24px;">
          <h2 style="color: #2F6B63; font-weight: bold;">Nueva venta aprobada</h2>

          <p style="color: #2E2A26;"><strong>Cliente:</strong> ${pedido.cliente_nombre || 'Sin nombre'}</p>
          <p style="color: #2E2A26;"><strong>Email:</strong> ${pedido.comprador_email || '-'}</p>
          <p style="color: #2E2A26;"><strong>Teléfono:</strong> ${pedido.cliente_telefono || '-'}</p>
          <p style="color: #2E2A26;"><strong>DNI:</strong> ${pedido.cliente_dni || '-'}</p>

          <div style="background-color: #ffffff; border: 1px solid #E4DCCF; padding: 16px; border-radius: 10px; margin: 16px 0;">
            ${formatearItems(pedido.items)}
            ${pedido.zona_envio ? `<p style="margin: 10px 0 0; color: #2E2A26;">Envío (${pedido.zona_envio}): $${pedido.costo_envio}</p>` : ''}
            <p style="margin: 10px 0 0; font-weight: bold; font-size: 18px; color: #2F6B63;">Total: $${pedido.total}</p>
          </div>

          ${pedido.direccion ? `<p style="color: #2E2A26;"><strong>Dirección:</strong><br>${formatearDireccion(pedido.direccion)}</p>` : ''}
          ${pedido.notas ? `<p style="color: #2E2A26;"><strong>Notas:</strong> ${pedido.notas}</p>` : ''}

          <p style="margin-top: 20px; font-size: 13px; color: #8A8378;">
            Pago #${pedido.mercadopago_payment_id}
          </p>
        </div>
      `,
    })
      if (error) {
      console.error('Resend devolvió un error:', error)
    } else {
      console.log('Email enviado OK:', data)
    }
  } catch (error) {
    console.error('Error al enviar email de notificación de venta:', error)
  }
}