// DESTINO: src/app/BotonGoogle.js  (archivo NUEVO)
'use client'

import { supabase } from '@/lib/supabase'

export default function BotonGoogle({ texto = 'Ingresar con Google' }) {
  async function ingresar() {
    // Vuelve a la misma página donde estaba la persona
    const volverA = window.location.href.split('#')[0]
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: volverA },
    })
  }

  return (
    <button
      type="button"
      onClick={ingresar}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 18px',
        borderRadius: '8px',
        border: '1px solid #dadce0',
        background: '#fff',
        color: '#3c4043',
        fontWeight: 600,
        fontSize: '14px',
        cursor: 'pointer',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-4 6.7-9.9 6.7-17.4z" />
        <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
        <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.6 2.3-8.6 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
      </svg>
      {texto}
    </button>
  )
}