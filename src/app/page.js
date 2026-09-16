import { supabase } from '@/lib/supabase'
import ProductoCard from './ProductoCard'
import CarritoIcono from './CarritoIcono'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: productos } = await supabase
    .from('productos')
    .select('*')

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <header className="flex items-center justify-between px-6 py-5 md:px-10 border-b border-[#E4DCCF]">
        <span className="font-serif text-xl text-[#2E2A26]">Dimedeti Ambos</span>
        <CarritoIcono />
      </header>

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