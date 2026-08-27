import { NextResponse } from 'next/server'

export async function GET() {
  const payload = {
    origin: {
      name: 'Dimedeti Ambos',
      company: 'Dimedeti Ambos',
      email: 'dimedetiambos@gmail.com',
      phone: '1112345678',
      street: 'Posadas',
      number: '2646',
      district: 'Villa Libertad',
      city: 'General San Martín',
      state: 'B',
      country: 'AR',
      postalCode: '1650',
    },
    destination: {
      name: 'Cliente Prueba',
      company: 'Particular',
      email: 'cliente@email.com',
      phone: '1112345678',
      street: 'Calle Falsa',
      number: '123',
      district: 'Buenos Aires',
      city: 'Buenos Aires',
      state: 'B',
      country: 'AR',
      postalCode: '1424',
      branchCode: '10134',
    },
    packages: [
      {
        content: 'Indumentaria Medica',
        amount: 1,
        type: 'box',
        dimensions: { length: 18, width: 20, height: 8 },
        weight: 0.8,
      },
    ],
    shipment: {
  carrier: 'andreani',
  type: 1,
  service: 'sucursal',
  serviceId: 414,
},
    settings: {
      printFormat: 'PDF',
      printSize: 'STOCK_4X6',
      currency: 'ARS',
    },
  }

  const res = await fetch('https://api-test.envia.com/ship/generate/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ENVIA_TOKEN.trim()}`,
    },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  console.log('=== TEST ETIQUETA ANDREANI (serviceId) ===', JSON.stringify(data, null, 2))

  return NextResponse.json(data)
}