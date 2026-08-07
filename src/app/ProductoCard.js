import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default async function ProductoCard({ producto }) {
  const { data: variantes } = await supabase
    .from('variantes')
    .select('*')
    .eq('producto_id', producto.id)
    .limit(1)

  const imagen = variantes?.[0]?.imagen_url

  return (
    <Link href={`/producto/${producto.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', width: '250px', cursor: 'pointer' }}>
        {imagen && (
          <img src={imagen} alt={producto.nombre} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
        )}
        <h2>{producto.nombre}</h2>
        <p>{producto.descripcion}</p>
        <p><strong>${producto.precio}</strong></p>
      </div>
    </Link>
  )
}