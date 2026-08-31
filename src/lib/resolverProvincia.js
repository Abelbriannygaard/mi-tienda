// Determina el código de provincia (formato Envia) a partir del código postal argentino.
// Códigos confirmados directamente con Envia: DF (CABA), BA (Buenos Aires), CB (Córdoba).
// El resto son códigos de referencia estándar — verificar si algún pedido real falla.

const RANGOS = [
  { min: 1000, max: 1499, state: 'DF' },  // CABA
  { min: 2000, max: 2099, state: 'SF' },  // Santa Fe (Rosario) — va ANTES del rango de Buenos Aires
  { min: 1500, max: 2999, state: 'BA' },  // Buenos Aires (GBA + interior)
  { min: 3000, max: 3099, state: 'SF' },  // Santa Fe (ciudad)
  { min: 3100, max: 3299, state: 'ER' },  // Entre Ríos
  { min: 3300, max: 3399, state: 'MN' },  // Misiones
  { min: 3400, max: 3499, state: 'CR' },  // Corrientes
  { min: 3600, max: 3699, state: 'FO' },  // Formosa — va ANTES del rango de Chaco
  { min: 3500, max: 3799, state: 'CH' },  // Chaco
  { min: 3800, max: 3999, state: 'CH' },  // Chaco (interior)
  { min: 4000, max: 4199, state: 'TM' },  // Tucumán
  { min: 4200, max: 4399, state: 'SE' },  // Santiago del Estero
  { min: 4400, max: 4599, state: 'SA' },  // Salta
  { min: 4600, max: 4699, state: 'JY' },  // Jujuy
  { min: 4700, max: 4799, state: 'CT' },  // Catamarca
  { min: 5000, max: 5299, state: 'CB' },  // Córdoba
  { min: 5300, max: 5399, state: 'LR' },  // La Rioja
  { min: 5400, max: 5499, state: 'SJ' },  // San Juan
  { min: 5500, max: 5599, state: 'MZ' },  // Mendoza
  { min: 5700, max: 5799, state: 'SL' },  // San Luis
  { min: 6000, max: 6099, state: 'BA' },  // Buenos Aires (interior oeste)
  { min: 6300, max: 6399, state: 'LP' },  // La Pampa
  { min: 6600, max: 6699, state: 'BA' },  // Buenos Aires (Junín, etc.)
  { min: 7000, max: 7999, state: 'BA' },  // Buenos Aires (Atlántica/interior)
  { min: 8000, max: 8299, state: 'BA' },  // Buenos Aires (Bahía Blanca, etc.)
  { min: 8300, max: 8399, state: 'NQ' },  // Neuquén
  { min: 8400, max: 8599, state: 'RN' },  // Río Negro
  { min: 9000, max: 9299, state: 'CU' },  // Chubut
  { min: 9300, max: 9399, state: 'SC' },  // Santa Cruz
  { min: 9400, max: 9499, state: 'TF' },  // Tierra del Fuego
]

export function resolverProvincia(codigoPostal) {
  const cp = parseInt(String(codigoPostal).replace(/\D/g, '').slice(0, 4), 10)

  if (!cp || Number.isNaN(cp)) {
    return 'BA' // fallback conservador
  }

  const match = RANGOS.find((r) => cp >= r.min && cp <= r.max)
  return match ? match.state : 'BA'
}