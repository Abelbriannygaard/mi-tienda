import { createClient } from '@supabase/supabase-js'
import Afip from '@afipsdk/afip.js'
import { generarFacturaPdf } from './generarFacturaPdf'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PUNTO_VENTA = 8
const TIPO_COMPROBANTE = 11 // Factura C (Monotributo)

export async function generarFactura(pedido) {
  if (pedido.factura_cae) {
    return { yaExistia: true }
  }

  const afip = new Afip({
    CUIT: Number(process.env.AFIP_CUIT),
    cert: process.env.AFIP_CERT,
    key: process.env.AFIP_KEY,
    access_token: process.env.AFIP_ACCESS_TOKEN,
    production: true,
  })

  const ultimoAutorizado = await afip.ElectronicBilling.getLastVoucher(PUNTO_VENTA, TIPO_COMPROBANTE)
  const proximoNumero = ultimoAutorizado + 1

  const dni = (pedido.cliente_dni || '').replace(/\D/g, '')
  const docTipo = dni.length >= 7 ? 96 : 99
  const docNro = dni.length >= 7 ? Number(dni) : 0

  const hoy = new Date()
  const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, '0')}${String(hoy.getDate()).padStart(2, '0')}`
  const total = Number(pedido.total) || 0

  const data = {
    CantReg: 1,
    PtoVta: PUNTO_VENTA,
    CbteTipo: TIPO_COMPROBANTE,
    Concepto: 1,
    DocTipo: docTipo,
    DocNro: docNro,
    CbteDesde: proximoNumero,
    CbteHasta: proximoNumero,
    CbteFch: fecha,
    ImpTotal: total,
    ImpTotConc: 0,
    ImpNeto: total,
    ImpOpEx: 0,
    ImpTrib: 0,
    ImpIVA: 0,
    MonId: 'PES',
    MonCotiz: 1,
  }

  const resultado = await afip.ElectronicBilling.createVoucher(data)

  const pdfBytes = await generarFacturaPdf({
    pedido,
    resultado,
    puntoVenta: PUNTO_VENTA,
    tipoComprobante: TIPO_COMPROBANTE,
    numeroComprobante: proximoNumero,
  })

  const nombreArchivo = `factura-${PUNTO_VENTA}-${proximoNumero}.pdf`

  const { error: errorSubida } = await supabaseAdmin.storage
    .from('facturas')
    .upload(nombreArchivo, pdfBytes, { contentType: 'application/pdf', upsert: true })

  let facturaUrl = null
  if (!errorSubida) {
    const { data: urlData } = supabaseAdmin.storage.from('facturas').getPublicUrl(nombreArchivo)
    facturaUrl = urlData.publicUrl
  }

  return {
    yaExistia: false,
    cae: resultado.CAE,
    vencimiento: resultado.CAEFchVto,
    numero: `${PUNTO_VENTA}-${proximoNumero}`,
    pdfUrl: facturaUrl,
  }
}