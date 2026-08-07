'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'

export default function ProductoDetalle({ producto, variantes }) {
  const [varianteElegida, setVarianteElegida] = useState(variantes[0] || null)
  const { agregarAlCarrito } = useCarrito()

  function handleAgregar() {
    agregarAlCarrito({
      ...producto,
      variante_id: varianteElegida?.id,
      color: varianteElegida?.color,
    })
  }

  return (
    <main style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#009ee3', textDecoration: 'none' }}>← Volver al catálogo</Link>

      <div style={{ display: 'flex', gap: '40px', marginTop: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          {varianteElegida?.imagen_url ? (
            <img
              src={varianteElegida.imagen_url}
              alt={producto.nombre}
              style={{ width: '100%', borderRadius: '10px', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '300px', backgroundColor: '#eee', borderRadius: '10px' }} />
          )}
        </div>

        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1>{producto.nombre}</h1>
          <p style={{ fontSize: '18px', color: '#555' }}>{producto.descripcion}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '10px' }}>${producto.precio}</p>

          {variantes.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Color:</p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {variantes.map((variante) => (
                  <button
                    key={variante.id}
                    onClick={() => setVarianteElegida(variante)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      border: varianteElegida?.id === variante.id ? '2px solid #009ee3' : '1px solid #ccc',
                      backgroundColor: varianteElegida?.id === variante.id ? '#e6f7ff' : 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {variante.color}
                    {variante.stock === 0 && ' (sin stock)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAgregar}
            disabled={varianteElegida?.stock === 0}
            style={{
              marginTop: '24px',
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: varianteElegida?.stock === 0 ? '#ccc' : '#009ee3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: varianteElegida?.stock === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {varianteElegida?.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </main>
  )
}