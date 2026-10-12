'use client'

import Script from 'next/script'

import { useState } from 'react'
import { useCarrito } from '@/lib/carrito'
import { useRouter } from 'next/navigation'
import SelectorEnvio from './SelectorEnvio'
import BrandBrickMP from './BrandBrickMP'
import { DESCUENTO_TRANSFERENCIA } from '@/lib/configTransferencia'

export default function Checkout() {
  const { items, total, totalProductos, costoEnvio, zonaEnvio, pagar, vaciarCarrito } = useCarrito()
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

  const esRetiro = zonaEnvio?.nombre === 'Retiro en persona'

  // Descuento por transferencia: solo sobre los productos, no sobre el envío
  const porcentajeDescuento = Math.round(DESCUENTO_TRANSFERENCIA * 100)
  const montoDescuento = Math.round(totalProductos * DESCUENTO_TRANSFERENCIA)
  const conTransferencia = metodoPago === 'transferencia'
  const totalAPagar = conTransferencia ? total - montoDescuento : total

  function handleChange(e) {
    setDatos({ ...datos, [e.target.name]: e.target.value })
  }

  function validar() {
    if (!datos.nombre.trim()) return 'Ingresá tu nombre completo'
    if (!datos.email.trim()) return 'Ingresá tu email'
    if (!datos.dni.trim()) return 'Ingresá tu DNI'
    if (!datos.telefono.trim()) return 'Ingresá tu teléfono'
    if (!zonaEnvio) return 'Elegí una zona de envío'
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, zonaEnvio, datosCliente: datos, recaptchaToken: token }),
        })
        const data = await res.json()

        if (!res.ok) {
          alert(data.error || 'Hubo un error al procesar tu pedido. Probá de nuevo.')
          setEnviando(false)
          return
        }

        // La pantalla siguiente lee estos datos para mostrar el monto y el número de pedido
        sessionStorage.setItem(
          'pedido_transferencia',
          JSON.stringify({ id: data.pedido_id, total: data.total, descuento: data.descuento })
        )
        vaciarCarrito()
        router.push('/pago-transferencia')
        return
      }

      await pagar(datos, token)
    } catch (err) {
      alert('Hubo un error al procesar tu pedido. Probá de nuevo.')
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
        <p>Envío ({zonaEnvio?.nombre || 'sin elegir'}): ${costoEnvio}</p>
        {conTransferencia && (
          <p style={{ color: '#15803d' }}>
            Descuento por transferencia ({porcentajeDescuento}%): −${montoDescuento}
          </p>
        )}
        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Total: ${totalAPagar}</p>
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
                Ahorrás ${montoDescuento}. Te mostramos los datos al terminar el pedido.
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