// DESTINO: src/app/checkout/page.js  (reemplaza el archivo actual)
'use client'

import Script from 'next/script'

import { useState, useEffect, useRef } from 'react'
import { useCarrito } from '@/lib/carrito'
import { useRouter } from 'next/navigation'
import SelectorEnvio from './SelectorEnvio'
import BrandBrickMP from './BrandBrickMP'
import BotonGoogle from '../BotonGoogle'
import { DESCUENTO_TRANSFERENCIA } from '@/lib/configTransferencia'
import { textoConfeccion } from '@/lib/configConfeccion'
import { ID_ENVIO_GRATIS_AUTO, UMBRAL_ENVIO_GRATIS, calcularCostoEnvio } from '@/lib/configEnvioGratis'
import { etiquetaDescuento } from '@/lib/configCupones'
import { track } from '@/lib/fbq'

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

  // Los descuentos NO se acumulan: se aplica solo el más alto.
  // Si empatan (ej. 5% de cupón y 5% de transferencia) queda el de transferencia y el cupón no se gasta.
  const montoTransferencia = Math.round(totalProductos * DESCUENTO_TRANSFERENCIA)
  const hayCupon = cuponAplica && descuentoCupon > 0
  const transferenciaGana = conTransferencia && (!hayCupon || montoTransferencia >= descuentoCupon)
  const cuponEnUso = hayCupon && !transferenciaGana
  const descuentoCuponEfectivo = cuponEnUso ? descuentoCupon : 0
  const descuentoTransferenciaEfectivo = transferenciaGana ? montoTransferencia : 0

  const subtotalEfectivo = totalProductos - descuentoCuponEfectivo
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
    if (!datos.dni.trim()) return 'Ingresá tu DNI'
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

        // La pantalla siguiente lee estos datos para mostrar el monto y el número de pedido
        sessionStorage.setItem(
          'pedido_transferencia',
          JSON.stringify({ id: data.pedido_id, total: data.total, descuento: data.descuento })
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

  if (items.length === 0) {
    return (
      <main style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Tu carrito está vacío</h1>
        <button onClick={() => router.push('/')} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Volver a la tienda
        </button>
      </main>
    )
  }

  return (
    <main style={{ padding: 'clamp(16px, 5vw, 40px)', maxWidth: '600px', margin: '0 auto' }}>
      <Script src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`} />
      <h1>Finalizar compra</h1>
      <div style={{ backgroundColor: '#f7f7f7', padding: '16px', borderRadius: '8px', marginTop: '20px' }}>
        <h3>Resumen del pedido</h3>
        {items.map((item) => (
          <p key={`${item.id}-${item.variante_id || ''}`}>
            {item.nombre} {item.color ? `(${item.color})` : ''} x{item.cantidad} — ${item.precio * item.cantidad}
          </p>
        ))}
        {cuponEnUso && (
          <p style={{ color: '#15803d' }}>
            Cupón {cupon.codigo} ({etiquetaDescuento(cupon)}): −${descuentoCuponEfectivo}
          </p>
        )}
        {hayCupon && transferenciaGana && (
          <p style={{ fontSize: '14px', color: '#a16207' }}>
            Tu cupón {cupon.codigo} no se suma al descuento por transferencia: se aplica el mayor.
          </p>
        )}
        {envioGratisEfectivo && !esRetiro ? (
          <p>
            Costo de envío: <strong style={{ color: '#15803d' }}>¡Gratis!</strong>
          </p>
        ) : (
          <p>
            Envío ({zonaEnvio?.nombre || 'sin elegir'}): ${costoEnvioEfectivo}
          </p>
        )}
        {!esRetiro && !envioGratisEfectivo && (
          <p style={{ fontSize: '14px', color: '#15803d' }}>
            🚚 Sumá ${faltaParaEnvioGratis} más en productos y el envío es gratis.
          </p>
        )}
        {transferenciaGana && (
          <p style={{ color: '#15803d' }}>
            Descuento por transferencia ({porcentajeDescuento}%): −${descuentoTransferenciaEfectivo}
          </p>
        )}
        <p style={{ fontSize: '14px', color: '#555' }}>
          🧵 Tiempo de confección estimado: {textoConfeccion()}.
          {esRetiro ? ' Te avisamos cuando esté listo para retirar.' : ''}
        </p>
        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Total: ${totalAPagar}</p>
      </div>

      {/* Ingreso con Google: hace falta para usar cupones */}
      <div style={{ marginTop: '16px' }}>
        {!usuario ? (
          <div
            style={{
              padding: '14px',
              border: '1px solid #E4DCCF',
              backgroundColor: '#FAF6F0',
              borderRadius: '8px',
            }}
          >
            <p style={{ margin: '0 0 10px', fontSize: '14px', color: '#2E2A26' }}>
              🎁 Ingresá con Google para usar cupones y llevarte <strong>5% de descuento en tu primera compra</strong>.
              Podés comprar sin cuenta, pero sin cupón.
            </p>
            <BotonGoogle />
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#8A8378' }}>
              Al ingresar aceptás recibir novedades por email. Podés darte de baja cuando quieras.
            </p>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>
            Ingresaste como <strong>{usuario.email}</strong> ·{' '}
            <button
              type="button"
              onClick={cerrarSesion}
              style={{ border: 'none', background: 'none', color: '#2F6B63', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
            >
              Salir
            </button>
          </p>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        {cupon ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              padding: '12px',
              border: '1px solid #bbf7d0',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#15803d' }}>
              🎟️ Cupón <strong>{cupon.codigo}</strong> ({etiquetaDescuento(cupon)})
              {!cuponAplica && (
                <>
                  <br />
                  <small style={{ color: '#a16207' }}>
                    Se aplica con una compra mínima de ${Number(cupon.compra_minima).toLocaleString('es-AR')} en productos.
                  </small>
                </>
              )}
            </span>
            <button
              type="button"
              onClick={quitarCupon}
              style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '6px', background: '#fff', cursor: 'pointer' }}
            >
              Quitar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={codigoCupon}
              onChange={(e) => setCodigoCupon(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (codigoCupon.trim() && !aplicandoCupon) handleAplicarCupon()
                }
              }}
              placeholder="¿Tenés un cupón?"
              autoCapitalize="characters"
              style={{ ...inputStyle, marginTop: 0, flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAplicarCupon}
              disabled={aplicandoCupon || !codigoCupon.trim()}
              style={{
                padding: '0 18px',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                backgroundColor: aplicandoCupon || !codigoCupon.trim() ? '#ccc' : '#2F6B63',
                cursor: aplicandoCupon || !codigoCupon.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {aplicandoCupon ? '...' : 'Aplicar'}
            </button>
          </div>
        )}
        {mensajeCupon && <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#b91c1c' }}>{mensajeCupon}</p>}
        {cuponPideLogin && !usuario && (
          <div style={{ marginTop: '10px' }}>
            <BotonGoogle texto="Ingresar con Google para usar el cupón" />
          </div>
        )}
      </div>

      <SelectorEnvio codigoPostal={datos.codigoPostal} />

      <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>
          Nombre completo *
          <input name="nombre" value={datos.nombre} onChange={handleChange} style={inputStyle} />
        </label>

        <label>
          Email *
          <input name="email" type="email" value={datos.email} onChange={handleChange} style={inputStyle} />
        </label>

        <label>
          DNI *
          <input name="dni" value={datos.dni} onChange={handleChange} style={inputStyle} />
        </label>

        <label>
          Teléfono *
          <input name="telefono" value={datos.telefono} onChange={handleChange} style={inputStyle} />
        </label>

        {!esRetiro && (
          <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ flex: 2, minWidth: '140px' }}>
                Calle *
                <input name="calle" value={datos.calle} onChange={handleChange} style={inputStyle} />
              </label>
              <label style={{ flex: 1, minWidth: '100px' }}>
                Número *
                <input name="numero" value={datos.numero} onChange={handleChange} style={inputStyle} />
              </label>
            </div>
            <label>
              Piso / Depto (opcional)
              <input name="pisoDepto" value={datos.pisoDepto} onChange={handleChange} style={inputStyle} placeholder="Ej: 3° B" />
            </label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <label style={{ flex: 1, minWidth: '140px' }}>
                Ciudad *
                <input name="ciudad" value={datos.ciudad} onChange={handleChange} style={inputStyle} />
              </label>
              <label style={{ flex: 1, minWidth: '140px' }}>
                Código Postal *
                <input name="codigoPostal" value={datos.codigoPostal} onChange={handleChange} style={inputStyle} />
              </label>
            </div>
          </>
        )}

        <label>
          Notas adicionales (opcional)
          <textarea name="notas" value={datos.notas} onChange={handleChange} style={{ ...inputStyle, minHeight: '60px' }} />
        </label>

        <div style={{ marginTop: '8px' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 'bold' }}>Forma de pago</p>

          <label style={opcionPagoStyle(metodoPago === 'mercadopago')}>
            <input
              type="radio"
              name="metodoPago"
              checked={metodoPago === 'mercadopago'}
              onChange={() => setMetodoPago('mercadopago')}
            />
            <span>
              <strong>Mercado Pago</strong>
              <br />
              <small style={{ color: '#666' }}>Tarjeta, dinero en cuenta, cuotas y más</small>
            </span>
          </label>

          <label style={{ ...opcionPagoStyle(conTransferencia), marginTop: '8px' }}>
            <input
              type="radio"
              name="metodoPago"
              checked={conTransferencia}
              onChange={() => setMetodoPago('transferencia')}
            />
            <span>
              <strong>Transferencia bancaria</strong>{' '}
              <span style={{ color: '#15803d', fontWeight: 'bold' }}>{porcentajeDescuento}% de descuento</span>
              <br />
              <small style={{ color: '#666' }}>
                Ahorrás ${montoTransferencia}. Te mostramos los datos al terminar el pedido.
                {hayCupon && ' No se suma al cupón: se aplica el descuento mayor.'}
              </small>
            </span>
          </label>
        </div>

        {!conTransferencia && <BrandBrickMP />}

        <button
          type="submit"
          disabled={enviando}
          style={{
            marginTop: '10px',
            padding: '14px',
            fontSize: '16px',
            backgroundColor: enviando ? '#ccc' : conTransferencia ? '#2F6B63' : '#009ee3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Procesando...' : conTransferencia ? 'Confirmar pedido' : 'Confirmar y pagar'}
        </button>
      </form>
    </main>
  )
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px',
  marginTop: '4px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  boxSizing: 'border-box',
}

function opcionPagoStyle(seleccionada) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    border: seleccionada ? '2px solid #2F6B63' : '1px solid #ccc',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: seleccionada ? '#f0f7f5' : '#fff',
  }
}