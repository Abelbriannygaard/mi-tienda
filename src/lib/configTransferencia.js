// Configuración del pago por transferencia bancaria.

// Descuento por pagar con transferencia (0.05 = 5%). Se aplica solo a los productos, no al envío.
export const DESCUENTO_TRANSFERENCIA = 0.05

// ============================================================
// CUENTA ACTIVA: cambiá esta línea para elegir qué datos se muestran.
//   'nueva'    -> TIA.DELTA.TANDA (Galicia)
//   'anterior' -> dimedeti-ambos (Macro)
// ============================================================
const CUENTA_ACTIVA = 'nueva'

const CUENTAS = {
  nueva: {
    titular: 'ABEL BRIAN NYGAARD', // REVISAR: tiene que ser el titular de la cuenta nueva
    banco: 'Banco Galicia', // REVISAR: el CBU nuevo empieza con 007 (Galicia)
    alias: 'TIA.DELTA.TANDA',
    cbu: '0070092430004010826138',
    cuil: '20-11489007-4',
    cuenta: '401082610923',
    cuit: '', // ya no se usa (ahora es cuil); vacío para no romper el email
  },
  anterior: {
    titular: 'ABEL BRIAN NYGAARD',
    banco: 'Banco Macro',
    alias: 'dimedeti-ambos',
    cbu: '2850596140096116920578',
    cuil: '', // vacío = no se muestra
    cuenta: '', // vacío = no se muestra
    cuit: '',
  },
}

// Estos datos los ve el cliente al terminar el pedido y en el email.
export const DATOS_BANCARIOS = CUENTAS[CUENTA_ACTIVA]

// WhatsApp del negocio, para que el cliente mande el comprobante.
// REVISAR: tiene que ser el número al que querés que te lleguen los comprobantes (con código de país, sin + ni espacios).
export const WHATSAPP_NEGOCIO = '5491178197073'