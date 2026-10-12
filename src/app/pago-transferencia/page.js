'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { DATOS_BANCARIOS, WHATSAPP_NEGOCIO } from '@/lib/configTransferencia'

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-AR')
}

export default function PagoTransferencia() {
  const [pedido, setPedido] = useState(null)
  const [cargado, setCargado] = useState(false)
  const [copiado, setCopiado] = useState('')

  useEffect(() => {
    try {
      const guardado = sessionStorage.getItem('pedido_transferencia')
      if (guardado) setPedido(JSON.parse(guardado))
    } catch (e) {
      // sin datos: se muestra el aviso genérico
    }
    setCargado(true)
  }, [])

  async function copiar(etiqueta, valor) {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(etiqueta)
      setTimeout(() => setCopiado(''), 2000)
    } catch (e) {
      alert('No se pudo copiar. Seleccioná el texto y copialo a mano.')
    }
  }

  if (!cargado) return null

  if (!pedido) {
    return (
      <main style={{ padding: '40px 20px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <h1>No encontramos un pedido reciente</h1>
        <p style={{ color: '#555' }}>
          Si recién hiciste un pedido por transferencia, revisá tu email: ahí te enviamos los datos para pagar.
        </p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '16px', color: '#2F6B63', fontWeight: 'bold' }}>
          Volver a la tienda
        </Link>
      </main>
    )
  }

  const mensajeWhatsApp = `Hola! Hice el pedido #${pedido.id} por transferencia por $${pedido.total}. Te mando el comprobante.`
  const linkWhatsApp = `https://wa.me/${WHATSAPP_NEGOCIO}?text=${encodeURIComponent(mensajeWhatsApp)}`

  const filas = [
    { etiqueta: 'Titular', valor: DATOS_BANCARIOS.titular, copiable: false },
    { etiqueta: 'Banco', valor: DATOS_BANCARIOS.banco, copiable: false },
    { etiqueta: 'Alias', valor: DATOS_BANCARIOS.alias, copiable: true },
    { etiqueta: 'CBU', valor: DATOS_BANCARIOS.cbu, copiable: true },
    { etiqueta: 'CUIT', valor: DATOS_BANCARIOS.cuit, copiable: false },
  ].filter((fila) => fila.valor)

  return (
    <main style={{ padding: 'clamp(16px, 5vw, 40px)', maxWidth: '520px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '4px' }}>¡Recibimos tu pedido!</h1>
      <p style={{ marginTop: 0, color: '#555' }}>
        Pedido <strong>#{pedido.id}</strong>. Para confirmarlo, hacé la transferencia con estos datos.
      </p>

      <div style={{ backgroundColor: '#f0f7f5', border: '1px solid #cfe3de', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
        <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>Total a transferir</p>
        <p style={{ margin: '2px 0 0', fontSize: '28px', fontWeight: 'bold', color: '#2F6B63' }}>
          ${formatearMonto(pedido.total)}
        </p>
        {pedido.descuento > 0 && (
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#15803d' }}>
            Ya incluye tu descuento de ${formatearMonto(pedido.descuento)}
          </p>
        )}
      </div>

      <div style={{ border: '1px solid #e5e5e5', borderRadius: '10px', padding: '8px 16px', marginTop: '16px' }}>
        {filas.map((fila) => (
          <div
            key={fila.etiqueta}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              padding: '10px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{fila.etiqueta}</p>
              <p style={{ margin: 0, fontWeight: 'bold', wordBreak: 'break-all' }}>{fila.valor}</p>
            </div>
            {fila.copiable && (
              <button
                onClick={() => copiar(fila.etiqueta, fila.valor)}
                style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #2F6B63',
                  backgroundColor: copiado === fila.etiqueta ? '#2F6B63' : '#fff',
                  color: copiado === fila.etiqueta ? '#fff' : '#2F6B63',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {copiado === fila.etiqueta ? '¡Copiado!' : 'Copiar'}
              </button>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: '20px' }}>
        Después de transferir, mandanos el comprobante por WhatsApp indicando tu número de pedido:
      </p>
      <a
        href={linkWhatsApp}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '14px',
          borderRadius: '999px',
          backgroundColor: '#25D366',
          color: '#fff',
          fontWeight: 'bold',
          textDecoration: 'none',
        }}
      >
        Enviar comprobante por WhatsApp
      </a>

      <p style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>
        Cuando veamos el pago te lo confirmamos por mail y empezamos a confeccionar tu pedido. También te enviamos
        estos datos por email.
      </p>

      <Link href="/" style={{ display: 'inline-block', marginTop: '8px', color: '#2F6B63', fontWeight: 'bold' }}>
        Volver a la tienda
      </Link>
    </main>
  )
}