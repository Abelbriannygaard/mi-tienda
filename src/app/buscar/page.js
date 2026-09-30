import { supabase } from '@/lib/supabase'
import ProductoCard from '../ProductoCard'
import Fuse from 'fuse.js'

export default async function BuscarPage({ searchParams }) {
  const params = await searchParams
  const query = params?.q || ''

  let productos = []

  if (query) {
    const { data: todosLosProductos } = await supabase
      .from('productos')
      .select('*')

    const fuse = new Fuse(todosLosProductos || [], {
      keys: ['nombre', 'descripcion'],
      threshold: 0.3,
      ignoreLocation: true,
      useExtendedSearch: true,
    })

    productos = fuse.search(query).map((resultado) => resultado.item)
  }

  return (
    <main className="min-h-screen bg-[#FAF6F0]">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="font-serif text-2xl text-[#2E2A26]">
          Resultados para "{query}"
        </h1>

        {productos.length === 0 && (
          <p className="mt-6 text-[15px] text-[#8A8378]">
            No encontramos productos que coincidan con tu búsqueda.
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-6">
          {productos.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      </div>
    </main>
  )
}