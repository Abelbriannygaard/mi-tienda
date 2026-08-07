import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProductoDetalle from './ProductoDetalle'

export default async function PaginaProducto({ params }) {
  const { id } = await params

  const { data: producto } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()

  if (!producto) {
    notFound()
  }

  const { data: variantes } = await supabase
    .from('variantes')
    .select('*')
    .eq('producto_id', id)

  return <ProductoDetalle producto={producto} variantes={variantes || []} />
}