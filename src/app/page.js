import { supabase } from '@/lib/supabase'
import ProductoCard from './ProductoCard'
import CarritoIcono from './CarritoIcono'
import TestimoniosCarousel from './TestimoniosCarousel'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: productos } = await supabase
    .from('productos')
    .select('*')

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
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
      <div className="px-6 md:px-10 py-10">
        <div className="flex flex-wrap gap-6">
          {productos?.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      </div>
    </main>
  )
}