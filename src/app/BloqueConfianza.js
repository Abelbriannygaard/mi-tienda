import Link from 'next/link'
import { UMBRAL_ENVIO_GRATIS } from '@/lib/configEnvioGratis'
import { DESCUENTO_TRANSFERENCIA } from '@/lib/configTransferencia'

// Bloque de confianza para la ficha de producto y el checkout.
// Los montos salen de las mismas configuraciones que usa el checkout (envío gratis y transferencia),
// así que si los cambiás ahí, se actualizan acá solos.
export default function BloqueConfianza({ compacto = false }) {
  const umbral = Number(UMBRAL_ENVIO_GRATIS).toLocaleString('es-AR')
  const porcentajeTransferencia = Math.round(DESCUENTO_TRANSFERENCIA * 100)

  const items = [
    {
      icono: '🚚',
      titulo: 'Envíos a todo el país',
      texto: `Envío gratis en compras desde $${umbral} en productos.`,
    },
    {
      icono: '💳',
      titulo: 'Pagá como prefieras',
      texto: `Mercado Pago o transferencia bancaria con ${porcentajeTransferencia}% de descuento.`,
    },
    {
      icono: '🔒',
      titulo: 'Compra segura',
      texto: 'Usamos tus datos únicamente para procesar y entregar tu pedido.',
    },
  ]

  return (
    <div className="rounded-2xl border border-[#E4DCCF] bg-[#FFFDF9] p-4 text-[#2E2A26]">
      <ul className={compacto ? 'space-y-2' : 'space-y-3'}>
        {items.map((item) => (
          <li key={item.titulo} className="flex items-start gap-3">
            <span className="text-lg leading-6" aria-hidden="true">
              {item.icono}
            </span>
            <div>
              <p className="text-sm font-semibold leading-5">{item.titulo}</p>
              {!compacto && (
                <p className="text-xs leading-5 text-[#6B645C]">{item.texto}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-[#6B645C]">
        <Link href="/politica-de-cambios" className="underline hover:text-[#2F6B63]">
          Ver política de cambios
        </Link>
      </p>
    </div>
  )
}
