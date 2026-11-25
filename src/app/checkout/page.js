'use client'

import Script from 'next/script'
import './checkout.css'

import { useState, useEffect, useRef } from 'react'
import { useCarrito } from '@/lib/carrito'
import { useRouter } from 'next/navigation'
import SelectorEnvio from './SelectorEnvio'
import BrandBrickMP from './BrandBrickMP'
import BotonGoogle from '../BotonGoogle'
import BloqueConfianza from '../BloqueConfianza'
import { DESCUENTO_TRANSFERENCIA } from '@/lib/configTransferencia'
import { cuponSeSumaConTransferencia } from '@/lib/configDescuentos'
import { ID_ENVIO_GRATIS_AUTO, UMBRAL_ENVIO_GRATIS, calcularCostoEnvio } from '@/lib/configEnvioGratis'
import { etiquetaDescuento } from '@/lib/configCupones'
import { TEXTO_RETIRO_CORTO } from '@/lib/configRetiro'
import { track } from '@/lib/fbq'

// BotonGoogle ahora está dentro del <form>: si su botón no tiene type="button", enviaría el checkout.
// Esto cancela solo ese envío y deja que el login con Google funcione igual.
function SinEnvioDeFormulario({ children }) {
  return (
    <div
      onClickCapture={(e) => {
        const boton = e.target.closest?.('button')
        if (boton && boton.type === 'submit') e.preventDefault()
      }}
    >
      {children}
    </div>
  )
}

export default function Checkout() {
  const {
    items,
    totalProductos,
    envioGratis,
    zonaEnvio,
    cupon,
    cuponAplica,
    descuentoCupon,
    aplicarCupon,
    quitarCupon,
    pagar,
    vaciarCarrito,
    usuario,
    cerrarSesion,
    cabecerasConSesion,
  } = useCarrito()
  const router = useRouter()

  const [datos, setDatos] = useState({
    nombre: '',
    email: '',
    dni: '',
    telefono: '',
    calle: '',
    numero: '',
    pisoDepto: '',
    ciudad: '',
    codigoPostal: '',
    notas: '',
  })

  const [enviando, setEnviando] = useState(false)
  const [metodoPago, setMetodoPago] = useState('mercadopago')

  // Campo de cupón
  const [codigoCupon, setCodigoCupon] = useState('')
  const [mensajeCupon, setMensajeCupon] = useState('')
  const [aplicandoCupon, setAplicandoCupon] = useState(false)
  const [cuponPideLogin, setCuponPideLogin] = useState(false)

  // META PIXEL: InitiateCheckout (una sola vez). Los hooks van siempre antes de cualquier return.
  const checkoutIniciado = useRef(false)

  useEffect(() => {
    if (checkoutIniciado.current || items.length === 0) return
    checkoutIniciado.current = true
    track('InitiateCheckout', {
      value: totalProductos,
      currency: 'ARS',
      content_type: 'product',
      num_items: items.reduce((a, i) => a + i.cantidad, 0),
      contents: items.map((i) => ({
        id: String(i.id),
        quantity: i.cantidad,
        item_price: i.precio,
      })),
    })
  }, [items, totalProductos])

  const esRetiro = zonaEnvio?.nombre === 'Retiro en persona'
  const porcentajeDescuento = Math.round(DESCUENTO_TRANSFERENCIA * 100)
  const conTransferencia = metodoPago === 'transferencia'

  // Cupón + transferencia (las reglas están en src/lib/configDescuentos.js):
  // - Los cupones de bienvenida SE SUMAN: primero se descuenta el cupón y el % de transferencia
  //   se calcula sobre lo que queda (5% + 5% = 9,75%).
  // - Cualquier otro cupón NO se suma: se aplica solo el descuento más alto.
  //   Si empatan, queda el de transferencia y el cupón no se gasta.
  const hayCupon = cuponAplica && descuentoCupon > 0
  const cuponSeSuma = hayCupon && cuponSeSumaConTransferencia(cupon.codigo)
  const transferenciaSinCupon = Math.round(totalProductos * DESCUENTO_TRANSFERENCIA)
  const cuponNoSumaYEsMayor = hayCupon && !cuponSeSuma && conTransferencia && descuentoCupon > transferenciaSinCupon
  const cuponDescartado = hayCupon && !cuponSeSuma && conTransferencia && !cuponNoSumaYEsMayor
  const cuponEnUso = hayCupon && !cuponDescartado
  const descuentoCuponEfectivo = cuponEnUso ? descuentoCupon : 0
  const subtotalEfectivo = totalProductos - descuentoCuponEfectivo

  const montoTransferencia = Math.round(subtotalEfectivo * DESCUENTO_TRANSFERENCIA)
  const transferenciaGana = conTransferencia && !cuponNoSumaYEsMayor
  const descuentoTransferenciaEfectivo = transferenciaGana ? montoTransferencia : 0
  const envioGratisEfectivo = subtotalEfectivo >= UMBRAL_ENVIO_GRATIS
  const faltaParaEnvioGratis = Math.max(0, UMBRAL_ENVIO_GRATIS - subtotalEfectivo)
  const costoEnvioEfectivo = calcularCostoEnvio(subtotalEfectivo, zonaEnvio)
  const totalAPagar = subtotalEfectivo - descuentoTransferenciaEfectivo + costoEnvioEfectivo

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value })
  }

  async function handleAplicarCupon() {
    setMensajeCupon('')
    setCuponPideLogin(false)
    setAplicandoCupon(true)
    const resultado = await aplicarCupon(codigoCupon)
    setAplicandoCupon(false)

    if (!resultado.ok) {
      setMensajeCupon(resultado.error)
      if (resultado.loginRequerido) setCuponPideLogin(true)
      return
    }
    setCodigoCupon('')
  }

  function validar() {
    if (cupon && !usuario) {
      return 'Para usar el cupón ingresá con Google (o quitá el cupón para seguir sin cuenta).'
    }
    if (!datos.nombre.trim()) return 'Ingresá tu nombre completo'
    if (!datos.email.trim()) return 'Ingresá tu email'
    if (!datos.telefono.trim()) return 'Ingresá tu teléfono'
    if (envioGratis && !esRetiro) {
      // Con envío gratis la empresa se elige sola al cargar el código postal
      if (zonaEnvio?.id !== ID_ENVIO_GRATIS_AUTO) {
        return 'Todavía no pudimos confirmar tu envío gratis. Revisá tu código postal.'
      }
    } else if (!zonaEnvio) {
      return 'Elegí una zona de envío'
    }
    if (!esRetiro) {
      if (!datos.calle.trim() || !datos.numero.trim() || !datos.ciudad.trim() || !datos.codigoPostal.trim()) {
        return 'Completá la dirección de envío completa'
      }
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (items.length === 0) {
      alert('Tu carrito está vacío')
      return
    }

    const error = validar()
    if (error) {
      alert(error)
      return
    }

    setEnviando(true)
    try {
      const token = await new Promise((resolve, reject) => {
        window.grecaptcha.ready(() => {
          window.grecaptcha
            .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY, { action: 'checkout' })
            .then(resolve)
            .catch(reject)
        })
      })

      if (conTransferencia) {
        const res = await fetch('/api/crear-pedido-transferencia', {
          method: 'POST',
          headers: await cabecerasConSesion(),
          body: JSON.stringify({
            items,
            zonaEnvio,
            datosCliente: datos,
            recaptchaToken: token,
            cuponCodigo: cupon?.codigo || null,
          }),
        })
        const data = await res.json()

        if (!res.ok) {
          // Si el cupón ya no sirve (venció, se agotó o ya lo usaste), se saca para que el cliente vea el precio real
          if (data.cupon_invalido) quitarCupon()
          alert(data.error || 'Hubo un error al procesar tu pedido. Probá de nuevo.')
          setEnviando(false)
          return
        }

        // La pantalla siguiente lee estos datos para mostrar el monto, el número de pedido y, si es retiro, dónde retirar
        sessionStorage.setItem(
          'pedido_transferencia',
          JSON.stringify({
            id: data.pedido_id,
            total: data.total,
            descuento: data.descuento,
            descuento_cupon: data.descuento_cupon || 0,
            retiro: esRetiro,
          })
        )

        // META PIXEL: Purchase por transferencia
        track(
          'Purchase',
          {
            value: Number(data.total),
            currency: 'ARS',
            content_type: 'product',
            num_items: items.reduce((a, i) => a + i.cantidad, 0),
            contents: items.map((i) => ({
              id: String(i.id),
              quantity: i.cantidad,
              item_price: i.precio,
            })),
          },
          `purchase_${data.pedido_id}`
        )

        vaciarCarrito()
        router.push('/pago-transferencia')
        return
      }

      await pagar(datos, token)
    } catch (err) {
      if (err?.cuponInvalido) {
        quitarCupon()
        alert(err.message)
      } else {
        alert('Hubo un error al procesar tu pedido. Probá de nuevo.')
      }
      setEnviando(false)
    }
  }

  const formatoPrecio = (valor) => Number(valor || 0).toLocaleString('es-AR')

  if (items.length === 0) {
    return (
      <main className="checkout-empty">
        <div className="checkout-empty-card">
          <span className="checkout-kicker">DIMEDETI AMBOS</span>
          <h1>Tu carrito está vacío</h1>
          <p>Elegí tus prendas favoritas y volvé para finalizar tu compra.</p>
          <button type="button" className="checkout-primary-button" onClick={() => router.push('/')}>
            Volver a la tienda
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="checkout-page">
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} />

      <header className="checkout-heading">
        <span className="checkout-kicker">DIMEDETI AMBOS · TIENDA ONLINE</span>
        <h1>Finalizá tu compra</h1>
        <p>Ya falta poco. Completá tus datos y elegí cómo querés recibir tu pedido.</p>
        <div className="checkout-steps" aria-label="Pasos de compra">
          <span className="checkout-step checkout-step-active"><b>1</b> Tus datos</span>
          <i />
          <span className="checkout-step"><b>2</b> Entrega y pago</span>
          <i />
          <span className="checkout-step"><b>3</b> Confirmación</span>
        </div>
      </header>

      <form id="checkout-form" onSubmit={handleSubmit} className="checkout-layout">
        <div className="checkout-main-column">
          <section className="checkout-card">
            <div className="checkout-section-heading">
              <span className="checkout-section-number">01</span>
              <div>
                <h2>Datos de contacto</h2>
                <p>¿A quién le preparamos el pedido?</p>
              </div>
            </div>

            {!usuario ? (
              <div className="checkout-google-box">
                <div>
                  <strong>🎁 Tenés un beneficio de bienvenida</strong>
                  <p>Ingresá con Google para acceder al cupón BIENVENIDA del 5% en tu primera compra. También podés comprar sin registrarte.</p>
                </div>
                <SinEnvioDeFormulario><BotonGoogle /></SinEnvioDeFormulario>
              </div>
            ) : (
              <div className="checkout-session">
                <span>Sesión iniciada como <strong>{usuario.email}</strong></span>
                <button type="button" onClick={cerrarSesion}>Cerrar sesión</button>
              </div>
            )}

            <div className="checkout-fields-grid">
              <label className="checkout-field checkout-field-full">
                Nombre y apellido *
                <input name="nombre" autoComplete="name" value={datos.nombre} onChange={handleChange} style={inputStyle} />
              </label>
              <label className="checkout-field">
                Correo electrónico *
                <input name="email" type="email" autoComplete="email" value={datos.email} onChange={handleChange} style={inputStyle} />
              </label>
              <label className="checkout-field">
                Teléfono *
                <input name="telefono" type="tel" autoComplete="tel" value={datos.telefono} onChange={handleChange} style={inputStyle} />
              </label>
              <label className="checkout-field checkout-field-full">
                DNI <span>(opcional)</span>
                <input name="dni" inputMode="numeric" value={datos.dni} onChange={handleChange} style={inputStyle} />
                <small style={{ display: 'block', marginTop: '6px', color: '#8A8378', fontSize: '12px' }}>
                  Lo usamos para emitir tu factura con tus datos.
                </small>
              </label>
            </div>
          </section>

          <section className="checkout-card">
            <div className="checkout-section-heading">
              <span className="checkout-section-number">02</span>
              <div>
                <h2>Entrega de tu pedido</h2>
                <p>Completá la dirección para consultar las opciones disponibles.</p>
              </div>
            </div>

            {!esRetiro && (
              <div className="checkout-fields-grid">
                <label className="checkout-field checkout-field-wide">
                  Calle *
                  <input name="calle" autoComplete="address-line1" value={datos.calle} onChange={handleChange} style={inputStyle} />
                </label>
                <label className="checkout-field">
                  Número *
                  <input name="numero" autoComplete="address-line2" value={datos.numero} onChange={handleChange} style={inputStyle} />
                </label>
                <label className="checkout-field">
                  Piso / Depto
                  <input name="pisoDepto" value={datos.pisoDepto} onChange={handleChange} style={inputStyle} placeholder="Opcional" />
                </label>
                <label className="checkout-field">
                  Ciudad *
                  <input name="ciudad" autoComplete="address-level2" value={datos.ciudad} onChange={handleChange} style={inputStyle} />
                </label>
                <label className="checkout-field">
                  Código postal *
                  <input name="codigoPostal" autoComplete="postal-code" value={datos.codigoPostal} onChange={handleChange} style={inputStyle} />
                </label>
              </div>
            )}

            <div className="checkout-delivery-selector">
              <SelectorEnvio codigoPostal={datos.codigoPostal} />
            </div>

            <label className="checkout-field checkout-notes-field">
              Indicaciones adicionales <span>(opcional)</span>
              <textarea name="notas" value={datos.notas} onChange={handleChange} style={{ ...inputStyle, minHeight: '88px', resize: 'vertical' }} placeholder="Aclaraciones para preparar o entregar tu pedido..." />
            </label>
          </section>

          <section className="checkout-card">
            <div className="checkout-section-heading">
              <span className="checkout-section-number">03</span>
              <div>
                <h2>Forma de pago</h2>
                <p>Elegí cómo querés abonar tu compra.</p>
              </div>
            </div>

            <div className="checkout-payment-options">
              <label style={opcionPagoStyle(metodoPago === 'mercadopago')} className="checkout-payment-option">
                <input
                  type="radio"
                  name="metodoPago"
                  checked={metodoPago === 'mercadopago'}
                  onChange={() => setMetodoPago('mercadopago')}
                />
                <span className="checkout-payment-icon">💳</span>
                <span className="checkout-payment-copy">
                  <strong>Mercado Pago</strong>
                  <small>Tarjetas, dinero en cuenta, cuotas y más.</small>
                </span>
              </label>

              <label style={{ ...opcionPagoStyle(conTransferencia), marginTop: 0 }} className="checkout-payment-option">
                <input
                  type="radio"
                  name="metodoPago"
                  checked={conTransferencia}
                  onChange={() => setMetodoPago('transferencia')}
                />
                <span className="checkout-payment-icon">🏦</span>
                <span className="checkout-payment-copy">
                  <strong>Transferencia bancaria <em>{porcentajeDescuento}% OFF</em></strong>
                  <small>
                    {cuponNoSumaYEsMayor
                      ? `Tu cupón ${cupon.codigo} ya te da un descuento mayor, así que no se suma el de transferencia.`
                      : cuponDescartado
                        ? `Ahorrás $${formatoPrecio(montoTransferencia)}. Tu cupón ${cupon.codigo} no se suma: se aplica el descuento mayor.`
                        : cuponSeSuma
                          ? `Ahorrás $${formatoPrecio(montoTransferencia)}. Se suma a tu cupón ${cupon.codigo}.`
                          : `Ahorrás $${formatoPrecio(montoTransferencia)}. El descuento se aplica automáticamente.`}
                  </small>
                </span>
              </label>
            </div>

            {!conTransferencia && <div className="checkout-brick"><BrandBrickMP /></div>}
          </section>

          <div className="checkout-security-note">
            <span>🔒</span>
            <p>Tu información se utiliza únicamente para procesar y entregar tu pedido.</p>
          </div>
        </div>

        <aside className="checkout-side-column">
          <section className="checkout-card checkout-summary-card">
            <div className="checkout-section-heading checkout-summary-heading">
              <div>
                <span className="checkout-kicker">UN ÚLTIMO REPASO</span>
                <h2>Resumen de tu pedido</h2>
              </div>
              <span className="checkout-item-count">{items.reduce((total, item) => total + item.cantidad, 0)} prendas</span>
            </div>

            <div className="checkout-items-list">
              {items.map((item) => (
                <article className="checkout-product" key={`${item.id}-${item.variante_id || ''}`}>
                  <div className="checkout-product-image">
                    {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} /> : <span>Prenda</span>}
                  </div>
                  <div className="checkout-product-info">
                    <strong>{item.nombre}</strong>
                    {item.color && <span className="checkout-product-detail">Color: {item.color}</span>}
                    {item.talle && <span className="checkout-product-detail">Talle: {item.talle}</span>}
                    <span className="checkout-quantity">Cantidad: <b>{item.cantidad}</b></span>
                  </div>
                  <strong className="checkout-product-price">${formatoPrecio(item.precio * item.cantidad)}</strong>
                </article>
              ))}
            </div>

            <div className="checkout-coupon-area">
              {cupon ? (
                <div className="checkout-coupon-applied">
                  <div>
                    <span>🎟️ Cupón aplicado</span>
                    <strong>{cupon.codigo} · {etiquetaDescuento(cupon)}</strong>
                    {!cuponAplica && <small>Válido desde una compra mínima de ${formatoPrecio(cupon.compra_minima)} en productos.</small>}
                  </div>
                  <button type="button" onClick={quitarCupon}>Quitar</button>
                </div>
              ) : (
                <>
                  <label htmlFor="checkout-coupon">¿Tenés un código de descuento?</label>
                  <div className="checkout-coupon-form">
                    <input
                      id="checkout-coupon"
                      value={codigoCupon}
                      onChange={(e) => setCodigoCupon(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (codigoCupon.trim() && !aplicandoCupon) handleAplicarCupon()
                        }
                      }}
                      placeholder="Ingresá tu cupón"
                      autoCapitalize="characters"
                    />
                    <button type="button" onClick={handleAplicarCupon} disabled={aplicandoCupon || !codigoCupon.trim()}>
                      {aplicandoCupon ? '...' : 'Aplicar'}
                    </button>
                  </div>
                </>
              )}
              {mensajeCupon && <p className="checkout-coupon-error">{mensajeCupon}</p>}
              {cuponPideLogin && !usuario && (
                <div className="checkout-coupon-login">
                  <SinEnvioDeFormulario><BotonGoogle texto="Ingresar con Google para usar el cupón" /></SinEnvioDeFormulario>
                </div>
              )}
              {!usuario && !cupon && <small className="checkout-coupon-hint">El cupón BIENVENIDA es del 5% y se puede usar una sola vez por cuenta.</small>}
            </div>

            <div className="checkout-totals">
              <div><span>Subtotal de productos</span><strong>${formatoPrecio(totalProductos)}</strong></div>
              {cuponEnUso && <div className="checkout-discount-row"><span>{cupon.codigo} ({etiquetaDescuento(cupon)})</span><strong>−${formatoPrecio(descuentoCuponEfectivo)}</strong></div>}
              {transferenciaGana && <div className="checkout-discount-row"><span>Descuento por transferencia ({porcentajeDescuento}%)</span><strong>−${formatoPrecio(descuentoTransferenciaEfectivo)}</strong></div>}
              <div>
                <span>{esRetiro ? 'Retiro en persona' : 'Envío'}</span>
                <strong>{esRetiro ? 'Gratis' : envioGratisEfectivo ? '¡Gratis!' : zonaEnvio ? `$${formatoPrecio(costoEnvioEfectivo)}` : 'A calcular'}</strong>
              </div>
              {esRetiro && <p className="checkout-making-time">📍 {TEXTO_RETIRO_CORTO}.</p>}
              {!esRetiro && !envioGratisEfectivo && (
                <p className="checkout-free-shipping-hint">Te faltan ${formatoPrecio(faltaParaEnvioGratis)} en productos para obtener envío gratis desde ${formatoPrecio(UMBRAL_ENVIO_GRATIS)}.</p>
              )}
              <div className="checkout-total-line"><span>Total a pagar</span><strong>${formatoPrecio(totalAPagar)}</strong></div>
            </div>

            {cuponSeSuma && conTransferencia && (
              <p className="checkout-stacking-note">¡Tu cupón de bienvenida se combina con el descuento por transferencia! Los demás cupones no se acumulan.</p>
            )}
            {cuponDescartado && (
              <p className="checkout-stacking-note">Tu cupón {cupon.codigo} no se suma al descuento por transferencia: se aplica el mayor de los dos (en este caso, el de transferencia) y el cupón no se gasta.</p>
            )}
            {cuponNoSumaYEsMayor && (
              <p className="checkout-stacking-note">Tu cupón {cupon.codigo} es mayor que el descuento por transferencia: se aplica el cupón y no se suma el de transferencia.</p>
            )}

            <div style={{ margin: '14px 0' }}>
              <BloqueConfianza compacto />
            </div>

            <button
              type="submit"
              form="checkout-form"
              disabled={enviando}
              className="checkout-primary-button checkout-submit-button"
            >
              {enviando ? 'Procesando tu pedido...' : conTransferencia ? 'Confirmar pedido' : 'Continuar con Mercado Pago'}
            </button>
            <p className="checkout-submit-caption">Al confirmar, aceptás nuestros términos y condiciones de compra.</p>
          </section>
        </aside>
      </form>
    </main>
  )

}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '12px 14px',
  marginTop: '7px',
  border: '1px solid #DCD4C9',
  borderRadius: '9px',
  backgroundColor: '#FFFEFC',
  color: '#2E2A26',
  fontSize: '15px',
  boxSizing: 'border-box',
}

function opcionPagoStyle(seleccionada) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    border: seleccionada ? '2px solid #2F6B63' : '1px solid #E4DCCF',
    borderRadius: '12px',
    cursor: 'pointer',
    backgroundColor: seleccionada ? '#F0F7F5' : '#FFFEFC',
  }
}

