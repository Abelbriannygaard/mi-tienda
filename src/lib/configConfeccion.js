// Tiempo de confección de los pedidos.
// Archivo: src/lib/configConfeccion.js
//
// Para cambiar el plazo que ven los clientes (sitio, carrito, checkout y emails):
// cambiá DEMANDA_ACTUAL entre 'alta' y 'baja', guardá y hacé git push.

export const DEMANDA_ACTUAL = 'baja' // 'alta' | 'baja'

// Plazos en días corridos
export const PLAZOS_CONFECCION = {
  alta: { min: 7, max: 12 },
  baja: { min: 4, max: 7 },
}

// Los números del plazo actual: { min, max }. Los usa la cotización de envíos para sumar los días.
export function plazoConfeccion() {
  return PLAZOS_CONFECCION[DEMANDA_ACTUAL] || PLAZOS_CONFECCION.alta
}

export function textoConfeccion() {
  const plazo = plazoConfeccion()
  return `${plazo.min} a ${plazo.max} días corridos`
}
