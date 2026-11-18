'use client'

import { useEffect, useState } from 'react'
import { useCarrito } from '@/lib/carrito'
import { etiquetaDescuento } from '@/lib/configCupones'

// Si el cliente entra con un link como https://www.dimedetiambos.com.ar/?cupon=VERANO10
// (por ejemplo, escaneando un QR), el cupón queda cargado solo y se muestra un aviso.
export default function CuponDesdeQR() {
  const { aplicarCupon } = useCarrito()
  const [aviso, setAviso] = useState(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const codigo = params.get('cupon')
    if (!codigo) return

    // Se saca el cupón de la dirección para que no se vuelva a aplicar al recargar
    params.delete('cupon')
    const resto = params.toString()
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (resto ? `?${resto}` : '') + window.location.hash
    )

    aplicarCupon(codigo).then((r) => {
      if (r.ok) {
        const minimo = Number(r.cupon.compra_minima) || 0
        setAviso({
          ok: true,
          texto:
            `🎟️ Cupón ${r.cupon.codigo} aplicado (${etiquetaDescuento(r.cupon)})` +
            (minimo > 0 ? ` · compra mínima $${minimo.toLocaleString('es-AR')}` : ''),
        })
      } else {
        setAviso({ ok: false, texto: r.error })
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!aviso) return
    const timer = setTimeout(() => setAviso(null), 7000)
    return () => clearTimeout(timer)
  }, [aviso])

  if (!aviso) return null

  return (
    <div
      role="status"
      onClick={() => setAviso(null)}
      style={{
        position: 'fixed',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        maxWidth: 'calc(100vw - 24px)',
        padding: '12px 18px',
        borderRadius: '10px',
        fontSize: '14px',
        textAlign: 'center',
        cursor: 'pointer',
        color: 'white',
        backgroundColor: aviso.ok ? '#2F6B63' : '#b91c1c',
        boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
      }}
    >
      {aviso.texto}
    </div>
  )
}
