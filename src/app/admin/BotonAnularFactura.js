'use client'

import { useState } from 'react'

export default function BotonAnularFactura({ pedido }) {
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)

  async function anular() {
    if (!confirm('¿Anular esta factura? Se va a generar una Nota de Crédito real ante AFIP. Esta acción no se puede deshacer.')) {
      return
    }

    setCargando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/afip/anular-factura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: pedido.id }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResultado({ tipo: 'ok', mensaje: 'Nota de crédito generada. Recargá la página.' })
      } else {
        setResultado({ tipo: 'error', mensaje: data.error || 'Error al anular la factura.' })
      }
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: 'Error de conexión.' })
    } finally {
      setCargando(false)
    }
  }

  if (!pedido.factura_cae) return null

  if (pedido.factura_anulada) {
    return (
      <div style={{ marginTop: '6px', fontSize: '13px', color: '#dc2626' }}>
        🚫 Factura anulada (NC {pedido.nota_credito_numero})
      </div>
    )
  }

  return (
    <div style={{ marginTop: '6px' }}>
      <button
        onClick={anular}
        disabled={cargando}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: cargando ? '#ccc' : '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: cargando ? 'not-allowed' : 'pointer',
        }}
      >
        {cargando ? 'Anulando...' : '🚫 Anular factura'}
      </button>
      {resultado && (
        <p style={{ marginTop: '4px', fontSize: '12px', color: resultado.tipo === 'ok' ? '#15803d' : '#dc2626' }}>
          {resultado.mensaje}
        </p>
      )}
    </div>
  )
}