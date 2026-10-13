import { Resend } from 'resend'
import { DATOS_BANCARIOS, WHATSAPP_NEGOCIO } from './configTransferencia'
import { textoConfeccion } from './configConfeccion'

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

      // Una línea con precio negativo es un descuento (ej: transferencia)
      const subtotal = item.precio * item.cantidad
      const importe = subtotal < 0 ? `-$${Math.abs(subtotal)}` : `$${subtotal}`
      const detalle = subtotal < 0 ? importe : `Cantidad: ${item.cantidad} — ${importe}`

      return `
        <table role="presentation" width="100%" style="margin-bottom: 10px;">
          <tr>
            ${foto}
            <td style="vertical-align: top; font-size: 14px; color: #2E2A26;">
              <div>${item.nombre}</div>
              <div style="color: #8A8378;">${detalle}</div>
            </td>
          </tr>
        </table>
      `
    })
    .join('')
}

// Bloque de entrega para los emails al cliente: tiempo de confección y, si corresponde, aviso de retiro
function bloqueEntrega(pedido) {
  const esRetiro = pedido.zona_envio === 'Retiro en persona'
  return `
          <p style="color: #2E2A26;"><strong>Tiempo de confección estimado:</strong> ${textoConfeccion()}.</p>
          ${esRetiro ? '<p style="color: #2E2A26;"><strong>Retiro en persona:</strong> te avisamos por WhatsApp o por email cuando tu pedido esté listo, y coordinamos el día y el horario para retirarlo.</p>' : ''}`
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
          ${bloqueEntrega(pedido)}
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

// ---------- Pago por transferencia ----------

// Al cliente, apenas hace el pedido: con los datos para transferir
export async function enviarEmailInstruccionesTransferencia(pedido) {
  if (!pedido.comprador_email) return

  const mensajeWhatsApp = `Hola! Hice el pedido #${pedido.id} por transferencia por $${pedido.total}. Te mando el comprobante.`
  const linkWhatsApp = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensajeWhatsApp)}`

  const filasBancarias = [
    ['Titular', DATOS_BANCARIOS.titular],
    ['Banco', DATOS_BANCARIOS.banco],
    ['Alias', DATOS_BANCARIOS.alias],
    ['CBU', DATOS_BANCARIOS.cbu],
    ['CUIT', DATOS_BANCARIOS.cuit],
  ]
    .filter(([, valor]) => valor)
    .map(
      ([etiqueta, valor]) =>
        `<p style="margin: 4px 0; color: #2E2A26;"><strong>${etiqueta}:</strong> ${valor}</p>`
    )
    .join('')

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: pedido.comprador_email,
      replyTo: 'abel.nygaard@gmail.com',
      subject: `Tu pedido #${pedido.id}: datos para la transferencia - dimedetiambos`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #FAF6F0; padding: 24px;">
          <h2 style="color: #2F6B63; font-weight: bold;">¡Recibimos tu pedido, ${pedido.cliente_nombre || ''}!</h2>
          <p style="color: #2E2A26;">Pedido <strong>#${pedido.id}</strong>. Para confirmarlo, hacé la transferencia con estos datos:</p>

          <div style="background-color: #ffffff; border: 1px solid #E4DCCF; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 4px; color: #8A8378; font-size: 13px;">Total a transferir</p>
            <p style="margin: 0 0 14px; font-weight: bold; font-size: 24px; color: #2F6B63;">$${pedido.total}</p>
            ${filasBancarias}
          </div>

          <p style="color: #2E2A26;">
            Después, mandanos el comprobante por WhatsApp indicando tu número de pedido:
          </p>
          <p style="margin: 16px 0;">
            <a href="${linkWhatsApp}" style="background-color: #2F6B63; color: #ffffff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: bold; display: inline-block;">
              Enviar comprobante por WhatsApp
            </a>
          </p>
          <p style="color: #2E2A26;">
            Cuando veamos el pago te lo confirmamos por mail y empezamos a confeccionar tu pedido.
          </p>

          <div style="background-color: #ffffff; border: 1px solid #E4DCCF; padding: 16px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; color: #2E2A26;">Resumen del pedido</p>
            ${formatearItems(pedido.items)}
            ${pedido.zona_envio ? `<p style="margin: 10px 0 0; color: #2E2A26;">Envío (${pedido.zona_envio}): $${pedido.costo_envio}</p>` : ''}
            <p style="margin: 10px 0 0; font-weight: bold; font-size: 18px; color: #2F6B63;">Total: $${pedido.total}</p>
          </div>

          ${pedido.direccion ? `<p style="color: #2E2A26;"><strong>Dirección de envío:</strong><br>${formatearDireccion(pedido.direccion)}</p>` : ''}
          ${bloqueEntrega(pedido)}

          <p style="margin-top: 24px; color: #8A8378; font-size: 14px;">
            Cualquier consulta, respondé este mail o escribinos por WhatsApp.
          </p>
        </div>
      `,
    })
    if (error) {
      console.error('Resend devolvió un error:', error)
    } else {
      console.log('Email de transferencia enviado OK:', data)
    }
  } catch (error) {
    console.error('Error al enviar email de instrucciones de transferencia:', error)
  }
}

// A Abel: hay un pedido esperando que confirme el pago
export async function enviarEmailNotificacionTransferencia(pedido) {
  const emailAdmin = process.env.ADMIN_NOTIFICATION_EMAIL
  if (!emailAdmin) return

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: emailAdmin,
      subject: `Pedido por transferencia pendiente 🏦 - $${pedido.total}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #FAF6F0; padding: 24px;">
          <h2 style="color: #2F6B63; font-weight: bold;">Pedido #${pedido.id} por transferencia</h2>
          <p style="color: #2E2A26;">Está <strong>pendiente de pago</strong>. Cuando veas la plata en tu cuenta, confirmalo desde el admin.</p>

          <p style="color: #2E2A26;"><strong>Cliente:</strong> ${pedido.cliente_nombre || 'Sin nombre'}</p>
          <p style="color: #2E2A26;"><strong>Email:</strong> ${pedido.comprador_email || '-'}</p>
          <p style="color: #2E2A26;"><strong>Teléfono:</strong> ${pedido.cliente_telefono || '-'}</p>
          <p style="color: #2E2A26;"><strong>DNI:</strong> ${pedido.cliente_dni || '-'}</p>

          <div style="background-color: #ffffff; border: 1px solid #E4DCCF; padding: 16px; border-radius: 10px; margin: 16px 0;">
            ${formatearItems(pedido.items)}
            ${pedido.zona_envio ? `<p style="margin: 10px 0 0; color: #2E2A26;">Envío (${pedido.zona_envio}): $${pedido.costo_envio}</p>` : ''}
            <p style="margin: 10px 0 0; font-weight: bold; font-size: 18px; color: #2F6B63;">Total a recibir: $${pedido.total}</p>
          </div>

          ${pedido.direccion ? `<p style="color: #2E2A26;"><strong>Dirección:</strong><br>${formatearDireccion(pedido.direccion)}</p>` : ''}
          ${pedido.notas ? `<p style="color: #2E2A26;"><strong>Notas:</strong> ${pedido.notas}</p>` : ''}

          <p style="margin-top: 20px;">
            <a href="https://tienda.dimedetiambos.com.ar/admin" style="color: #2F6B63; font-weight: bold;">Ir al panel para confirmar el pago</a>
          </p>
        </div>
      `,
    })
    if (error) {
      console.error('Resend devolvió un error:', error)
    } else {
      console.log('Email de aviso de transferencia enviado OK:', data)
    }
  } catch (error) {
    console.error('Error al enviar email de aviso de transferencia:', error)
  }
}
