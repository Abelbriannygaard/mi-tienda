'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SECCIONES = [
  { href: '/', label: 'Inicio' },
  { href: '/quienes-somos', label: 'Quiénes somos' },
  { href: '/guia-de-talles', label: 'Guía de talles' },
]

export default function Header() {
  const [busqueda, setBusqueda] = useState('')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const router = useRouter()

  function handleBuscar(e) {
    e.preventDefault()
    if (busqueda.trim().length > 0) {
      router.push(`/buscar?q=${encodeURIComponent(busqueda.trim())}`)
      setBusqueda('')
    }
  }

  return (
    <header
      style={{
        padding: '14px 40px',
        borderBottom: '1px solid #eee',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <img
            src="/logo.png"
            alt="dimedetiambos"
            style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
          />
          <span
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#333',
              letterSpacing: '0.3px',
            }}
          >
            Tienda
          </span>
        </Link>

        {/* Menú de navegación - desktop */}
        <nav
          style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
          }}
        >
          {SECCIONES.map((seccion) => (
            <Link
              key={seccion.href}
              href={seccion.href}
              style={{
                textDecoration: 'none',
                color: '#333',
                fontSize: '15px',
                fontWeight: 500,
              }}
            >
              {seccion.label}
            </Link>
          ))}
        </nav>

        {/* Buscador */}
        <form
          onSubmit={handleBuscar}
          style={{
            display: 'flex',
            alignItems: 'center',
            border: '1px solid #ddd',
            borderRadius: '999px',
            padding: '6px 14px',
            minWidth: '200px',
            flex: '1 1 220px',
            maxWidth: '320px',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#888"
            strokeWidth="2"
            style={{ flexShrink: 0, marginRight: '8px' }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar ambos..."
            style={{
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              width: '100%',
              background: 'transparent',
            }}
          />
        </form>
      </div>
    </header>
  )
}