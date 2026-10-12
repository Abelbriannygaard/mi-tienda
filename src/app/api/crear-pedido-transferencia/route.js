import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DESCUENTO_TRANSFERENCIA } from '@/lib/configTransferencia'
import {
  enviarEmailInstruccionesTransferencia,
  enviarEmailNotificacionTransferencia,
} from '@/lib/enviarEmails'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function verificarRecaptcha(token) {
  if (!token) return false

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    })

    const data = await res.json()
    return data.success && data.score >= 0.5 && data.action === 'checkout'
  } catch (error) {
    console.error('Error al verificar reCAPTCHA:', error)
    return false
  }
}

export async function POST(request) {
  try {
    const { items, zonaEnvio, datosCliente, recaptchaToken } = await request.json()

    const recaptchaValido = await verificarRecaptcha(recaptchaToken)
    if (!recaptchaValido) {
      return NextResponse.json(
        { error: 'No pudimos verificar que sos una persona real. Recargá la página e intentá de nuevo.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Tu carrito está vacío' }, { status: 400 })
    }
    if (!zonaEnvio) {
      return NextResponse.json({ error: 'Elegí una zona de envío' }, { status: 400 })
    }
    if (!datosCliente?.nombre || !datosCliente?.email) {
      return NextResponse.json({ error: 'Faltan tus datos de contacto' }, { status: 400 })
    }

    // Mismo criterio que crear-preferencia: se toman nombre y precio del carrito.
    // Se limpian cantidad y precio para que no entren valores raros.
    const itemsPedido = items.map((item) => {
      const cantidad = Math.max(1, parseInt(item.cantidad, 10) || 1)
      const precio = Math.max(0, Number(item.precio) || 0)
      const detalles = [item.color, item.talle ? `Talle ${item.talle}` : null].filter(Boolean).join(' - ')

      return {
        nombre: detalles ? `${item.nombre} (${detalles})` : item.nombre,
        cantidad,
        precio,
        imagen_url: item.imagen_url || null,
      }
    })

    const subtotal = itemsPedido.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
    const descuento = Math.round(subtotal * DESCUENTO_TRANSFERENCIA)
    const costoEnvio = Number(zonaEnvio.costo) || 0
    const total = subtotal - descuento + costoEnvio

    // El descuento queda como una línea con precio negativo, así todo suma igual
    // en el admin, en los emails y en la factura
    if (descuento > 0) {
      itemsPedido.push({
        nombre: `Descuento por transferencia (${Math.round(DESCUENTO_TRANSFERENCIA * 100)}%)`,
        cantidad: 1,
        precio: -descuento,
        imagen_url: null,
      })
    }

    const direccion = datosCliente.calle
      ? {
          calle: datosCliente.calle,
          numero: datosCliente.numero,
          pisoDepto: datosCliente.pisoDepto || null,
          ciudad: datosCliente.ciudad,
          codigoPostal: datosCliente.codigoPostal || null,
        }
      : null

    // La tabla identifica cada pedido por esta columna: se usa una referencia propia que arranca con TR-
    const referencia =
      'TR-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()

    const { data: pedido, error: errorInsert } = await supabaseAdmin
      .from('pedidos')
      .insert({
        mercadopago_payment_id: referencia,
        estado: 'pending',
        metodo_pago: 'transferencia',
        descuento,
        total,
        items: itemsPedido,
        comprador_email: datosCliente.email || null,
        cliente_nombre: datosCliente.nombre || null,
        cliente_dni: datosCliente.dni || null,
        cliente_telefono: datosCliente.telefono || null,
        direccion,
        zona_envio: zonaEnvio.nombre || null,
        costo_envio: costoEnvio,
        envio_carrier: zonaEnvio.envioCarrier || zonaEnvio.envio_carrier || null,
        envio_service_code: zonaEnvio.envioServiceCode || zonaEnvio.envio_service_code || null,
        envio_branch_code: zonaEnvio.envioBranchCode || zonaEnvio.envio_branch_code || null,
        notas: datosCliente.notas || null,
      })
      .select('id')
      .single()

    if (errorInsert) {
      console.error('Error al guardar el pedido por transferencia:', errorInsert)
      return NextResponse.json({ error: 'No se pudo guardar el pedido. Probá de nuevo.' }, { status: 500 })
    }

    const pedidoParaEmail = {
      id: pedido.id,
      cliente_nombre: datosCliente.nombre || null,
      comprador_email: datosCliente.email || null,
      cliente_telefono: datosCliente.telefono || null,
      cliente_dni: datosCliente.dni || null,
      items: itemsPedido,
      total,
      zona_envio: zonaEnvio.nombre || null,
      costo_envio: costoEnvio,
      direccion,
      notas: datosCliente.notas || null,
    }

    await enviarEmailInstruccionesTransferencia(pedidoParaEmail)
    await enviarEmailNotificacionTransferencia(pedidoParaEmail)

    return NextResponse.json({ pedido_id: pedido.id, total, descuento })
  } catch (error) {
    console.error('Error al crear pedido por transferencia:', error)
    return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 })
  }
}