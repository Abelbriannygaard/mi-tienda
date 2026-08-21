import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { postalCode, items } = await req.json()

    if (!postalCode) {
      return NextResponse.json({ success: false, error: 'Código postal requerido' }, { status: 400 })
    }

    const apiKey = process.env.ENVIA_TOKEN
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Falta ENVIA_API_KEY en .env.local' }, { status: 500 })
    }

    // Calcular peso y alto real según la cantidad de prendas en el carrito
    const totalItems = items?.reduce((acc, item) => acc + (item.cantidad || 1), 0) || 1
    const weight = totalItems * 0.8
    const height = 8 * Math.min(totalItems, 3)

    const payload = {
      origin: {
        name: "Dimedeti Ambos",
        company: "Dimedeti Ambos",
        email: "dimedetiambos@gmail.com",
        phone: "1112345678",
        street: "Posadas",
        number: "2646",
        district: "Villa Libertad",
        city: "General San Martín",
        state: "B",
        country: "AR",
        postalCode: "1650"
      },
      destination: {
        name: "Cliente",
        company: "Particular",
        email: "cliente@email.com",
        phone: "1112345678",
        street: "Calle Falsa",
        number: "123",
        district: "Centro",
        city: "Buenos Aires",
        state: "B",
        country: "AR",
        postalCode: String(postalCode).trim()
      },
      packages: [
        {
          content: "Indumentaria Medica",
          amount: 1,
          type: "box",
          dimensions: {
            length: 18,
            width: 20,
            height: height
          },
          weight: weight
        }
      ],
      shipment: {
        carrier: "correoArgentino",
        type: 1
      }
    }

    const res = await fetch('https://api-test.envia.com/ship/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify(payload)
    })

    const responseText = await res.text()
    let data = {}

    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error("Respuesta de Envia no es JSON válido:", responseText)
      return NextResponse.json({
        success: false,
        error: 'Error de autenticación con la API de Envia (API Key inválida o mal copiada).'
      }, { status: 400 })
    }

    console.log("=== RESPUESTA ENVIA ===", JSON.stringify(data, null, 2))

    if (!res.ok || data.meta === 'error' || !data.data || data.data.length === 0) {
      const msg = data.error?.message || data.message || 'No se encontraron tarifas para ese CP'
      return NextResponse.json({ success: false, error: msg }, { status: 400 })
    }

    const DIAS_CONFECCION = 12

    const rates = data.data.map((rate) => {
      const matches = rate.deliveryEstimate?.match(/\d+/g)
      const transitDays = matches ? parseInt(matches[matches.length - 1]) : 5
      const totalDays = transitDays + DIAS_CONFECCION

      return {
        id: `${rate.carrierId || 'ca'}-${rate.serviceId || 'std'}`,
        carrier: rate.carrierDescription || "Correo Argentino",
        service: rate.serviceDescription || rate.service || "Estándar",
        price: Math.round(rate.totalPrice || 0),
        deliveryText: `Llega en aprox. ${totalDays} días corridos (incluye 12 días de confección)`
      }
    })

    return NextResponse.json({ success: true, rates })

  } catch (error) {
    console.error("Error servidor cotización:", error)
    return NextResponse.json({ success: false, error: 'Error interno del servidor' }, { status: 500 })
  }
}