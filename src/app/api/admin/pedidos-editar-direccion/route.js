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
    const { pedidoId, direccion, envio } = await request.json()

    if (!pedidoId) {
      return Response.json({ error: 'Falta el ID del pedido' }, { status: 400 })
    }
    if (!direccion?.calle || !direccion?.numero || !direccion?.ciudad || !direccion?.codigoPostal) {
      return Response.json({ error: 'Falta completar la dirección' }, { status: 400 })
    }

    const actualizacion = {
      direccion: {
        calle: direccion.calle,
        numero: direccion.numero,
        pisoDepto: direccion.pisoDepto || null,
        ciudad: direccion.ciudad,
        codigoPostal: direccion.codigoPostal,
      },
    }

    if (envio?.carrierSlug && envio?.serviceCode) {
      actualizacion.zona_envio = `${envio.carrier} - ${envio.service}`
      actualizacion.costo_envio = envio.price || 0
      actualizacion.envio_carrier = envio.carrierSlug
      actualizacion.envio_service_code = envio.serviceCode
      actualizacion.envio_branch_code = envio.branchCode || null
    }

    const { error } = await supabaseAdmin
      .from('pedidos')
      .update(actualizacion)
      .eq('id', pedidoId)

    if (error) {
      console.error('Error al editar dirección:', error)
      return Response.json({ error: 'No se pudo actualizar la dirección' }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error en pedidos-editar-direccion:', error)
    return Response.json({ error: 'Error interno' }, { status: 500 })
  }
}