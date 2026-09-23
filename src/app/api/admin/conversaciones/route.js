'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

const ZONA = 'America/Argentina/Buenos_Aires'

function formatearFecha(fecha) {
  if (!fecha) return ''
  return new Date(fecha).toLocaleString('es-AR', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function traducirError(mensaje) {
  if (/24|re-?engage|131047/i.test(mensaje || '')) {
    return 'No se pudo enviar: pasaron más de 24 horas desde el último mensaje del cliente. WhatsApp solo permite responder dentro de ese plazo.'
  }
  return mensaje || 'No se pudo enviar el mensaje'
}

const estilosRol = {
  user: { fondo: '#f1f1f1', alinear: 'flex-start', etiqueta: 'Cliente' },
  model: { fondo: '#dbeafe', alinear: 'flex-end', etiqueta: 'Bot' },
  admin: { fondo: '#dcfce7', alinear: 'flex-end', etiqueta: 'Vos' },
}

export default function Conversaciones() {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(null)
  const [chat, setChat] = useState({ mensajes: [], bot_pausado: false, nombre_cliente: null })
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const finRef = useRef(null)

  async function cargarLista() {
    try {
      const res = await fetch('/api/admin/conversaciones', { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      const data = await res.json()
      setLista(data.conversaciones || [])
    } catch (e) {
      // se reintenta en el próximo ciclo
    } finally {
      setCargando(false)
    }
  }

  async function cargarChat(numero) {
    try {
      const res = await fetch(`/api/admin/conversaciones?numero=${numero}`, { cache: 'no-store' })
      if (res.status === 401) {
        window.location.href = '/admin/login'
        return
      }
      setChat(await res.json())
    } catch (e) {
      // se reintenta en el próximo ciclo
    }
  }

  useEffect(() => {
    cargarLista()
    const t = setInterval(cargarLista, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!abierto) return
    cargarChat(abierto)
    const t = setInterval(() => cargarChat(abierto), 5000)
    return () => clearInterval(t)
  }, [abierto])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.mensajes.length, abierto])

  async function enviar() {
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/conversaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'enviar', numero: abierto, texto: t }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(traducirError(data.error))
      } else {
        setTexto('')
        await cargarChat(abierto)
      }
    } catch (e) {
      setError('Error de conexión, intentá de nuevo')
    } finally {
      setEnviando(false)
    }
  }

  async function alternarPausa() {
    const nuevo = !chat.bot_pausado
    setChat((c) => ({ ...c, bot_pausado: nuevo }))
    await fetch('/api/admin/conversaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'pausar', numero: abierto, pausado: nuevo }),
    })
    cargarLista()
  }

  const contenedor = {
    maxWidth: '700px',
    margin: '0 auto',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
  }

  // ---------- Vista de un chat ----------
  if (abierto) {
    const cliente = lista.find((c) => c.numero_cliente === abierto)
    const titulo = chat.nombre_cliente || cliente?.nombre_cliente || abierto

    return (
      <main style={contenedor}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setAbierto(null)} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer' }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{titulo}</p>
            <p style={{ margin: 0, fontSize: '12px', color: chat.bot_pausado ? '#b91c1c' : '#15803d' }}>
              {chat.bot_pausado ? 'Bot pausado: respondés vos' : 'Bot activo'}
            </p>
          </div>
          <button
            onClick={alternarPausa}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: chat.bot_pausado ? '#15803d' : '#b91c1c',
              color: '#fff',
            }}
          >
            {chat.bot_pausado ? 'Reanudar bot' : 'Pausar bot'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fafafa' }}>
          {chat.mensajes.map((m, i) => {
            const e = estilosRol[m.rol] || estilosRol.user
            return (
              <div key={i} style={{ alignSelf: e.alinear, maxWidth: '85%' }}>
                <div style={{ backgroundColor: e.fondo, padding: '10px 12px', borderRadius: '12px', fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.mensaje}
                </div>
                <p style={{ margin: '2px 4px 0', fontSize: '11px', color: '#999', textAlign: e.alinear === 'flex-end' ? 'right' : 'left' }}>
                  {e.etiqueta} · {formatearFecha(m.created_at)}
                </p>
              </div>
            )
          })}
          <div ref={finRef} />
        </div>

        {error && (
          <p style={{ margin: 0, padding: '8px 16px', fontSize: '13px', color: '#b91c1c', backgroundColor: '#fee2e2' }}>{error}</p>
        )}

        <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e5e5', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              const esCelu = window.matchMedia('(pointer: coarse)').matches
              if (e.key === 'Enter' && !e.shiftKey && !esCelu && !e.nativeEvent.isComposing) {
                e.preventDefault()
                enviar()
              }
            }}
            placeholder="Escribí tu mensaje..."
            rows={2}
            style={{ flex: 1, padding: '10px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc', resize: 'none', fontFamily: 'inherit' }}
          />
          <button
            onClick={enviar}
            disabled={enviando || !texto.trim()}
            style={{
              padding: '12px 16px',
              fontSize: '15px',
              fontWeight: 'bold',
              borderRadius: '8px',
              border: 'none',
              color: '#fff',
              backgroundColor: enviando || !texto.trim() ? '#7fc9ec' : '#009ee3',
              cursor: enviando ? 'not-allowed' : 'pointer',
            }}
          >
            {enviando ? '...' : 'Enviar'}
          </button>
        </div>
      </main>
    )
  }

  // ---------- Lista de conversaciones ----------
  return (
    <main style={{ ...contenedor, height: 'auto', minHeight: '100dvh' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/admin" style={{ fontSize: '22px', textDecoration: 'none', color: '#333' }}>←</Link>
        <h1 style={{ margin: 0, fontSize: '20px' }}>Conversaciones</h1>
      </div>

      {cargando && <p style={{ padding: '16px', color: '#888' }}>Cargando...</p>}
      {!cargando && lista.length === 0 && (
        <p style={{ padding: '16px', color: '#888' }}>Todavía no hay conversaciones.</p>
      )}

      {lista.map((c) => (
        <div
          key={c.numero_cliente}
          onClick={() => {
            setChat({ mensajes: [], bot_pausado: c.bot_pausado, nombre_cliente: c.nombre_cliente })
            setError('')
            setTexto('')
            setAbierto(c.numero_cliente)
          }}
          style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>
              {c.nombre_cliente || c.numero_cliente}
              {c.bot_pausado && (
                <span style={{ marginLeft: '8px', fontSize: '11px', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                  Pausado
                </span>
              )}
            </p>
            <span style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap' }}>{formatearFecha(c.ultima_fecha)}</span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.ultimo_rol === 'user' ? '' : c.ultimo_rol === 'admin' ? 'Vos: ' : 'Bot: '}
            {c.ultimo_mensaje}
          </p>
        </div>
      ))}
    </main>
  )
}