// Archivo: src/lib/configCupones.js
// Funciones puras (sin base de datos): las usan tanto el navegador como el servidor.
//
// Reglas de los cupones:
// - Descuentan solo los productos, no el envío.
// - Se aplican ANTES del 5% de transferencia (el 5% se calcula sobre el precio ya con cupón).
// - El monto del envío gratis se mide DESPUÉS del cupón.

export function normalizarCodigo(texto) {
  return String(texto || '').trim().toUpperCase().replace(/\s+/g, '')
}

// Cuánto descuenta el cupón sobre el subtotal de productos. Nunca más que el subtotal.
export function calcularDescuentoCupon(cupon, subtotal) {
  if (!cupon || !(subtotal > 0)) return 0
  const valor = Number(cupon.valor) || 0
  const bruto = cupon.tipo === 'porcentaje' ? Math.round((subtotal * valor) / 100) : Math.round(valor)
  return Math.max(0, Math.min(bruto, subtotal))
}

export function etiquetaDescuento(cupon) {
  if (cupon.tipo === 'porcentaje') return `−${Number(cupon.valor)}%`
  return `−$${Number(cupon.valor).toLocaleString('es-AR')}`
}

// Texto de la línea que queda en el pedido, el admin y los emails
export function nombreLineaCupon(cupon) {
  return `Cupón ${cupon.codigo} (${etiquetaDescuento(cupon)})`
}
