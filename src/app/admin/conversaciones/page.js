'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

const ZONA = 'America/Argentina/Buenos_Aires'

// Tamaño máximo que permite WhatsApp según el tipo de archivo (en MB)
const LIMITE_MB = { image: 5, video: 16, audio: 16, document: 50 }

const TIPOS_ACEPTADOS =
  'image/jpeg,image/png,video/mp4,video/3gpp,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'

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

// Máximo de duración de una nota de voz grabada desde el panel (en segundos)
const LIMITE_GRABACION = 300

function formatearDuracion(segundos) {
  const m = Math.floor(segundos / 60)
  const s = String(segundos % 60).padStart(2, '0')
  return `${m}:${s}`
}

// El navegador graba en un formato que WhatsApp no acepta (webm). Lo convertimos a MP3, que sí acepta.
async function convertirAMp3(blob) {
  const { Mp3Encoder } = await import('@breezystack/lamejs')

  const datos = await blob.arrayBuffer()
  const ContextoAudio = window.AudioContext || window.webkitAudioContext
  const contexto = new ContextoAudio()
  let audio
  try {
    audio = await contexto.decodeAudioData(datos)
  } finally {
    contexto.close()
  }

  // Mono alcanza para voz
  const canal = audio.getChannelData(0)
  const muestras = new Int16Array(canal.length)
  for (let i = 0; i < canal.length; i++) {
    const v = Math.max(-1, Math.min(1, canal[i]))
    muestras[i] = v < 0 ? v * 0x8000 : v * 0x7fff
  }

  const codificador = new Mp3Encoder(1, audio.sampleRate, 96)
  const partes = []
  const TAMANO_BLOQUE = 1152
  for (let i = 0; i < muestras.length; i += TAMANO_BLOQUE) {
    const trozo = codificador.encodeBuffer(muestras.subarray(i, i + TAMANO_BLOQUE))
    if (trozo.length > 0) partes.push(trozo)
  }
  const final = codificador.flush()
  if (final.length > 0) partes.push(final)

  return new Blob(partes, { type: 'audio/mpeg' })
}

function formatearTamano(bytes) {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function traducirError(mensaje) {
  if (/24|re-?engage|131047/i.test(mensaje || '')) {
    return 'No se pudo enviar: pasaron más de 24 horas desde el último mensaje del cliente. WhatsApp solo permite responder dentro de ese plazo.'
  }
  return mensaje || 'No se pudo enviar el mensaje'
}

function fusionarMensajes(actuales, nuevos) {
  const mapa = new Map(actuales.map((m) => [m.id, m]))
  for (const m of nuevos) mapa.set(m.id, m)
  return Array.from(mapa.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
}

const estilosRol = {
  user: { fondo: '#f1f1f1', alinear: 'flex-start', etiqueta: 'Cliente' },
  model: { fondo: '#dbeafe', alinear: 'flex-end', etiqueta: 'Bot' },
  admin: { fondo: '#dcfce7', alinear: 'flex-end', etiqueta: 'Vos' },
}

// Muestra el contenido de un mensaje: texto, foto, video, audio o documento
function ContenidoMensaje({ m }) {
  const tipo = m.tipo || 'text'
  if (tipo === 'text') return <>{m.mensaje}</>

  const lineas = (m.mensaje || '').split('\n')
  const etiqueta = lineas[0]
  const textoAcompanante = lineas.slice(1).join('\n')

  if (!m.media_url) {
    return <span style={{ color: '#888' }}>{etiqueta} (no se pudo cargar el archivo)</span>
  }

  let archivo = null

  if (tipo === 'image') {
    archivo = (
      <a href={m.media_url} target="_blank" rel="noreferrer">
        <img
          src={m.media_url}
          alt="Foto"
          style={{ display: 'block', width: '260px', maxWidth: '100%', borderRadius: '8px' }}
        />
      </a>
    )
  } else if (tipo === 'sticker') {
    archivo = (
      <img src={m.media_url} alt="Sticker" style={{ display: 'block', width: '120px', maxWidth: '100%' }} />
    )
  } else if (tipo === 'video') {
    archivo = (
      <video
        controls
        preload="metadata"
        src={m.media_url}
        style={{ display: 'block', width: '260px', maxWidth: '100%', borderRadius: '8px' }}
      />
    )
  } else if (tipo === 'audio') {
    archivo = (
      <div>
        <audio controls preload="none" src={m.media_url} style={{ width: '240px', maxWidth: '100%' }} />
        <a
          href={m.media_url}
          target="_blank"
          rel="noreferrer"
          style={{ display: 'block', fontSize: '12px', color: '#555', marginTop: '2px' }}
        >
          Descargar audio
        </a>
      </div>
    )
  } else {
    archivo = (
      <a
        href={m.media_url}
        target="_blank"
        rel="noreferrer"
        style={{ color: '#1d4ed8', textDecoration: 'underline', wordBreak: 'break-word' }}
      >
        📎 {m.media_nombre || 'Documento'}
      </a>
    )
  }

  return (
    <>
      {archivo}
      {textoAcompanante && <div style={{ marginTop: '6px' }}>{textoAcompanante}</div>}
    </>
  )
}

export default function Conversaciones() {
  const [lista, setLista] = useState([])
  const [cargando, setCargando] = useState(true)
  const [abierto, setAbierto] = useState(null)
  const [chat, setChat] = useState({ mensajes: [], bot_pausado: false, nombre_cliente: null, hayMas: false })
  const [cargandoViejos, setCargandoViejos] = useState(false)
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const finRef = useRef(null)
  const saltarScrollRef = useRef(false)
  const inputArchivoRef = useRef(null)

  // Grabación de notas de voz
  const [grabando, setGrabando] = useState(false)
  const [segundos, setSegundos] = useState(0)
  const [preparandoAudio, setPreparandoAudio] = useState(false)
  const [urlPreview, setUrlPreview] = useState(null)
  const grabadorRef = useRef(null)
  const trozosRef = useRef([])
  const microfonoRef = useRef(null)
  const temporizadorRef = useRef(null)

  const [notisActivas, setNotisActivas] = useState(false)
  const [activandoNotis, setActivandoNotis] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.getRegistration().then(async (reg) => {
      if (reg) {
        const sub = await reg.pushManager.getSubscription()
        setNotisActivas(Boolean(sub))
      }
    })
  }, [])

  async function activarNotificaciones() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Este navegador no soporta notificaciones push.')
      return
    }
    setActivandoNotis(true)
    try {
      const permiso = await Notification.requestPermission()
      if (permiso !== 'granted') {
        alert('No diste el permiso de notificaciones. Podés activarlo más tarde desde la configuración del navegador.')
        return
      }

      const registro = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const clavePublica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(clavePublica),
      })

      const res = await fetch('/api/admin/push-suscripcion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suscripcion),
      })

      if (res.ok) {
        setNotisActivas(true)
      } else {
        alert('No se pudo activar la notificación, intentá de nuevo.')
      }
    } catch (e) {
      alert('Error al activar las notificaciones: ' + e.message)
    } finally {
      setActivandoNotis(false)
    }
  }

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
      const data = await res.json()
      setChat((prev) => ({
        mensajes: fusionarMensajes(prev.mensajes, data.mensajes || []),
        bot_pausado: data.bot_pausado,
        nombre_cliente: data.nombre_cliente,
        hayMas: data.hay_mas,
      }))
    } catch (e) {
      // se reintenta en el próximo ciclo
    }
  }

  async function cargarMasAntiguos() {
    if (!abierto || chat.mensajes.length === 0 || cargandoViejos) return
    setCargandoViejos(true)
    saltarScrollRef.current = true
    try {
      const cursor = chat.mensajes[0].created_at
      const res = await fetch(
        `/api/admin/conversaciones?numero=${abierto}&antes=${encodeURIComponent(cursor)}`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      setChat((prev) => ({
        ...prev,
        mensajes: fusionarMensajes(prev.mensajes, data.mensajes || []),
        hayMas: data.hay_mas,
      }))
    } catch (e) {
      // el botón queda disponible para reintentar
    } finally {
      setCargandoViejos(false)
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
    if (saltarScrollRef.current) {
      saltarScrollRef.current = false
      return
    }
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.mensajes.length, abierto])

  // Vista previa para escuchar el audio adjunto antes de enviarlo
  useEffect(() => {
    if (archivo && archivo.type.startsWith('audio/')) {
      const url = URL.createObjectURL(archivo)
      setUrlPreview(url)
      return () => URL.revokeObjectURL(url)
    }
    setUrlPreview(null)
  }, [archivo])

  function liberarMicrofono() {
    clearInterval(temporizadorRef.current)
    microfonoRef.current?.getTracks().forEach((pista) => pista.stop())
    microfonoRef.current = null
  }

  // Si se cierra la página mientras se graba, se apaga el micrófono
  useEffect(() => {
    return () => liberarMicrofono()
  }, [])

  async function iniciarGrabacion() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setError('Este navegador no permite grabar audio.')
      return
    }
    try {
      const microfono = await navigator.mediaDevices.getUserMedia({ audio: true })
      microfonoRef.current = microfono
      trozosRef.current = []

      const grabador = new MediaRecorder(microfono)
      grabador.ondataavailable = (e) => {
        if (e.data.size > 0) trozosRef.current.push(e.data)
      }
      grabador.start()
      grabadorRef.current = grabador

      setSegundos(0)
      setGrabando(true)
      temporizadorRef.current = setInterval(() => setSegundos((s) => s + 1), 1000)
    } catch (e) {
      liberarMicrofono()
      setError('No se pudo usar el micrófono. Revisá que el navegador tenga permiso para usarlo.')
    }
  }

  function cancelarGrabacion() {
    const grabador = grabadorRef.current
    if (grabador) {
      grabador.onstop = null
      if (grabador.state !== 'inactive') grabador.stop()
    }
    grabadorRef.current = null
    liberarMicrofono()
    setGrabando(false)
    setSegundos(0)
  }

  function terminarGrabacion() {
    const grabador = grabadorRef.current
    if (!grabador || grabador.state === 'inactive') return

    clearInterval(temporizadorRef.current)
    setGrabando(false)
    setPreparandoAudio(true)

    grabador.onstop = async () => {
      try {
        const original = new Blob(trozosRef.current, { type: grabador.mimeType || 'audio/webm' })
        const mp3 = await convertirAMp3(original)
        const hora = new Date()
          .toLocaleTimeString('es-AR', { timeZone: ZONA, hour: '2-digit', minute: '2-digit' })
          .replace(':', '')
        setArchivo(new File([mp3], `nota-de-voz-${hora}.mp3`, { type: 'audio/mpeg' }))
      } catch (e) {
        setError('No se pudo preparar el audio: ' + e.message)
      } finally {
        liberarMicrofono()
        grabadorRef.current = null
        setPreparandoAudio(false)
      }
    }
    grabador.stop()
  }

  // Corta sola la grabación al llegar al máximo
  useEffect(() => {
    if (grabando && segundos >= LIMITE_GRABACION) terminarGrabacion()
  }, [segundos, grabando])

  function elegirArchivo(e) {
    const f = e.target.files?.[0]
    if (f) {
      setArchivo(f)
      setError('')
    }
  }

  function quitarArchivo() {
    setArchivo(null)
    if (inputArchivoRef.current) inputArchivoRef.current.value = ''
  }

  async function enviarTexto(t) {
    const res = await fetch('/api/admin/conversaciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'enviar', numero: abierto, texto: t }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(traducirError(data.error))
      return false
    }
    return true
  }

  async function enviar() {
    const t = texto.trim()
    if ((!t && !archivo) || enviando) return
    setEnviando(true)
    setError('')
    try {
      if (archivo) {
        // 1) Pedir permiso de subida
        const resFirma = await fetch('/api/admin/conversaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accion: 'firmar_subida',
            numero: abierto,
            nombre: archivo.name,
            mime: archivo.type,
          }),
        })
        const firma = await resFirma.json()
        if (!resFirma.ok) {
          setError(firma.error || 'No se pudo preparar el archivo')
          return
        }

        const limite = LIMITE_MB[firma.categoria]
        if (archivo.size > limite * 1024 * 1024) {
          setError(`El archivo pesa ${formatearTamano(archivo.size)}. WhatsApp permite hasta ${limite} MB para este tipo.`)
          return
        }

        // 2) Subir el archivo directo a Supabase Storage
        const { error: errorSubida } = await supabase.storage
          .from('whatsapp-media')
          .uploadToSignedUrl(firma.path, firma.token, archivo, { contentType: firma.mime })
        if (errorSubida) {
          setError('No se pudo subir el archivo: ' + errorSubida.message)
          return
        }

        // 3) Pedirle a WhatsApp que lo mande
        const res = await fetch('/api/admin/conversaciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accion: 'enviar_media',
            numero: abierto,
            url: firma.url,
            mime: firma.mime,
            nombre: archivo.name,
            caption: firma.categoria === 'audio' ? '' : t,
          }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(traducirError(data.error))
          return
        }

        // Los audios no llevan texto: si escribiste algo, va como mensaje aparte
        if (firma.categoria === 'audio' && t) {
          const ok = await enviarTexto(t)
          if (!ok) return
        }

        quitarArchivo()
        setTexto('')
        await cargarChat(abierto)
      } else {
        const ok = await enviarTexto(t)
        if (ok) {
          setTexto('')
          await cargarChat(abierto)
        }
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
    const puedeEnviar = !enviando && (texto.trim() || archivo)

    return (
      <main style={contenedor}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => { cancelarGrabacion(); setAbierto(null) }} style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer' }}>←</button>
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
          {chat.hayMas && (
            <button
              onClick={cargarMasAntiguos}
              disabled={cargandoViejos}
              style={{
                alignSelf: 'center',
                padding: '6px 14px',
                fontSize: '13px',
                borderRadius: '999px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                color: '#555',
                cursor: cargandoViejos ? 'not-allowed' : 'pointer',
                marginBottom: '4px',
              }}
            >
              {cargandoViejos ? 'Cargando...' : 'Cargar mensajes anteriores'}
            </button>
          )}

          {chat.mensajes.map((m) => {
            const e = estilosRol[m.rol] || estilosRol.user
            return (
              <div key={m.id} style={{ alignSelf: e.alinear, maxWidth: '85%' }}>
                <div style={{ backgroundColor: e.fondo, padding: '10px 12px', borderRadius: '12px', fontSize: '14px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  <ContenidoMensaje m={m} />
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

        <div style={{ padding: '10px 12px', borderTop: '1px solid #e5e5e5' }}>
          {archivo && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                padding: '6px 10px',
                fontSize: '13px',
                borderRadius: '8px',
                backgroundColor: '#f1f5f9',
              }}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                📎 {archivo.name} ({formatearTamano(archivo.size)})
              </span>
              <button
                onClick={quitarArchivo}
                disabled={enviando}
                title="Quitar archivo"
                style={{ border: 'none', background: 'none', fontSize: '16px', cursor: 'pointer', color: '#555' }}
              >
                ✕
              </button>
            </div>
          )}

          {archivo && urlPreview && (
            <audio controls src={urlPreview} style={{ width: '100%', marginBottom: '8px' }} />
          )}

          {preparandoAudio && (
            <p style={{ margin: '0 0 8px', fontSize: '13px', color: '#555' }}>Preparando audio...</p>
          )}

          {grabando && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 4px' }}>
              <span style={{ flex: 1, fontSize: '15px', color: '#dc2626', fontWeight: '600' }}>
                ● Grabando {formatearDuracion(segundos)}
              </span>
              <button
                onClick={cancelarGrabacion}
                style={{
                  padding: '10px 14px',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={terminarGrabacion}
                style={{
                  padding: '10px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  backgroundColor: '#15803d',
                  cursor: 'pointer',
                }}
              >
                Listo
              </button>
            </div>
          )}

          <div style={{ display: grabando ? 'none' : 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <input
              ref={inputArchivoRef}
              type="file"
              accept={TIPOS_ACEPTADOS}
              onChange={elegirArchivo}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => inputArchivoRef.current?.click()}
              disabled={enviando}
              title="Adjuntar foto, video, audio o documento"
              style={{
                padding: '10px 12px',
                fontSize: '20px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                cursor: enviando ? 'not-allowed' : 'pointer',
              }}
            >
              📎
            </button>
            <button
              onClick={iniciarGrabacion}
              disabled={enviando || preparandoAudio || Boolean(archivo)}
              title="Grabar nota de voz"
              style={{
                padding: '10px 12px',
                fontSize: '20px',
                borderRadius: '8px',
                border: '1px solid #ccc',
                backgroundColor: '#fff',
                cursor: enviando || preparandoAudio || archivo ? 'not-allowed' : 'pointer',
              }}
            >
              🎤
            </button>
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
              placeholder={archivo ? 'Agregá un texto (opcional)...' : 'Escribí tu mensaje...'}
              rows={2}
              style={{ flex: 1, padding: '10px', fontSize: '15px', borderRadius: '8px', border: '1px solid #ccc', resize: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={enviar}
              disabled={!puedeEnviar}
              style={{
                padding: '12px 16px',
                fontSize: '15px',
                fontWeight: 'bold',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                backgroundColor: puedeEnviar ? '#009ee3' : '#7fc9ec',
                cursor: puedeEnviar ? 'pointer' : 'not-allowed',
              }}
            >
              {enviando ? '...' : 'Enviar'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // ---------- Lista de conversaciones ----------
  return (
    <main style={{ ...contenedor, height: 'auto', minHeight: '100dvh' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/admin" style={{ fontSize: '22px', textDecoration: 'none', color: '#333' }}>←</Link>
        <h1 style={{ margin: 0, fontSize: '20px', flex: 1 }}>Conversaciones</h1>
        {!notisActivas ? (
          <button
            onClick={activarNotificaciones}
            disabled={activandoNotis}
            style={{
              padding: '8px 12px',
              fontSize: '13px',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid #009ee3',
              backgroundColor: '#fff',
              color: '#009ee3',
              cursor: activandoNotis ? 'not-allowed' : 'pointer',
            }}
          >
            {activandoNotis ? 'Activando...' : '🔔 Activar avisos'}
          </button>
        ) : (
          <span style={{ fontSize: '13px', color: '#15803d' }}>🔔 Avisos activos</span>
        )}
      </div>

      {cargando && <p style={{ padding: '16px', color: '#888' }}>Cargando...</p>}
      {!cargando && lista.length === 0 && (
        <p style={{ padding: '16px', color: '#888' }}>Todavía no hay conversaciones.</p>
      )}

      {lista.map((c) => (
        <div
          key={c.numero_cliente}
          onClick={() => {
            setChat({ mensajes: [], bot_pausado: c.bot_pausado, nombre_cliente: c.nombre_cliente, hayMas: false })
            setError('')
            setTexto('')
            setArchivo(null)
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

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}