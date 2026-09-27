'use client'

import { useEffect, useRef, useState } from 'react'

// Para sumar más testimonios en el futuro, agregá objetos acá con el mismo formato.
const TESTIMONIOS = [
  {
    texto: 'El pantalón es de muy buena calidad y las medidas exactas. Me quedó perfecto!',
    estrellas: 5,
  },
  {
    texto: 'Muy buena calidad, esta es la cuarta vez que compro, y los colores son firmes.',
    estrellas: 5,
  },
  {
    texto: 'Hermoso, a todas mis compañeras también les encantó.',
    estrellas: 5,
  },
  {
    texto: 'Muy lindo.',
    estrellas: 5,
  },
]

function Estrellas({ cantidad }) {
  return (
    <div className="flex gap-0.5 text-[#2F6B63]">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < cantidad ? 'opacity-100' : 'opacity-20'}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function TestimoniosCarousel() {
  const [indice, setIndice] = useState(0)
  const scrollRef = useRef(null)
  const pausadoRef = useRef(false)
  const movimientoIntencionalRef = useRef(false)

  // Autoplay: avanza solo cada 4.5s, salvo que el usuario esté interactuando
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (!pausadoRef.current) {
        movimientoIntencionalRef.current = true
        setIndice((i) => (i + 1) % TESTIMONIOS.length)
      }
    }, 4500)
    return () => clearInterval(intervalo)
  }, [])

  // Solo movemos el scroll a mano si el cambio de índice vino de un clic
  // o del autoplay, no si vino de que el usuario ya scrolleó él mismo.
  useEffect(() => {
    if (!movimientoIntencionalRef.current) return
    movimientoIntencionalRef.current = false

    const contenedor = scrollRef.current
    if (!contenedor) return
    const tarjeta = contenedor.children[indice]
    if (tarjeta) {
      contenedor.scrollTo({ left: tarjeta.offsetLeft, behavior: 'smooth' })
    }
  }, [indice])

  function handleScroll() {
    const contenedor = scrollRef.current
    if (!contenedor) return
    const anchoTarjeta = contenedor.children[0]?.offsetWidth || 1
    const nuevoIndice = Math.round(contenedor.scrollLeft / anchoTarjeta)
    setIndice(nuevoIndice)
  }

  function irAlTestimonio(i) {
    movimientoIntencionalRef.current = true
    setIndice(i)
  }

  return (
    <section className="w-full bg-[#F3EEE6] py-10">
      <h2 className="mb-6 text-center font-serif text-2xl text-[#2E2A26]">
        Lo que dicen quienes ya compraron
      </h2>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={() => (pausadoRef.current = true)}
        onTouchEnd={() => (pausadoRef.current = false)}
        onMouseEnter={() => (pausadoRef.current = true)}
        onMouseLeave={() => (pausadoRef.current = false)}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[10%] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {TESTIMONIOS.map((t, i) => (
          <div
            key={i}
            className="flex w-[80%] shrink-0 snap-center flex-col justify-between rounded-2xl border border-[#E4DCCF] bg-white p-6 sm:w-[320px]"
          >
            <Estrellas cantidad={t.estrellas} />
            <p className="mt-3 font-serif text-[15px] leading-snug text-[#2E2A26]">
              "{t.texto}"
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {TESTIMONIOS.map((_, i) => (
          <button
            key={i}
            onClick={() => irAlTestimonio(i)}
            aria-label={`Ver testimonio ${i + 1}`}
            className={`h-2 w-2 rounded-full transition ${
              i === indice ? 'bg-[#2F6B63]' : 'bg-[#CFC7B8]'
            }`}
          />
        ))}
      </div>
    </section>
  )
}