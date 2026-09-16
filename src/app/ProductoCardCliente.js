'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'

export default function ProductoCardCliente({ producto, variantes }) {
  const coloresUnicos = Array.from(new Set(variantes.map((v) => v.color).filter(Boolean)))

  const primeraFotoPorColor = coloresUnicos
    .map((color) => variantes.find((v) => v.color === color && v.imagen_url))
    .filter(Boolean)

  const [fotoActiva, setFotoActiva] = useState(primeraFotoPorColor[0])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [colorSeleccionado, setColorSeleccionado] = useState(fotoActiva?.color || '')
  const [varianteElegida, setVarianteElegida] = useState(fotoActiva || variantes[0] || null)
  const [cantidad, setCantidad] = useState(1)
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  const { agregarAlCarrito } = useCarrito()

  const variantesDelColor = variantes.filter((v) => v.color === colorSeleccionado)

  function abrirModal(e) {
    e.preventDefault()
    setColorSeleccionado(fotoActiva?.color || variantes[0]?.color || '')
    setVarianteElegida(fotoActiva || variantes[0] || null)
    setCantidad(1)
    setModalAbierto(true)
  }

  function handleSeleccionarColor(nuevoColor) {
    setColorSeleccionado(nuevoColor)
    const opcionesDelColor = variantes.filter((v) => v.color === nuevoColor)
    if (opcionesDelColor.length > 0) setVarianteElegida(opcionesDelColor[0])
  }

  function handleSeleccionarTalle(varianteId) {
    const encontrada = variantesDelColor.find((v) => String(v.id) === String(varianteId))
    if (encontrada) setVarianteElegida(encontrada)
  }

  function handleAgregar() {
    agregarAlCarrito(
      {
        ...producto,
        variante_id: varianteElegida?.id,
        color: varianteElegida?.color,
        talle: varianteElegida?.talle,
      },
      cantidad
    )
    setMostrarConfirmacion(true)
    setTimeout(() => {
      setMostrarConfirmacion(false)
      setModalAbierto(false)
    }, 1200)
  }

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

      {primeraFotoPorColor.length > 1 && (
        <div className="flex gap-1.5 px-3 pt-3 flex-wrap">
          {primeraFotoPorColor.slice(0, 8).map((f) => (
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

      <Link href={`/producto/${producto.id}`} className="block px-4 pt-3">
        <h2 className="font-serif text-[17px] leading-snug text-[#2E2A26]">
          {producto.nombre}
        </h2>
        <span className="mt-2 inline-block rounded-full bg-[#EFE6D8] px-3 py-1 text-sm font-medium text-[#2F6B63]">
          ${producto.precio?.toLocaleString('es-AR')}
        </span>
      </Link>

      <div className="px-4 pb-4 pt-3">
        <button
          onClick={abrirModal}
          className="w-full rounded-full bg-[#2F6B63] py-2.5 text-sm font-semibold text-white transition hover:bg-[#28584F]"
        >
          Agregar al carrito
        </button>
      </div>

      {modalAbierto && (
        <div
          onClick={() => setModalAbierto(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E2A26]/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-[#FAF6F0] p-6"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-serif text-lg text-[#2E2A26] pr-4">{producto.nombre}</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-[#8A8378] hover:text-[#2E2A26]"
              >
                ✕
              </button>
            </div>

            <span className="mt-2 inline-block rounded-full bg-[#EFE6D8] px-3 py-1 text-sm font-medium text-[#2F6B63]">
              ${producto.precio?.toLocaleString('es-AR')}
            </span>

            {coloresUnicos.length > 0 && (
              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-[#2E2A26]">
                  Color: <span className="font-normal text-[#8A8378]">{colorSeleccionado}</span>
                </label>
                <select
                  value={colorSeleccionado}
                  onChange={(e) => handleSeleccionarColor(e.target.value)}
                  className="w-full rounded-lg border border-[#E4DCCF] bg-white px-3 py-2.5 text-sm text-[#2E2A26] outline-none focus:border-[#2F6B63]"
                >
                  {coloresUnicos.map((color) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            {variantesDelColor.length > 0 && (
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-[#2E2A26]">
                  Talle: <span className="font-normal text-[#8A8378]">{varianteElegida?.talle}</span>
                </label>
                <select
                  value={varianteElegida?.id || ''}
                  onChange={(e) => handleSeleccionarTalle(e.target.value)}
                  className="w-full rounded-lg border border-[#E4DCCF] bg-white px-3 py-2.5 text-sm text-[#2E2A26] outline-none focus:border-[#2F6B63]"
                >
                  {variantesDelColor.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stock === 0}>
                      {v.talle} {v.stock === 0 ? '(Sin stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {varianteElegida && varianteElegida.stock > 0 && (
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-[#2E2A26]">
                  Cantidad: <span className="font-normal text-[#8A8378]">({varianteElegida.stock} disponibles)</span>
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    disabled={cantidad <= 1}
                    className="h-9 w-9 rounded-l-lg border border-[#E4DCCF] text-[#2E2A26] disabled:text-[#CFC7B8]"
                  >
                    −
                  </button>
                  <div className="flex h-9 w-11 items-center justify-center border-y border-[#E4DCCF] text-sm font-medium">
                    {cantidad}
                  </div>
                  <button
                    onClick={() => setCantidad((c) => Math.min(varianteElegida.stock, c + 1))}
                    disabled={cantidad >= varianteElegida.stock}
                    className="h-9 w-9 rounded-r-lg border border-[#E4DCCF] text-[#2E2A26] disabled:text-[#CFC7B8]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAgregar}
              disabled={!varianteElegida || varianteElegida?.stock === 0}
              className="mt-6 w-full rounded-full bg-[#2F6B63] py-3 text-sm font-semibold text-white transition hover:bg-[#28584F] disabled:bg-[#E4DCCF] disabled:text-[#8A8378]"
            >
              {varianteElegida?.stock === 0 ? 'Sin stock disponible' : 'Agregar al carrito'}
            </button>

            {mostrarConfirmacion && (
              <div className="mt-3 rounded-lg bg-[#E3EFE9] px-3 py-2 text-center text-sm font-medium text-[#2F6B63]">
                ✓ Producto agregado al carrito
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}