'use client'

import { useState } from 'react'

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  marginBottom: '8px',
  boxSizing: 'border-box',
}

export default function EditarDireccionBoton({ pedido }) {
  const [abierto, setAbierto] = useState(false)
  const [form, setForm] = useState({
    calle: pedido.direccion?.calle || '',
    numero: pedido.direccion?.numero || '',
    pisoDepto: pedido.direccion?.pisoDepto || '',
    ciudad: pedido.direccion?.ciudad || '',
    codigoPostal: pedido.direccion?.codigoPostal || '',
  })
  const [cantidadBultos, setCantidadBultos] = useState(1)
  const [opciones, setOpciones] = useState([])
  const [opcionElegida, setOpcionElegida] = useState(null)
  const [sucursalElegida, setSucursalElegida] = useState(null)
  const [cotizando, setCotizando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function cotizar() {
    if (!form.codigoPostal) {
      setMensaje('Ingresá el código postal')
      return
    }
    setCotizando(true)
    setMensaje('')
    setOpciones([])
    setOpcionElegida(null)
    setSucursalElegida(null)
    try {
      const res = await fetch('/api/envios/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postalCode: form.codigoPostal, items: [{ cantidad: cantidadBultos }] }),
      })
      const data = await res.json()
      if (!data.success) {
        setMensaje(data.error || 'No se pudo cotizar')
        return
      }
      setOpciones(data.rates || [])
    } catch (e) {
      setMensaje('Error de conexión al cotizar')
    } finally {
      setCotizando(false)
    }
  }

  async function guardar() {
    if (!form.calle || !form.numero || !form.ciudad || !form.codigoPostal) {
      setMensaje('Completá la dirección')
      return
    }
    setGuardando(true)
    setMensaje('')
    try {
      const body = {
        pedidoId: pedido.id,
        direccion: form,
      }
      if (opcionElegida) {
        body.envio = {
          carrierSlug: opcionElegida.carrierSlug,
          serviceCode: opcionElegida.serviceCode,
          carrier: opcionElegida.carrier,
          service: opcionElegida.service,
          price: opcionElegida.price,
          branchCode: sucursalElegida?.branchCode || null,
        }
      }
      const res = await fetch('/api/admin/pedidos-editar-direccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setMensaje(data.error || 'No se pudo guardar')
        return
      }
      setMensaje('Guardado. Recargá la página para ver los cambios.')
    } catch (e) {
      setMensaje('Error de conexión al guardar')
    } finally {
      setGuardando(false)
    }
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          marginTop: '10px',
          marginRight: '8px',
          padding: '8px 14px',
          fontSize: '13px',
          fontWeight: '600',
          borderRadius: '8px',
          border: '1px solid #666',
          backgroundColor: '#fff',
          color: '#333',
          cursor: 'pointer',
        }}
      >
        ✏️ Editar dirección
      </button>
    )
  }

  return (
    <div style={{ marginTop: '12px', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', backgroundColor: '#fafafa' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 2 }}>
          <input style={inputStyle} placeholder="Calle" value={form.calle} onChange={(e) => cambiar('calle', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <input style={inputStyle} placeholder="Número" value={form.numero} onChange={(e) => cambiar('numero', e.target.value)} />
        </div>
      </div>
      <input style={inputStyle} placeholder="Piso / Depto" value={form.pisoDepto} onChange={(e) => cambiar('pisoDepto', e.target.value)} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ flex: 2 }}>
          <input style={inputStyle} placeholder="Ciudad" value={form.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <input style={inputStyle} placeholder="Código postal" value={form.codigoPostal} onChange={(e) => cambiar('codigoPostal', e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
        <input
          type="number"
          min="1"
          style={{ ...inputStyle, marginBottom: 0, width: '80px' }}
          value={cantidadBultos}
          onChange={(e) => setCantidadBultos(e.target.value)}
        />
        <button
          onClick={cotizar}
          disabled={cotizando}
          style={{
            padding: '8px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#009ee3',
            color: '#fff',
            cursor: cotizando ? 'not-allowed' : 'pointer',
          }}
        >
          {cotizando ? 'Cotizando...' : 'Volver a cotizar envío'}
        </button>
      </div>

      {opciones.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          {opciones.map((op) => (
            <div
              key={op.id}
              onClick={() => { setOpcionElegida(op); setSucursalElegida(null) }}
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: opcionElegida?.id === op.id ? '2px solid #009ee3' : '1px solid #ddd',
                marginBottom: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              <strong>{op.carrier} — {op.service}</strong> · ${op.price}
            </div>
          ))}

          {opcionElegida?.branches?.length > 0 && (
            <select
              style={inputStyle}
              value={sucursalElegida?.branchCode || ''}
              onChange={(e) => {
                const suc = opcionElegida.branches.find((b) => b.branchCode === e.target.value)
                setSucursalElegida(suc || null)
              }}
            >
              <option value="">Elegí una sucursal</option>
              {opcionElegida.branches.map((b) => (
                <option key={b.branchCode} value={b.branchCode}>{b.direccion}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {mensaje && <p style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>{mensaje}</p>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={guardar}
          disabled={guardando}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#15803d',
            color: '#fff',
            cursor: guardando ? 'not-allowed' : 'pointer',
          }}
        >
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={() => setAbierto(false)}
          style={{
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '6px',
            border: '1px solid #ccc',
            backgroundColor: '#fff',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}