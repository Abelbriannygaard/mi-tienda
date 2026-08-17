'use client'

import CarritoIcono from '../../CarritoIcono'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'

export default function ProductoDetalle({ producto, variantes }) {
  // 1. Extraer colores únicos
  const coloresUnicos = Array.from(new Set(variantes.map((v) => v.color).filter(Boolean)))

  // 2. Estado para el color seleccionado
  const [colorSeleccionado, setColorSeleccionado] = useState(
    variantes[0]?.color || ''
  )

  // 3. Variantes asociadas al color seleccionado
  const variantesDelColor = variantes.filter((v) => v.color === colorSeleccionado)

  // 4. Variante activa (talle, stock, etc.)
  const [varianteElegida, setVarianteElegida] = useState(
    variantes[0] || null
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
    <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#009ee3', textDecoration: 'none', fontSize: '14px' }}>
          ← Volver al catálogo
        </Link>
        <CarritoIcono />
      </div>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px', flexWrap: 'wrap' }}>
        {/* CARRUSEL Y GALERÍA DE IMÁGENES */}
        <div style={{ flex: '1.2', minWidth: '320px', display: 'flex', gap: '15px' }}>
          {/* Miniaturas a la izquierda */}
          {imagenesGaleria.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
              {imagenesGaleria.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Vista ${idx + 1}`}
                  onClick={() => setFotoIndex(idx)}
                  style={{
                    width: '54px',
                    height: '54px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: fotoIndex === idx ? '2px solid #009ee3' : '1px solid #e0e0e0',
                    backgroundColor: '#fff',
                    opacity: fotoIndex === idx ? 1 : 0.7,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>
          )}

          {/* Imagen Principal desplegada en tamaño completo */}
          <div
            style={{
              position: 'relative',
              flex: '1',
              width: '100%',
              backgroundColor: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              minHeight: '400px',
            }}
          >
            {imagenesGaleria.length > 0 ? (
              <img
                src={imagenesGaleria[fotoIndex]}
                alt={producto.nombre}
                onClick={() => setModalAbierto(true)}
                title="Haz clic para ampliar"
                style={{
                  width: '100%',
                  height: '100%',
                  maxHeight: '480px',
                  objectFit: 'contain',
                  cursor: 'zoom-in',
                }}
              />
            ) : (
              <div style={{ width: '100%', height: '350px', backgroundColor: '#eee', borderRadius: '10px' }} />
            )}

            {/* Flechas de navegación del carrusel */}
            {imagenesGaleria.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFotoIndex((prev) => (prev === 0 ? imagenesGaleria.length - 1 : prev - 1))
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '10px',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    zIndex: 2,
                  }}
                >
                  ‹
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setFotoIndex((prev) => (prev === imagenesGaleria.length - 1 ? 0 : prev + 1))
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    zIndex: 2,
                  }}
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>

        {/* INFORMACIÓN Y SELECCIÓN DEL PRODUCTO */}
        <div style={{ flex: '1', minWidth: '300px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{producto.nombre}</h1>
          <p style={{ fontSize: '15px', color: '#666', marginTop: '8px' }}>{producto.descripcion}</p>
          <p style={{ fontSize: '28px', fontWeight: 'bold', marginTop: '16px' }}>${producto.precio}</p>

          {/* Desplegable de Color */}
          {coloresUnicos.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                Color: <span style={{ fontWeight: 'normal', color: '#666' }}>{colorSeleccionado}</span>
              </label>
              <select
                value={colorSeleccionado}
                onChange={(e) => handleSeleccionarColor(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  outline: 'none',
                }}
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
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                Talle: <span style={{ fontWeight: 'normal', color: '#666' }}>{varianteElegida?.talle}</span>
              </label>
              <select
                value={varianteElegida?.id || ''}
                onChange={(e) => handleSeleccionarTalle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '15px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  color: '#333',
                  cursor: 'pointer',
                  outline: 'none',
                }}
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
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#333' }}>
                Cantidad: <span style={{ fontWeight: 'normal', color: '#666' }}>({varianteElegida.stock} disponibles)</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  disabled={cantidad <= 1}
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '18px',
                    border: '1px solid #ccc',
                    borderRadius: '8px 0 0 8px',
                    backgroundColor: cantidad <= 1 ? '#f5f5f5' : '#fff',
                    color: cantidad <= 1 ? '#ccc' : '#333',
                    cursor: cantidad <= 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  −
                </button>
                <div
                  style={{
                    width: '50px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ccc',
                    borderLeft: 'none',
                    borderRight: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                  }}
                >
                  {cantidad}
                </div>
                <button
                  onClick={() => setCantidad((c) => Math.min(varianteElegida.stock, c + 1))}
                  disabled={cantidad >= varianteElegida.stock}
                  style={{
                    width: '40px',
                    height: '40px',
                    fontSize: '18px',
                    border: '1px solid #ccc',
                    borderRadius: '0 8px 8px 0',
                    backgroundColor: cantidad >= varianteElegida.stock ? '#f5f5f5' : '#fff',
                    color: cantidad >= varianteElegida.stock ? '#ccc' : '#333',
                    cursor: cantidad >= varianteElegida.stock ? 'not-allowed' : 'pointer',
                  }}
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
            style={{
              marginTop: '28px',
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 'bold',
              backgroundColor: (!varianteElegida || varianteElegida?.stock === 0) ? '#e0e0e0' : '#009ee3',
              color: (!varianteElegida || varianteElegida?.stock === 0) ? '#999' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (!varianteElegida || varianteElegida?.stock === 0) ? 'not-allowed' : 'pointer',
              transition: 'transform 0.1s ease, background-color 0.2s ease',
            }}
            onMouseDown={(e) => {
              if (!varianteElegida || varianteElegida?.stock === 0) return
              e.currentTarget.style.transform = 'scale(0.97)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            {varianteElegida?.stock === 0 ? 'Sin stock disponible' : 'Agregar al carrito'}
          </button>

          {/* Mensaje de confirmación */}
          {mostrarConfirmacion && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              ✓ Producto agregado al carrito
            </div>
          )}
        </div>
      </div>

      {/* MODAL / VISOR DE FOTO EN PANTALLA COMPLETA */}
      {modalAbierto && imagenesGaleria.length > 0 && (
        <div
          onClick={() => setModalAbierto(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setModalAbierto(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '25px',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>

          <img
            src={imagenesGaleria[fotoIndex]}
            alt={producto.nombre}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            }}
          />
        </div>
      )}
    </main>
  )
}