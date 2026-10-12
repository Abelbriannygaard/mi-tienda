// Confirmar el pago de un pedido por transferencia.
// Esta función NO verifica quién la llama: la ruta de API que la usa chequea esAdmin() antes.

import { createClient } from '@supabase/supabase-js'
import { generarFactura } from './generarFactura'
import { enviarEmailConfirmacionCliente } from './enviarEmails'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Genera la factura y la guarda en el pedido. Devuelve la info, o null si falló.
async function facturarPedido(pedido) {
  try {
    const facturaInfo = await generarFactura({ ...pedido, factura_cae: null })
    if (facturaInfo.yaExistia) return null

    const { error } = await supabaseAdmin
      .from('pedidos')
      .update({
        factura_cae: facturaInfo.cae,
        factura_vencimiento_cae: facturaInfo.vencimiento,
        factura_numero: facturaInfo.numero,
        factura_pdf_url: facturaInfo.pdfUrl,
      })
      .eq('id', pedido.id)

    if (error) {
      console.error('La factura se emitió pero no se pudo guardar en el pedido:', error, facturaInfo)
    }
    return facturaInfo
  } catch (error) {
    console.error('Error al generar la factura de transferencia:', error)
    return null
  }
}

// Marca el pedido como pagado, factura por el total con descuento y avisa al cliente.
export async function confirmarPagoTransferencia(pedidoId) {
  const { data: pedido, error } = await supabaseAdmin
    .from('pedidos')
    .select('*')
    .eq('id', pedidoId)
    .maybeSingle()

  if (error) throw error
  if (!pedido) return { ok: false, error: 'No existe ese pedido' }
  if (pedido.metodo_pago !== 'transferencia') {
    return { ok: false, error: 'Ese pedido no es por transferencia' }
  }

  // Ya estaba pagado: solo reintenta la factura si había fallado, sin mandar otro email
  if (pedido.estado === 'approved') {
    if (pedido.factura_cae) return { ok: true, yaConfirmado: true, facturaOk: true }
    const factura = await facturarPedido(pedido)
    return { ok: true, yaConfirmado: true, facturaOk: Boolean(factura) }
  }

  // El cambio de estado solo se aplica si sigue pendiente: si el botón se toca dos veces
  // a la vez, una sola pasa y no se factura ni se manda el mail por duplicado
  const { data: actualizados, error: errorEstado } = await supabaseAdmin
    .from('pedidos')
    .update({ estado: 'approved' })
    .eq('id', pedidoId)
    .eq('estado', 'pending')
    .select('id')

  if (errorEstado) throw errorEstado
  if (!actualizados || actualizados.length === 0) {
    return { ok: true, yaConfirmado: true, facturaOk: Boolean(pedido.factura_cae) }
  }

  const factura = await facturarPedido(pedido)

  await enviarEmailConfirmacionCliente({
    ...pedido,
    estado: 'approved',
    factura_pdf_url: factura?.pdfUrl || null,
  })

  return { ok: true, yaConfirmado: false, facturaOk: Boolean(factura) }
}