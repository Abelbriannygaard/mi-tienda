'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { createPortal } from 'react-dom'
import { useCarrito } from '@/lib/carrito'
import { etiquetaDescuento } from '@/lib/configCupones'
import SelectorEnvio from './checkout/SelectorEnvio'
import './carrito.css'

const pesos = (n) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(Number(n) || 0)

export default function CarritoIcono() {
  const {
    items, cantidadTotal, totalProductos, costoEnvio, envioGratis, total,
    zonaEnvio, quitarDelCarrito, actualizarCantidad, vaciarCarrito,
    panelAbierto, abrirPanel, cerrarPanel,
    cupon, cuponAplica, descuentoCupon,
  } = useCarrito()

  const hayCupon = Boolean(cupon) && cuponAplica && descuentoCupon > 0

  // Con el panel abierto: Escape lo cierra y la página de atrás no se desplaza
  useEffect(() => {
    if (!panelAbierto) return
    const alTeclear = (e) => {
      if (e.key === 'Escape') cerrarPanel()
    }
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', alTeclear)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', alTeclear)
    }
    // cerrarPanel solo cambia el estado del panel, no hace falta volver a registrar el listener en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelAbierto])

  return (
    <>
      <button type="button" className="dm-cart-trigger" onClick={abrirPanel}
        aria-label={`Abrir carrito, ${cantidadTotal} prendas`}>
        <span className="dm-cart-trigger-icon" aria-hidden="true">🛍</span>
        <span className="dm-cart-trigger-label">Mi carrito</span>
        <span className="dm-cart-count" key={cantidadTotal}>{cantidadTotal}</span>
      </button>

      {panelAbierto && typeof document !== 'undefined' && createPortal(
        <>
          <button type="button" className="dm-cart-overlay" onClick={cerrarPanel}
            aria-label="Cerrar carrito" />
          <aside className="dm-cart-drawer" role="dialog" aria-modal="true"
            aria-label="Tu carrito de compras">
            <header className="dm-cart-header">
              <div>
                <span className="dm-cart-eyebrow">DIMEDETI AMBOS</span>
                <h2>Tu carrito</h2>
                <p>{cantidadTotal === 1 ? '1 prenda seleccionada' : `${cantidadTotal} prendas seleccionadas`}</p>
              </div>
              <button type="button" className="dm-cart-close" onClick={cerrarPanel}
                aria-label="Cerrar carrito">×</button>
            </header>

            {items.length > 0 && (
              <div className="dm-cart-toolbar">
                <span>Tu selección</span>
                <button type="button" onClick={() => {
                  if (confirm('¿Querés vaciar todo el carrito?')) vaciarCarrito()
                }}>Vaciar carrito</button>
              </div>
            )}

            {items.length === 0 ? (
              <div className="dm-cart-empty">
                <span className="dm-cart-empty-icon" aria-hidden="true">🛍</span>
                <h3>Tu carrito está vacío</h3>
                <p>Descubrí nuestros ambos, chaquetas y pantalones.</p>
                <Link href="/" onClick={cerrarPanel} className="dm-cart-primary">Explorar la tienda</Link>
              </div>
            ) : (
              <>
                <div className="dm-cart-content">
                  <div className="dm-cart-items">
                    {items.map((item) => (
                      <article className="dm-cart-item"
                        key={`${item.id}-${item.variante_id || ''}`}>
                        <div className="dm-cart-item-main">
                          <div className="dm-cart-item-info">
                            <h3>{item.nombre}</h3>
                            <div className="dm-cart-attributes">
                              {item.color && <span>{item.color}</span>}
                              {item.talle && <span>Talle {item.talle}</span>}
                            </div>
                          </div>
                          <button type="button" className="dm-cart-remove"
                            onClick={() => quitarDelCarrito(item.id, item.variante_id)}
                            aria-label={`Quitar ${item.nombre} del carrito`}>×</button>
                        </div>
                        <div className="dm-cart-item-bottom">
                          <div className="dm-cart-quantity">
                            <span className="dm-cart-quantity-label">Cantidad</span>
                            <div className="dm-cart-quantity-control">
                              <button type="button" aria-label="Disminuir cantidad"
                                onClick={() => actualizarCantidad(item.id, item.variante_id, item.cantidad - 1)}>−</button>
                              <span>{item.cantidad}</span>
                              <button type="button" aria-label="Aumentar cantidad"
                                onClick={() => actualizarCantidad(item.id, item.variante_id, item.cantidad + 1)}>+</button>
                            </div>
                          </div>
                          <strong className="dm-cart-item-price">{pesos(item.cantidad * item.precio)}</strong>
                        </div>
                      </article>
                    ))}
                  </div>

                  <section className="dm-cart-shipping">
                    <SelectorEnvio />
                  </section>
                </div>

                <footer className="dm-cart-footer">
                  <div className="dm-cart-summary">
                    <div className="dm-cart-summary-line"><span>Subtotal</span><span>{pesos(totalProductos)}</span></div>
                    {hayCupon && (
                      <div className="dm-cart-summary-line">
                        <span>Cupón {cupon.codigo} ({etiquetaDescuento(cupon)})</span>
                        <strong>−{pesos(descuentoCupon)}</strong>
                      </div>
                    )}
                    <div className="dm-cart-summary-line">
                      <span>{envioGratis && zonaEnvio?.nombre !== 'Retiro en persona'
                        ? 'Envío' : `Envío${zonaEnvio ? ` · ${zonaEnvio.nombre}` : ' · A calcular'}`}</span>
                      <strong>
                        {envioGratis && zonaEnvio?.nombre !== 'Retiro en persona' ? '¡Gratis!' : pesos(costoEnvio)}
                      </strong>
                    </div>
                    <div className="dm-cart-total"><span>Total estimado</span><strong>{pesos(total)}</strong></div>
                    <p className="dm-cart-note">El total final se confirma al completar tus datos de compra.</p>
                  </div>
                  <Link href="/checkout" className="dm-cart-primary dm-cart-checkout" onClick={cerrarPanel}>
                    Continuar con la compra <span aria-hidden="true">→</span>
                  </Link>
                  <button type="button" className="dm-cart-continue" onClick={cerrarPanel}>Seguir mirando</button>
                </footer>
              </>
            )}
          </aside>
        </>,
        document.body
      )}
    </>
  )
}