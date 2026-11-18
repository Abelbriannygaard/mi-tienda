// Archivo: src/lib/cupones.js
// SOLO para el servidor (rutas api): valida cupones y anota sus usos.

import { createClient } from '@supabase/supabase-js'
import { normalizarCodigo, calcularDescuentoCupon } from '@/lib/configCupones'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mensaje único para todos los casos, así nadie puede averiguar qué códigos existen
const MENSAJE_NO_VALIDO = 'El cupón no es válido o ya no está disponible.'

// Comprueba que el cupón exista y esté vigente (sin mirar el monto de la compra)
export async function buscarCuponValido(codigoCrudo) {
  const codigo = normalizarCodigo(codigoCrudo)
  if (!codigo) return { ok: false, error: 'Ingresá un código de cupón.' }

  const { data: cupon, error } = await supabaseAdmin
    .from('cupones')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle()

  if (error) {
    console.error('Error al buscar el cupón:', error)
    return { ok: false, error: 'No pudimos verificar el cupón. Probá de nuevo.' }
  }

  if (!cupon || !cupon.activo) return { ok: false, error: MENSAJE_NO_VALIDO }

  const ahora = new Date()
  if (cupon.fecha_inicio && new Date(cupon.fecha_inicio) > ahora) return { ok: false, error: MENSAJE_NO_VALIDO }
  if (cupon.fecha_fin && new Date(cupon.fecha_fin) < ahora) return { ok: false, error: MENSAJE_NO_VALIDO }
  if (cupon.max_usos != null && cupon.usos >= cupon.max_usos) return { ok: false, error: MENSAJE_NO_VALIDO }

  return { ok: true, cupon }
}

// Valida el cupón contra el subtotal real del pedido y calcula el descuento
export async function validarCuponParaPedido(codigo, subtotal) {
  const resultado = await buscarCuponValido(codigo)
  if (!resultado.ok) return resultado

  const minimo = Number(resultado.cupon.compra_minima) || 0
  if (subtotal < minimo) {
    return {
      ok: false,
      error: `Este cupón requiere una compra mínima de $${minimo.toLocaleString('es-AR')} en productos.`,
    }
  }

  const descuento = calcularDescuentoCupon(resultado.cupon, subtotal)
  if (descuento <= 0) return { ok: false, error: MENSAJE_NO_VALIDO }

  return { ok: true, cupon: resultado.cupon, descuento }
}

// Suma un uso de forma atómica. Devuelve false si el cupón se agotó justo en ese momento.
export async function usarCupon(codigo) {
  const { data, error } = await supabaseAdmin.rpc('usar_cupon', { p_codigo: codigo })
  if (error) {
    console.error('Error al registrar el uso del cupón:', error)
    return false
  }
  return data === true
}

// Devuelve el uso si el pedido no se pudo completar
export async function devolverUsoCupon(codigo) {
  const { error } = await supabaseAdmin.rpc('devolver_uso_cupon', { p_codigo: codigo })
  if (error) console.error('Error al devolver el uso del cupón:', error)
}

// Mercado Pago no acepta líneas con precio negativo: el descuento se reparte entre los
// precios de los productos, proporcionalmente, y la suma queda igual al total con cupón.
export function repartirDescuentoEnItems(items, descuento) {
  if (!descuento || descuento <= 0) return items

  const subtotal = items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0)
  if (subtotal <= 0) return items

  let restante = descuento
  return items.map((item, idx) => {
    const totalLinea = item.unit_price * item.quantity
    const esUltima = idx === items.length - 1
    let descLinea = esUltima ? restante : Math.round((descuento * totalLinea) / subtotal)
    descLinea = Math.max(0, Math.min(descLinea, totalLinea, restante))
    restante -= descLinea
    const nuevoPrecio = Math.round(((totalLinea - descLinea) / item.quantity) * 100) / 100
    return { ...item, unit_price: nuevoPrecio }
  })
}
