'use client'

import CarritoIcono from '../../CarritoIcono'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'

export default function ProductoDetalle({ producto, variantes }) {
  // 1. Extraer colores únicos
  const coloresUnicos = Array.from(new Set(variantes.map((v) => v.color).filter(Boolean)))

  // 2. Estado para el color seleccionado
  const varianteNegro = variantes.find((v) => v.color?.toLowerCase() === 'negro')
  const varianteInicial = varianteNegro || variantes[0]

  const [colorSeleccionado, setColorSeleccionado] = useState(
    varianteInicial?.color || ''
  )

  // 3. Variantes asociadas al color seleccionado
  const variantesDelColor = variantes.filter((v) => v.color === colorSeleccionado)

  // 4. Variante activa (talle, stock, etc.)
  const [varianteElegida, setVarianteElegida] = useState(
    varianteInicial || null
  )

  // 5. Estado para la foto del carrusel actualmente visible
  const [fotoIndex, setFotoIndex] = useState(0)

  // 6. Estado para el visor de imagen ampliada (Modal/Lightbox)
  const [modalAbierto, setModalAbierto] = useState(false)

  const { agregarAlCarrito } = useCarrito()

  // Estado para la cantidad elegida
  const [cantidad, setCantidad] = useState(1)

  // Estado para mostrar el mensaje de "agregado con éxito"
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false)

  // Extraer todas las imágenes no vacías de la variante elegida
  const imagenesGaleria = varianteElegida
    ? [
        varianteElegida.imagen_url,
        varianteElegida.imagen_2,
        varianteElegida.imagen_3,
        varianteElegida.imagen_4,
        varianteElegida.imagen_5,
        varianteElegida.imagen_6,
        varianteElegida.imagen_7,
        varianteElegida.imagen_8,
        varianteElegida.imagen_9,
        varianteElegida.imagen_10,
        varianteElegida.imagen_11,
        varianteElegida.imagen_12,
      ].filter((url) => Boolean(url) && url.trim() !== '')
    : []

  // Resetear la foto activa al primer índice cuando cambia la variante o el color
  useEffect(() => {
    setFotoIndex(0)
    setCantidad(1)
  }, [colorSeleccionado, varianteElegida?.id])

  // Cerrar modal con la tecla Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setModalAbierto(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Manejar cambio de color
  function handleSeleccionarColor(nuevoColor) {
    setColorSeleccionado(nuevoColor)
    const opcionesDelColor = variantes.filter((v) => v.color === nuevoColor)
    if (opcionesDelColor.length > 0) {
      setVarianteElegida(opcionesDelColor[0])
    }
  }

  // Manejar cambio de talle
  function handleSeleccionarTalle(varianteId) {
    const varianteEncontrada = variantesDelColor.find(
      (v) => String(v.id) === String(varianteId)
    )
    if (varianteEncontrada) {
      setVarianteElegida(varianteEncontrada)
    }
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
    setTimeout(() => setMostrarConfirmacion(false), 2500)
  }

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <div className="mx-auto max-w-5xl px-6 py-8 md:px-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-medium text-[#2F6B63] hover:text-[#28584F]"
          >
            ← Volver al catálogo
          </Link>
          <CarritoIcono />
        </div>

        <div className="mt-6 flex flex-col gap-10 md:flex-row md:items-start">
          {/* CARRUSEL Y GALERÍA DE IMÁGENES */}
          <div className="flex w-full gap-4 md:w-[52%]">
            {/* Miniaturas a la izquierda */}
            {imagenesGaleria.length > 1 && (
              <div className="flex max-h-[480px] flex-col gap-2.5 overflow-y-auto">
                {imagenesGaleria.map((imgUrl, idx) => (
                  <img
                    key={idx}
                    src={imgUrl}
                    alt={`Vista ${idx + 1}`}
                    onClick={() => setFotoIndex(idx)}
                    className={`h-14 w-14 cursor-pointer rounded-md border object-cover transition ${
                      fotoIndex === idx
                        ? 'border-[#2F6B63] opacity-100 ring-1 ring-[#2F6B63]'
                        : 'border-[#E4DCCF] opacity-70'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Imagen Principal desplegada en tamaño completo */}
            <div className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-2xl border border-[#E4DCCF] bg-white">
              {imagenesGaleria.length > 0 ? (
                <img
                  src={imagenesGaleria[fotoIndex]}
                  alt={producto.nombre}
                  onClick={() => setModalAbierto(true)}
                  title="Haz clic para ampliar"
                  className="h-full w-full cursor-zoom-in object-contain"
                />
              ) : (
                <div className="h-full w-full bg-[#F3EEE6]" />
              )}

              {/* Flechas de navegación del carrusel */}
              {imagenesGaleria.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFotoIndex((prev) => (prev === 0 ? imagenesGaleria.length - 1 : prev - 1))
                    }}
                    className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg shadow-md"
                  >
                    ‹
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFotoIndex((prev) => (prev === imagenesGaleria.length - 1 ? 0 : prev + 1))
                    }}
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg shadow-md"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </div>

          {/* SELECCIÓN DE COMPRA (precio, color, talle, cantidad, botón) */}
          <div className="w-full md:w-[48%]">
            <span className="inline-block rounded-full bg-[#EFE6D8] px-4 py-1.5 text-lg font-semibold text-[#2F6B63]">
              ${producto.precio?.toLocaleString('es-AR')}
            </span>

            {/* Desplegable de Color */}
            {coloresUnicos.length > 0 && (
              <div className="mt-6">
                <label className="mb-1.5 block text-sm font-medium text-[#2E2A26]">
                  Color: <span className="font-normal text-[#8A8378]">{colorSeleccionado}</span>
                </label>
                <select
                  value={colorSeleccionado}
                  onChange={(e) => handleSeleccionarColor(e.target.value)}
                  className="w-full rounded-lg border border-[#E4DCCF] bg-white px-3 py-2.5 text-sm text-[#2E2A26] outline-none focus:border-[#2F6B63]"
                >
                  {coloresUnicos.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Desplegable de Talle */}
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
                  {variantesDelColor.map((variante) => (
                    <option key={variante.id} value={variante.id} disabled={variante.stock === 0}>
                      {variante.talle} {variante.stock === 0 ? '(Sin stock)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selector de Cantidad */}
            {varianteElegida && varianteElegida.stock > 0 && (
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-[#2E2A26]">
                  Cantidad: <span className="font-normal text-[#8A8378]">({varianteElegida.stock} disponibles)</span>
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                    disabled={cantidad <= 1}
                    className="h-10 w-10 rounded-l-lg border border-[#E4DCCF] text-lg text-[#2E2A26] disabled:text-[#CFC7B8]"
                  >
                    −
                  </button>
                  <div className="flex h-10 w-12 items-center justify-center border-y border-[#E4DCCF] text-sm font-semibold">
                    {cantidad}
                  </div>
                  <button
                    onClick={() => setCantidad((c) => Math.min(varianteElegida.stock, c + 1))}
                    disabled={cantidad >= varianteElegida.stock}
                    className="h-10 w-10 rounded-r-lg border border-[#E4DCCF] text-lg text-[#2E2A26] disabled:text-[#CFC7B8]"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Botón de Agregar al Carrito */}
            <button
              onClick={handleAgregar}
              disabled={!varianteElegida || varianteElegida?.stock === 0}
              className="mt-7 w-full rounded-full bg-[#2F6B63] py-3 text-sm font-semibold text-white transition hover:bg-[#28584F] disabled:bg-[#E4DCCF] disabled:text-[#8A8378]"
            >
              {varianteElegida?.stock === 0 ? 'Sin stock disponible' : 'Agregar al carrito'}
            </button>

            {/* Mensaje de confirmación */}
            {mostrarConfirmacion && (
              <div className="mt-3 rounded-lg bg-[#E3EFE9] px-3 py-2.5 text-center text-sm font-medium text-[#2F6B63]">
                ✓ Producto agregado al carrito
              </div>
            )}
          </div>
        </div>

        {/* TÍTULO Y DESCRIPCIÓN, DEBAJO DE TODO */}
        <div className="mt-10 border-t border-[#E4DCCF] pt-8">
          <h1 className="font-serif text-2xl leading-snug text-[#2E2A26]">
            {producto.nombre}
          </h1>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[#5C564C]">
            {producto.descripcion}
          </p>
        </div>
      </div>

      {/* MODAL / VISOR DE FOTO EN PANTALLA COMPLETA */}
      {modalAbierto && imagenesGaleria.length > 0 && (
        <div
          onClick={() => setModalAbierto(false)}
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-[#2E2A26]/85 p-5"
        >
          <button
            onClick={() => setModalAbierto(false)}
            className="absolute right-6 top-5 text-3xl font-bold text-white"
          >
            ✕
          </button>

          <img
            src={imagenesGaleria[fotoIndex]}
            alt={producto.nombre}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </main>
  )
}