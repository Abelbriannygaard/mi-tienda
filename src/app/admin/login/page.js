'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [usuario, setUsuario] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [verContrasena, setVerContrasena] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const respuesta = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, contrasena }),
      })

      if (respuesta.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        setError('Usuario o contraseña incorrectos')
      }
    } catch (err) {
      setError('Error al iniciar sesión, intentá de nuevo')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '360px',
        }}
      >
        <h1 style={{ fontSize: '20px', marginBottom: '24px', textAlign: 'center' }}>
          Panel de administración
        </h1>

        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
          Usuario
        </label>
        <input
          type="text"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '15px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            marginBottom: '16px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '6px', color: '#333' }}>
          Contraseña
        </label>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            type={verContrasena ? 'text' : 'password'}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 40px 10px 14px',
              fontSize: '15px',
              borderRadius: '8px',
              border: '1px solid #ccc',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              color: '#666',
            }}
            title={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {verContrasena ? '🙈' : '👁️'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={cargando}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '15px',
            fontWeight: 'bold',
            backgroundColor: cargando ? '#7fc9ec' : '#009ee3',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: cargando ? 'not-allowed' : 'pointer',
          }}
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}