// Tiempo de confección de los pedidos.
// Archivo: src/lib/configConfeccion.js
//
// Para cambiar el plazo que ven los clientes (checkout y emails):
// cambiá DEMANDA_ACTUAL entre 'alta' y 'baja', guardá y hacé git push.

export const DEMANDA_ACTUAL = 'alta' // 'alta' | 'baja'

// Plazos en días corridos
export const PLAZOS_CONFECCION = {
  alta: { min: 7, max: 12 },
  baja: { min: 4, max: 7 },
}

export function textoConfeccion() {
  const plazo = PLAZOS_CONFECCION[DEMANDA_ACTUAL] || PLAZOS_CONFECCION.alta
  return `${plazo.min} a ${plazo.max} días corridos`
}
