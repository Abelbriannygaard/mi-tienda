import { cache } from 'react'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import ProductoDetalle from './ProductoDetalle'

// Dirección oficial del sitio (sin barra final). Es la versión con www:
// en Vercel, dimedetiambos.com.ar redirige a www.dimedetiambos.com.ar
const SITIO = 'https://www.dimedetiambos.com.ar'

// cache(): la página y los metadatos comparten la misma consulta, sin repetirla
const getProducto = cache(async (id) => {
  // Solo productos visibles: si está oculto o no existe, no se devuelve
  const { data } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .eq('visible', true)
    .single()
  return data
})

const getVariantes = cache(async (id) => {
  const { data } = await supabase.from('variantes').select('*').eq('producto_id', id)
  return data || []
})

// Colores únicos del producto, sin repetir por mayúsculas o tildes (Azul francia = Azul Francia)
function coloresDelProducto(variantes) {
  const porClave = new Map()
  for (const v of variantes) {
    const color = v.color?.trim()
    if (!color) continue
    const clave = color.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const actual = porClave.get(clave)
    // Si hay dos escrituras, preferimos la que lleva tilde
    if (!actual || (/[^\x00-\x7F]/.test(color) && !/[^\x00-\x7F]/.test(actual))) {
      porClave.set(clave, color)
    }
  }
  return Array.from(porClave.values()).map(
    (c) => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
  )
}

// Recorta el texto sin cortar palabras a la mitad y agrega puntos suspensivos si hace falta
function recortar(texto, max = 155) {
  if (texto.length <= max) return texto
  const corte = texto.slice(0, max)
  const ultimoEspacio = corte.lastIndexOf(' ')
  const limpio = ultimoEspacio > 100 ? corte.slice(0, ultimoEspacio) : corte
  return limpio.replace(/[.,;:\s]+$/, '') + '…'
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const producto = await getProducto(id)
  if (!producto) return {}

  const variantes = await getVariantes(id)
  const colores = coloresDelProducto(variantes)
  const lista = colores.join(', ')

  const title = lista ? `${producto.nombre} - ${lista}` : producto.nombre

  const base = producto.descripcion ? ` ${producto.descripcion.replace(/\s+/g, ' ').trim()}` : ''
  const description = recortar(lista ? `Colores: ${lista}.${base}` : base.trim())

  return {
    // absolute: sin el sufijo "| Dimedeti Ambos" del layout, para que el título sea más corto
    title: { absolute: title },
    description,
    alternates: { canonical: `${SITIO}/producto/${id}` },
  }
}

export default async function PaginaProducto({ params }) {
  const { id } = await params

  const producto = await getProducto(id)

  if (!producto) {
    notFound()
  }

  const variantes = await getVariantes(id)

  return <ProductoDetalle producto={producto} variantes={variantes} />
}