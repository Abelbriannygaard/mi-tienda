// Determina el código de provincia (formato Envia) a partir del código postal argentino.
// Basado en los rangos clásicos del sistema de 4 dígitos (CP simple, no CPA de 8 caracteres).

const RANGOS = [
  { min: 1000, max: 1499, state: 'C' },  // CABA
  { min: 1500, max: 2999, state: 'B' },  // Buenos Aires (GBA + interior)
  { min: 3000, max: 3099, state: 'S' },  // Santa Fe (ciudad)
  { min: 3100, max: 3299, state: 'E' },  // Entre Ríos
  { min: 3300, max: 3399, state: 'N' },  // Misiones
  { min: 3400, max: 3499, state: 'W' },  // Corrientes
  { min: 3500, max: 3799, state: 'H' },  // Chaco
  { min: 3600, max: 3699, state: 'P' },  // Formosa
  { min: 3800, max: 3999, state: 'H' },  // Chaco (interior)
  { min: 4000, max: 4199, state: 'T' },  // Tucumán
  { min: 4200, max: 4299, state: 'G' },  // Santiago del Estero
  { min: 4300, max: 4399, state: 'G' },  // Santiago del Estero (interior)
  { min: 4400, max: 4599, state: 'A' },  // Salta
  { min: 4600, max: 4699, state: 'Y' },  // Jujuy
  { min: 4700, max: 4799, state: 'K' },  // Catamarca
  { min: 5000, max: 5299, state: 'X' },  // Córdoba
  { min: 5300, max: 5399, state: 'F' },  // La Rioja
  { min: 5400, max: 5499, state: 'J' },  // San Juan
  { min: 5500, max: 5599, state: 'M' },  // Mendoza
  { min: 5700, max: 5799, state: 'D' },  // San Luis
  { min: 6000, max: 6099, state: 'B' },  // Buenos Aires (interior oeste)
  { min: 6300, max: 6399, state: 'L' },  // La Pampa
  { min: 6600, max: 6699, state: 'B' },  // Buenos Aires (Junín, etc.)
  { min: 7000, max: 7999, state: 'B' },  // Buenos Aires (Atlántica/interior)
  { min: 8000, max: 8299, state: 'B' },  // Buenos Aires (Bahía Blanca, etc.)
  { min: 8300, max: 8399, state: 'Q' },  // Neuquén
  { min: 8400, max: 8599, state: 'R' },  // Río Negro
  { min: 9000, max: 9299, state: 'U' },  // Chubut
  { min: 9300, max: 9399, state: 'Z' },  // Santa Cruz
  { min: 9400, max: 9499, state: 'V' },  // Tierra del Fuego
]

export function resolverProvincia(codigoPostal) {
  const cp = parseInt(String(codigoPostal).replace(/\D/g, '').slice(0, 4), 10)

  if (!cp || Number.isNaN(cp)) {
    return 'B' // fallback conservador
  }

  const match = RANGOS.find((r) => cp >= r.min && cp <= r.max)
  return match ? match.state : 'B'
}