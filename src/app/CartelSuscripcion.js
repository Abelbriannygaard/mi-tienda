// DESTINO: src/app/CartelSuscripcion.js  (archivo NUEVO)
'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useCarrito } from '@/lib/carrito'
import BotonGoogle from './BotonGoogle'

const CLAVE_CERRADO = 'dimedetiambos_cartel_suscripcion_cerrado'

export default function CartelSuscripcion() {
  const { usuario, sesionLista } = useCarrito()
  const pathname = usePathname()

  // Arranca "cerrado" hasta confirmar que la persona no lo cerró antes
  const [cerrado, setCerrado] = useState(true)
  const [demoraCumplida, setDemoraCumplida] = useState(false)

  useEffect(() => {
    try {
      setCerrado(Boolean(localStorage.getItem(CLAVE_CERRADO)))
    } catch {
      setCerrado(false)
    }
    const timer = setTimeout(() => setDemoraCumplida(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  function cerrar() {
    try {
      localStorage.setItem(CLAVE_CERRADO, '1')
    } catch {}
    setCerrado(true)
  }

  const enRutaExcluida =
    pathname?.startsWith('/admin') || pathname?.startsWith('/checkout') || pathname?.startsWith('/pago')

  if (!sesionLista || usuario || cerrado || !demoraCumplida || enRutaExcluida) return null

  return (
    <div
      role="dialog"
      aria-label="Descuento de bienvenida"
      style={{
        position: 'fixed',
        left: '16px',
        bottom: '16px',
        zIndex: 60,
        width: 'min(360px, calc(100vw - 32px))',
        background: '#fff',
        border: '1px solid #E4DCCF',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,.18)',
        padding: '18px',
      }}
    >
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar"
        style={{
          position: 'absolute',
          top: '8px',
          right: '12px',
          border: 0,
          background: 'none',
          fontSize: '22px',
          cursor: 'pointer',
          color: '#8A8378',
        }}
      >
        ×
      </button>
      <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '16px', color: '#2E2A26', paddingRight: '18px' }}>
        Ingresá con Google y llevate 5% de descuento en tu primera compra
      </p>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#8A8378' }}>
        Al ingresar aceptás recibir novedades por email. Podés darte de baja cuando quieras.
      </p>
      <BotonGoogle />
    </div>
  )
}