import { NextResponse } from 'next/server'
import { resolverProvincia } from '@/lib/resolverProvincia'
const CARRIERS = ['correoArgentino', 'andreani', 'urbano', 'oca']

// Plazos de envío que se muestran al cliente. Se editan acá y no dependen de lo que informe el correo.
const ENVIO_EN_BSAS = { min: 2, max: 2, texto: '2 días' }
const ENVIO_RESTO_DEL_PAIS = { min: 3, max: 5, texto: '3 a 5 días hábiles' }

// true: la Ciudad de Buenos Aires (códigos postales 1000 a 1499) cuenta con el plazo de Buenos Aires.
// false: la Ciudad de Buenos Aires cuenta como "resto del país".
const CABA_CUENTA_COMO_BSAS = true

// Códigos con los que puede figurar la provincia de Buenos Aires
const CODIGOS_BSAS = ['BA', 'B', 'PBA', 'BUENOS AIRES']

// Devuelve el plazo de envío que corresponde al código postal del cliente
function plazoDeEnvio(postalCode) {
  const provincia = String(resolverProvincia(postalCode) || '').trim().toUpperCase()
  if (CODIGOS_BSAS.includes(provincia)) return ENVIO_EN_BSAS

  const digitos = String(postalCode).match(/\d{4}/)
  const cp = digitos ? parseInt(digitos[0], 10) : NaN
  if (CABA_CUENTA_COMO_BSAS && cp >= 1000 && cp <= 1499) return ENVIO_EN_BSAS

  return ENVIO_RESTO_DEL_PAIS
}

async function cotizarConCarrier(carrier, apiKey, postalCode, weight, height) {
  try {
        const res = await fetch('https://api.envia.com/ship/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        origin: {
          name: 'Dimedeti Ambos',
          company: 'Dimedeti Ambos',
          email: 'dimedetiambos@gmail.com',
          phone: '1112345678',
          street: 'Posadas',
          number: '2646',
          district: 'Villa Libertad',
          city: 'General San Martín',
          state: 'BA',
          country: 'AR',
          postalCode: '1650',
        },
        destination: {
          name: 'Cliente',
          company: 'Particular',
          email: 'cliente@email.com',
          phone: '1112345678',
          street: 'Calle Falsa',
          number: '123',
          district: 'Centro',
          city: 'Sin especificar',
          state: resolverProvincia(postalCode),
          country: 'AR',
          postalCode: String(postalCode).trim(),
          },
        packages: [
          {
            content: 'Indumentaria Medica',
            amount: 1,
            type: 'box',
            dimensions: { length: 18, width: 20, height },
            weight,
          },
        ],
        shipment: { carrier, type: 1 },
      }),
    })

    const responseText = await res.text()
    let data = {}

    try {
      data = JSON.parse(responseText)
    } catch {
      console.error(
        `Respuesta no-JSON de ${carrier}:`,
        responseText.slice(0, 300)
      )
      return []
    }

    if (
      !res.ok ||
      data.meta === 'error' ||
      !data.data ||
      data.data.length === 0
    ) {
      console.error(`Error con carrier ${carrier}:`, JSON.stringify(data))
      return []
    }

    console.log(
  `=== SERVICIOS DEVUELTOS POR ${carrier} ===`,
  JSON.stringify(
    data.data.map((rate) => ({
      carrier: rate.carrier,
      carrierDescription: rate.carrierDescription,
      service: rate.service,
      serviceId: rate.serviceId,
      serviceDescription: rate.serviceDescription,
      totalPrice: rate.totalPrice,
      deliveryEstimate: rate.deliveryEstimate,
      branches: rate.branches,
    })),
    null,
    2
  )
)

return data.data
  } catch (err) {
    console.error(`Excepción con carrier ${carrier}:`, err.message)
    return []
  }
}

export async function POST(req) {
  try {
    const { postalCode, items } = await req.json()

    if (!postalCode) {
      return NextResponse.json(
        { success: false, error: 'Código postal requerido' },
        { status: 400 }
      )
    }

    const apiKey = process.env.ENVIA_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Falta ENVIA_API_KEY en .env.local' },
        { status: 500 }
      )
    }

    const totalItems =
      items?.reduce(
        (acc, item) => acc + (parseInt(item.cantidad, 10) || 1),
        0
      ) || 1

    const weight = totalItems * 0.8
    const height = 8 * Math.min(totalItems, 3)

    const resultadosPorCarrier = await Promise.all(
      CARRIERS.map((carrier) =>
        cotizarConCarrier(
          carrier,
          apiKey,
          postalCode,
          weight,
          height
        )
      )
    )

    // Incluye todas las opciones devueltas por Envia:
    // domicilio y sucursal.
    const todasLasCotizaciones = resultadosPorCarrier
      .flat()
      .filter((rate) => !(rate.carrier === 'oca' && ['oca_PP', 'oca_PS'].includes(rate.service)))

    if (todasLasCotizaciones.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No se encontraron opciones de envío para este Código Postal.',
        },
        { status: 400 }
      )
    }

    // Solo se informa el plazo del correo (sin días de confección)
    const envio = plazoDeEnvio(postalCode)

    const rates = todasLasCotizaciones
      .map((rate) => {
        return {
          id: `${rate.carrierId || rate.carrier}-${rate.serviceId || rate.service}`,
          carrierSlug: rate.carrier,
          carrierId: rate.carrierId || null,
          serviceId: rate.serviceId || null,
          serviceCode: rate.service || null,
          carrier: rate.carrierDescription || rate.carrier,
          service:
            rate.serviceDescription || rate.service || 'Estándar',
          price: Math.round(rate.totalPrice || 0),
          diasEnvioMin: envio.min,
          diasEnvioMax: envio.max,
          envioTexto: envio.texto,
          deliveryText: `Envío: ${envio.texto}`,
          branches: (rate.serviceDescription || '').toLowerCase().trim().endsWith('a sucursal')
            ? (rate.branches || []).map((b) => ({
                branchCode: b.branch_code,
                direccion: `${b.reference || ''} - ${b.address?.address || ''}, ${b.address?.city || ''}`.trim(),
              }))
            : [],
        }
      })
      .sort((a, b) => a.price - b.price)

    return NextResponse.json({
      success: true,
      rates,
    })
  } catch (error) {
    console.error('Error servidor cotización:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

