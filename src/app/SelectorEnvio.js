'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCarrito } from '@/lib/carrito'

export default function SelectorEnvio() {
  const [zonas, setZonas] = useState([])
  const { zonaEnvio, setZonaEnvio } = useCarrito()

  useEffect(() => {
    async function cargarZonas() {
      const { data } = await supabase.from('zonas_envio').select('*')
      if (data) setZonas(data)
    }
    cargarZonas()
  }, [])

  return (
    <div style={{ padding: '10px 16px', border: '1px solid #ccc', borderRadius: '8px', marginTop: '10px' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Elegí tu zona de envío:</p>
      {zonas.map((zona) => (
        <label key={zona.id} style={{ display: 'block', marginBottom: '4px', cursor: 'pointer' }}>
          <input
            type="radio"
            name="zonaEnvio"
            checked={zonaEnvio?.id === zona.id}
            onChange={() => setZonaEnvio(zona)}
            style={{ marginRight: '8px' }}
          />
          {zona.nombre} — ${zona.costo}
        </label>
      ))}
    </div>
  )
}