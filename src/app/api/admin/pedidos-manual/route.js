import { createClient } from '@supabase/supabase-js'
import { esAdmin } from '@/lib/adminAuth'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  if (!(await esAdmin())) {
    return Response.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      clienteNombre,
      clienteEmail,
      clienteTelefono,
      clienteDni,
      direccion,
      cantidadBultos,
      notas,
      envio,
    } = body

    if (!direccion?.calle || !direccion?.numero || !direccion?.ciudad || !direccion?.codigoPostal) {
      return Response.json({ error: 'Falta completar la dirección' }, { status: 400 })
    }

    if (!envio?.carrierSlug || !envio?.serviceCode) {
      return Response.json({ error: 'Falta elegir una opción de envío' }, { status: 400 })
    }

    const cantidad = Math.max(1, parseInt(cantidadBultos, 10) || 1)

    const { data: pedido, error } = await supabaseAdmin
      .from('pedidos')
      .insert({
        mercadopago_payment_id: `MANUAL-${crypto.randomUUID()}`,
        estado: 'manual',
        total: envio.price || 0,
        items: [
          {
            nombre: 'Envio manual (sin productos de la tienda)',
            cantidad,
            precio: 0,
            imagen_url: null,
          },
        ],
        comprador_email: clienteEmail || null,
        cliente_nombre: clienteNombre || null,
        cliente_dni: clienteDni || null,
        cliente_telefono: clienteTelefono || null,
        direccion: {
          calle: direccion.calle,
          numero: direccion.numero,
          pisoDepto: direccion.pisoDepto || null,
          ciudad: direccion.ciudad,
          codigoPostal: direccion.codigoPostal,
        },
        zona_envio: `${envio.carrier} - ${envio.service}`,
        costo_envio: envio.price || 0,
        envio_carrier: envio.carrierSlug,
        envio_service_code: envio.serviceCode,
        envio_branch_code: envio.branchCode || null,
        notas: notas || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error al crear pedido manual:', error)
      return Response.json({ error: 'No se pudo crear el envío manual' }, { status: 500 })
    }

    return Response.json({ ok: true, pedido })
  } catch (error) {
    console.error('Error en pedidos-manual:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}