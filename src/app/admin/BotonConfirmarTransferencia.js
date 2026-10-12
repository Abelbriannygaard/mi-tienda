'use client'

import { useState } from 'react'

export default function BotonConfirmarTransferencia({ pedido }) {
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const esTransferencia = pedido.metodo_pago === 'transferencia'
  const pendiente = pedido.estado === 'pending'
  // Pagado pero la factura falló: el mismo botón la reintenta
  const faltaFactura = pedido.estado === 'approved' && !pedido.factura_cae

  if (!esTransferencia || (!pendiente && !faltaFactura)) return null

  async function confirmar() {
    const aviso = pendiente
      ? `¿Ya viste $${pedido.total} acreditados en tu cuenta por el pedido #${pedido.id}?\n\nAl confirmar se marca como pagado, se emite la factura real en AFIP y se le avisa al cliente por email.`
      : '¿Reintentar la factura de este pedido? Se emite una factura real en AFIP.'
    if (!confirm(aviso)) return

    setCargando(true)
    setResultado(null)

    try {
      const res = await fetch('/api/admin/pedidos-confirmar-transferencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: pedido.id }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setResultado({ tipo: 'error', mensaje: data.error || 'Error al confirmar el pago.' })
      } else if (!data.facturaOk) {
        setResultado({
          tipo: 'error',
          mensaje: 'Pago confirmado, pero la factura falló. Recargá la página y tocá "Reintentar factura".',
        })
      } else {
        setResultado({ tipo: 'ok', mensaje: 'Pago confirmado y factura emitida. Recargá la página.' })
      }
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: 'Error de conexión.' })
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ marginTop: '10px' }}>
      <button
        onClick={confirmar}
        disabled={cargando}
        style={{
          padding: '8px 14px',
          fontSize: '13px',
          fontWeight: '600',
          backgroundColor: cargando ? '#ccc' : '#2F6B63',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: cargando ? 'not-allowed' : 'pointer',
        }}
      >
        {cargando ? 'Confirmando...' : pendiente ? '🏦 Confirmar pago' : '🧾 Reintentar factura'}
      </button>
      {resultado && (
        <p style={{ marginTop: '6px', fontSize: '13px', color: resultado.tipo === 'ok' ? '#15803d' : '#dc2626' }}>
          {resultado.mensaje}
        </p>
      )}
    </div>
  )
}