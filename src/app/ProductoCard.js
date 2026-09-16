import { supabase } from '@/lib/supabase'
import ProductoCardCliente from './ProductoCardCliente'

export default async function ProductoCard({ producto }) {
  const { data: variantes } = await supabase
    .from('variantes')
    .select('color, imagen_url')
    .eq('producto_id', producto.id)

  const vistos = new Set()
  const fotosPorColor = []
  for (const v of variantes || []) {
    if (v.imagen_url && !vistos.has(v.color)) {
      vistos.add(v.color)
      fotosPorColor.push(v)
    }
  }

  return <ProductoCardCliente producto={producto} fotos={fotosPorColor} />
}