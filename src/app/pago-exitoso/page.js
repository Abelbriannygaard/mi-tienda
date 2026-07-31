import { guardarPedido } from '@/lib/guardarPedido'

export default async function PagoExitoso({ searchParams }) {
  const params = await searchParams
  const paymentId = params.collection_id || params.payment_id

  let guardado = false

  if (paymentId) {
    try {
      await guardarPedido(paymentId)
      guardado = true
    } catch (error) {
      console.error('No se pudo guardar el pedido desde pago-exitoso:', error)
    }
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#16a34a', fontSize: '28px' }}>✅ ¡Gracias por tu compra!</h1>
      <p style={{ marginTop: '12px', fontSize: '16px' }}>
        Tu pago fue aprobado correctamente. En breve nos comunicamos para coordinar el envío.
      </p>
      <a href="/" style={{ display: 'inline-block', marginTop: '24px', color: '#009ee3' }}>
        ← Volver a la tienda
      </a>
    </div>
  )
}