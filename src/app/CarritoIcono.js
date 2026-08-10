'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'

export default function CarritoIcono() {
  const { items, cantidadTotal, total, quitarDelCarrito } = useCarrito()
  const [abierto, setAbierto] = useState(false)

  return (
    <div
      onMouseEnter={() => setAbierto(true)}
      onMouseLeave={() => setAbierto(false)}
      style={{ position: 'relative' }}
    >
      <div
        style={{
          padding: '10px 16px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        🛒 {cantidadTotal}
      </div>

      {abierto && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '340px',
            backgroundColor: 'white',
            boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
            padding: '20px',
            zIndex: 100,
            overflowY: 'auto',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Tu carrito</h3>

          {items.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>Tu carrito está vacío</p>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.variante_id || ''}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>
                      {item.nombre} {item.color ? `(${item.color})` : ''}
                    </p>
                    <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                      {item.cantidad} x ${item.precio} = ${item.cantidad * item.precio}
                    </p>
                  </div>
                  <button
                    onClick={() => quitarDelCarrito(item.id)}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '18px',
                    }}
                    title="Quitar"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <p style={{ fontWeight: 'bold', marginTop: '16px', fontSize: '18px' }}>
                Total: ${total}
              </p>

              <Link href="/checkout">
                <button
                  style={{
                    width: '100%',
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: '#009ee3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '15px',
                  }}
                >
                  Finalizar compra
                </button>
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}