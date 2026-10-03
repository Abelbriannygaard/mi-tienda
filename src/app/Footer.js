'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <footer className="w-full border-t border-[#E4DCCF] bg-[#FAF6F0] px-6 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div>
          <h3 className="font-serif text-lg text-[#2E2A26]">Dimedeti Ambos</h3>
          <p className="mt-2 max-w-xs text-sm text-[#8A8378]">
            Indumentaria médica y sanitaria con diseño propio, hace más de 5 años.
          </p>
          <p className="mt-3 text-sm text-[#8A8378]">CUIT: 20-31943343-1</p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#2E2A26]">Ayuda</h4>
          <ul className="mt-2 space-y-2 text-sm text-[#8A8378]">
            <li>
              <Link href="/guia-de-talles" className="hover:text-[#2F6B63]">
                Guía de talles
              </Link>
            </li>
            <li>
              <Link href="/politica-de-cambios" className="hover:text-[#2F6B63]">
                Política de cambios
              </Link>
            </li>
            <li>
              <Link href="/quienes-somos" className="hover:text-[#2F6B63]">
                Quiénes somos
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-[#2E2A26]">Información legal</h4>
          <ul className="mt-2 space-y-2 text-sm text-[#8A8378]">
            <li>
              <Link href="/terminos-y-condiciones" className="hover:text-[#2F6B63]">
                Términos y condiciones
              </Link>
            </li>
            <li>
              <Link href="/politica-de-privacidad" className="hover:text-[#2F6B63]">
                Política de privacidad
              </Link>
            </li>
          </ul>
          {/* Acá va el sello de Data Fiscal (ARCA) cuando tengamos el código */}
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-5xl text-xs text-[#CFC7B8]">
        © {new Date().getFullYear()} Dimedeti Ambos. Todos los derechos reservados.
      </p>
    </footer>
  )
}
