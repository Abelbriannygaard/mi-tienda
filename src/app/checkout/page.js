'use client'

import Script from 'next/script'

import { useState } from 'react'
import { useCarrito } from '@/lib/carrito'
import { useRouter } from 'next/navigation'
import SelectorEnvio from './SelectorEnvio'

export default function Checkout() {
  const { items, total, totalProductos, costoEnvio, zonaEnvio, pagar } = useCarrito()
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

  const esRetiro = zonaEnvio?.nombre === 'Retiro en persona'

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

      await pagar(datos, token)
    } catch (err) {
      alert('Hubo un error al procesar tu pedido. Probá de nuevo.')
      setEnviando(false)
    }
  }>

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
    <main style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
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
        <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Total: ${total}</p>
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 2 }}>
                Calle *
                <input name="calle" value={datos.calle} onChange={handleChange} style={inputStyle} />
              </label>
              <label style={{ flex: 1 }}>
                Número *
                <input name="numero" value={datos.numero} onChange={handleChange} style={inputStyle} />
              </label>
            </div>
            <label>
              Piso / Depto (opcional)
              <input name="pisoDepto" value={datos.pisoDepto} onChange={handleChange} style={inputStyle} placeholder="Ej: 3° B" />
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <label style={{ flex: 1 }}>
                Ciudad *
                <input name="ciudad" value={datos.ciudad} onChange={handleChange} style={inputStyle} />
              </label>
              <label style={{ flex: 1 }}>
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

        <button
          type="submit"
          disabled={enviando}
          style={{
            marginTop: '10px',
            padding: '14px',
            fontSize: '16px',
            backgroundColor: enviando ? '#ccc' : '#009ee3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: enviando ? 'not-allowed' : 'pointer',
          }}
        >
          {enviando ? 'Procesando...' : 'Confirmar y pagar'}
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