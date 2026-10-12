// Configuración del pago por transferencia bancaria.

// Descuento por pagar con transferencia (0.05 = 5%). Se aplica solo a los productos, no al envío.
export const DESCUENTO_TRANSFERENCIA = 0.05

// Estos datos los ve el cliente al terminar el pedido y en el email.
export const DATOS_BANCARIOS = {
  titular: 'ABEL BRIAN NYGAARD',
  banco: 'Banco Macro',
  alias: 'dimedeti-ambos',
  cbu: '2850596140096116920578',
  cuit: '', // opcional: si lo dejás vacío no se muestra
}

// WhatsApp del negocio, para que el cliente mande el comprobante.
// REVISAR: tiene que ser el número al que querés que te lleguen los comprobantes (con código de país, sin + ni espacios).
export const WHATSAPP_NEGOCIO = '5491178197073'