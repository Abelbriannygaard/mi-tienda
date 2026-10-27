import { supabase } from '@/lib/supabase'

const DOMINIO = 'https://www.dimedetiambos.com.ar'

// Lista de páginas que se le ofrece a Google. Se arma sola: cada producto visible cargado en Supabase se suma.
export default async function sitemap() {
  const paginas = [
    { url: `${DOMINIO}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${DOMINIO}/quienes-somos`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${DOMINIO}/guia-de-talles`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  let productos = []
  try {
    const { data } = await supabase
      .from('productos')
      .select('id, created_at')
      .eq('visible', true)
      .limit(1000)
    productos = data || []
  } catch (error) {
    // Si falla la consulta, el sitemap sale igual con las páginas fijas
  }

  const paginasDeProductos = productos.map((p) => ({
    url: `${DOMINIO}/producto/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...paginas, ...paginasDeProductos]
}