'use client'

import { useCarrito } from '@/lib/carrito'

export default function CarritoIcono() {
  const { cantidadTotal, total, pagar } = useCarrito()

  return (
    <div style={{ padding: '10px 16px', border: '1px solid #ccc', borderRadius: '8px' }}>
      🛒 {cantidadTotal} items — ${total}
      {cantidadTotal > 0 && (
        <button
          onClick={pagar}
          style={{
            marginLeft: '12px',
            padding: '6px 14px',
            backgroundColor: '#009ee3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Finalizar compra
        </button>
      )}
    </div>
  )
}