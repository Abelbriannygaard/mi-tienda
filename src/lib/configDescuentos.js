// Reglas de descuentos: un solo lugar que usan el checkout (lo que ve el cliente)
// y la ruta del servidor (lo que realmente se cobra). Así nunca se contradicen.
//
// Cupones que SE SUMAN al descuento por transferencia (primero se descuenta el cupón y el
// % de transferencia se calcula sobre lo que queda: 5% + 5% = 9,75%).
// Cualquier otro cupón NO se suma: se aplica solo el descuento más alto de los dos
// (si empatan, queda el de transferencia y el cupón no se gasta).
// Escribí los códigos en mayúsculas. Para sumar otro cupón, agregalo a esta lista y hacé git push.

export const CUPONES_QUE_SE_SUMAN_A_TRANSFERENCIA = ['BIENVENIDA', 'BIENVENIDA5']

export function cuponSeSumaConTransferencia(codigo) {
  const normalizado = String(codigo || '').trim().toUpperCase()
  return CUPONES_QUE_SE_SUMAN_A_TRANSFERENCIA.includes(normalizado)
}
