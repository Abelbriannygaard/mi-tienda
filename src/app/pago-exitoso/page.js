import { guardarPedido } from '@/lib/guardarPedido'
import PurchaseMeta from './PurchaseMeta'

export default async function PagoExitoso({ searchParams }) {
  const params = await searchParams
  const paymentId = params.collection_id || params.payment_id

  let pago = null

  if (paymentId) {
    try {
      pago = await guardarPedido(paymentId)
    } catch (error) {
      console.error('No se pudo guardar el pedido desde pago-exitoso:', error)
    }
  }

  const aprobado = pago?.status === 'approved'
  const contents = (pago?.additional_info?.items || [])
  .filter((item) => item.id && item.id !== 'envio')
  .map((item) => ({
    id: String(item.id),
    quantity: Number(item.quantity),
    item_price: Number(item.unit_price),
  }))

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      {aprobado && (
        <PurchaseMeta
          pedidoId={String(paymentId)}
          value={Number(pago.transaction_amount)}
          contents={contents}
        />
      )}
      <h1 style={{ color: '#16a34a', fontSize: '28px' }}>✅ ¡Gracias por tu compra!</h1>
      <p style={{ marginTop: '12px', fontSize: '16px' }}>
        Tu pago fue aprobado correctamente. Te enviamos un email con el resumen de tu pedido.
        Cuando lo despachemos, vas a recibir otro email con el número de seguimiento para rastrear tu envío.
      </p>
      <a href="/" style={{ display: 'inline-block', marginTop: '24px', color: '#009ee3' }}>
        ← Volver a la tienda
      </a>
    </div>
  )
}