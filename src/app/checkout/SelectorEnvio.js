'use client'

import { useEffect, useState } from 'react'
import { useCarrito } from '@/lib/carrito'

export default function SelectorEnvio({ codigoPostal: cpDireccion }) {
  const [cpInput, setCpInput] = useState('')
  const [opcionesEnvia, setOpcionesEnvia] = useState([])
  const [cargando, setCargando] = useState(false)
  const [errorCotizacion, setErrorCotizacion] = useState(null)
  
  const { items, zonaEnvio, setZonaEnvio } = useCarrito()

  // Sincronizar si el usuario cambia el CP en el formulario principal
  useEffect(() => {
    if (cpDireccion && cpDireccion !== cpInput) {
      setCpInput(cpDireccion)
    }
  }, [cpDireccion])

  // Función para consultar la cotización a Envia.com
  const cotizar = async (cp) => {
    if (!cp || String(cp).trim().length < 4) {
      setErrorCotizacion('Ingresá un Código Postal válido (4 dígitos).')
      setOpcionesEnvia([])
      return
    }

    setCargando(true)
    setErrorCotizacion(null)

    try {
      const res = await fetch('/api/envios/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: String(cp).trim(),
          items: items,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success && data.rates?.length > 0) {
        setOpcionesEnvia(data.rates)
        setErrorCotizacion(null)
      } else {
        setErrorCotizacion('No se encontraron opciones de envío para este Código Postal.')
        setOpcionesEnvia([])
      }
    } catch (err) {
      setErrorCotizacion('Error al calcular el envío. Intentalo de nuevo.')
      setOpcionesEnvia([])
    } finally {
      setCargando(false)
    }
  }

  // Cotizar automáticamente si el CP tiene 4 dígitos
  useEffect(() => {
    if (cpInput.trim().length >= 4) {
      const timer = setTimeout(() => cotizar(cpInput), 500)
      return () => clearTimeout(timer)
    }
  }, [cpInput, items])

  return (
    <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', marginTop: '15px', backgroundColor: '#fafafa' }}>
      <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '15px' }}>
        Calcular costo de envío:
      </p>

      {/* Casilla para que el usuario escriba o modifique su Código Postal */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Ej: 1650"
          value={cpInput}
          onChange={(e) => setCpInput(e.target.value)}
          maxLength={5}
          style={{
            padding: '8px 12px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            width: '120px',
            fontSize: '14px',
          }}
        />
        <button
          type="button"
          onClick={() => cotizar(cpInput)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#009ee3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          {cargando ? 'Buscando...' : 'Calcular'}
        </button>
      </div>

      {/* Estado de carga */}
      {cargando && (
        <p style={{ color: '#009ee3', fontSize: '14px', fontWeight: 'bold' }}>
          ⏳ Consultando tarifas de Correo Argentino...
        </p>
      )}

      {/* Error si no encuentra tarifas */}
      {errorCotizacion && !cargando && (
        <p style={{ color: '#d9534f', fontSize: '13px', margin: 0 }}>
          {errorCotizacion}
        </p>
      )}

      {/* Lista de opciones devueltas por Correo Argentino */}
      {opcionesEnvia.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <p style={{ fontSize: '13px', color: '#555', marginBottom: '8px' }}>
            Opciones disponibles para CP <strong>{cpInput}</strong>:
          </p>

          {opcionesEnvia.map((opcion) => {
            const idUnico = `envia-${opcion.id}`
            const estaSeleccionado = zonaEnvio?.id === idUnico

            return (
              <label
                key={idUnico}
                style={{
                  display: 'block',
                  padding: '12px',
                  border: estaSeleccionado ? '2px solid #009ee3' : '1px solid #e0e0e0',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  backgroundColor: estaSeleccionado ? '#f0f8ff' : '#fff',
                }}
              >
                <input
                  type="radio"
                  name="zonaEnvio"
                  checked={estaSeleccionado}
                  onChange={() =>
                    setZonaEnvio({
                      id: idUnico,
                      nombre: `${opcion.carrier} - ${opcion.service}`,
                      costo: opcion.price,
                      envioCarrier: opcion.carrierSlug,
                      envioServiceCode: opcion.serviceCode,
                    })
                  }
                  style={{ marginRight: '10px' }}
                />
                <strong>{opcion.service}</strong> — ${opcion.price}
                <br />
                <small style={{ color: '#666', marginLeft: '24px', display: 'block', marginTop: '4px' }}>
                  {opcion.deliveryText}
                </small>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}