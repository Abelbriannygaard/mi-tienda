'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const NUMERO_WHATSAPP = '5491178197073'
const MENSAJE_GENERICO = 'Hola, quiero hacer una consulta sobre los ambos de la tienda'

export default function FloatingWhatsApp() {
  const pathname = usePathname()
  const [mensaje, setMensaje] = useState(MENSAJE_GENERICO)

  useEffect(() => {
    const match = pathname?.match(/^\/producto\/(\d+)/)
    if (!match) {
      setMensaje(MENSAJE_GENERICO)
      return
    }

    const id = match[1]
    let activo = true

    supabase
      .from('productos')
      .select('nombre')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (activo && data?.nombre) {
          setMensaje(`Hola, quiero consultar sobre el ${data.nombre}`)
        }
      })

    return () => {
      activo = false
    }
  }, [pathname])

  const link = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition hover:scale-105"
    >
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#25D366] opacity-75"></span>
      <svg viewBox="0 0 32 32" className="relative h-7 w-7 fill-white">
        <path d="M16.001 3C9.373 3 4 8.373 4 15.001c0 2.386.63 4.62 1.732 6.553L4 29l7.633-1.685A11.94 11.94 0 0 0 16 27c6.628 0 12-5.373 12-12S22.629 3 16.001 3zm.001 21.818a9.77 9.77 0 0 1-4.977-1.362l-.357-.212-4.53 1.001 1.02-4.415-.233-.372a9.79 9.79 0 0 1-1.507-5.457c0-5.412 4.404-9.815 9.815-9.815 5.412 0 9.815 4.403 9.815 9.815s-4.403 9.817-9.815 9.817h-.231zm5.39-7.35c-.294-.147-1.741-.859-2.011-.958-.27-.098-.467-.147-.664.148-.196.294-.76.958-.933 1.153-.171.196-.343.221-.637.074-.294-.147-1.243-.458-2.368-1.462-.875-.78-1.466-1.744-1.638-2.038-.171-.294-.018-.453.129-.6.132-.132.294-.343.442-.514.147-.171.196-.294.294-.49.098-.196.049-.368-.025-.515-.074-.147-.664-1.6-.91-2.191-.24-.578-.484-.5-.664-.51l-.567-.01c-.196 0-.515.074-.784.368-.27.294-1.03 1.007-1.03 2.457 0 1.45 1.055 2.85 1.202 3.048.147.196 2.077 3.174 5.033 4.451.703.303 1.252.484 1.68.62.706.224 1.348.192 1.856.117.566-.085 1.741-.712 1.987-1.4.246-.688.246-1.278.172-1.4-.074-.123-.27-.196-.564-.343z" />
      </svg>
    </a>
  )
}