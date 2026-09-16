'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ProductoCardCliente({ producto, fotos }) {
  const [fotoActiva, setFotoActiva] = useState(fotos?.[0])

  return (
    <div className="w-[250px] rounded-2xl border border-[#E4DCCF] bg-white overflow-hidden transition-shadow hover:shadow-[0_8px_24px_-8px_rgba(46,42,38,0.18)]">
      <Link href={`/producto/${producto.id}`} className="block">
        <div className="aspect-[4/5] w-full overflow-hidden bg-[#F3EEE6]">
          {fotoActiva?.imagen_url && (
            <img
              src={fotoActiva.imagen_url}
              alt={`${producto.nombre} - ${fotoActiva.color}`}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </Link>

      {fotos?.length > 1 && (
        <div className="flex gap-1.5 px-3 pt-3 flex-wrap">
          {fotos.slice(0, 8).map((f) => (
            <button
              key={f.color}
              onMouseEnter={() => setFotoActiva(f)}
              onClick={(e) => {
                e.preventDefault()
                setFotoActiva(f)
              }}
              className={`h-9 w-9 overflow-hidden rounded-md border transition ${
                fotoActiva?.color === f.color
                  ? 'border-[#2F6B63] ring-1 ring-[#2F6B63]'
                  : 'border-[#E4DCCF]'
              }`}
              title={f.color}
            >
              <img src={f.imagen_url} alt={f.color} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <Link href={`/producto/${producto.id}`} className="block px-4 pb-4 pt-3">
        <h2 className="font-serif text-[17px] leading-snug text-[#2E2A26]">
          {producto.nombre}
        </h2>
        <span className="mt-2 inline-block rounded-full bg-[#EFE6D8] px-3 py-1 text-sm font-medium text-[#2F6B63]">
          ${producto.precio?.toLocaleString('es-AR')}
        </span>
      </Link>
    </div>
  )
}