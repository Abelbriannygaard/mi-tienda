// DESTINO: src/lib/configRetiro.js (archivo nuevo)
// Único lugar donde se define dónde se retira el pedido.
// Si algún día cambia la zona o la dirección, se edita solo acá.

export const ZONA_RETIRO = 'San Martín, Provincia de Buenos Aires (GBA)'

// Texto corto para el selector de envío, el checkout y el panel del carrito.
export const TEXTO_RETIRO_CORTO = `Retirás en zona ${ZONA_RETIRO}`

// Texto largo para la pantalla de transferencia y los emails.
export const TEXTO_RETIRO_LARGO = `Retiro en persona en zona ${ZONA_RETIRO}. Te avisamos por WhatsApp o por email cuando tu pedido esté listo y coordinamos el día y el horario.`

// Etiqueta que reemplaza a "Dirección de envío" cuando el pedido es con retiro.
export const ETIQUETA_RETIRO = 'Retirás en'