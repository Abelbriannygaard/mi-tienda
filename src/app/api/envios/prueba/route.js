import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch(
      'https://queries-test.envia.com/carrier?country_code=AR',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.ENVIA_TOKEN}`,
        },
      }
    )

    const text = await response.text()

    return new NextResponse(text, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/plain',
      },
    })
  } catch (error) {
    console.error('Error consultando carriers:', error)

    return NextResponse.json(
      {
        error: 'No se pudieron consultar los carriers',
        details: error.message,
      },
      { status: 500 }
    )
  }
}