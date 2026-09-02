import { NextResponse } from 'next/server'
import Afip from '@afipsdk/afip.js'

export async function GET() {
  try {
    const afip = new Afip({
      CUIT: Number(process.env.AFIP_CUIT),
      cert: process.env.AFIP_CERT,
      key: process.env.AFIP_KEY,
      access_token: process.env.AFIP_ACCESS_TOKEN,
      production: true,
    })

    // Pedimos el número del último comprobante autorizado para el punto de venta 8, tipo Factura C (11)
    const ultimoAutorizado = await afip.ElectronicBilling.getLastVoucher(8, 11)

    return NextResponse.json({
      success: true,
      mensaje: 'Conexión con AFIP exitosa',
      ultimoComprobanteAutorizado: ultimoAutorizado,
    })
  } catch (error) {
    console.error('Error al conectar con AFIP:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    )
  }
}