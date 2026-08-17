import { supabase } from '@/lib/supabase'
import ProductoCard from './ProductoCard'
import CarritoIcono from './CarritoIcono'

export default async function Home() {
  const { data: productos } = await supabase.from('productos').select('*')

  return (
    <main style={{ padding: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Mi Tienda</h1>
        <CarritoIcono />
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        {productos?.map((producto) => (
          <ProductoCard key={producto.id} producto={producto} />
        ))}
      </div>
    </main>
  )
}