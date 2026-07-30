'use client'

import { useCarrito } from '@/lib/carrito'

export default function ProductoCard({ producto }) {
  const { agregarAlCarrito } = useCarrito()

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', width: '250px' }}>
      <h2>{producto.nombre}</h2>
      <p>{producto.descripcion}</p>
      <p><strong>${producto.precio}</strong></p>
      <button onClick={() => agregarAlCarrito(producto)} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Agregar al carrito
      </button>
    </div>
  )
}