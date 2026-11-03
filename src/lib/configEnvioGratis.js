// Envío gratis a partir de cierto monto.
// Archivo: src/lib/configEnvioGratis.js
//
// El monto se compara contra el total de los PRODUCTOS (antes del descuento por transferencia
// y sin contar el envío). Para cambiar el monto, editá UMBRAL_ENVIO_GRATIS y hacé git push.

export const UMBRAL_ENVIO_GRATIS = 100000

// Devuelve el costo de envío que realmente se cobra
export function calcularCostoEnvio(subtotalProductos, zonaEnvio) {
  if (!zonaEnvio) return 0
  if (subtotalProductos >= UMBRAL_ENVIO_GRATIS) return 0
  return Number(zonaEnvio.costo) || 0
}