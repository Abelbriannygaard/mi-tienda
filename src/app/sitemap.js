import { supabase } from '@/lib/supabase'

// Dirección oficial del sitio, sin www. Tiene que ser la misma que SITIO en producto/[id]/page.js
const SITIO = 'https://dimedetiambos.com.ar'

// Se vuelve a generar como máximo cada hora
export const revalidate = 3600

export default async function sitemap() {
  // Solo productos visibles: los ocultos (como el 999 de prueba) no entran
  const { data: productos } = await supabase
    .from('productos')
    .select('id, created_at')
    .eq('visible', true)
    .order('id', { ascending: true })

  const paginas = [
    { url: `${SITIO}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITIO}/quienes-somos`, changeFrequency: 'yearly', priority: 0.5 },
    { url: `${SITIO}/guia-de-talles`, changeFrequency: 'yearly', priority: 0.5 },
  ]

  const urlsProductos = (productos || []).map((p) => ({
    url: `${SITIO}/producto/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...paginas, ...urlsProductos]
}