'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const INTERVALO = 5000 // milisegundos entre tarjetas

// "confeccion" llega desde page.js con textoConfeccion(), así los días
// siempre coinciden con los del cartel verde de arriba.
export default function BannerCarrusel({ confeccion }) {
  // Para sumar o cambiar tarjetas, editá solo esta lista.
  // tipo 'imagen': usa un archivo de /public. tipo 'texto': título, subtítulo y detalle.
  // Si ponés href (por ejemplo '/producto/4'), la tarjeta lleva a esa página.
  const TARJETAS = [
    {
      tipo: 'imagen',
      src: '/banner-envio-gratis.png',
      alt: 'Envío gratis en compras desde $100.000 a todo el país',
      href: null,
    },
    {
      tipo: 'texto',
      titulo: '5% de descuento',
      subtitulo: 'pagando por transferencia',
      detalle: 'Se aplica en el carrito',
      href: null,
    },
    {
      tipo: 'texto',
      titulo: 'Confección a pedido',
      subtitulo: 'Elegí tu talle y color, y lo hacemos para vos',
      detalle: `${confeccion} · Envíos a todo el país`,
      href: null,
    },
  ]

  const total = TARJETAS.length
  const [actual, setActual] = useState(0)
  const [pausado, setPausado] = useState(false)
  const x0 = useRef(null)

  function ir(n) {
    setActual((n + total) % total)
  }

  // Autoplay: se pausa con el mouse o el dedo, y se reinicia al cambiar de tarjeta
  useEffect(() => {
    if (pausado || total < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setTimeout(() => setActual((a) => (a + 1) % total), INTERVALO)
    return () => clearTimeout(id)
  }, [pausado, actual, total])

  function onTouchStart(e) {
    x0.current = e.touches[0].clientX
    setPausado(true)
  }

  function onTouchEnd(e) {
    if (x0.current !== null) {
      const dx = e.changedTouches[0].clientX - x0.current
      if (Math.abs(dx) > 40) ir(actual + (dx < 0 ? 1 : -1))
    }
    x0.current = null
    setPausado(false)
  }

  function contenido(t, i) {
    if (t.tipo === 'imagen') {
      return (
        <Image
          src={t.src}
          alt={t.alt}
          width={1636}
          height={900}
          priority={i === 0}
          className="block h-full w-full object-cover"
        />
      )
    }
    return (
      <div className="relative flex h-full flex-col justify-center bg-[#FAF6F0] px-[8%]">
        <h2 className="font-serif text-[clamp(26px,6vw,80px)] leading-none tracking-tight text-[#2E2A26]">
          {t.titulo}
        </h2>
        <p className="mt-2 text-[clamp(14px,2.4vw,32px)] text-[#2E2A26]">
          {t.subtitulo}
        </p>
        <p className="mt-3 text-[clamp(11px,1.4vw,18px)] font-medium tracking-wide text-[#2F6B63]">
          {t.detalle}
        </p>
        <div
          aria-hidden="true"
          className="absolute right-[8%] top-1/2 aspect-square w-[clamp(60px,12vw,180px)] -translate-y-1/2 rounded-full bg-[#2F6B63] opacity-10"
        />
      </div>
    )
  }

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Promociones"
      className="mx-auto w-full max-w-[1200px] px-6 py-8 md:px-10"
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-[#E4DCCF] bg-[#FAF6F0]"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${actual * 100}%)` }}
        >
          {TARJETAS.map((t, i) => (
            <div
              key={i}
              aria-hidden={i !== actual}
              className="aspect-[1636/900] w-full shrink-0"
            >
              {t.href ? (
                <Link
                  href={t.href}
                  tabIndex={i === actual ? 0 : -1}
                  className="block h-full"
                >
                  {contenido(t, i)}
                </Link>
              ) : (
                contenido(t, i)
              )}
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              onClick={() => ir(actual - 1)}
              aria-label="Tarjeta anterior"
              className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-2xl leading-none text-[#2E2A26] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6B63] sm:flex"
            >
              ‹
            </button>
            <button
              onClick={() => ir(actual + 1)}
              aria-label="Tarjeta siguiente"
              className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-2xl leading-none text-[#2E2A26] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6B63] sm:flex"
            >
              ›
            </button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {TARJETAS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => ir(i)}
                  aria-label={`Ir a la tarjeta ${i + 1}`}
                  aria-current={i === actual}
                  className={`h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F6B63] ${
                    i === actual ? 'w-6 bg-[#2F6B63]' : 'w-2 bg-[#CFC7B8]'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}