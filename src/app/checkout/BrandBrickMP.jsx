'use client'

import { useEffect } from 'react'

const SDK_SRC = 'https://sdk.mercadopago.com/js/v2'

function cargarSDK() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) return resolve()
    const existente = document.querySelector(`script[src="${SDK_SRC}"]`)
    if (existente) {
      existente.addEventListener('load', resolve)
      existente.addEventListener('error', reject)
      return
    }
    const script = document.createElement('script')
    script.src = SDK_SRC
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.body.appendChild(script)
  })
}

export default function BrandBrickMP() {
  useEffect(() => {
    let cancelado = false
    let controller = null

    async function iniciar() {
      try {
        await cargarSDK()
        if (cancelado) return

        const mp = new window.MercadoPago(
          process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
          { locale: 'es-AR' }
        )

        controller = await mp.bricks().create('brand', 'brandBrick_container', {
          customization: {
            texts: {
              valueProp: 'security',
              align: 'left',
              useCustomFont: false,
              size: 'medium',
              fontWeight: 'semibold',
              color: 'secondary',
            },
            paymentMethods: {
              excludedPaymentMethods: [],
              excludedPaymentTypes: [],
              maxInstallments: 12,
              interestFreeInstallments: false,
            },
            visual: {
              backgroundColor: 'white',
              hideMercadoPagoLogo: false,
              border: false,
              borderColor: 'dark',
              contentAlign: 'center',
              borderWidth: '1px',
              borderRadius: '0px',
              verticalPadding: '8px',
              horizontalPadding: '16px',
            },
          },
        })

        // Si el componente se desmontó mientras cargaba, lo limpiamos
        if (cancelado && controller) controller.unmount()
      } catch (error) {
        console.error('No se pudo cargar el Brand Brick de Mercado Pago:', error)
      }
    }

    iniciar()

    return () => {
      cancelado = true
      if (controller) controller.unmount()
    }
  }, [])

  return <div id="brandBrick_container" />
}