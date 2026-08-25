'use client'

import { useState } from 'react'

export default function BotonGenerarEtiqueta({ pedido }) {
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)

  async function generar() {
    if (!confirm('¿Generar la etiqueta de envío para este pedido? Esto genera un envío real (o de prueba, si seguimos en sandbox) y no se puede deshacer fácilmente.')) {
      return
    }

    setCargando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/envios/generar-etiqueta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: pedido.id }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setResultado({ tipo: 'ok', mensaje: 'Etiqueta generada. Recargá la página para ver los datos.' })
      } else {
        setResultado({ tipo: 'error', mensaje: data.error || 'Error al generar la etiqueta.' })
      }
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: 'Error de conexión al generar la etiqueta.' })
    } finally {
      setCargando(false)
    }
  }

  if (pedido.estado_envio === 'etiqueta_generada') {
    return (
      <div style={{ marginTop: '10px', fontSize: '13px', color: '#15803d' }}>
        ✅ Etiqueta generada
        {pedido.tracking_envio && ` — Tracking: ${pedido.tracking_envio}`}
        {pedido.etiqueta_url && (
          <>
            {' · '}
            <a href={pedido.etiqueta_url} target="_blank" rel="noreferrer" style={{ color: '#009ee3' }}>
              Ver etiqueta
            </a>
          </>
        )}
      </div>
    )
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        onClick={generar}
        disabled={cargando}
        style={{
          padding: '8px 14px',
          fontSize: '13px',
          backgroundColor: cargando ? '#ccc' : '#15803d',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: cargando ? 'not-allowed' : 'pointer',
        }}
      >
        {cargando ? 'Generando...' : '📦 Generar etiqueta'}
      </button>
      {resultado && (
        <p style={{ marginTop: '6px', fontSize: '13px', color: resultado.tipo === 'ok' ? '#15803d' : '#dc2626' }}>
          {resultado.mensaje}
        </p>
      )}
    </div>
  )
}