'use client'

import { useState } from 'react'
import Link from 'next/link'

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '15px',
  borderRadius: '8px',
  border: '1px solid #ccc',
  marginBottom: '12px',
  boxSizing: 'border-box',
}

const labelStyle = { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#333' }

export default function EnvioManual() {
  const [form, setForm] = useState({
    clienteNombre: '',
    clienteEmail: '',
    clienteTelefono: '',
    clienteDni: '',
    calle: '',
    numero: '',
    pisoDepto: '',
    ciudad: '',
    codigoPostal: '',
    cantidadBultos: 1,
    notas: '',
  })
  const [cotizando, setCotizando] = useState(false)
  const [opciones, setOpciones] = useState([])
  const [opcionElegida, setOpcionElegida] = useState(null)
  const [sucursalElegida, setSucursalElegida] = useState(null)
  const [error, setError] = useState('')
  const [creando, setCreando] = useState(false)
  const [resultado, setResultado] = useState(null)

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
    setOpciones([])
    setOpcionElegida(null)
    setSucursalElegida(null)
    setResultado(null)
  }

  async function cotizar() {
    setError('')
    if (!form.codigoPostal.trim()) {
      setError('Ingresá el código postal para cotizar')
      return
    }
    setCotizando(true)
    setOpciones([])
    setOpcionElegida(null)
    setSucursalElegida(null)
    try {
      const res = await fetch('/api/envios/cotizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postalCode: form.codigoPostal.trim(),
          items: [{ cantidad: form.cantidadBultos }],
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'No se pudo cotizar el envío')
        return
      }
      setOpciones(data.rates || [])
    } catch (e) {
      setError('Error de conexión al cotizar')
    } finally {
      setCotizando(false)
    }
  }

  async function confirmar() {
    setError('')
    if (!opcionElegida) {
      setError('Elegí una opción de envío')
      return
    }
    if (opcionElegida.branches?.length > 0 && !sucursalElegida) {
      setError('Elegí una sucursal de entrega')
      return
    }
    if (!form.calle || !form.numero || !form.ciudad || !form.codigoPostal) {
      setError('Completá la dirección')
      return
    }

    setCreando(true)
    try {
      const resPedido = await fetch('/api/admin/pedidos-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: form.clienteNombre,
          clienteEmail: form.clienteEmail,
          clienteTelefono: form.clienteTelefono,
          clienteDni: form.clienteDni,
          direccion: {
            calle: form.calle,
            numero: form.numero,
            pisoDepto: form.pisoDepto,
            ciudad: form.ciudad,
            codigoPostal: form.codigoPostal,
          },
          cantidadBultos: form.cantidadBultos,
          notas: form.notas,
          envio: {
            carrierSlug: opcionElegida.carrierSlug,
            serviceCode: opcionElegida.serviceCode,
            carrier: opcionElegida.carrier,
            service: opcionElegida.service,
            price: opcionElegida.price,
            branchCode: sucursalElegida?.branchCode || null,
          },
        }),
      })
      const dataPedido = await resPedido.json()
      if (!resPedido.ok) {
        setError(dataPedido.error || 'No se pudo crear el envío')
        return
      }

      const resEtiqueta = await fetch('/api/envios/generar-etiqueta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pedidoId: dataPedido.pedido.id }),
      })
      const dataEtiqueta = await resEtiqueta.json()

      if (!resEtiqueta.ok) {
        setResultado({
          ok: false,
          mensaje: `El envío #${dataPedido.pedido.id} se creó, pero la etiqueta falló: ${dataEtiqueta.error || 'error desconocido'}. Podés reintentar generarla desde Pedidos.`,
        })
        return
      }

      const label = dataEtiqueta.data?.data?.[0]?.label
      setResultado({
        ok: true,
        mensaje: `Envío #${dataPedido.pedido.id} creado y etiqueta generada.`,
        label,
      })
    } catch (e) {
      setError('Error de conexión al crear el envío')
    } finally {
      setCreando(false)
    }
  }

  return (
    <main style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Link href="/admin" style={{ fontSize: '22px', textDecoration: 'none', color: '#333' }}>←</Link>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Envío manual</h1>
      </div>

      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
        Usalo para generar una etiqueta de envío para un cliente que compró por fuera de la tienda (por WhatsApp, por ejemplo).
      </p>

      <label style={labelStyle}>Nombre del cliente</label>
      <input style={inputStyle} value={form.clienteNombre} onChange={(e) => cambiar('clienteNombre', e.target.value)} />

      <label style={labelStyle}>Email (opcional)</label>
      <input style={inputStyle} value={form.clienteEmail} onChange={(e) => cambiar('clienteEmail', e.target.value)} />

      <label style={labelStyle}>Teléfono</label>
      <input style={inputStyle} value={form.clienteTelefono} onChange={(e) => cambiar('clienteTelefono', e.target.value)} />

      <label style={labelStyle}>DNI (opcional, para factura)</label>
      <input style={inputStyle} value={form.clienteDni} onChange={(e) => cambiar('clienteDni', e.target.value)} />

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Calle</label>
          <input style={inputStyle} value={form.calle} onChange={(e) => cambiar('calle', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Número</label>
          <input style={inputStyle} value={form.numero} onChange={(e) => cambiar('numero', e.target.value)} />
        </div>
      </div>

      <label style={labelStyle}>Piso / Depto (opcional)</label>
      <input style={inputStyle} value={form.pisoDepto} onChange={(e) => cambiar('pisoDepto', e.target.value)} />

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 2 }}>
          <label style={labelStyle}>Ciudad</label>
          <input style={inputStyle} value={form.ciudad} onChange={(e) => cambiar('ciudad', e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Código postal</label>
          <input style={inputStyle} value={form.codigoPostal} onChange={(e) => cambiar('codigoPostal', e.target.value)} />
        </div>
      </div>

      <label style={labelStyle}>Cantidad de bultos/prendas</label>
      <input
        type="number"
        min="1"
        style={inputStyle}
        value={form.cantidadBultos}
        onChange={(e) => cambiar('cantidadBultos', e.target.value)}
      />

      <label style={labelStyle}>Notas (opcional)</label>
      <textarea style={{ ...inputStyle, minHeight: '60px' }} value={form.notas} onChange={(e) => cambiar('notas', e.target.value)} />

      <button
        onClick={cotizar}
        disabled={cotizando}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '15px',
          fontWeight: 'bold',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: cotizando ? '#7fc9ec' : '#009ee3',
          color: '#fff',
          cursor: cotizando ? 'not-allowed' : 'pointer',
          marginBottom: '16px',
        }}
      >
        {cotizando ? 'Cotizando...' : 'Cotizar envío'}
      </button>

      {opciones.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>Elegí una opción:</p>
          {opciones.map((op) => (
            <div
              key={op.id}
              onClick={() => {
                setOpcionElegida(op)
                setSucursalElegida(null)
              }}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: opcionElegida?.id === op.id ? '2px solid #009ee3' : '1px solid #ddd',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
            >
              <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{op.carrier} — {op.service}</p>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>${op.price} · {op.deliveryText}</p>
            </div>
          ))}

          {opcionElegida?.branches?.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <label style={labelStyle}>Sucursal de entrega</label>
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
            </div>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '12px' }}>{error}</p>
      )}

      {opcionElegida && (
        <button
          onClick={confirmar}
          disabled={creando}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 'bold',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: creando ? '#86efac' : '#15803d',
            color: '#fff',
            cursor: creando ? 'not-allowed' : 'pointer',
          }}
        >
          {creando ? 'Generando...' : 'Crear envío y generar etiqueta'}
        </button>
      )}

      {resultado && (
        <div style={{ marginTop: '16px', padding: '14px', borderRadius: '8px', backgroundColor: resultado.ok ? '#dcfce7' : '#fee2e2' }}>
          <p style={{ margin: 0, fontSize: '14px', color: resultado.ok ? '#15803d' : '#b91c1c' }}>{resultado.mensaje}</p>
          {resultado.label && (
            <a href={resultado.label} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '8px', color: '#009ee3', fontWeight: '600' }}>
              Ver / descargar etiqueta
            </a>
          )}
        </div>
      )}
    </main>
  )
}