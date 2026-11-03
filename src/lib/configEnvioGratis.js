// Envío gratis a partir de cierto monto.
// Archivo: src/lib/configEnvioGratis.js
//
// El monto se compara contra el total de los PRODUCTOS (antes del descuento por transferencia
// y sin contar el envío). Para cambiar el monto, editá UMBRAL_ENVIO_GRATIS y hacé git push.

export const UMBRAL_ENVIO_GRATIS = 100000

// Cuando el envío es gratis, el cliente NO elige empresa: el sistema la elige solo.
// Orden de preferencia (siempre a domicilio). Se usa la primera que tenga tarifa para su código postal.
export const EMPRESAS_ENVIO_GRATIS = ['urbano', 'oca']

// Dentro de cada empresa se prefiere este servicio (OCA lo llama "Sucursal a puerta").
// Si no aparece, se usa el más barato de los que llegan a la puerta del cliente.
export const SERVICIOS_PREFERIDOS = ['sucursal a puerta']

// Si ninguna de las anteriores llega a ese código postal, se usa la a domicilio más barata de
// cualquier otra empresa, para no perder la venta. Poné false si preferís que no se pueda comprar.
export const USAR_OTRAS_EMPRESAS_SI_FALTAN = true

// Lo que se guarda como "zona de envío" cuando el envío es gratis (el cliente no ve la empresa)
export const ID_ENVIO_GRATIS_AUTO = 'envio-gratis-auto'
export const NOMBRE_ENVIO_GRATIS = 'Envío gratis a domicilio'

// Devuelve el costo de envío que realmente se cobra
export function calcularCostoEnvio(subtotalProductos, zonaEnvio) {
  if (!zonaEnvio) return 0
  if (subtotalProductos >= UMBRAL_ENVIO_GRATIS) return 0
  return Number(zonaEnvio.costo) || 0
}

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

// Una opción es "a domicilio" si el cliente la recibe en su puerta.
// OCA: "Sucursal a puerta" y "Puerta a puerta" llegan al domicilio; "Sucursal a sucursal" y
// "Puerta a sucursal" no (el destino es una sucursal).
function esADomicilio(opcion) {
  const texto = `${normalizar(opcion.service)} ${normalizar(opcion.serviceCode)}`
  if (/\ba\s+(sucursal|agencia|punto|locker)/.test(texto)) return false
  if (/puerta|domicilio|home|door/.test(texto)) return true
  if (/sucursal|agencia|punto|retiro|pickup|locker/.test(texto)) return false
  if (opcion.branches?.length > 0) return false
  return true
}

function esServicioPreferido(opcion) {
  const texto = `${normalizar(opcion.service)} ${normalizar(opcion.serviceCode)}`
  return SERVICIOS_PREFERIDOS.some((s) => texto.includes(s))
}

// Primero el servicio preferido y, entre iguales, el más barato
function ordenar(opciones) {
  return [...opciones].sort(
    (a, b) =>
      Number(esServicioPreferido(b)) - Number(esServicioPreferido(a)) || precioDe(a) - precioDe(b)
  )
}

function precioDe(opcion) {
  return Number(opcion.price) || 0
}

// De todas las tarifas que devuelve la cotización, elige la que se usa cuando el envío es gratis
export function elegirOpcionEnvioGratis(opciones) {
  const aDomicilio = (opciones || []).filter(esADomicilio)

  for (const empresa of EMPRESAS_ENVIO_GRATIS) {
    const candidatas = aDomicilio.filter((o) =>
      `${normalizar(o.carrierSlug)} ${normalizar(o.carrier)}`.includes(empresa)
    )
    if (candidatas.length > 0) {
      return ordenar(candidatas)[0]
    }
  }

  if (USAR_OTRAS_EMPRESAS_SI_FALTAN && aDomicilio.length > 0) {
    return ordenar(aDomicilio)[0]
  }

  return null
}