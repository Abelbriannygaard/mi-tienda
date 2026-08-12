'use client'

import { useRouter } from 'next/navigation'

export default function CerrarSesionBoton() {
  const router = useRouter()

  async function handleCerrarSesion() {
    await fetch('/api/admin-logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleCerrarSesion}
      style={{
        padding: '8px 16px',
        fontSize: '14px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        backgroundColor: '#fff',
        cursor: 'pointer',
        color: '#333',
      }}
    >
      Cerrar sesión
    </button>
  )
}