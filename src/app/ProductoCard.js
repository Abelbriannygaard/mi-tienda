import { supabase } from '@/lib/supabase'
import ProductoCardCliente from './ProductoCardCliente'

export default async function ProductoCard({ producto }) {
  const { data: variantes } = await supabase
    .from('variantes')
    .select('*')
    .eq('producto_id', producto.id)

  return <ProductoCardCliente producto={producto} variantes={variantes || []} />
}