import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { textoConfeccion } from '@/lib/configConfeccion'
import ProductoCard from './ProductoCard'
import CarritoIcono from './CarritoIcono'
import TestimoniosCarousel from './TestimoniosCarousel'
import BannerCarrusel from './BannerCarrusel'

export const dynamic = 'force-dynamic'

// Animación del cartel verde: el texto se desplaza hacia la izquierda sin cortes
const CSS_CARTEL =
  '.cartel-track{display:flex;width:max-content;animation:cartel-scroll 30s linear infinite}' +
  '.cartel-track:hover{animation-play-state:paused}' +
  '.cartel-grupo{display:flex;flex-shrink:0}' +
  '@keyframes cartel-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
  '@media (prefers-reduced-motion: reduce){.cartel-track{animation:none}}'

// Banner de cada categoría. Los archivos van en public/banners/
// Si guardaste las imágenes con otra extensión (por ejemplo .webp o .png), cambiala acá.
const CATEGORIAS = [
  { id: 0, banner: '/banners/ambos.jpg', alt: 'Ambos' },
  { id: 1, banner: '/banners/chaquetas.jpg', alt: 'Chaquetas' },
  { id: 2, banner: '/banners/pantalones.jpg', alt: 'Pantalones' },
]

// Orden del catálogo: primero ambos, luego chaquetas y al final pantalones.
// Se mira cómo EMPIEZA el nombre, para que "Ambo ... Pantalon con Puños" no caiga en pantalones.
function grupo(nombre = '') {
  const n = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (n.startsWith('ambo')) return 0
  if (n.startsWith('chaqueta')) return 1
  if (n.startsWith('pantalon')) return 2
  return 3
}

export default async function Home() {
  const { data } = await supabase
    .from('productos')
    .select('*')
    .eq('visible', true)
    .order('id', { ascending: true })

  const productos = [...(data || [])].sort(
    (a, b) => grupo(a.nombre) - grupo(b.nombre)
  )

  // Productos cuyo nombre no empieza con ambo, chaqueta ni pantalon: van al final, sin banner
  const otros = productos.filter((p) => grupo(p.nombre) === 3)

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <style>{CSS_CARTEL}</style>
      <div className="overflow-hidden bg-[#2F6B63] py-2.5 text-sm text-white">
        <div className="cartel-track">
          {[0, 1].map((copia) => (
            <div key={copia} className="cartel-grupo" aria-hidden={copia === 1}>
              {[0, 1, 2, 3].map((n) => (
                <span key={n} className="whitespace-nowrap px-8">
                  🧵 Todas las prendas se confeccionan a pedido · Tiempo de confección: <strong>{textoConfeccion()}</strong>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <header
        className="flex items-center justify-between border-b border-[#E4DCCF] px-6 py-10 md:px-10 md:py-14"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(250,246,240,0.95) 0%, rgba(250,246,240,0.75) 50%, rgba(250,246,240,0.35) 100%), url(/img/fondo-tela.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
        }}
      >
        <span className="font-serif text-3xl tracking-tight text-[#2E2A26] md:text-4xl">
          Dimedeti Ambos
        </span>
        <CarritoIcono />
      </header>

      <BannerCarrusel confeccion={textoConfeccion()} />
      <TestimoniosCarousel />

      <div
        className="relative px-6 md:px-10 py-10"
        style={{
          backgroundImage:
            'linear-gradient(rgba(250,246,240,0.75), rgba(250,246,240,0.85)), url(/img/fondo-tela.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
        }}
      >
        {CATEGORIAS.map((cat) => {
          const lista = productos.filter((p) => grupo(p.nombre) === cat.id)
          if (lista.length === 0) return null

          return (
            <section key={cat.id} className="mb-10">
              <Image
                src={cat.banner}
                alt={cat.alt}
                width={1672}
                height={941}
                sizes="(min-width: 768px) 90vw, 100vw"
                className="mb-6 block h-auto w-full rounded-xl"
              />
              <div className="flex flex-wrap gap-6">
                {lista.map((producto) => (
                  <ProductoCard key={producto.id} producto={producto} />
                ))}
              </div>
            </section>
          )
        })}

        {otros.length > 0 && (
          <section className="mb-10">
            <div className="flex flex-wrap gap-6">
              {otros.map((producto) => (
                <ProductoCard key={producto.id} producto={producto} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}