import { supabase } from '@/lib/supabase'
import { textoConfeccion } from '@/lib/configConfeccion'
import ProductoCard from './ProductoCard'
import CarritoIcono from './CarritoIcono'
import TestimoniosCarousel from './TestimoniosCarousel'

export const dynamic = 'force-dynamic'

// Animación del cartel verde: el texto se desplaza hacia la izquierda sin cortes
const CSS_CARTEL =
  '.cartel-track{display:flex;width:max-content;animation:cartel-scroll 30s linear infinite}' +
  '.cartel-track:hover{animation-play-state:paused}' +
  '.cartel-grupo{display:flex;flex-shrink:0}' +
  '@keyframes cartel-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
  '@media (prefers-reduced-motion: reduce){.cartel-track{animation:none}}'

export default async function Home() {
  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .eq('visible', true)

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
        <div className="flex flex-wrap gap-6">
          {productos?.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      </div>
    </main>
  )
}