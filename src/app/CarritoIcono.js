'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'
import SelectorEnvio from './checkout/SelectorEnvio'

export default function CarritoIcono() {
  const {
    items,
    cantidadTotal,
    totalProductos,
    costoEnvio,
    total,
    zonaEnvio,
    quitarDelCarrito,
    actualizarCantidad,
    vaciarCarrito,
  } = useCarrito()
  const [abierto, setAbierto] = useState(false)

  return (
    <>
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setAbierto(true)}
          style={{
            padding: '10px 16px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            cursor: 'pointer',
            backgroundColor: '#fff',
            fontSize: '15px',
          }}
        >
          🛒 {cantidadTotal}
        </button>
      </div>

      {abierto && (
        <>
          {/* Fondo oscuro: al tocarlo, cierra el panel */}
          <div
            onClick={() => setAbierto(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              zIndex: 99,
            }}
          />

          {/* Panel lateral del carrito */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              height: '100vh',
              width: '340px',
              maxWidth: '90vw',
              backgroundColor: 'white',
              boxShadow: '-4px 0 16px rgba(0,0,0,0.15)',
              padding: '20px',
              zIndex: 100,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Tu carrito</h3>
              <button
                onClick={() => setAbierto(false)}
                style={{
                  border: 'none',
                  background: '#f5f5f5',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#333',
                }}
                title="Cerrar"
              >
                ✕
              </button>
            </div>

            {items.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('¿Vaciar todo el carrito?')) {
                    vaciarCarrito()
                  }
                }}
                style={{
                  marginTop: '10px',
                  alignSelf: 'flex-start',
                  border: 'none',
                  background: 'none',
                  color: '#888',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: 0,
                }}
              >
                Vaciar carrito
              </button>
            )}

            {items.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', marginTop: '30px' }}>
                Tu carrito está vacío
              </p>
            ) : (
              <>
                <div style={{ marginTop: '16px' }}>
                  {items.map((item) => (
                    <div
                      key={`${item.id}-${item.variante_id || ''}`}
                      style={{
                        padding: '12px 0',
                        borderBottom: '1px solid #eee',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>
                            {item.nombre} {item.color ? `(${item.color})` : ''}
                          </p>
                          {item.talle && (
                            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#888' }}>
                              Talle: {item.talle}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => quitarDelCarrito(item.id, item.variante_id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            color: '#dc2626',
                            cursor: 'pointer',
                            fontSize: '16px',
                            padding: '2px 6px',
                          }}
                          title="Quitar"
                        >
                          ✕
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                          <button
                            onClick={() => actualizarCantidad(item.id, item.variante_id, item.cantidad - 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              fontSize: '15px',
                              border: '1px solid #ccc',
                              borderRadius: '6px 0 0 6px',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              color: '#333',
                            }}
                          >
                            −
                          </button>
                          <div
                            style={{
                              width: '34px',
                              height: '28px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '1px solid #ccc',
                              borderLeft: 'none',
                              borderRight: 'none',
                              fontSize: '13px',
                              fontWeight: '600',
                            }}
                          >
                            {item.cantidad}
                          </div>
                          <button
                            onClick={() => actualizarCantidad(item.id, item.variante_id, item.cantidad + 1)}
                            style={{
                              width: '28px',
                              height: '28px',
                              fontSize: '15px',
                              border: '1px solid #ccc',
                              borderRadius: '0 6px 6px 0',
                              backgroundColor: '#fff',
                              cursor: 'pointer',
                              color: '#333',
                            }}
                          >
                            +
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>
                          ${item.cantidad * item.precio}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span>Subtotal</span>
                    <span>${totalProductos}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px', color: '#666' }}>
                    <span>Envío {zonaEnvio ? `(${zonaEnvio.nombre})` : '(sin elegir)'}</span>
                    <span>${costoEnvio}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginTop: '8px' }}>
                    <span>Total</span>
                    <span>${total}</span>
                  </div>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <SelectorEnvio />
                </div>

                <Link href="/checkout" style={{ marginTop: 'auto' }}>
                  <button
                    onClick={() => setAbierto(false)}
                    style={{
                      width: '100%',
                      marginTop: '16px',
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
        </>
      )}
    </>
  )
}