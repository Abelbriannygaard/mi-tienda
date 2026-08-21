import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const token = process.env.ENVIA_TOKEN_TEST || process.env.ENVIA_TOKEN

    const response = await fetch("https://api-test.envia.com/ship/rate", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        origin: {
          name: 'Dimedeti',
          phone: '0000000000',
          country: 'AR',
          postalCode: '1650',
          city: 'San Martin',
          state: 'B',
        },
        destination: {
          name: 'Cliente prueba',
          phone: '0000000000',
          country: 'AR',
          postalCode: '1424',
          city: 'Buenos Aires',
          state: 'C',
        },
        packages: [
          {
            type: 'box',
            content: 'Indumentaria',
            amount: 1,
            declaredValue: 10000,
            weightUnit: 'KG',
            weight: 0.8,
            lengthUnit: 'CM',
            dimensions: {
              length: 18,
              width: 20,
              height: 8,
            },
          },
        ],
        shipment: {
          type: 1,
          carrier: 'correoArgentino',
        },
      }),
    })

    const data = await response.json()

    return NextResponse.json({
      status: response.status,
      data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo realizar la cotización', details: error.message },
      { status: 500 }
    )
  }
}