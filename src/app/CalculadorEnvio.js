'use client'

import { useState } from 'react'
import { UMBRAL_ENVIO_GRATIS } from '@/lib/configEnvioGratis'

// Calculadora de envío para la ficha del producto: el cliente ve el costo y el plazo
// antes de llegar al checkout. Usa la misma cotización que el carrito (/api/envios/cotizar).
export default function CalculadorEnvio({ precio, cantidad = 1 }) {
  const [cp, setCp] = useState('')
  const [estado, setEstado] = useState('inicial') // inicial | cargando | listo | error
  const [resultado, setResultado] = useState(null)
  const [mensaje, setMensaje] = useState('')

  const umbral = Number(UMBRAL_ENVIO_GRATIS)
  const subtotal = Number(precio || 0) * (Number(cantidad) || 1)
  const esGratis = subtotal >= umbral

  async function calcular() {
    const digitos = cp.replace(/\D/g, '').slice(0, 4)
    if (digitos.length < 4) {
      setEstado('error')
      setMensaje('Ingresá tu código postal de 4 dígitos.')
      return
    }

    setEstado('cargando')
    try {
      const res = await fetch('/api/envios/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: digitos, items: [{ cantidad: Number(cantidad) || 1 }] }),
      })
      const data = await res.json()

      if (res.ok && data.success && data.rates?.length > 0) {
        // Las opciones llegan ordenadas de la más barata a la más cara
        const masBarata = data.rates[0]
        setResultado({ precio: Number(masBarata.price) || 0, plazo: masBarata.envioTexto || null })
        setEstado('listo')
      } else {
        setEstado('error')
        setMensaje('No encontramos opciones de envío para ese código postal.')
      }
    } catch {
      setEstado('error')
      setMensaje('No pudimos calcular el envío. Probá de nuevo.')
    }
  }

  return (
    <div className="mt-5 rounded-2xl border border-[#E4DCCF] bg-white p-4">
      <p className="text-sm font-semibold text-[#2E2A26]">Calculá tu envío</p>
      <p className="mt-0.5 text-xs text-[#6B645C]">
        Envío gratis en compras desde ${umbral.toLocaleString('es-AR')} en productos.
      </p>

      <div className="mt-3 flex gap-2">
        <input
          value={cp}
          onChange={(e) => setCp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') calcular()
          }}
          inputMode="numeric"
          maxLength={8}
          placeholder="Tu código postal"
          aria-label="Código postal"
          className="w-full rounded-lg border border-[#E4DCCF] bg-white px-3 py-2 text-sm text-[#2E2A26] outline-none focus:border-[#2F6B63]"
        />
        <button
          type="button"
          onClick={calcular}
          disabled={estado === 'cargando'}
          className="rounded-lg bg-[#2F6B63] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#28584F] disabled:opacity-60"
        >
          {estado === 'cargando' ? '...' : 'Calcular'}
        </button>
      </div>

      {estado === 'listo' && resultado && (
        <div className="mt-3 text-sm text-[#2E2A26]">
          {esGratis ? (
            <p className="font-semibold text-[#2F6B63]">¡Con tu selección el envío es gratis!</p>
          ) : (
            <p>
              Envío desde{' '}
              <strong>${resultado.precio.toLocaleString('es-AR')}</strong>
            </p>
          )}
          {resultado.plazo && <p className="text-xs text-[#6B645C]">🚚 Llega en {resultado.plazo}.</p>}
        </div>
      )}

      {estado === 'error' && <p className="mt-3 text-xs text-[#B42318]">{mensaje}</p>}
    </div>
  )
}
